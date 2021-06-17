/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
const { getSpotInfo, getTravelingTime } = require('../server/model/automation_model');
const { getGeoDistance, calculateCloserPoint } = require('./geopackage');

const removeSpot = (itemToRemove, items) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const i in items) {
    if (items[i] === itemToRemove) {
      items.splice(i, 1);
    }
  }
};

const getNextSpotId = (currentSpotId, sequence, clusters, spotsInfo) => {
  if (Object.keys(clusters).length === 2 && clusters[sequence].length === 1) {
    return clusters[sequence][0];
  }
  if (!clusters[sequence]) {
    return -1;
  }

  const currentClusterVectors = clusters[sequence].map((id) => spotsInfo[id].vector);
  const currentSpotVector = spotsInfo[currentSpotId].vector;
  const nextSpotIndex = calculateCloserPoint(currentClusterVectors, currentSpotVector, 'getClosePoint');
  if (nextSpotIndex === -1) { // => cluster length == 1
    delete clusters[sequence]; // remove used-up cluster
    [, sequence] = clusters.sequence; // assign new sequence
    clusters.sequence.splice(0, 1); // remove the sequence of index 0
    return getNextSpotId(currentSpotId, sequence, clusters, spotsInfo);
  }
  return clusters[sequence][nextSpotIndex];
};

const arrangeNextActivity = async (
  dayId, startTime, prevSpotId, nextSpotId, spotsInfo, arrangedEvents, startDateUnix,
) => {
  // prevSpotId, nextSpotId == Google ids
  let transitTime = await getTravelingTime(prevSpotId, nextSpotId, spotsInfo);
  const spotInfo = await getSpotInfo(nextSpotId); // linger_time, open_days, open_hour, closed_hour

  let eventEndsAt = startTime + transitTime + spotInfo.lingerTime;
  // if startTime || eventEndsAt is between an arranged event, new start time = such event's end
  const arrangedEventsOfDay = arrangedEvents[startDateUnix];
  if (arrangedEventsOfDay) {
    for (const event of arrangedEventsOfDay) {
      if (
        (startTime <= event.end && startTime >= event.start)
        || (eventEndsAt <= event.end && eventEndsAt >= event.start)
      ) {
        startTime = event.end;
        transitTime = await getTravelingTime(event.google_id, nextSpotId, spotsInfo);
        eventEndsAt = startTime + transitTime + spotInfo.lingerTime;
      }
    }
  }

  // check if spot open on the day
  let open = false;
  const openDays = spotInfo.openDays.split(',');
  for (const day of openDays) {
    if (parseInt(day, 10) === parseInt(dayId, 10)) {
      open = true;
    }
  }

  let response;
  if (eventEndsAt > 1200 || startTime > spotInfo.closedHour || !open) {
    response = -1;
  } else if (startTime + 60 < spotInfo.openHour) {
    response = -2;
  } else if (eventEndsAt > 1110) { // 行程安排後，若會晚於 18:30， call it a day
    response = {
      keepArranging: false,
      arrangement: [
        {
          activity: 'transit',
          startTime,
          end: startTime + transitTime,
        },
        {
          activity: spotsInfo[nextSpotId].name,
          spotId: spotsInfo[nextSpotId].spotId,
          startTime: startTime + transitTime,
          end: startTime + transitTime + spotInfo.lingerTime,
        },
      ],
    };
  } else {
    // 若行程開始於 12h ~ 13h45，新增午餐時間
    if (startTime > 720 && startTime < 825) {
      const lunchBreak = 60;
      startTime += lunchBreak;
    }
    response = {
      keepArranging: true,
      arrangement: [
        {
          activity: 'transit',
          startTime,
          end: startTime + transitTime,
        },
        {
          activity: spotsInfo[nextSpotId].name,
          spotId: spotsInfo[nextSpotId].spotId,
          startTime: startTime + transitTime,
          end: startTime + transitTime + spotInfo.lingerTime,
        },
      ],
    };
  }
  return response;
};

const findPolePoints = (keys, spotsInfo) => {
  if (keys.length === 1) {
    return keys;
  }
  let maxDistance = 0;
  const polePointsKeys = [];
  keys.forEach((base) => {
    keys.forEach((comparison) => {
      const distance = getGeoDistance(spotsInfo[base].vector, spotsInfo[comparison].vector);
      if (distance > maxDistance) {
        maxDistance = distance;
        polePointsKeys[0] = base;
        polePointsKeys[1] = comparison;
      }
    });
  });
  return polePointsKeys;
};

module.exports = {
  getNextSpotId,
  arrangeNextActivity,
  removeSpot,
  findPolePoints,
};

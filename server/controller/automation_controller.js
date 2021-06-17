/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
const Automation = require('../model/automation_model');
const Kmeans = require('../../utils/kmeans');
const {
  getNextSpotId, arrangeNextActivity, removeSpot, findPolePoints,
} = require('../../utils/organizeTrip');
const { calculateCloserPoint } = require('../../utils/geopackage');

const calculateTrips = async (req, res, next) => {
  try {
    const {
      tripId, spotsInfo, startDate, arrangedEvents,
    } = req.body;
    let {
      dayId, googleIds, tripDuration,
    } = req.body;
    let startTime = parseInt(req.body.startTime, 10);
    const startDateDatetime = new Date(startDate.split('GMT')[0]);
    const originalStartTime = startTime;
    let startDateUnix = startDateDatetime.getTime();
    tripDuration += 1;

    // record arrangements
    const wholeTrip = {};
    const otherEvents = {
      nightEvents: [],
      remainingSpots: [],
    };
    const { nightEvents, remainingSpots } = otherEvents;

    // record pending arrangements
    let pendingArrangements = [];
    let tooEarlyArrangements = [];

    // initialize count for each place id, stored in object
    const tooEarlyArrangementCount = {};
    googleIds.forEach((id) => { tooEarlyArrangementCount[id] = 0; });

    // loop until all spots arranged
    while (googleIds.length > 0) {
      const poleSpotIds = findPolePoints(googleIds, spotsInfo);
      let startSpotId = poleSpotIds[Math.floor(Math.random() * poleSpotIds.length)];

      // if arrangements exist on the day, include them in the consideration of kmeans result
      const daysWithArrangedEvents = Object.keys(arrangedEvents);
      if (daysWithArrangedEvents) {
        for (const dayUnix of daysWithArrangedEvents) {
          if (parseInt(dayUnix, 10) === startDateUnix) {
            const index = Math.floor(Math.random() * arrangedEvents[dayUnix].length);
            const arrangedEvent = arrangedEvents[dayUnix][index];
            const vectors = googleIds.map((id) => spotsInfo[id].vector);
            const spotClosestToArrangedEventIndex = calculateCloserPoint(vectors, [arrangedEvent.latitude, arrangedEvent.longtitude], 'getClosePoint');
            startSpotId = googleIds[spotClosestToArrangedEventIndex];
          }
        }
      }

      const clusters = Kmeans.getClusters(googleIds, spotsInfo, tripDuration, startSpotId);

      const spotInfo = await Automation.getSpotInfo(startSpotId);
      if (spotInfo.openHour >= 960) { // after 5 pm, categorized to night events
        spotInfo.activity = spotsInfo[startSpotId].name;
        nightEvents.push(spotInfo);
        removeSpot(startSpotId, googleIds);
        removeSpot(startSpotId, clusters[clusters.sequence[0]]);
        continue;
      } else {
        // if the starting spot opens the day
        let open = false;
        const openDays = spotInfo.openDays.split(',');
        for (const day of openDays) {
          if (parseInt(day, 10) === parseInt(dayId, 10)) {
            open = true;
          }
        }
        if (open) {
          if (spotInfo.openHour > startTime + 120) { // greedy: if startSpot opens within 2 hours
            tooEarlyArrangements.push(startSpotId);
            tooEarlyArrangementCount[startSpotId] += 1;

            removeSpot(startSpotId, clusters[clusters.sequence[0]]);
            removeSpot(startSpotId, googleIds);
            if (clusters[clusters.sequence[0]].length === 0) {
              delete clusters[clusters.sequence[0]];
              clusters.sequence.splice(0, 1);
            }
            continue;
          } else {
            startTime = (spotInfo.openHour >= startTime) ? spotInfo.openHour : startTime;

            // if startTime 介於 一行程的排程段, 新的startTime = arranged行程的結束
            const arrangedEventsOfDay = arrangedEvents[startDateUnix];
            if (arrangedEventsOfDay) {
              for (const event of arrangedEventsOfDay) {
                if (
                  (startTime <= event.end && startTime >= event.start)
                  || (startTime + 90 <= event.end && startTime + 90 >= event.start)
                ) {
                  const transitTime = await Automation
                    .getTravelingTime(event.google_id, startSpotId, spotsInfo);
                  startTime = event.end + transitTime;
                }
              }
            }

            wholeTrip[startDateUnix] = [ // initialize the day
              {
                activity: spotsInfo[startSpotId].name,
                spotId: spotsInfo[startSpotId].spotId,
                startTime,
                end: startTime + spotInfo.lingerTime,
              },
            ];

            startTime += spotInfo.lingerTime;
            removeSpot(startSpotId, googleIds);
            removeSpot(startSpotId, clusters[clusters.sequence[0]]);
            if (clusters[clusters.sequence[0]].length === 0) {
              delete clusters[clusters.sequence[0]];
              clusters.sequence.splice(0, 1);
            }
          }
        } else {
          // remove spot from cluster and find the next spot
          pendingArrangements.push(startSpotId);
          removeSpot(startSpotId, googleIds);
          removeSpot(startSpotId, clusters[clusters.sequence[0]]);
          if (clusters[clusters.sequence[0]].length === 0) {
            delete clusters[clusters.sequence[0]];
            clusters.sequence.splice(0, 1);
          }
          startSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);
          continue;
        }
      }

      let keepArranging = true;
      while (keepArranging) { // 一直跑到當日景點排滿為止
        if (Object.keys(clusters).length === 1) { // clusters empty
          break;
        }
        if (Object.keys(clusters).length > 1 && clusters.sequence.length === 0) {
          clusters.sequence.push(Object.keys(clusters)[0]);
        }
        const nextSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);
        if (nextSpotId === -1) { // no more spots
          break;
        }
        // eslint-disable-next-line max-len
        const nextActivity = await arrangeNextActivity(dayId, startTime, startSpotId, nextSpotId, spotsInfo, arrangedEvents, startDateUnix);

        if (tooEarlyArrangements.length > 0) { // add back too early arrangements to cluster
          tooEarlyArrangements.forEach((googleId) => {
            if (tooEarlyArrangementCount[googleId] < 7) {
              const sequence = clusters.sequence[0];
              clusters[sequence] = clusters[sequence].concat(tooEarlyArrangements);
            }
          });
          googleIds = googleIds.concat(tooEarlyArrangements);
          tooEarlyArrangements = [];
        }

        // -1 = arrangement later than 8pm / later than spot open hour / not open
        if (nextActivity === -1) {
          // remove and jump to next spot till end between 6:30 ~ 8:00 pm
          pendingArrangements.push(nextSpotId);
          removeSpot(nextSpotId, clusters[clusters.sequence[0]]);
          removeSpot(nextSpotId, googleIds);
          if (clusters[clusters.sequence[0]].length === 0) {
            delete clusters[clusters.sequence[0]];
            clusters.sequence.splice(0, 1);
          }
          // startSpotId = nextSpotId;
        } else if (nextActivity === -2) { // 太早去的行程放進too early稍待安排
          tooEarlyArrangements.push(nextSpotId);
          tooEarlyArrangementCount[nextSpotId] += 1;

          removeSpot(nextSpotId, clusters[clusters.sequence[0]]);
          removeSpot(nextSpotId, googleIds);
          if (clusters[clusters.sequence[0]].length === 0) {
            delete clusters[clusters.sequence[0]];
            clusters.sequence.splice(0, 1);
          }
          // startSpotId = nextSpotId;
        } else {
          keepArranging = nextActivity.keepArranging; // while(true or false)
          wholeTrip[startDateUnix] = wholeTrip[startDateUnix].concat(nextActivity.arrangement);
          startSpotId = nextSpotId;
          if (keepArranging) {
            startTime = nextActivity.arrangement[1].end;
          }
          removeSpot(nextSpotId, googleIds); // remove arranged spot
          removeSpot(nextSpotId, poleSpotIds);
          removeSpot(nextSpotId, clusters[clusters.sequence[0]]);
          if (clusters[clusters.sequence[0]].length === 0) {
            delete clusters[clusters.sequence[0]];
            clusters.sequence.splice(0, 1);
          }
        }
      }

      if (pendingArrangements.length > 0) { // add back pending arrangements to full list
        googleIds = googleIds.concat(pendingArrangements);
        pendingArrangements = [];
      }

      dayId += 1; // move to next dat
      if (dayId === 7) dayId = 0;

      // add one day to unix time
      startDateUnix = startDateDatetime.setDate(startDateDatetime.getDate() + 1);
      startTime = originalStartTime;
      tripDuration -= 1;
    }

    if (googleIds.length > 0 || tooEarlyArrangements.length > 0 || pendingArrangements.length > 0) {
      if (googleIds.length > 0) {
        for (const id of googleIds) {
          const remainingSpotInfo = await Automation.getSpotInfo(id);
          remainingSpotInfo.activity = spotsInfo[id].name;
          remainingSpots.push(remainingSpotInfo);
        }
      }
      if (tooEarlyArrangements.length > 0) {
        for (const id of tooEarlyArrangements) {
          const remainingSpotInfo = await Automation.getSpotInfo(id);
          remainingSpotInfo.activity = spotsInfo[id].name;
          remainingSpots.push(remainingSpotInfo);
        }
      }
      if (pendingArrangements.length > 0) {
        for (const id of pendingArrangements) {
          const remainingSpotInfo = await Automation.getSpotInfo(id);
          remainingSpotInfo.activity = spotsInfo[id].name;
          remainingSpots.push(remainingSpotInfo);
        }
      }
    }

    await Automation.arrangeAutomationResult(tripId, req.user.id, dayId, startDate, wholeTrip);
    res.send(otherEvents);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateTrips,
};

/* eslint-disable object-curly-newline */
/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */

const Automation = require('../model/automation_model');
const Kmeans = require('../../utils/kmeans');
const {
  getNextSpotId, arrangeNextActivity, removeSpot, findPolePoints, renderRemainingSpots,
} = require('../../utils/organizeTrip');
const { calculateCloserPoint } = require('../../utils/geopackage');

const NIGHT_EVENT_THRESHOLD = 960;
const HOUR = 60;
const EARLY_ARRANGEMENT_COUNT = 7;

const calculateTrips = async (req, res, next) => {
  try {
    // load and sort request body
    const { tripId, spotsInfo, startDate, arrangedEvents } = req.body;
    let { dayId, googleIds, tripDuration } = req.body;
    tripDuration += 1;
    let startTime = parseInt(req.body.startTime, 10);
    const originalStartTime = startTime;

    const startDateDatetime = new Date(startDate.split('GMT')[0]);
    let startDateUnix = startDateDatetime.getTime();

    // record arrangements
    const wholeTrip = {};
    const otherEvents = {};

    // record pending arrangements
    let pendingArrangements = [];
    let tooEarlyArrangements = [];

    // initialize count for each place id, stored in an object
    const tooEarlyArrangementCount = {};
    googleIds.forEach((id) => { tooEarlyArrangementCount[id] = 0; });

    // after 5 pm, categorized to night events
    const nightEvents = [];
    for (const googleId of googleIds) {
      const spotInfo = await Automation.getSpotInfo(googleId);
      if (spotInfo.openHour >= NIGHT_EVENT_THRESHOLD) {
        spotInfo.activity = spotsInfo[googleId].name;
        nightEvents.push(spotInfo);
        removeSpot(googleId, [googleIds]);
      }
    }
    otherEvents.nightEvents = nightEvents;

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

      // check if the starting spot opens the day
      let open = false;
      const openDays = spotInfo.openDays.split(',');
      for (const day of openDays) {
        if (parseInt(day, 10) === parseInt(dayId, 10)) {
          open = true;
        }
      }
      if (open) {
        // greedy: if startSpot opens within 2 hours
        if (spotInfo.openHour > startTime + (2 * HOUR)) {
          tooEarlyArrangements.push(startSpotId);
          tooEarlyArrangementCount[startSpotId] += 1;
          removeSpot(startSpotId, [clusters[clusters.sequence[0]], googleIds], clusters);
          continue;
        } else {
          startTime = (spotInfo.openHour >= startTime) ? spotInfo.openHour : startTime;

          // if startTime is between some arrangement's start and end, startTime = arrangement's end
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

          // initialize the day
          wholeTrip[startDateUnix] = [
            {
              activity: spotsInfo[startSpotId].name,
              spotId: spotsInfo[startSpotId].spotId,
              startTime,
              end: startTime + spotInfo.lingerTime,
            },
          ];

          startTime += spotInfo.lingerTime;
          removeSpot(startSpotId, [googleIds, clusters[clusters.sequence[0]]], clusters);
        }
      } else {
        // remove spot from cluster and find the next spot
        pendingArrangements.push(startSpotId);
        removeSpot(startSpotId, [googleIds, clusters[clusters.sequence[0]]], clusters);
        startSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);
        continue;
      }

      let keepArranging = true;
      while (keepArranging) {
        // keep arranging until the day is full
        if (Object.keys(clusters).length === 1) {
          // clusters empty
          break;
        }
        if (Object.keys(clusters).length > 1 && clusters.sequence.length === 0) {
          clusters.sequence.push(Object.keys(clusters)[0]);
        }
        const nextSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);
        if (nextSpotId === -1) {
          // no more spots
          break;
        }
        const nextActivity = await arrangeNextActivity(
          dayId, startTime, startSpotId, nextSpotId, spotsInfo, arrangedEvents, startDateUnix,
        );

        // add back too early arrangements to cluster if count < 7
        if (tooEarlyArrangements.length > 0) {
          tooEarlyArrangements.forEach((googleId) => {
            if (tooEarlyArrangementCount[googleId] < EARLY_ARRANGEMENT_COUNT) {
              const sequence = clusters.sequence[0];
              clusters[sequence] = clusters[sequence].concat(tooEarlyArrangements);
            }
          });
          googleIds = googleIds.concat(tooEarlyArrangements);
          tooEarlyArrangements = [];
        }

        if (nextActivity === -1) {
          // -1 -> arrangement later than 8pm / later than spot open_hour / not open
          // remove and jump to next spot till the end is between 6:30 ~ 8:00 pm
          pendingArrangements.push(nextSpotId);
          removeSpot(nextSpotId, [clusters[clusters.sequence[0]], googleIds], clusters);
        } else if (nextActivity === -2) {
          // -2 -> arrangement ealier than spot open_hour
          tooEarlyArrangements.push(nextSpotId);
          tooEarlyArrangementCount[nextSpotId] += 1;
          removeSpot(nextSpotId, [clusters[clusters.sequence[0]], googleIds], clusters);
        } else {
          // spot is arranged, nextActivity.keepArranging decides whether keep arranging
          keepArranging = nextActivity.keepArranging;// (true or false)
          wholeTrip[startDateUnix] = wholeTrip[startDateUnix].concat(nextActivity.arrangement);
          startSpotId = nextSpotId;
          if (keepArranging) {
            startTime = nextActivity.arrangement[1].end;
          }
          removeSpot(nextSpotId,
            [
              googleIds, poleSpotIds, clusters[clusters.sequence[0]],
            ], clusters);
        }
      }

      if (pendingArrangements.length > 0) {
        // add back pending arrangements to the list
        googleIds = googleIds.concat(pendingArrangements);
        pendingArrangements = [];
      }
      // move to the next day
      dayId += 1;
      if (dayId === 7) dayId = 0;

      // add one day to unix time
      startDateUnix = startDateDatetime.setDate(startDateDatetime.getDate() + 1);
      startTime = originalStartTime;
      tripDuration -= 1;
    }

    otherEvents.remainingSpots = await renderRemainingSpots(
      [googleIds, tooEarlyArrangements, pendingArrangements], spotsInfo,
    );

    await Automation.arrangeAutomationResult(tripId, req.user.id, dayId, startDate, wholeTrip);
    res.send(otherEvents);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateTrips,
};

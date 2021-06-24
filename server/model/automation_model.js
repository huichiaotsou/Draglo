const Google = require('../../utils/google');
const { pool } = require('./mysql');
require('dotenv').config();

const getSpotInfo = async (spotId) => {
  try {
    const queryStr = 'SELECT linger_time, open_days, open_hour, closed_hour FROM spots WHERE google_id = ?';
    const [[result]] = await pool.query(queryStr, spotId);
    const lingerTime = result.linger_time;
    const openDays = result.open_days;
    let openHour = result.open_hour;
    let closedHour = result.closed_hour;

    if (openHour == null) openHour = 0;
    if (closedHour == null) closedHour = 2400;
    openHour = Math.floor(openHour / 100) * 60 + (openHour % 100);
    closedHour = Math.floor(closedHour / 100) * 60 + (closedHour % 100);
    return {
      lingerTime, openDays, openHour, closedHour,
    };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const getTravelingTime = async (prevSpotId, nextSpotId) => {
  try {
    const sql = {
      queryStr: 'SELECT transit_time FROM itineraries WHERE start_google_id = ? AND end_google_id = ?',
      condition: [prevSpotId, nextSpotId],
    };

    const [result] = await pool.query(sql.queryStr, sql.condition);
    if (result.length === 0) {
      // get transit time from google API & store in DB
      const itinerary = await Google.directionAPI(prevSpotId, nextSpotId, 'transit', 0);
      if (itinerary.error) {
        return Math.round((itinerary.distance / (1000 * 100)) * 60);
      }

      await pool.query('INSERT INTO itineraries SET ?', itinerary);
      return Math.round(itinerary.transit_time) + 15;
    }

    return Math.round(result[0].transit_time) + 15;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const arrangeAutomationResult = async (tripId, userId, dayId, startDate, wholeTrip) => {
  try {
    const queryStr = 'INSERT INTO arrangements (trip_id, user_id, spot_id, start_time, end_time, is_arranged, auto_arranged) VALUES ? ';
    const upsert = 'ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time), is_arranged = VALUES(is_arranged), user_id = VALUES(user_id), auto_arranged = VALUES(auto_arranged) ';
    const values = [];
    const keys = Object.keys(wholeTrip);
    keys.forEach((unixDay) => {
      wholeTrip[unixDay].forEach((activity) => {
        const dateForStart = new Date(parseInt(unixDay, 10));
        const dateForEnd = new Date(parseInt(unixDay, 10));
        const timeStart = dateForStart.setMinutes(dateForStart.getMinutes() + activity.startTime);
        const timeEnd = dateForEnd.setMinutes(dateForEnd.getMinutes() + activity.end);
        if (activity.activity !== 'transit') {
          values.push(
            [tripId, userId, activity.spotId, new Date(timeStart), new Date(timeEnd), 1, 1],
          );
        }
      });
    });
    if (values.length > 0) {
      await pool.query(queryStr.concat(upsert), [values]);
      return;
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getSpotInfo,
  getTravelingTime,
  arrangeAutomationResult,
};

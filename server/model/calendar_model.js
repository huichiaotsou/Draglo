const { pool } = require('./mysql');
const { encrypt } = require('../../utils/utils');

const getSpotAddress = async (googleId) => {
  try {
    const [[getAddress]] = await pool.query('SELECT address FROM spots WHERE google_id = ?', googleId);
    return getAddress.address;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const generateCalendar = async (tripId) => {
  try {
    let calendarId = encrypt(tripId.toString());
    calendarId = calendarId.slice(0, 8) + tripId;
    const conditions = [calendarId, tripId];
    await pool.query('UPDATE trips SET calendar_id = ? WHERE id = ?', conditions);
    return calendarId;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

module.exports = {
  generateCalendar,
  getSpotAddress,
};

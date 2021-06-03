const { pool } = require('../model/mysql')
const { encrypt } = require('../../utils/utils');

const getSpotAddress = async (googleId) => {
    try {
        let address = await pool.query('SELECT address FROM spots WHERE google_id = ?', googleId);
        return address[0][0].address;
    } catch (error) {
        console.log(error);
        return {error}
    }
}

const generateCalendar = async (tripId) => {
    try {
        let calendarId = encrypt(tripId);
        calendarId = calendarId.slice(0,8) + tripId
        let conditions = [calendarId, tripId]
        await pool.query('UPDATE trips SET calendar_id = ? WHERE id = ?', conditions)
        return calendarId
    } catch (error) {
        console.log(error);
        return {error}
    }
}

module.exports = {
    generateCalendar,
    getSpotAddress
}
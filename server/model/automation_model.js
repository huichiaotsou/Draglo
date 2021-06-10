const Google = require('../../utils/google');
const { pool } = require('./mysql');
require('dotenv').config();

const getSpotInfo = async (spotId) => { 
    try {
        let queryStr = 'SELECT linger_time, open_days, open_hour, closed_hour FROM spots WHERE google_id = ?';
        let result = await pool.query(queryStr, spotId);
        let { linger_time, open_days, open_hour, closed_hour } = result[0][0]
        if (open_hour == null) open_hour = 0;
        if (closed_hour == null) closed_hour = 2400;
        open_hour = Math.floor(open_hour/100) * 60 + (open_hour % 100);
        closed_hour = Math.floor(closed_hour/100) * 60 + (closed_hour % 100);
        return {
            lingerTime: linger_time,
            openDays: open_days,
            openHour: open_hour,
            closedHour: closed_hour
        }
    } catch (error) {
        console.log(error);
        return {error}
    }
}

const getTravelingTime = async (prevSpotId, nextSpotId) => {
    try {
        let sql = {
            queryStr: 'SELECT transit_time FROM itineraries WHERE start_google_id = ? AND end_google_id = ?',
            condition: [prevSpotId, nextSpotId],
        }
        console.log(`SELECT transit_time FROM itineraries WHERE start_google_id = '${prevSpotId}' AND end_google_id = '${nextSpotId}'`);
        
        let result = await pool.query(sql.queryStr, sql.condition);
        if (result[0].length == 0) {
            // get time from google API & store in DB
            let itinerary = await Google.directionAPI(prevSpotId, nextSpotId, 'transit', 0)
            if (itinerary.error) {
                return Math.round((itinerary.distance / (1000 * 100)) * 60)
            }
    
            await pool.query('INSERT INTO itineraries SET ?', itinerary);
            return Math.round(itinerary.transit_time) + 15;
        } else {
            return Math.round(result[0][0].transit_time) + 15;
        }
    } catch (error) {
        console.log(error);
        return {error}
    }
}

const arrangeAutomationResult = async (tripId, userId, dayId, startDate, wholeTrip) => {
    try {
        let queryStr = 'INSERT INTO arrangements (trip_id, user_id, spot_id, start_time, end_time, is_arranged, auto_arranged) VALUES ? '
        let upsert = 'ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time), is_arranged = VALUES(is_arranged), user_id = VALUES(user_id), auto_arranged = VALUES(auto_arranged) '
        let values = []; 
        let keys = Object.keys(wholeTrip);
        keys.map( unixDay => {
            wholeTrip[unixDay].map(activity => {
                let dateForStart = new Date(parseInt(unixDay));
                let dateForEnd = new Date(parseInt(unixDay));
                // let timezoneOffset = dateForStart.getTimezoneOffset() / 60;
                let timeStart = dateForStart.setMinutes(dateForStart.getMinutes() + activity.startTime) //).setHours(dateForStart.getHours() + (timezoneOffset * 2))
                let timeEnd = dateForEnd.setMinutes(dateForEnd.getMinutes() + activity.end) //).setHours(dateForEnd.getHours() + (timezoneOffset * 2))
                if (activity.activity != 'transit') {
                    values.push([tripId, userId, activity.spotId, new Date(timeStart), new Date(timeEnd), 1, 1])
                }
            })
        })
        console.log("arrangements raw data: ");
        console.log(values);
        if(values.length > 0) {
            await pool.query(queryStr.concat(upsert), [values]);
        }
    } catch (error) {
        console.log(error);
        return {error}
    }
}

module.exports = {
    getSpotInfo,
    getTravelingTime,
    arrangeAutomationResult
}





    
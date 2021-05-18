const Google = require('../../utils/google');
const { begin, query, commit, rollback } = require('./mysql');
require('dotenv').config();

const getSpotInfo = async (spotId) => { 
    let queryStr = 'SELECT linger_time, open_days, open_hour, closed_hour FROM spots WHERE google_id = ?';
    let result = await query(queryStr, spotId);
    let { linger_time, open_days, open_hour, closed_hour } = result[0]
    if (open_hour == null) open_hour = 0;
    if (closed_hour == null) closed_hour = 2400;
    open_hour = open_hour/100 * 60;
    closed_hour = closed_hour/100 * 60;
    return {
        lingerTime: linger_time,
        openDays: open_days,
        openHour: open_hour,
        closedHour: closed_hour
    }
}
const getTravelingTime = async (prevSpotId, nextSpotId) => {
    let sql = {
        queryStr: 'SELECT transit_time FROM itinararies WHERE start_google_id = ? AND end_google_id = ?',
        condition: [prevSpotId, nextSpotId],
    }
    let result = await query(sql.queryStr, sql.condition);
    if (result.length == 0) {
        // get time from google API & store in DB
        // let response = await Google.directionAPI(prevSpotId, nextSpotId);
        // await query('INSERT INTO itinararies SET ? ', response);
        // return Math.round(response.transit_time / 60);
        return 30;
    } else {
        return Math.round(result[0].transit_time / 60); //mins
    }
}

module.exports = {
    getSpotInfo,
    getTravelingTime
}



    
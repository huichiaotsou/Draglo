const { begin, query, commit, rollback } = require('./mysql');

const getSpotInfo = async (spotId) => { 
    let queryStr = 'SELECT linger_time, open_days, open_hour, closed_hour FROM spots WHERE google_id = ?';
    let result = await query(queryStr, spotId);
    return {
        lingerTime: result.linger_time / 60,
        openDays: result.open_days,
        openHour: result.open_hour,
        closedHour: result.closed_hour
    }
}

const getTravelingTime = async (prevSpotId, nextSpotId) => {
    let sql = {
        queryStr: 'SELECT transit_time FROM itinararies WHERE start_google_id = ? AND end_google_id = ?',
        condition: [prevSpotId, nextSpotId],
    }
    let result = query(sql.queryStr, sql.condition);
    if (result.length == 0) {
        //get time from google API & store in DB
        //
        //
    } else {
        return (result[0].transit_time / 60);
    }
}

module.exports = {
    getSpotInfo,
    getTravelingTime
}



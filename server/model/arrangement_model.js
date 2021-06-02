const { pool } = require('./mysql');

const getPendingArrangements = async (tripId, city) => {
    try {
        let sql = {
            queryStr: 'SELECT DISTINCT name, city, google_id, spot_id, latitude, longtitude, open_hour, closed_hour FROM spots JOIN arrangements ON spots.id = arrangements.spot_id WHERE is_arranged = 0 AND trip_id = ? ',
            conditions: [tripId]
        }
        if (city) {
            sql.queryStr = sql.queryStr.concat('AND city = ?');
            sql.conditions.push(city);
        } else {
            sql.queryStr = sql.queryStr.concat('ORDER BY city');
        }
        let result = await pool.query(sql.queryStr, sql.conditions);
        return result[0];
    } catch (error) {
        console.log(error);
        return {error}
    }
}

const getArrangements = async (tripId) => {
    try {
        let queryStr = 'SELECT DISTINCT name, city, google_id, spot_id, start_time, end_time, latitude, longtitude, open_hour, closed_hour FROM spots '
        let joinTable = 'JOIN arrangements ON spots.id = arrangements.spot_id WHERE is_arranged = 1 AND trip_id = ? ';
        let result = await pool.query(queryStr.concat(joinTable), tripId);
        return result[0];
    } catch (error) {
        console.log(error);
        return {error}
    }
}

const removeArrangement = async (spotId, tripId) => {
    try {
        let queryStr = 'DELETE FROM arrangements WHERE trip_id = ? AND spot_id = ?';
        await pool.query(queryStr, [tripId, spotId]);
        return true;
    } catch (error) {
        console.log(error);
        return {error};
    }
}

const updateArrangement = async (isArranged, spotId, tripId, startTime, endTime) => {
    try {
        let queryStr = 'UPDATE arrangements SET is_arranged = ?, start_time = ?, end_time = ? WHERE spot_id = ? AND trip_id = ?';
        let conditions = [isArranged, startTime, endTime, spotId, tripId];
        await pool.query(queryStr, conditions);
        return true;
    } catch (error) {
        console.log(error);
        return {error};
    }
}


module.exports = {
    getPendingArrangements,
    removeArrangement,
    updateArrangement,
    getArrangements
}
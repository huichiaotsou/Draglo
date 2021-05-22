const { query } = require('./mysql');

const getPendingArrangements = async (tripId, city) => {
    try {
        let sql = {
            queryStr: 'SELECT DISTINCT name, city, google_id, spot_id FROM spots JOIN arrangements ON spots.id = arrangements.spot_id WHERE is_arranged = 0 AND trip_id = ? ',
            conditions: [tripId]
        }
        if (city) {
            sql.queryStr = sql.queryStr.concat('AND city = ?');
            sql.conditions.push(city);
        } else {
            sql.queryStr = sql.queryStr.concat('ORDER BY city');
        }
        let result = await query(sql.queryStr, sql.conditions);
        return result;
    } catch (error) {
        console.log(error);
        return {error}
    }
}

const removeArrangement = async (spotId, tripId) => {
    try {
        let queryStr = 'UPDATE arrangements SET is_arranged = -1 WHERE trip_id = ? AND spot_id = ?';
        await query(queryStr, [tripId, spotId]);
        return true;
    } catch (error) {
        console.log(error);
        return {error}
    }
}

module.exports = {
    getPendingArrangements,
    removeArrangement
}
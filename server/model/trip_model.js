const { query } = require('./mysql');

const getDashboard = async (userId, behavior, keyword) => {
    let sql = {
        query: 'SELECT trips.id AS trip_id, name, image, trip_start, trip_end FROM trips ',
        conditions: [0 , userId]
    }
    if (behavior == "search") {
        sql.query = sql.query.concat('WHERE is_archived = ? AND user_id = ? AND name LIKE ?');
        sql.conditions.push(`%${keyword}%`)
    } else if (behavior == "archived") {
        sql.query = sql.query.concat('WHERE is_archived = ? AND user_id = ?');
        sql.conditions[0] = 1;
    } else if (behavior == "shared") {
        sql.query = sql.query.concat('JOIN contributors ON trips.id = contributors.trip_id WHERE is_archived = ? AND contributors.user_id = ?')
    } else {                       
        sql.query = sql.query.concat('WHERE is_archived = ? AND user_id = ?');
    }
    let result = await query(sql.query, sql.conditions);
    return {data: result};
}

const createTrip = async (initialTrip) => {
    let result = await query('INSERT INTO trips SET ? ', initialTrip);
    return result.insertId;
}

const checkOwnership = async (userId, tripId) => {
    let checkAuthor = await query('SELECT COUNT(*) AS count FROM trips WHERE id = ? AND user_id = ?',[tripId , userId]);
    let checkContributor = await query('SELECT COUNT(*) AS count FROM contributors WHERE trip_id = ? AND user_id = ?',[tripId , userId]);

    if (checkAuthor[0].count != 0 ) {
        return {role: 'author'}
    } else if (checkContributor[0].count != 0) {
        return {role: 'contributor'}
    } else {
        return false
    }
}

const getTripSettings = async (userId, tripId) => {
    let tripsOfUser = await query('SELECT id, name FROM trips WHERE is_archived = 0 AND user_id = ?', userId);
    let tripSettings = await query('SELECT * FROM trips WHERE id = ?', tripId);
    let response = tripSettings[0];
    response.otherTrips = tripsOfUser;
    return response;
}

const updateDuration = async (tripId, tripStart, tripEnd) => {
    let conditions = [tripStart, tripEnd, tripId];
    let result = await query('UPDATE trips SET trip_start = ?, trip_end = ? WHERE id = ?', conditions);
    if (result.error) {
        return {error};
    } else {
        return true;
    }
}

const updateName = async (tripId, tripName) => {
    let conditions = [tripName, tripId];
    let result = await query('UPDATE trips SET name = ? WHERE id = ?', conditions);
    if (result.error) {
        return {error};
    } else {
        return true;
    }
}

const archiveTrip = async (tripId, action) => {
    let conditions = [action, tripId];
    let result = await query('UPDATE trips SET is_archived = ? WHERE id = ?', conditions);
    if (result.error) {
        return {error};
    } else {
        return true;
    }
}

module.exports = {
    getDashboard,
    createTrip,
    checkOwnership,
    getTripSettings,
    updateDuration,
    updateName,
    archiveTrip
}
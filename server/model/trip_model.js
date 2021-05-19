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


module.exports = {
    getDashboard,
}
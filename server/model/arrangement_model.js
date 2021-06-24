const { pool } = require('./mysql');

const getPendingArrangements = async (tripId, city, placeId) => {
  try {
    const sql = {
      queryStr: 'SELECT DISTINCT name, city, google_id, spot_id, latitude, longtitude, open_hour, closed_hour FROM spots JOIN arrangements ON spots.id = arrangements.spot_id WHERE is_arranged = 0 AND trip_id = ? ',
      conditions: [tripId],
    };
    if (city) {
      sql.queryStr = sql.queryStr.concat('AND city = ?');
      sql.conditions.push(city);
    } else if (placeId) {
      sql.queryStr = sql.queryStr.concat('AND google_id = ?');
      sql.conditions.push(placeId);
    } else {
      sql.queryStr = sql.queryStr.concat('ORDER BY city');
    }
    const [result] = await pool.query(sql.queryStr, sql.conditions);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

const getArrangements = async (tripId, placeId) => {
  try {
    const sql = {
      query: '',
      conditions: [tripId],
    };
    const select = 'SELECT DISTINCT name, city, google_id, spot_id, start_time, end_time, latitude, longtitude, open_hour, closed_hour, auto_arranged FROM spots ';
    const joinTable = 'JOIN arrangements ON spots.id = arrangements.spot_id WHERE is_arranged = 1 AND trip_id = ? ';
    sql.query = select.concat(joinTable);
    if (placeId) {
      sql.query = sql.query.concat('AND google_id = ?');
      sql.conditions.push(placeId);
    }
    const [result] = await pool.query(sql.query, sql.conditions);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

const removeArrangement = async (spotId, tripId) => {
  try {
    const queryStr = 'DELETE FROM arrangements WHERE trip_id = ? AND spot_id = ?';
    const [result] = await pool.query(queryStr, [tripId, spotId]);
    if (result.affectedRows !== 1) {
      return { error: 'removal failed' };
    }
    return true;
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

const updateArrangement = async (isArranged, spotId, tripId, startTime, endTime, autoArranged) => {
  try {
    const queryStr = 'UPDATE arrangements SET is_arranged = ?, start_time = ?, end_time = ?, auto_arranged = ? WHERE spot_id = ? AND trip_id = ? ';
    const conditions = [isArranged, startTime, endTime, autoArranged, spotId, tripId];
    const [result] = await pool.query(queryStr, conditions);
    if (result.changedRows === 0) {
      return { error: 'no arrangement updated' };
    }
    return true;
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

const clearArrangement = async (tripId) => {
  try {
    const queryStr = 'UPDATE arrangements SET is_arranged = 0 WHERE trip_id = ?';
    await pool.query(queryStr, tripId);
    return true;
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

module.exports = {
  getPendingArrangements,
  removeArrangement,
  updateArrangement,
  getArrangements,
  clearArrangement,
};

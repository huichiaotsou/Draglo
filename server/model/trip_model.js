const { pool } = require('./mysql');

const getDashboard = async (userId, behavior, keyword) => {
  try {
    const sql = {
      query: 'SELECT DISTINCT trips.id AS trip_id, name, image, trip_start, trip_end FROM trips ',
      conditions: [0, userId],
    };
    if (behavior === 'search') {
      sql.query = sql.query.concat('WHERE is_archived = ? AND user_id = ? AND name LIKE ?');
      sql.conditions.push(`%${keyword}%`);
    } else if (behavior === 'archived') {
      sql.query = sql.query.concat('WHERE is_archived = ? AND user_id = ?');
      sql.conditions[0] = 1;
    } else if (behavior === 'shared') {
      sql.query = sql.query.concat('JOIN contributors ON trips.id = contributors.trip_id WHERE is_archived = ? AND contributors.user_id = ?');
    } else {
      sql.query = sql.query.concat('WHERE is_archived = ? AND user_id = ?');
    }

    const [result] = await pool.query(sql.query, sql.conditions);
    const trips = result.map((trip) => {
      if (trip.name.length > 20) {
        return {
          trip_id: trip.trip_id,
          name: `${trip.name.slice(0, 20)} . . .`,
          image: trip.image,
          trip_start: trip.trip_start,
          trip_end: trip.trip_end,
        };
      }
      return trip;
    });
    return { data: trips };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const createTrip = async (initTrip) => {
  try {
    const [result] = await pool.query('INSERT INTO trips SET ? ', initTrip);
    return result.insertId;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const getTripSettings = async (userId, tripId) => {
  try {
    const tripsOfUser = await pool.query('SELECT id, name FROM trips WHERE is_archived = 0 AND user_id = ?', userId);
    const [tripSettings] = await pool.query('SELECT * FROM trips WHERE id = ?', tripId);
    const [response] = tripSettings;
    [response.otherTrips] = tripsOfUser;

    // slice long names for rendering to Front End
    response.otherTrips = response.otherTrips.map((trip) => {
      if (trip.name.length > 20) {
        return {
          id: trip.id,
          name: `${trip.name.slice(0, 20)} . . .`,
        };
      }
      return trip;
    });
    return response;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const updateDuration = async (tripId, tripStart, tripEnd) => {
  try {
    const conditions = [tripStart, tripEnd, tripId];
    await pool.query('UPDATE trips SET trip_start = ?, trip_end = ? WHERE id = ?', conditions);
    return true;
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

const updateName = async (tripId, tripName) => {
  try {
    await pool.query('UPDATE trips SET name = ? WHERE id = ?', [tripName, tripId]);
    return true;
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

const archiveTrip = async (tripId, action) => {
  try {
    const conditions = [action, tripId];
    await pool.query('UPDATE trips SET is_archived = ? WHERE id = ?', conditions);
    return true;
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

const updateImage = async (tripId, image) => {
  try {
    const conditions = [image, tripId];
    await pool.query('UPDATE trips SET image = ? WHERE id = ?', conditions);
    return true;
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

module.exports = {
  getDashboard,
  createTrip,
  getTripSettings,
  updateDuration,
  updateName,
  archiveTrip,
  updateImage,
};

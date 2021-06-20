/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
require('dotenv').config();

const { NODE_ENV } = process.env;
const { encrypt } = require('../utils/utils');
const {
  users, trips, sharedTrips,
} = require('./fake_data');

const { pool } = require('../server/model/mysql');

const _createFakeUsers = async () => {
  const encryptedUsers = users.map((user) => {
    if (user.provider === 'Google') {
      return [user.email, encrypt(user.email)];
    }
    return [user.email, encrypt(user.password)];
  });
  await pool.query('INSERT INTO users (email, password) VALUES ? ', [encryptedUsers]);
};

const _createFakeTrips = async () => {
  const queryString = 'INSERT INTO trips (name, trip_start, trip_end, day_start, day_end, is_archived, user_id, image, calendar_id) VALUES ?';
  await pool.query(queryString, [trips.map((t) => Object.values(t))]);
};

const _createFakeSharedTrips = async () => {
  const queryString = 'INSERT INTO contributors (trip_id, user_id, share_token, token_used) VALUES ?';
  await pool.query(queryString, [sharedTrips.map((t) => Object.values(t))]);
};

const createFakeData = async () => {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env');
    return;
  }

  await _createFakeUsers();
  await _createFakeTrips();
  await _createFakeSharedTrips();
};

const truncateFakeData = async () => {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env');
    return;
  }

  const truncateTable = async (table) => {
    const conn = await pool.getConnection();
    await conn.query('START TRANSACTION');
    await conn.query('SET FOREIGN_KEY_CHECKS = ?', 0);
    await conn.query(`TRUNCATE TABLE ${table}`);
    await conn.query('SET FOREIGN_KEY_CHECKS = ?', 1);
    await conn.query('COMMIT');
    await conn.release();
  };

  const tables = ['users', 'trips', 'contributors'];
  for (const table of tables) {
    await truncateTable(table);
  }
};

const closeConnection = async () => {
  await pool.end();
};

const main = async () => {
  await truncateFakeData();
  await createFakeData();
  await closeConnection();
};

// execute when called directly.
if (require.main === module) {
  main();
}

module.exports = {
  createFakeData,
  truncateFakeData,
  closeConnection,
};

require('dotenv').config();
const mysql = require('mysql2/promise');

const env = process.env.NODE_ENV || 'production';
const {
  DB_HOST, DB_USER, DB_PWD, DB_DEV, DB_PROD,
  DB_HOST_TEST, DB_USER_TEST, DB_PWD_TEST, DB_TEST,
} = process.env;

const mysqlConfig = {
  development: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PWD,
    database: DB_DEV,
    waitForConnections: true,
    connectionLimit: 20,
  },
  production: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PWD,
    database: DB_PROD,
    waitForConnections: true,
    connectionLimit: 20,
  },
  test: {
    host: DB_HOST_TEST,
    user: DB_USER_TEST,
    password: DB_PWD_TEST,
    database: DB_TEST,
    waitForConnections: true,
    connectionLimit: 20,
  },
};

const pool = mysql.createPool(mysqlConfig[env]);

module.exports = {
  pool,
};

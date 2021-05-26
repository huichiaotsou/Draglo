require('dotenv').config()
const mysql = require('mysql2/promise');
const env = process.env.NODE_ENV || 'production';
const { DB_HOST, DB_USER, DB_PWD, DB_DEV, DB_PROD } = process.env;

mysqlConfig = {
    development : {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PWD,
        database: DB_DEV,
        waitForConnections: true,
        connectionLimit: 20
    },
    production : {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PWD,
        database: DB_PROD,
        waitForConnections: true,
        connectionLimit: 20
    }
}

const pool = mysql.createPool(mysqlConfig[env]);

module.exports = {
    pool
}
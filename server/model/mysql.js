require('dotenv').config()
const mysql = require('mysql')
const { promisify } = require('util');
const env = process.env.NODE_ENV || 'production';
const { DB_HOST, DB_USER, DB_PWD, DB_DEV, DB_PROD } = process.env;

mysqlConfig = {
    development : {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PWD,
        database: DB_DEV
    },
    production : {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PWD,
        database: DB_PROD
    }
}

const db = mysql.createConnection(mysqlConfig[env]);
db.connect((err)=> {
    if (err) throw err;
    console.log("MySQL Connection Established.")
});

const promiseTransaction = promisify(db.beginTransaction).bind(db);
const promiseQuery = promisify(db.query).bind(db);
const promiseCommit = promisify(db.commit).bind(db);
const promiseRollback = promisify(db.rollback).bind(db);

module.exports = {
    begin : promiseTransaction,
    query : promiseQuery, 
    commit : promiseCommit,
    rollback : promiseRollback
}
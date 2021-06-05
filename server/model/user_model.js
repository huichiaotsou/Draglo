require('dotenv').config();
const jwt = require('jsonwebtoken');
const { encrypt } = require('../../utils/utils')
const { pool } = require('./mysql');

const signUp = async (email, password) => {
    try {
        let checkEmail = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (checkEmail[0].length > 0) {
            return { 
                statusCode: 403,
                error: 'email already exists'
            }
        }
        let user = {email};
        user.password = encrypt(password);
        let signUpSQL = await pool.query('INSERT INTO users SET ?', user);
        user.id = signUpSQL[0].insertId;
        delete user.password;
        let accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '28800s' });
        user.access_token = accessToken;
        return user;
    } catch (error) {
        console.log(error);
        return {error}
    }
};

const googleSignIn = async (email) => {
    try {
        let queryStr = 'SELECT id, email FROM users WHERE email = ?';
        let checkUser = await pool.query(queryStr, email);
        let user = checkUser[0][0];
        if (!user) {
            let set = {
                email: email,
                password: encrypt(email)
            }
            let createUser = await pool.query('INSERT INTO users SET ?', set);
            user = {
                id : createUser[0].insertId,
                email : email
            }
        } 
        user.access_token = jwt.sign({
            id: user.id,
            email: user.email,
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '28800s' })
        return user;
    } catch (error) {
        return {error}
    }
}

const nativeSignIn = async (email, password) => {
    try {
        let queryStr = 'SELECT id, email, password FROM users WHERE email = ?';
        let checkUser = await pool.query(queryStr, email);
        let user = checkUser[0][0];
        let inputPassword = encrypt(password);
        console.log(user);
        if (!user) {
            return {
                statusCode: 400,
                error: 'Not registered, redirecting to registration page'
            };
        } else if (inputPassword != user.password){
            return {
                statusCode: 403,
                error: 'Wrong password'
            }
        } else {
            user.access_token = jwt.sign({
                id: user.id,
                email: user.email,
            }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '28800s' })
            return user;
        }
    } catch (error) {
        return {error}
    }
}
 
module.exports = {
    nativeSignIn,
    signUp,
    googleSignIn
}

require('dotenv').config();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('./mysql');

const signUp = async (email, password) => {
    try {
        let checkEmail = await query('SELECT email FROM users WHERE email = ?', [email]);
        if (checkEmail.length > 0) {
            return { 
                statusCode: 403,
                error: 'email already exists'
            }
        }
        let user = {email};
        let accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '28800s' });
        user.password = encryptPassword(password);
        let signUpSQL = await query('INSERT INTO users SET ?', user);
        user.id = signUpSQL.insertId;
        user.access_token = accessToken;
        return user;
    } catch (error) {
        console.log(error);
        return {error}
    }
};


const nativeSignIn = async (email, password) => {
    try {
        let queryStr = 'SELECT id, email, password FROM users WHERE email = ?';
        let checkUser = await query(queryStr, email);
        let user = checkUser[0];
        let inputPassword = encryptPassword(password);
        if (checkUser.length == 0) {
            return {
                statusCode: 400,
                error: 'User is not registered, redirecting to registration page'
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
 
function encryptPassword(password) {
    const hash = crypto.createHash('sha1');
    hash.update(password);
    return hash.digest('hex');
  }

module.exports = {
    nativeSignIn,
    signUp
}

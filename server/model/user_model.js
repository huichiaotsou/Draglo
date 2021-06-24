require('dotenv').config();
const jwt = require('jsonwebtoken');
const { encrypt } = require('../../utils/utils');
const { pool } = require('./mysql');

const signUp = async (email, password) => {
  try {
    const [checkEmail] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
    if (checkEmail.length > 0) {
      return {
        statusCode: 403,
        error: 'email already exists',
      };
    }
    const user = { email };
    user.password = encrypt(password);
    const [signUpSQL] = await pool.query('INSERT INTO users SET ?', user);
    user.id = signUpSQL.insertId;
    delete user.password;
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '28800s' });
    user.access_token = accessToken;
    return user;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const googleSignIn = async (email) => {
  try {
    const queryStr = 'SELECT id, email, password FROM users WHERE email = ?';
    let [[user]] = await pool.query(queryStr, email);
    const password = encrypt(email);
    if (!user) {
      const set = {
        email,
        password,
      };
      const [createUser] = await pool.query('INSERT INTO users SET ?', set);
      user = {
        id: createUser.insertId,
        email,
      };
    }
    user.access_token = jwt.sign({
      id: user.id,
      email: user.email,
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '28800s' });
    return user;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const nativeSignIn = async (email, password) => {
  try {
    const queryStr = 'SELECT id, email, password FROM users WHERE email = ?';
    const [[user]] = await pool.query(queryStr, email);
    const inputPassword = encrypt(password);
    let response;
    if (!user) {
      response = {
        statusCode: 400,
        error: 'Not registered, redirecting to registration page',
      };
    } else if (inputPassword !== user.password) {
      response = {
        statusCode: 403,
        error: 'Wrong password',
      };
    } else {
      user.access_token = jwt.sign({
        id: user.id,
        email: user.email,
      }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '28800s' });
      delete user.password;
      response = user;
    }
    return response;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

module.exports = {
  nativeSignIn,
  signUp,
  googleSignIn,
};

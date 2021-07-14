const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { pool } = require('../server/model/mysql');
const Cache = require('./redis');

const { NODE_ENV } = process.env;

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      res.sendStatus(401);
    } else {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, result) => {
        if (err) {
          res.sendStatus(403);
        }
        req.user = result;
        next();
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
}

const verifyAccess = async (req, res, next) => {
  try {
    const tripId = req.query.id || req.body.tripId || req.params.tripId;
    const userId = req.user && req.user.id;
    if (!tripId || !userId) {
      res.sendStatus(400);
      return;
    }
    const [[checkAuthor]] = await pool.query('SELECT COUNT(*) AS count FROM trips WHERE id = ? AND user_id = ?', [tripId, userId]);
    const [[checkContributor]] = await pool.query('SELECT COUNT(*) AS count FROM contributors WHERE trip_id = ? AND user_id = ?', [tripId, userId]);
    if (checkAuthor.count < 1 && checkContributor.count < 1) {
      res.sendStatus(403);
      return;
    }
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const sendEmail = async (title, email, shareToken) => {
  if (NODE_ENV === 'test') {
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.gandi.net',
      port: 465,
      secure: true, // use TLS
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: '"Draglo" <noreply@draglo.com>',
      to: email,
      subject: `Invitation to co-edit the trip: ${title}`,
      text: `Your friend is inviting you to co-edit the trip: ${title}`,
      html: `
            <div>Your friend is inviting you to co-edit the trip: ${title}</div>
            <br>
            <a href='https://draglo.com/share.html?code=${shareToken}'>
            <div>Click here to obtain the edit access!</div>
            </a>`,
    });

    transporter.verify((error) => {
      if (error) {
        console.log(error);
        return { error };
      }
      console.log('Server is ready to take our messages');
      return true;
    });
  } catch (error) {
    console.log(error);
  }
};

const rateLimiter = async (req, res, next) => {
  if (!Cache.client.ready) {
    next();
  }
  try {
    const LIMIT = (NODE_ENV === 'test') ? Infinity : 20;
    const ip = req.socket.remoteAddress;
    const result = await Cache.get(ip);
    if (result) {
      if (result.length > LIMIT) {
        res.status(429).send('too many queries');
      } else {
        await Cache.append(ip, '1');
        next();
      }
    } else {
      await Cache.set(ip, '1');
      await Cache.expire(ip, 3);
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

function encrypt(password) {
  const hash = crypto.createHash('sha1');
  hash.update(password);
  return hash.digest('hex');
}

module.exports = {
  verifyToken,
  verifyAccess,
  sendEmail,
  rateLimiter,
  encrypt,
};

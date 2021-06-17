const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { pool } = require('../server/model/mysql');
const Cache = require('./redis');

// TOKEN FORMAT: authorization: Bearer <access_token>
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  // if (authHeader) then do authHeader.split(' ')[1] -> token = undefined or is token
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
}

const verifyAccess = async (req, res, next) => {
  const tripId = req.query.id || req.body.tripId;
  const userId = req.user.id;
  if (!tripId) {
    res.sendStatus(400);
  }
  const [[checkAuthor]] = await pool.query('SELECT COUNT(*) AS count FROM trips WHERE id = ? AND user_id = ?', [tripId, userId]);
  const [[checkContributor]] = await pool.query('SELECT COUNT(*) AS count FROM contributors WHERE trip_id = ? AND user_id = ?', [tripId, userId]);
  if (checkAuthor.count === 0 && checkContributor.count === 0) {
    res.sendStatus(403);
  } else {
    next();
  }
};

const sendEmail = async (title, email, shareToken) => {
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
    subject: `邀請編輯通知，旅程：${title}`,
    text: `您的朋友邀請您一起共同建立旅遊行程 ${title}`,
    html: `
          <div>您的朋友邀請您一起共同建立旅遊行程 ${title}</div>
          <br>
          <a href='https://draglo.com/share.html?code=${shareToken}'>
          <div>請點擊此處取得編輯權限</div>
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
};

const getCityName = (components) => {
  let city = '';
  for (const component of components) {
    if (component.types[0] === 'postal_town') {
      city = component.short_name;
      break;
    }
    if (component.types[0] === 'locality') {
      city = component.short_name;
      break;
    }
    if (component.types[0] === 'administrative_area_level_1') {
      city = component.short_name;
      break;
    }
  }

  // handle Tokyo
  for (const component of components) {
    if (component.types[0] === 'administrative_area_level_1' && component.short_name === 'Tokyo') {
      city = 'Tokyo';
      break;
    }
  }

  if (!city) {
    for (const component of components) {
      if (component.types[0] === 'administrative_area_level_2') {
        city = component.short_name;
        break;
      }
    }
  }

  return city;
};

const rateLimiter = async (req, res, next) => {
  if (!Cache.client.ready) {
    next();
  }
  try {
    const ip = req.socket.remoteAddress;
    const result = await Cache.get(ip);
    if (result) {
      if (result.length > 20) {
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
  getCityName,
  rateLimiter,
  encrypt,
};

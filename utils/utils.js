const jwt = require('jsonwebtoken');
require('dotenv').config();
const { pool } = require('../server/model/mysql');
const nodemailer = require("nodemailer");

// TOKEN FORMAT: authorization: Bearer <access_token>
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization; 
  //if (authHeader) then do authHeader.split(' ')[1] -> token = undefined or is token
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

const checkOwnership = async (userId, tripId) => {
  let checkAuthor = await pool.query('SELECT COUNT(*) AS count FROM trips WHERE id = ? AND user_id = ?',[tripId , userId]);
  let checkContributor = await pool.query('SELECT COUNT(*) AS count FROM contributors WHERE trip_id = ? AND user_id = ?',[tripId , userId]);
  if (checkAuthor[0][0].count != 0 ) {
      return {role: 'author'}
  } else if (checkContributor[0][0].count != 0) {
      return {role: 'contributor'}
  } else {
      return false
  }
}

const verifyAccess = async (req, res, next) => {
  let tripId = req.query.id || req.body.tripId
  let userId  = req.user.id
  if (!tripId) {
    res.sendStatus(400);
  }
  let checkAuthor = await pool.query('SELECT COUNT(*) AS count FROM trips WHERE id = ? AND user_id = ?',[tripId , userId]);
  let checkContributor = await pool.query('SELECT COUNT(*) AS count FROM contributors WHERE trip_id = ? AND user_id = ?',[tripId , userId]);
  if (checkAuthor[0][0].count == 0 && checkContributor[0][0].count == 0) {
    res.sendStatus(403)
  } else {
    next()
  }
}

const sendEmail = async (title, email, shareToken) => {
  let transporter = nodemailer.createTransport({
      host: "mail.gandi.net",
      port: 465,
      secure: true, // use TLS
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

  let info = await transporter.sendMail({
    from: '"Draglo" <noreply@draglo.com>', 
    to: email,
    subject: `邀請編輯通知，旅程：${title}`, 
    text: `您的朋友邀請您一起共同建立旅遊行程 ${title}`,
    html: `
          <div>您的朋友邀請您一起共同建立旅遊行程 ${title}</div>
          <br>
          <a href='https://draglo.com/share.html?code=${shareToken}'>
          <div>請點擊此處取得編輯權限</div>
          </a>`
  });

  console.log("Message sent: %s", info.messageId);

  transporter.verify(function(error, success) {
      if (error) {
        console.log(error);
        return {error}
      } else {
        console.log("Server is ready to take our messages");
      }
    });
}

  module.exports = {
    verifyToken,
    verifyAccess,
    checkOwnership,
    sendEmail
  }
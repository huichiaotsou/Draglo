const jwt = require('jsonwebtoken');
require('dotenv').config();

// TOKEN FORMAT: authorization: Bearer <access_token>
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization; 
    //if (authHeader) then do authHeader.split(' ')[1] -> token = undefined or is token
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      res.sendStatus(401);
    } else {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, result) => {
        if (err) return res.sendStatus(403);
        req.user = result;
        next();
      });
    }
  }

  module.exports = {
    verifyToken
  }
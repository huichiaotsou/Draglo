const jwt = require('jsonwebtoken');
require('dotenv').config();
const { query } = require('../server/model/mysql');


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

  const checkOwnership = async (userId, tripId) => {
    let checkAuthor = await query('SELECT COUNT(*) AS count FROM trips WHERE id = ? AND user_id = ?',[tripId , userId]);
    let checkContributor = await query('SELECT COUNT(*) AS count FROM contributors WHERE trip_id = ? AND user_id = ?',[tripId , userId]);

    if (checkAuthor[0].count != 0 ) {
        return {role: 'author'}
    } else if (checkContributor[0].count != 0) {
        return {role: 'contributor'}
    } else {
        return false
    }
}

  module.exports = {
    verifyToken,
    checkOwnership
  }
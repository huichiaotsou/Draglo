const { pool } = require('./mysql');

const createShareToken = async (tripId, shareToken) => {
  try {
    const set = {
      trip_id: tripId,
      share_token: shareToken,
      token_used: 0,
    };
    await pool.query('INSERT INTO contributors SET ?', set);
    return true;
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

const updateShareAccess = async (userId, shareToken) => {
  try {
    const [getUnusedToken] = await pool.query('SELECT * FROM contributors WHERE share_token = ? AND token_used = 0', shareToken);
    if (getUnusedToken.length > 0) {
      const [{ id }] = getUnusedToken;
      const conditions = [userId, id];
      await pool.query('UPDATE contributors SET user_id = ?, token_used = 1 WHERE id = ?', conditions);
      return true;
    }
    return { error: 'the token has already been used' };
  } catch (error) {
    console.log(error);
    throw new Error({ error });
  }
};

module.exports = {
  createShareToken,
  updateShareAccess,
};

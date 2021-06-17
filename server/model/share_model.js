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
    return { error };
  }
};

const updateShareAccess = async (userId, shareToken) => {
  try {
    const [checkTokenUsed] = await pool.query('SELECT * FROM contributors WHERE share_token = ? AND token_used = 1', shareToken);
    if (checkTokenUsed.length > 0) {
      return { error: 'the token has already been used' };
    }
    const conditions = [userId, shareToken];
    await pool.query('UPDATE contributors SET user_id = ?, token_used = 1 WHERE share_token = ?', conditions);
    return true;
  } catch (error) {
    return { error };
  }
};

module.exports = {
  createShareToken,
  updateShareAccess,
};

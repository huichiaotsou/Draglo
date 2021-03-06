const { pool } = require('./mysql');

const addSpot = async (spotInfo, initArrangements) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('START TRANSACTION');
    const [spotId] = await conn.query('SELECT id FROM spots WHERE google_id = ?', spotInfo.google_id);
    if (spotId.length === 0) {
      const [result] = await conn.query('INSERT INTO spots SET ? ', spotInfo);
      initArrangements.spot_id = result.insertId;
    } else {
      initArrangements.spot_id = spotId[0].id;
    }
    await conn.query('INSERT INTO arrangements SET ? ON DUPLICATE KEY UPDATE is_arranged = VALUES(is_arranged)', initArrangements);
    await conn.query('COMMIT');
    return true;
  } catch (error) {
    console.log(error);
    await conn.query('ROLLBACK');
    return { error };
  } finally {
    conn.release();
  }
};

module.exports = {
  addSpot,
};

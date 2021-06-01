const { pool } = require('./mysql');

const createShareToken = async (tripId, shareToken) => {
    try {
        let set = {
            trip_id: tripId,
            share_token: shareToken,
            token_used: 0,
        }
        await pool.query('INSERT INTO contributors SET ?',set);
        return true;
    } catch(error){
        return {error}
    }
}

const updateShareAccess = async (userId, shareToken) => {
    try {
        console.log(userId, shareToken);
        let checkTokenUsed = await pool.query('SELECT * FROM contributors WHERE share_token = ? AND token_used = 0', shareToken)
        if (checkTokenUsed[0].length > 0) {
            let conditions = [userId, shareToken]
            await pool.query('UPDATE contributors SET user_id = ?, token_used = 1 WHERE share_token = ?', conditions);
            return true
        } else {
            return {error: 'the token has already been used'}
        }
    } catch(error) {
        return {error}
    }
}

module.exports = {
    createShareToken,
    updateShareAccess
}
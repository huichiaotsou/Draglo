const { query } = require('../utils/mysql');

const getSpotDetails = async (placeIds) => {
    let result = await query('SELECT place_id, linger FROM spots WHERE place_id IN ?', placeIds);
    return result;
}

module.exports = {
    getSpotDetails
}
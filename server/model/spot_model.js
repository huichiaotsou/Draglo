const { query } = require('./mysql');

const addSpot = async (spotInfo) => {
    let result = await query('INSERT IGNORE INTO spots SET ? ', spotInfo);
    if (result.error) {
        return {error: result.error};
    } else {
        return true;
    }
}

module.exports = {
    addSpot
}
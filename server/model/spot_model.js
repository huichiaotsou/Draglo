const { begin, query, commit, rollback} = require('./mysql');

const addSpot = async (spotInfo, initArrangements) => {
    try {
        await begin();
        let spotId = await query('SELECT id FROM spots WHERE google_id = ?', spotInfo.google_id)
        if (spotId.length == 0) {
            let result = await query('INSERT INTO spots SET ? ', spotInfo);
            initArrangements.spot_id = result.insertId;
        } else {
            initArrangements.spot_id = spotId[0].id
        }
        await query('INSERT INTO arrangements SET ? ', initArrangements);
        await commit();
        return true
    } catch (error) {
        console.log(error);
        await rollback()
        return {error}
    }
}

module.exports = {
    addSpot
}
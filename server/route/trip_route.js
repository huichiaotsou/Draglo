const { verifyToken, verifyAccess } = require('../../utils/utils')

//controllers 
const { getTripSettings, modifyTripSettings } = require('../controller/trip_controller');
const { getArrangements, removeArrangement, updateArrangement } = require('../controller/arrangement_controller');
const { addSpot } = require('../controller/spot_controller');

const express = require('express');
const router = express.Router();

router.route('/trip', verifyToken, verifyAccess)
    .get( getTripSettings )
    .patch( modifyTripSettings )
    
router.route('/spot', verifyToken, verifyAccess)
    .post( addSpot )

router.route('/arrangement', verifyToken, verifyAccess)
    .get( getArrangements )
    .patch( updateArrangement ) //-> (修改arrangement的linger time 時要平均spots 的 linger time）
    .delete( removeArrangement )

module.exports = router;
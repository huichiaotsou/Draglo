const express = require('express');
const router = express.Router();
const { getTripSettings, modifyTripSettings } = require('../controller/trip_controller');
const { getArrangements, removeArrangement, updateArrangement } = require('../controller/arrangement_controller');
const { addSpot } = require('../controller/spot_controller');

router.route('/trip')
    .get( getTripSettings )
    .patch( modifyTripSettings )
    
router.route('/spot')
    .post( addSpot )

router.route('/arrangement')
    .get( getArrangements )
    .patch( updateArrangement ) //-> (修改arrangement的linger time 時要平均spots 的 linger time）
    .delete( removeArrangement )

module.exports = router;
const { verifyToken, verifyAccess } = require('../../utils/utils')

//controllers 
const { getTripSettings, modifyTripSettings } = require('../controller/trip_controller');
const { getArrangements, removeArrangement, updateArrangement } = require('../controller/arrangement_controller');
const { addSpot } = require('../controller/spot_controller');

const express = require('express');
const router = express.Router();

router.route('/trip')
    .get( verifyToken, verifyAccess, getTripSettings )
    .patch( verifyToken, verifyAccess, modifyTripSettings )
    
router.route('/spot')
    .post( verifyToken, verifyAccess, addSpot )

router.route('/arrangement')
    .get( verifyToken, verifyAccess, getArrangements )
    .patch( verifyToken, verifyAccess, updateArrangement ) //-> (修改arrangement的linger time 時要平均spots 的 linger time）
    .delete( verifyToken, verifyAccess, removeArrangement )

module.exports = router;
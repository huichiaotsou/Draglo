const express = require('express');
const router = express.Router();
const { createTrip, getTripSettings, modifyTripSettings } = require('../controller/trip_controller');
const { addSpot, removeSpot, getSavedSpots } = require('../controller/spot_controller');
const { getArrangements, removeArrangement, updateArrangement } = require('../controller/arrangement_controller');

router.route('/trip')
    .post( createTrip )
    .patch( modifyTripSettings )
    .get( getTripSettings )
    
router.route('/spot')
    .post( addSpot )
    .delete( removeSpot )
    .get( getSavedSpots )

router.route('/arrangement')
    .get( getArrangements )
    .delete( removeArrangement )
    .patch( updateArrangement ) //-> (修改arrangement的linger time 時要平均spots 的 linger time）

// router.route('/itinerary')
//     .post( saveCalculatedItinerary )

module.exports = router;
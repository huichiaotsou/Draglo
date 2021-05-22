const express = require('express');
const router = express.Router();
const { createTrip, getTripSettings, modifyTripSettings } = require('../controller/trip_controller');
const { addSpot, removeSpot, getSavedSpots } = require('../controller/spot_controller');

router.route('/trip')
    .post( createTrip )
    .patch( modifyTripSettings )
    .get( getTripSettings )
    
router.route('/spot')
    .post( addSpot )
    .delete( removeSpot )
    .get( getSavedSpots )

// router.route('/arrangement')
//     .post( addArrangements )     （arrangement時要平均spots 的 linger time）
//     .patch( modifyArrangements )
//     .get( getArrangements )

// router.route('/itinerary')
//     .post( saveCalculatedItinerary )

module.exports = router;
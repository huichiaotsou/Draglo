const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../utils/utils');
const { createTrip, getTripSettings, modifyTripSettings } = require('../controller/trip_controller');

router.route('/trip')
    .get(verifyToken, getTripSettings)
    .post(verifyToken, createTrip)
    .patch(verifyToken, modifyTripSettings)


module.exports = router;
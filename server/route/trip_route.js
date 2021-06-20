const express = require('express');
const { verifyToken, verifyAccess } = require('../../utils/utils');

// controllers
const { createTrip, getTripSettings, modifyTripSettings } = require('../controller/trip_controller');
const { getArrangements, removeArrangement, updateArrangement } = require('../controller/arrangement_controller');
const { addSpot } = require('../controller/spot_controller');

const router = express.Router();

router.route('/arrangement')
  .post(verifyToken, verifyAccess, addSpot)
  .get(verifyToken, verifyAccess, getArrangements);

router.route('/arrangement/:tripId/:spotId')
  .delete(verifyToken, verifyAccess, removeArrangement)
  .patch(verifyToken, verifyAccess, updateArrangement);

router.route('/trip')
  .post(verifyToken, createTrip)
  .get(verifyToken, verifyAccess, getTripSettings);

router.route('/trip/:tripId')
  .patch(verifyToken, verifyAccess, modifyTripSettings);

module.exports = router;

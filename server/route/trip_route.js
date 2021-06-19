const express = require('express');
const { verifyToken, verifyAccess } = require('../../utils/utils');

// controllers
const { getTripSettings, modifyTripSettings } = require('../controller/trip_controller');
const { getArrangements, removeArrangement, updateArrangement } = require('../controller/arrangement_controller');
const { addSpot } = require('../controller/spot_controller');

const router = express.Router();

router.route('/spot')
  .post(verifyToken, verifyAccess, addSpot);

router.route('/arrangement')
  .get(verifyToken, verifyAccess, getArrangements);

router.route('/arrangement/:tripId/:spotId')
  .delete(verifyToken, verifyAccess, removeArrangement)
  .patch(verifyToken, verifyAccess, updateArrangement);

router.route('/trip')
  .get(verifyToken, verifyAccess, getTripSettings);

router.route('/trip/:tripId')
  .patch(verifyToken, verifyAccess, modifyTripSettings);

module.exports = router;

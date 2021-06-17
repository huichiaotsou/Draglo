const express = require('express');
const { verifyToken } = require('../../utils/utils');

// controllers
const { signIn, signUp } = require('../controller/user_controller');
const { createTrip } = require('../controller/trip_controller');
const { getDashboard } = require('../controller/user_controller');

const router = express.Router();

router.route('/signin')
  .post(signIn);

router.route('/signup')
  .post(signUp);

router.route('/trip')
  .post(verifyToken, createTrip);

router.route('/dashboard')
  .get(verifyToken, getDashboard);

module.exports = router;

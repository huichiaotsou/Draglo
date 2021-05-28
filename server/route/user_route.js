const express = require('express');
const router = express.Router();
const { signIn, signUp } = require('../controller/user_controller');
const { createTrip } = require('../controller/trip_controller');
const { getDashboard } = require('../controller/user_controller');
const { verifyToken } = require('../../utils/utils')

router.route('/signin')
    .post( signIn )

router.route('/signup')
    .post( signUp )

router.route('/trip')
    .post( verifyToken, createTrip )

router.route('/dashboard')
    .get( verifyToken, getDashboard )

module.exports = router;
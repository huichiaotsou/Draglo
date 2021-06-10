const { verifyToken } = require('../../utils/utils')

//controllers 
const { signIn, signUp } = require('../controller/user_controller');
const { createTrip } = require('../controller/trip_controller');
const { getDashboard } = require('../controller/user_controller');

const express = require('express');
const router = express.Router();

router.route('/signin')
    .post( signIn )

router.route('/signup')
    .post( signUp )

router.use(verifyToken) //applied only for below routes

router.route('/trip')
    .post( createTrip )

router.route('/dashboard')
    .get( getDashboard )

module.exports = router;
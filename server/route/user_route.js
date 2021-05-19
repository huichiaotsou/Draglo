const express = require('express');
const router = express.Router();
const path = require('path')
const { signIn, signUp, getDashboard } = require('../controller/user_controller');
const { verifyToken } = require('../../utils/utils');

router.route('/signin')
    .post(signIn)

router.route('/signup')
    .post(signUp)

router.route('/dashboard')
    .get(verifyToken, getDashboard)

module.exports = router;
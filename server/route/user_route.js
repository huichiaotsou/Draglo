const express = require('express');
const router = express.Router();
const path = require('path')
const { signIn, signUp } = require('../controller/user_controller');

router.route('/signin')
    .get((req, res) => {res.sendFile(path.join(__dirname, '../../public', 'signin.html'))})
    .post(signIn)

router.route('/signup')
    .get((req, res) => {res.sendFile(path.join(__dirname, '../../public', 'signup.html'))})
    .post(signUp)

module.exports = router;
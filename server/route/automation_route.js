const express = require('express');
const router = express.Router();
const { calculateTrips, calculateIntercity } = require('../controller/automation_controller');
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

router.route('/automation')
    .post( calculateTrips )

router.route('/intercity')
    .post( calculateIntercity )

module.exports = router;
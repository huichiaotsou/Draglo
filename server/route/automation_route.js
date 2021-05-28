const express = require('express');
const router = express.Router();
const { calculateTrips } = require('../controller/automation_controller');
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

router.route('/automation')
    .post( calculateTrips )

module.exports = router;
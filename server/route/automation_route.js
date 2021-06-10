const express = require('express');
const router = express.Router();
const { calculateTrips } = require('../controller/automation_controller');
const { verifyToken, verifyAccess } = require('../../utils/utils')
const { iCalendarFeed } = require('../controller/calendar_controller')

router.use(express.json());
router.use(express.urlencoded({ extended: false }));

router.route('/automation', verifyToken, verifyAccess)
    .post( calculateTrips )

router.route('/calendar', verifyToken, verifyAccess)
    .post ( iCalendarFeed )

module.exports = router;
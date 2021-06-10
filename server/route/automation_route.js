const { verifyToken, verifyAccess } = require('../../utils/utils')

//controllers 
const { calculateTrips } = require('../controller/automation_controller');
const { iCalendarFeed } = require('../controller/calendar_controller')

const express = require('express');
const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(verifyToken, verifyAccess)

router.route('/automation')
    .post( calculateTrips )

router.route('/calendar')
    .post ( iCalendarFeed )

module.exports = router;
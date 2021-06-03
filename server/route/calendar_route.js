const express = require('express');
const router = express.Router();
const { iCalendarFeed } = require('../controller/calendar_controller')

router.route('/calendar')
    .post ( iCalendarFeed )

module.exports = router
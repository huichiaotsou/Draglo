const express = require('express');
const router = express.Router();
const { calculateTrips } = require('../controller/automation_controller');

router.post('/automation', calculateTrips)

module.exports = router;
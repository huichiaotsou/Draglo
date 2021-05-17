const express = require('express');
const router = express.Router();
const { calculateTrips } = require('../controller/automation_controller');
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

router.post('/automation', calculateTrips)

module.exports = router;
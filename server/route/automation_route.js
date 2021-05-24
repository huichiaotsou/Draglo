const express = require('express');
const router = express.Router();
const { calculateTrips } = require('../controller/automation_controller');
const { verifyToken } = require('../../utils/utils')
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

router.post('/automation', verifyToken, calculateTrips)

// const { getTravelingTime } = require('../model/automation_model')
// router.get('/traveltime', async (req, res)=>{
//     let travelingTime = await getTravelingTime('ChIJE-kmU2mpQjQRg3J0ihh6nvI','ChIJKyaoGAmpQjQR99RS3zrx9Ms');
//     res.send({travelingTime});
// })

module.exports = router;
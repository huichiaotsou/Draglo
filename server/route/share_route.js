const { verifyToken, verifyAccess } = require('../../utils/utils')

//controllers 
const { createShareToken, updateShareAccess } = require('../controller/share_controller')

const express = require('express');
const router = express.Router();

router.use(verifyToken)

router.route('/share')
    .post ( verifyAccess, createShareToken )
    .patch ( updateShareAccess )

module.exports = router
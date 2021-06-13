const { verifyToken, verifyAccess } = require('../../utils/utils')

//controllers 
const { createShareToken, updateShareAccess } = require('../controller/share_controller')

const express = require('express');
const router = express.Router();

router.route('/share')
    .post ( verifyToken, verifyAccess, createShareToken )
    .patch ( verifyToken, updateShareAccess )

module.exports = router
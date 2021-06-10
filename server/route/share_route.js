const express = require('express');
const router = express.Router();
const { createShareToken, updateShareAccess } = require('../controller/share_controller')
const { verifyToken, verifyAccess } = require('../../utils/utils')

router.route('/share', verifyToken)
    .post ( verifyAccess, createShareToken )
    .patch ( updateShareAccess )

module.exports = router
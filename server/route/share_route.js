const express = require('express');
const router = express.Router();
const { createShareToken, updateShareAccess } = require('../controller/share_controller')

router.route('/share')
    .post ( createShareToken )
    .patch ( updateShareAccess )

module.exports = router
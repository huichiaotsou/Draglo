const express = require('express');
const { verifyToken, verifyAccess } = require('../../utils/utils');

// controllers
const { createShareToken, updateShareAccess } = require('../controller/share_controller');

const router = express.Router();

router.route('/share')
  .patch(verifyToken, updateShareAccess)
  .post(verifyToken, verifyAccess, createShareToken);

module.exports = router;

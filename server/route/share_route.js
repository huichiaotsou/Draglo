const express = require('express');
const { verifyAccess } = require('../../utils/utils');

// controllers
const { createShareToken, updateShareAccess } = require('../controller/share_controller');

const router = express.Router();

router.route('/share')
  .patch(updateShareAccess)
  .post(verifyAccess, createShareToken);

module.exports = router;

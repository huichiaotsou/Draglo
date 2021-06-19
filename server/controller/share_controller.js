const jwt = require('jsonwebtoken');
const Share = require('../model/share_model');
const { sendEmail } = require('../../utils/utils');

const createShareToken = async (req, res, next) => {
  try {
    const {
      tripId, title, email,
    } = req.body;
    const shareToken = jwt.sign({ tripId, email }, process.env.SHARE_TOKEN_SECRET);
    await Share.createShareToken(tripId, shareToken);
    await sendEmail(title, email, shareToken);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const updateShareAccess = async (req, res, next) => {
  try {
    const { shareToken } = req.body;
    const userId = req.user.id;
    jwt.verify(shareToken, process.env.SHARE_TOKEN_SECRET, async (err, result) => {
      if (err) {
        res.sendStatus(403);
      }
      const update = await Share.updateShareAccess(userId, shareToken);
      if (update.error) {
        res.status(403).send(update.error);
      } else {
        res.status(204).send({ tripId: result.tripId });
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShareToken,
  updateShareAccess,
};

const Share = require('../model/share_model')
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../../utils/utils')

const createShareToken = async (req, res, next) => {
    try {
        let { tripId, title, email } = req.body;
        let shareToken = jwt.sign({tripId, email}, process.env.SHARE_TOKEN_SECRET);
        await Share.createShareToken(tripId, shareToken);
        //send token with node mailer
        await sendEmail(title, email, shareToken);
        res.sendStatus(200);
    } catch(error){
        next(error)
    }
}

const updateShareAccess = async (req, res, next) => {
    console.log(req.body);
    let { shareToken } = req.body;
    let userId = req.user.id;
    jwt.verify(shareToken, process.env.SHARE_TOKEN_SECRET, async (err, result) => {
        if (err) {
          res.sendStatus(403);
        }
        let update = await Share.updateShareAccess(userId, shareToken)
        if (update.error) {
            res.status(403).send(update.error)
        } else {
            res.status(200).send({tripId: result.tripId});
        }
    });

}


module.exports = {
    createShareToken,
    updateShareAccess,
    // deleteContributors
}




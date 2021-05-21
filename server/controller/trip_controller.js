const Trip = require('../model/trip_model')

const createTrip = async (req, res, next) => {
    let { id } = req.user;
    let start = new Date();
    let now = new Date()
    let end = new Date (now.setDate(now.getDate() + 6));
    let initialTrip = {
        name: '未命名行程',
        trip_start: start,
        trip_end: end,
        day_start: "0900",
        day_end: "2000",
        is_archived: 0,
        user_id: id,
        image: '/images/bg.jpg'
    }
    let result = await Trip.createTrip(initialTrip);
    res.status(200).send({tripId: result});
}

const getTripSettings = async (req, res, next) => {
    let userId = req.user.id;
    let tripId = req.query.id;
    let checkOwnership = await Trip.checkOwnership(userId, tripId);
    let role = checkOwnership.role;
    if(role == 'author' || role == 'contributor') {
        let result =  await Trip.getTripSettings(userId, tripId);
        result.duration = (result.trip_end - result.trip_start)/(1000*60*60*24) + 1;
        res.status(200).send(result);
    } else if (!tripId) {
        res.sendStatus(400);
    } else {
        res.sendStatus(403);
    }
}

const modifyTripSettings = async (req, res, next) => {
    let userId = req.user.id;
    let { tripId, tripStart, tripEnd, modify, tripName, archived } = req.body;
    tripStart = new Date(tripStart);
    tripEnd = new Date(tripEnd);
    let checkOwnership = await Trip.checkOwnership(userId, tripId);
    let role = checkOwnership.role;
    if(role == 'author') {
        if(modify == 'duration') {
            let result = await Trip.updateDuration(tripId, tripStart, tripEnd);
            if (result.error) {
                res.sendStatus(500)
            } else {
                res.sendStatus(200)
            }
        } else if (modify == 'name') {
            let result = await Trip.updateName(tripId, tripName);
            if (result.error) {
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        } else if (modify == 'archived') {
            let result = await Trip.archiveTrip(tripId, archived);
            if (result.error) {
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        }
    } else {
        res.sendStatus(403);
    }
}

module.exports = {
    createTrip,
    modifyTripSettings,
    getTripSettings
}
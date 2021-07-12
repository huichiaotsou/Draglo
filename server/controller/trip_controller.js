const Trip = require('../model/trip_model');

const createTrip = async (req, res, next) => {
  try {
    const { id } = req.user;
    const now1 = new Date(new Date().setHours(0, 0, 0, 0));
    const start = new Date(now1.setDate(now1.getDate() + 30));
    const now2 = new Date(new Date().setHours(0, 0, 0, 0));
    const end = new Date(now2.setDate(now2.getDate() + 37));
    const initTrip = {
      name: 'Unnamed Trip',
      trip_start: start,
      trip_end: end,
      day_start: '0900',
      day_end: '2000',
      is_archived: 0,
      user_id: id,
      image: '/images/bg.jpg',
    };
    const result = await Trip.createTrip(initTrip);
    res.status(200).send({ tripId: result });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getTripSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tripId = req.query.id;
    const result = await Trip.getTripSettings(userId, tripId);
    result.duration = (result.trip_end - result.trip_start) / (1000 * 60 * 60 * 24);
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const modifyTripSettings = async (req, res, next) => {
  try {
    const {
      modify, tripName, archived,
    } = req.body;
    const {
      tripId,
    } = req.params;

    const tripStart = new Date(req.body.tripStart);
    const tripEnd = new Date(req.body.tripEnd);
    const MAX_DURATION = 20;
    if ((tripEnd - tripStart) / (1000 * 60 * 60 * 24) > MAX_DURATION) {
      res.status(403).send('too long period');
    } else if (tripEnd < tripStart) {
      res.status(403).send('trip end is earlier than trip start');
    } else if (modify === 'duration') {
      await Trip.updateDuration(tripId, tripStart, tripEnd);
      res.sendStatus(204);
    } else if (modify === 'name') {
      await Trip.updateName(tripId, tripName);
      res.sendStatus(204);
    } else if (modify === 'archived') {
      await Trip.archiveTrip(tripId, archived);
      res.sendStatus(204);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  createTrip,
  modifyTripSettings,
  getTripSettings,
};

const Trip = require('../model/trip_model');

const createTrip = async (req, res, next) => {
  try {
    const { id } = req.user;
    const now1 = new Date(new Date().setHours(0, 0, 0, 0));
    const start = new Date(now1.setDate(now1.getDate() + 30));
    const now2 = new Date(new Date().setHours(0, 0, 0, 0));
    const end = new Date(now2.setDate(now2.getDate() + 37));
    const initTrip = {
      name: '未命名行程',
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
    if ((tripEnd - tripStart) / (1000 * 60 * 60 * 24) > 20) {
      res.status(500).send('too long period');
    }
    if (modify === 'duration') {
      const result = await Trip.updateDuration(tripId, tripStart, tripEnd);
      if (result.error) {
        res.status(500).send('server error, please try again later');
      } else {
        res.sendStatus(204);
      }
    } else if (modify === 'name') {
      const result = await Trip.updateName(tripId, tripName);
      if (result.error) {
        res.status(500).send('server error, please try again later');
      } else {
        res.sendStatus(204);
      }
    } else if (modify === 'archived') {
      const result = await Trip.archiveTrip(tripId, archived);
      if (result.error) {
        res.status(500).send('server error, please try again later');
      } else {
        res.sendStatus(204);
      }
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

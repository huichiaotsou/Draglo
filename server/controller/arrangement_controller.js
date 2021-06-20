const Arrangement = require('../model/arrangement_model');

const getArrangements = async (req, res, next) => {
  try {
    const { // id = tripId
      status, city, id, placeId,
    } = req.query;
    if (status === 'pending') {
      let pendingArrangements;
      if (city) {
        pendingArrangements = await Arrangement.getPendingArrangements(id, city);
      } else if (placeId) {
        pendingArrangements = await Arrangement.getPendingArrangements(id, null, placeId);
      } else {
        pendingArrangements = await Arrangement.getPendingArrangements(id);
      }

      for (const arrangement of pendingArrangements) {
        arrangement.open_hour = `${Math.floor(arrangement.open_hour / 100)}:${arrangement.open_hour % 100}`;
        arrangement.closed_hour = `${Math.floor(arrangement.closed_hour / 100)}:${arrangement.closed_hour % 100}`;
        if (parseInt(arrangement.open_hour.split(':')[0], 10) === 0) {
          arrangement.open_hour = `00:${arrangement.open_hour.split(':')[1]}`;
        }
        if (parseInt(arrangement.open_hour.split(':')[1], 10) === 0) {
          arrangement.open_hour = `${arrangement.open_hour.split(':')[0]}:00`;
        }
        if (parseInt(arrangement.closed_hour.split(':')[0], 10) === 0) {
          arrangement.closed_hour = `00:${arrangement.closed_hour.split(':')[1]}`;
        }
        if (parseInt(arrangement.closed_hour.split(':')[1], 10) === 0) {
          arrangement.closed_hour = `${arrangement.closed_hour.split(':')[0]}:00`;
        }
        if (parseInt(arrangement.closed_hour.split(':')[0], 10) > 24) {
          arrangement.closed_hour = `${arrangement.closed_hour.split(':')[0] - 24}:${arrangement.closed_hour.split(':')[1]}`;
        }
      }

      const response = {
        cities: '',
        spots: pendingArrangements,
      };
      if (pendingArrangements.length > 0) {
        response.cities = [pendingArrangements[0].city];
        for (let i = 1; i < pendingArrangements.length; i += 1) {
          if (pendingArrangements[i - 1].city !== pendingArrangements[i].city) {
            response.cities.push(pendingArrangements[i].city);
          }
        }
      } else if (placeId) {
        const checkArranged = await Arrangement.getArrangements(id, placeId);
        if (checkArranged.length > 0) {
          response.isArranged = true;
        }
      }
      res.send(response);
    } else if (status === 'arranged') {
      const arrangements = await Arrangement.getArrangements(id);
      // tuning open hours to human readable format
      for (const arrangement of arrangements) {
        arrangement.open_hour = `${Math.floor(arrangement.open_hour / 100)}:${arrangement.open_hour % 100}`;
        arrangement.closed_hour = `${Math.floor(arrangement.closed_hour / 100)}:${arrangement.closed_hour % 100}`;
        if (arrangement.open_hour.split(':')[0] === 0) {
          arrangement.open_hour = `00:${arrangement.open_hour.split(':')[1]}`;
        }
        if (arrangement.open_hour.split(':')[1] === 0) {
          arrangement.open_hour = `${arrangement.open_hour.split(':')[0]}:00`;
        }
        if (arrangement.closed_hour.split(':')[0] === 0) {
          arrangement.closed_hour = `00:${arrangement.closed_hour.split(':')[1]}`;
        }
        if (arrangement.closed_hour.split(':')[1] === 0) {
          arrangement.closed_hour = `${arrangement.closed_hour.split(':')[0]}:00`;
        }
        if (parseInt(arrangement.closed_hour.split(':')[0], 10) > 24) {
          arrangement.closed_hour = `${arrangement.closed_hour.split(':')[0] - 24}:${arrangement.closed_hour.split(':')[1]}`;
        }
      }
      res.send(arrangements);
    }
  } catch (error) {
    next(error);
  }
};

const removeArrangement = async (req, res, next) => {
  try {
    const {
      spotId, tripId,
    } = req.params;
    const result = await Arrangement.removeArrangement(spotId, tripId);
    if (result.error) {
      res.sendStatus(500);
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    next(error);
  }
};

const updateArrangement = async (req, res, next) => {
  try {
    const {
      isArranged, startTime, endTime, autoArranged,
    } = req.body;
    const {
      spotId, tripId,
    } = req.params;
    let result;
    if (spotId === 'cleartrip') {
      result = await Arrangement.clearArrangement(tripId);
    } else {
      result = await Arrangement
        .updateArrangement(isArranged, spotId, tripId, startTime, endTime, autoArranged);
    }
    if (result.error) {
      res.sendStatus(500);
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getArrangements,
  removeArrangement,
  updateArrangement,
};

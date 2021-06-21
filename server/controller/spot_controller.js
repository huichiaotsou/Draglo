require('dotenv').config();
const fetch = require('node-fetch');
const Spot = require('../model/spot_model');
const Trip = require('../model/trip_model');
const { getCityName, recordOpenDays } = require('../../utils/organizeTrip');

const { PLACE_API, PHOTO_PATH } = process.env;

const addSpot = async (req, res, next) => {
  try {
    const { tripId, spotName, placeId } = req.body;
    const userId = req.user.id;
    const placeAPI = PLACE_API + placeId;
    fetch(placeAPI)
      .then((data) => data.json())
      .then(async (json) => {
        const { result } = json;
        if (result.photos) {
          const photoPath = PHOTO_PATH + result.photos[0].photo_reference;
          await Trip.updateImage(tripId, photoPath);
        }

        const components = result.address_components;
        const city = getCityName(components);
        const spotInfo = {
          google_id: placeId,
          city,
          name: spotName,
          latitude: result.geometry.location.lat,
          longtitude: result.geometry.location.lng,
          linger_time: 90,
          address: result.formatted_address,
          open_days: '0,1,2,3,4,5,6',
          open_hour: '0000',
          closed_hour: '2400',
        };

        // record open days if exists
        if (result.opening_hours) {
          recordOpenDays(result.opening_hours, spotInfo);
        }

        // init arrangements
        const initArrangements = {
          trip_id: tripId,
          user_id: userId,
          is_arranged: 0,
        };

        if (components.length <= 3) {
          res.status(400).send({
            error: '請選擇特定景點以加入清單',
          });
        } else {
          await Spot.addSpot(spotInfo, initArrangements);
          res.sendStatus(204);
        }
      });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  addSpot,
};

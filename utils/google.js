/* eslint-disable no-param-reassign */
require('dotenv').config();
const axios = require('axios');

const directionAPI = async (prevSpotId, nextSpotId, mode, breaker) => {
  const directionURL = `${process.env.DIRECTION_API}origin=place_id:${prevSpotId}&destination=place_id:${nextSpotId}&mode=${mode}`;
  const travelTime = await axios.get(directionURL)
    .then((res) => {
      const { data } = res;
      if (breaker > 3) {
        return {
          error: 'no available transit found',
          distance: data.routes[0].legs[0].distance.value,
        };
      }
      if (data.available_travel_modes) { // no public transit found
        breaker += 1;
        return directionAPI(prevSpotId, nextSpotId, data.available_travel_modes[0], breaker);
      }
      const detail = data.routes[0].legs[0];
      const sqlData = {
        start_google_id: prevSpotId,
        end_google_id: nextSpotId,
        distance: detail.distance.value,
        transit_time: (detail.duration.value / 60),
      };
      if (data.routes[0].fare) {
        sqlData.transit_cost = data.routes[0].fare.text;
      }
      return sqlData;
    })
    .catch((error) => {
      console.log(error);
    });
  return travelTime;
};

const getGmailAddress = async (googleToken) => {
  const requestURL = `https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`;
  const result = await axios.get(requestURL)
    .then((res) => {
      const { data } = res;
      return { gmail: data.email };
    })
    .catch((error) => {
      console.log(error);
      return { error };
    });
  return result;
};

module.exports = {
  directionAPI,
  getGmailAddress,
};

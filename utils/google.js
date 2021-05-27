require('dotenv').config();
const axios = require('axios');

let directionAPI = async (prevSpotId, nextSpotId, mode) => {
    console.log('A. directionAPI: ');
    console.log('A-1. FROM '+ prevSpotId + ' TO ' + nextSpotId);
    let directionURL = process.env.DIRECTION_API + 'origin=place_id:' + prevSpotId +'&destination=place_id:' + nextSpotId + '&mode=' + mode
    let travelTime = await axios.get(directionURL)
        .then((res) => {
            let data = res.data;
            if (data.available_travel_modes) { //no public transit found
                console.log('A-2. no public transit found ');
                console.log('A-3. use: '+ data.available_travel_modes[0]);
                return directionAPI(prevSpotId, nextSpotId, data.available_travel_modes[0])
            }
            let detail = data.routes[0].legs[0];
            let sqlData = {
                start_google_id: prevSpotId,
                end_google_id: nextSpotId,
                distance: detail.distance.value,
                transit_time: (detail.duration.value / 60),
            }
            if (data.routes[0].fare) {
                sqlData.transit_cost = data.routes[0].fare.text;
            }
            return sqlData;
        })
        .catch(error => {
            console.log(error);
        })
    return travelTime;
}

module.exports = {
    directionAPI
}
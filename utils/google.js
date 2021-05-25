require('dotenv').config();
const axios = require('axios');

let directionAPI = async (prevSpotId, nextSpotId, spotsInfo) => {
    let latitude = spotsInfo[prevSpotId].vector[0]
    let longtitude = spotsInfo[prevSpotId].vector[1]
    let timestamp = new Date()
    let timezoneURL = process.env.TIMEZONE_API + latitude +',' + longtitude + '&timestamp=' + timestamp.setDate(timestamp.getDate() + 2).toString().slice(0,-3)
    console.log("timezoneURL: ");
    console.log(timezoneURL);

    let timezoneOffset = await axios.get(timezoneURL)
        .then((res)=> {
            return res.data.rawOffset / 3600;
        })
        .catch(error => {
            console.log(error);
        })
    console.log('timezoneOffset: ');
    console.log(timezoneOffset);
    
    timestamp.setHours(8,0,0,0)
    let destinationTime = timestamp.setHours(timestamp.getHours() + timezoneOffset);
    console.log('destinationTime: ');
    console.log(destinationTime);

    let directionURL = process.env.DIRECTION_API + 'origin=place_id:' + prevSpotId +'&destination=place_id:' + nextSpotId + '&departure_time=' + destinationTime
    let travelTime = await axios.get(directionURL)
        .then((res) => {
            let data = res.data;
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
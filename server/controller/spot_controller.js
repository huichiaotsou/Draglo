const Spot = require('../model/spot_model');
const Trip = require('../model/trip_model');
const fetch = require('node-fetch');
require('dotenv').config();

const addSpot = async (req, res, next) => {
    let { tripId, spotName, placeId } = req.body;
    let userId = req.user.id;
    let placeAPI = process.env.PLACE_API + placeId;
    fetch(placeAPI)
        .then(data => data.json())
        .then(async (json) => {
            let { result } = json;
            //find city: either in locality or in admin level 1
            let city;
            let components = result.address_components
            for (let component of components) {
                if( component.types[0] == 'postal_town'){
                    city = component.short_name;
                    break
                }
                if (component.types[0] == 'locality') {
                    city = component.short_name;
                    break;
                }
                if (component.types[0] == 'administrative_area_level_1') {
                    city = component.short_name;
                    break;
                }
            }

            //handle Tokyo
            for (let i in components) {
                if (components[i].types[0] == 'administrative_area_level_1' && components[i]['short_name'] == 'Tokyo') {
                    city = 'Tokyo';
                    break;
                }
            }

            if(result.photos) {
                let photoPath = process.env.PHOTO_PATH + result.photos[0].photo_reference;
                await Trip.updateImage(tripId, photoPath);
            }

            let spotInfo = {
                google_id: placeId,
                city: city,
                name: spotName,
                latitude: result.geometry.location.lat,
                longtitude: result.geometry.location.lng,
                linger_time: 90,
                address: result.formatted_address,
                open_days: '0,1,2,3,4,5,6',
                open_hour: '0000',
                closed_hour: '2400'
            }

            
            //record open days
            if (result.opening_hours) {
                let periods = result.opening_hours.periods;
                let openDays = periods.map(status => status.open.day);
                openDays = openDays.filter((day, index) => openDays.indexOf(day) == index);
                spotInfo.open_days = openDays.toString();
                if (periods[0].open) {
                    spotInfo.open_hour = periods[0].open.time;
                }
                if (periods[0].close) {
                    spotInfo.closed_hour = periods[0].close.time;
                    if (parseInt(spotInfo.closed_hour) <= 430) {
                        spotInfo.closed_hour = 2400 + parseInt(spotInfo.closed_hour);
                    }
                }
            }

            //init arrangements
            let initArrangements = {
                trip_id: tripId,
                user_id: userId,
                is_arranged: 0
            }

            let spotAdded = await Spot.addSpot(spotInfo, initArrangements);

            if(spotAdded.error){
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
}

module.exports = {
    addSpot
}
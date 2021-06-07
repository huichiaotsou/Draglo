const Arrangement = require('../model/arrangement_model');

const getArrangements = async (req, res, next) => {
    try {
        let { status, city, id, placeId } = req.query; //id = tripId
        if (status == 'pending') {
            let pendingArrangements;
            if (city) {
                pendingArrangements = await Arrangement.getPendingArrangements(id, city);
            } else if (placeId) {
                pendingArrangements = await Arrangement.getPendingArrangements(id, null, placeId);
            } else {
                pendingArrangements = await Arrangement.getPendingArrangements(id);
            }

            for (let arrangement of pendingArrangements) {
                arrangement.open_hour = `${Math.floor(arrangement.open_hour / 100)}:${arrangement.open_hour % 100}`
                arrangement.closed_hour = `${Math.floor(arrangement.closed_hour / 100)}:${arrangement.closed_hour % 100}`
                if (arrangement.open_hour.split(':')[0] == 0) {
                    arrangement.open_hour = '00:' + arrangement.open_hour.split(':')[1];
                }
                if (arrangement.open_hour.split(':')[1] == 0) {
                    arrangement.open_hour = arrangement.open_hour.split(':')[0] + ':00';
                }
                if (arrangement.closed_hour.split(':')[0] == 0) {
                    arrangement.closed_hour = '00:' + arrangement.closed_hour.split(':')[1];
                }
                if (arrangement.closed_hour.split(':')[1] == 0) {
                    arrangement.closed_hour = arrangement.closed_hour.split(':')[0] + ':00';
                }
                if (parseInt(arrangement.closed_hour.split(':')[0]) > 24) {
                    arrangement.closed_hour = (arrangement.closed_hour.split(':')[0] - 24) + ':'+ arrangement.closed_hour.split(':')[1];
                }
            }
    
            let response = {
                cities: "",
                spots: pendingArrangements
            }
            if (pendingArrangements.length > 0) {
                response.cities = [pendingArrangements[0].city];
                for (let i = 1; i < pendingArrangements.length ; i++) {
                    if (pendingArrangements[i-1].city != pendingArrangements[i].city) {
                        response.cities.push(pendingArrangements[i].city);
                    }
                }
            } else if (placeId) {
                let checkArranged = await Arrangement.getArrangements(id, placeId);
                console.log('checkArranged');
                console.log(checkArranged);
                if (checkArranged.length > 0) {
                    response.isArranged = true;
                }
            }
            res.send(response)
        } else if (status == 'arranged') {
            //render already arranged details (May 23)
            let arrangements = await Arrangement.getArrangements(id); //name, city, google_id, spot_id, start_time, end_time, open_hour, closed_hour
            //tuning open hours to human readable format
            for (let arrangement of arrangements) {
                arrangement.open_hour = `${Math.floor(arrangement.open_hour / 100)}:${arrangement.open_hour % 100}`
                arrangement.closed_hour = `${Math.floor(arrangement.closed_hour / 100)}:${arrangement.closed_hour % 100}`
                if (arrangement.open_hour.split(':')[0] == 0) {
                    arrangement.open_hour = '00:' + arrangement.open_hour.split(':')[1];
                }
                if (arrangement.open_hour.split(':')[1] == 0) {
                    arrangement.open_hour = arrangement.open_hour.split(':')[0] + ':00';
                }
                if (arrangement.closed_hour.split(':')[0] == 0) {
                    arrangement.closed_hour = '00:' + arrangement.closed_hour.split(':')[1];
                }
                if (arrangement.closed_hour.split(':')[1] == 0) {
                    arrangement.closed_hour = arrangement.closed_hour.split(':')[0] + ':00';
                }
                if (parseInt(arrangement.closed_hour.split(':')[0]) > 24) {
                    arrangement.closed_hour = (arrangement.closed_hour.split(':')[0] - 24) + ':'+ arrangement.closed_hour.split(':')[1];
                }
            }
            res.send(arrangements);
        }
    } catch (error) {
        console.log(error);
        next(error)
    }
}

const removeArrangement = async (req, res, next) => {
    let { spotId, tripId } = req.body;
    let result = await Arrangement.removeArrangement(spotId, tripId);
    if (result.error){
        res.sendStatus(500);
    } else {
        res.sendStatus(200);
    }
}

const updateArrangement = async (req, res, next) => {
    let { isArranged, spotId, tripId, startTime, endTime, autoArranged } = req.body;
    let result;
    if (spotId) {
        result = await Arrangement.updateArrangement(isArranged, spotId, tripId, startTime, endTime, autoArranged);
    } else {
        result = await Arrangement.clearArrangement(tripId);
    }
    if (result.error){
        res.sendStatus(500);
    } else {
        res.sendStatus(200);
    }
}
  
module.exports = {
    getArrangements,
    removeArrangement,
    updateArrangement
}



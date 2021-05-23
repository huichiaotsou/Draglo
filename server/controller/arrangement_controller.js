const Arrangement = require('../model/arrangement_model');

const getArrangements = async (req, res, next) => {
    try {
        let { status, city, id } = req.query;
        if (status == 'pending') {
            let pendingArrangements;
            if (city) {
                pendingArrangements = await Arrangement.getPendingArrangements(id, city);
            } else {
                pendingArrangements = await Arrangement.getPendingArrangements(id, null);
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
            }
            res.send(response)
        } else if (status == 'arranged') {
            //render already arranged details (May 23)
            let arrangements = await Arrangement.getArrangements(id); //name, city, google_id, spot_id, start_time, end_time
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
    let { isArranged, spotId, tripId, startTime, endTime } = req.body;
    let result = await Arrangement.updateArrangement(isArranged, spotId, tripId, startTime, endTime);
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



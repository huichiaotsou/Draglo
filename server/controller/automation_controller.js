const Automation = require('../model/automation_model')
const Kmeans = require('../../utils/kmeans')
const { getNextSpotId , arrangeNextActivity, removeSpot } = require('../../utils/organizeTrip');

//9am = 540, 12pm = 720, 1h30 = 810, 2pm = 840, 7pm = 1140

const calculateTrips = async (req, res, next) => {
    let { dayId, spotIds, spotsInfo, tripDuration, startTime, poleSpotIds } = req.body;
    tripDuration = tripDuration + 1;
    let originalStartTime = startTime;

    let wholeTrip = {};
    let nightEvents = wholeTrip.night_events = []
    while(spotIds.length > 0) { //while 一直跑到安排完所有景點
        //確認起始點
        let startSpotId = poleSpotIds[Math.floor(Math.random() * poleSpotIds.length)];
        if (startSpotId == undefined) {
            startSpotId = spotIds[Math.floor(Math.random() * spotIds.length)];
        }
        console.log('  ');
        console.log('-------------- New Day Start --------------');
        let clusters = Kmeans.getClusters(spotIds, spotsInfo, tripDuration, startSpotId);
        console.log("Day start with spot id: "+ startSpotId);
        console.log('-------------------------------------------');

        let spotInfo = await Automation.getSpotInfo(startSpotId);
        if (spotInfo.openHour >= 1020) { //after 5 pm
            //紀錄nightEventSpotIds
            spotInfo.activity = spotsInfo[startSpotId].name;
            nightEvents.push(spotInfo);
            //刪除並找下一個startSpotId
            removeSpot(startSpotId, spotIds);  
            removeSpot(startSpotId, poleSpotIds); 
            removeSpot(startSpotId, clusters[clusters.sequence[0]]); 
            startSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);;
            continue;
        } else {
            wholeTrip[dayId] = [ //initialize the day
                {
                    activity: spotsInfo[startSpotId].name,
                    startTime: startTime,
                    duration: spotInfo.lingerTime,
                    end: startTime + spotInfo.lingerTime
                }
            ];
            startTime += spotInfo.lingerTime; 
            removeSpot(startSpotId, spotIds);  
            removeSpot(startSpotId, poleSpotIds); 
            removeSpot(startSpotId, clusters[clusters.sequence[0]]); 
            if(clusters[clusters.sequence[0]].length == 0) {
                delete clusters[clusters.sequence[0]]
                clusters.sequence.splice(0,1);
            }
        }

        let pendingArrangement = [];
        let keepArranging = true;
        while (keepArranging) { //一直跑到當日景點排滿為止
             if (Object.keys(clusters).length == 1) { // clusters empty
                break;
             }
            if (Object.keys(clusters).length == 2 &&  clusters.sequence.length == 0) {
                clusters.sequence.push(Object.keys(clusters)[0]);
            }
            console.log("current spot id: " + startSpotId);
            let nextSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);
            console.log("calculated next spot id: " + nextSpotId);
            let nextActivity = await arrangeNextActivity(dayId, startTime, startSpotId, nextSpotId, spotsInfo);
            console.log(startSpotId + ' -> ' + nextSpotId + ' : transit and Spot to be added:');
            console.log(nextActivity);

            console.log("pendingArrangement.length: ");
            console.log(pendingArrangement.length);
            if (pendingArrangement.length > 0) {
                console.log('current clusters: ');
                console.log(clusters);
                console.log("pending arrangement: ");
                console.log(pendingArrangement);
                clusters[clusters.sequence[0]].concat(pendingArrangement);
                console.log(('clusters with pending arrangement added: '));
                console.log(clusters);                
            }

            //行程超時(8pm)、太早去、太晚去、沒開(return -1) -> 從 clusters 去除景點並找下個景點來安排，直到結束時間介於 6:30 ~ 8:00間
            if (nextActivity == -1) {

                pendingArrangement.push(nextSpotId);
                console.log('Pending Arrangement: ');
                console.log(pendingArrangement);

                removeSpot(nextSpotId, clusters[clusters.sequence[0]]);
                if(clusters[clusters.sequence[0]].length == 0) {
                    delete clusters[clusters.sequence[0]]
                    clusters.sequence.splice(0,1);
                }
                startSpotId = nextSpotId;
            } else {
                keepArranging = nextActivity.keepArranging; //while(true or false)
                wholeTrip[dayId] = wholeTrip[dayId].concat(nextActivity.arrangement);
                console.log("Latest Arrangement of whole day: ");
                console.log(wholeTrip[dayId]);
        
                startSpotId = nextSpotId;
                if (keepArranging) {
                    startTime = nextActivity.arrangement[1].end;
                }
                removeSpot(nextSpotId, spotIds); //remove arranged spot
                removeSpot(nextSpotId, poleSpotIds);
                removeSpot(nextSpotId, clusters[clusters.sequence[0]]); 
                if (clusters[clusters.sequence[0]].length == 0) {
                    delete clusters[clusters.sequence[0]];
                    clusters.sequence.splice(0,1);
                }
            }
        }
        console.log("remaining spots before moving to new day:");
        console.log(spotIds);    
        dayId ++; //換日
        if (dayId == 7){
            dayId = 0;
        }
        console.log("Next Day Id: " + dayId);
        startTime = originalStartTime;
        tripDuration --;
    }
    console.log("remaining spots before send wholeTrip response");
    console.log(spotIds);
    res.send(wholeTrip);
}

module.exports = {
    calculateTrips
}


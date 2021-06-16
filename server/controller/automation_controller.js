const Automation = require('../model/automation_model')
const Kmeans = require('../../utils/kmeans')
const { getNextSpotId , arrangeNextActivity, removeSpot, findPolePoints } = require('../../utils/organizeTrip');
const { calculateCloserPoint } = require('../../utils/geopackage')

const calculateTrips = async (req, res, next) => {
    try {
        let { tripId, dayId, googleIds, spotsInfo, tripDuration, startDate, arrangedEvents } = req.body;
        let startTime = parseInt(req.body.startTime)
        let startDateDatetime = new Date(startDate.split('GMT')[0])
        let startDateUnix = startDateDatetime.getTime();
        tripDuration = tripDuration + 1;
        let originalStartTime = startTime;

        //record arrangements
        let wholeTrip = {};
        let otherEvents = {}
        let nightEvents = otherEvents.nightEvents = [];
        let remainingSpots = otherEvents.remainingSpots = [];

        //record pending arrangements
        let pendingArrangement = [];
        let tooEarlyArrangement = [];

        //initialize count for each place id, stored in object
        let tooEarlyArrangementCount = {}
        googleIds.map(id => tooEarlyArrangementCount[id] = 0);

        while(googleIds.length > 0) { //loop until arranged all spots
            let poleSpotIds = findPolePoints(googleIds, spotsInfo);
            let startSpotId = poleSpotIds[ Math.floor(Math.random() * poleSpotIds.length) ];
    
            //若user當日已安排景點，以景點作為出發點計算kmeans結果
            let daysWithArrangedEvents = Object.keys(arrangedEvents)
            if (daysWithArrangedEvents) {
                for (let dayUnix of daysWithArrangedEvents) {
                    if (dayUnix == startDateUnix) {
                        let arrangedEvent = arrangedEvents[dayUnix][Math.floor(Math.random() * arrangedEvents[dayUnix].length)]
                        let vectors = googleIds.map(id => spotsInfo[id].vector) //get all vectors
                        let spotClosestToArrangedEventIndex = calculateCloserPoint(vectors, [arrangedEvent.latitude, arrangedEvent.longtitude], 'getClosePoint')
                        startSpotId = googleIds[spotClosestToArrangedEventIndex]
                    }
                }
            }
    
            let clusters = Kmeans.getClusters(googleIds, spotsInfo, tripDuration, startSpotId);
    
            let spotInfo = await Automation.getSpotInfo(startSpotId);
            if (spotInfo.openHour >= 960) { //after 5 pm, categorized to night events
                //紀錄nightEventSpotIds
                spotInfo.activity = spotsInfo[startSpotId].name;
                nightEvents.push(spotInfo);
                //刪除並找下一個startSpotId
                removeSpot(startSpotId, googleIds);  
                removeSpot(startSpotId, clusters[clusters.sequence[0]]); 
                continue;
            } else {
                //cehck 起始點當日是否營業：
                let open = false;
                let openDays = spotInfo.openDays.split(',');
                for (let day of openDays) {
                    if (parseInt(day) == parseInt(dayId)) {
                        open = true;
                    }
                }
                if (open) {
                    if (spotInfo.openHour > startTime + 120) { //起始點是否出門2小時內已營業
                        tooEarlyArrangement.push(startSpotId)
                        tooEarlyArrangementCount[startSpotId] += 1;
                            
                        removeSpot(startSpotId, clusters[clusters.sequence[0]]);
                        removeSpot(startSpotId, googleIds);
                        if(clusters[clusters.sequence[0]].length == 0) {
                            delete clusters[clusters.sequence[0]]
                            clusters.sequence.splice(0,1);
                        }
                        continue;
                    } else {
                        startTime = (spotInfo.openHour >= startTime) ? spotInfo.openHour : startTime;
                        
                        //if startTime 介於 一行程的排程段, 新的startTime = arranged行程的結束
                        let arrangedEventsOfDay = arrangedEvents[startDateUnix];
                        if (arrangedEventsOfDay) {
                            for (let event of arrangedEventsOfDay) {
                                if (
                                    (startTime <= event.end && startTime >= event.start) ||
                                    (startTime + 90 <= event.end && startTime + 90 >= event.start)
                                ) {
                                    let transitTime = await Automation.getTravelingTime(event.google_id, startSpotId, spotsInfo);
                                    startTime = event.end + transitTime;
                                }
                            }
                        }
    
                        wholeTrip[startDateUnix] = [ //initialize the day
                            {
                                activity: spotsInfo[startSpotId].name,
                                spotId: spotsInfo[startSpotId].spotId,
                                startTime: startTime,
                                end: startTime + spotInfo.lingerTime
                            }
                        ];

                        startTime += spotInfo.lingerTime;
                        removeSpot(startSpotId, googleIds);  
                        removeSpot(startSpotId, clusters[clusters.sequence[0]]); 
                        if(clusters[clusters.sequence[0]].length == 0) {
                            delete clusters[clusters.sequence[0]]
                            clusters.sequence.splice(0,1);
                        }
                    }
                } else {
                    //-> 從 clusters 去除景點並找下個景點來安排
                    pendingArrangement.push(startSpotId);    
                    removeSpot(startSpotId, googleIds);
                    removeSpot(startSpotId, clusters[clusters.sequence[0]]);
                    if(clusters[clusters.sequence[0]].length == 0) {
                        delete clusters[clusters.sequence[0]]
                        clusters.sequence.splice(0,1);
                    }
                    startSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);
                    continue;
                }
            }
    
            let keepArranging = true;
            while (keepArranging) { //一直跑到當日景點排滿為止
                 if (Object.keys(clusters).length == 1) { // clusters empty
                    break;
                 }
                if (Object.keys(clusters).length > 1 &&  clusters.sequence.length == 0) {
                    clusters.sequence.push(Object.keys(clusters)[0]);
                }
                let nextSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);
                if (nextSpotId == -1) { //已無景點
                    break;
                }
                let nextActivity = await arrangeNextActivity(dayId, startTime, startSpotId, nextSpotId, spotsInfo, arrangedEvents, startDateUnix);
    
                if (tooEarlyArrangement.length > 0) { //將先前太早去的景點加回到cluster
                    tooEarlyArrangement.map( googleId => {
                        if(tooEarlyArrangementCount[googleId] < 7) {
                            clusters[clusters.sequence[0]] = clusters[clusters.sequence[0]].concat(tooEarlyArrangement);
                        }
                    })
                    googleIds = googleIds.concat(tooEarlyArrangement);
                    tooEarlyArrangement = []; //清空too early
                }
                
                if (nextActivity == -1) { //行程超時(8pm)、太晚去、沒開(return -1) 
                    //-> 從 clusters 去除景點並找下個景點來安排，直到結束時間介於 6:30 ~ 8:00間
                    pendingArrangement.push(nextSpotId);    
                    removeSpot(nextSpotId, clusters[clusters.sequence[0]]);
                    removeSpot(nextSpotId, googleIds);
                    if(clusters[clusters.sequence[0]].length == 0) {
                        delete clusters[clusters.sequence[0]]
                        clusters.sequence.splice(0,1);
                    }
                    // startSpotId = nextSpotId;
                } else if (nextActivity == -2) { // 太早去的行程放進too early稍待安排
                    tooEarlyArrangement.push(nextSpotId);
                    tooEarlyArrangementCount[nextSpotId] += 1;
    
                    removeSpot(nextSpotId, clusters[clusters.sequence[0]]);
                    removeSpot(nextSpotId, googleIds)
                    if(clusters[clusters.sequence[0]].length == 0) {
                        delete clusters[clusters.sequence[0]]
                        clusters.sequence.splice(0,1);
                    }
                    // startSpotId = nextSpotId;
                } else {
                    keepArranging = nextActivity.keepArranging; //while(true or false)
                    wholeTrip[startDateUnix] = wholeTrip[startDateUnix].concat(nextActivity.arrangement);
                    startSpotId = nextSpotId;
                    if (keepArranging) {
                        startTime = nextActivity.arrangement[1].end;
                    }
                    removeSpot(nextSpotId, googleIds); //remove arranged spot
                    removeSpot(nextSpotId, poleSpotIds);
                    removeSpot(nextSpotId, clusters[clusters.sequence[0]]); 
                    if (clusters[clusters.sequence[0]].length == 0) {
                        delete clusters[clusters.sequence[0]];
                        clusters.sequence.splice(0,1);
                    }
                }
            }
    
            if (pendingArrangement.length > 0) { //將太晚去、沒開、行程超時的景點加回到總清單
                googleIds = googleIds.concat(pendingArrangement);
                pendingArrangement = []; //清空 pending arrangements
            }
    
            dayId ++; //換日
            if (dayId == 7){
                dayId = 0;
            }
            //add one day to unix time
            startDateUnix = startDateDatetime.setDate(startDateDatetime.getDate() + 1);
            startTime = originalStartTime;
            tripDuration --;
        }
        
        if (googleIds.length > 0 || tooEarlyArrangement.length > 0 || pendingArrangement.length > 0) {
            if (googleIds.length > 0) {
                for (let id of googleIds) {
                    let remainingSpotInfo = await Automation.getSpotInfo(id);
                    remainingSpotInfo.activity = spotsInfo[id].name;
                    remainingSpots.push(remainingSpotInfo);
                }
            }
            if (tooEarlyArrangement.length > 0) {
                for (let id of tooEarlyArrangement) {
                    let remainingSpotInfo = await Automation.getSpotInfo(id);
                    remainingSpotInfo.activity = spotsInfo[id].name;
                    remainingSpots.push(remainingSpotInfo);
                }
            }
            if (pendingArrangement.length > 0) {
                for (let id of pendingArrangement) {
                    let remainingSpotInfo = await Automation.getSpotInfo(id);
                    remainingSpotInfo.activity = spotsInfo[id].name;
                    remainingSpots.push(remainingSpotInfo);
                }
            }
        }
    
        await Automation.arrangeAutomationResult(tripId, req.user.id, dayId, startDate, wholeTrip);
        res.send(otherEvents);
    } catch (error) {
        console.log(error);
        next(error)
    }
}

module.exports = {
    calculateTrips
}


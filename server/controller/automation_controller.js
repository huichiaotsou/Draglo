const Automation = require('../model/automation_model')
const Kmeans = require('../../utils/kmeans')
const { getNextSpotId , arrangeNextActivity, removeSpot, findPolePoints } = require('../../utils/organizeTrip');
const { calculateCloserPoint } = require('../../utils/geopackage')

const calculateTrips = async (req, res, next) => {
    try {
        console.log(req.body);
        let { tripId, dayId, googleIds, spotsInfo, tripDuration, startDate, arrangedEvents } = req.body;
        console.log('arrangedEvents: ');
        console.log(arrangedEvents);
        let startTime = parseInt(req.body.startTime)
        let startDateDatetime = new Date(startDate.split('GMT')[0])
        let startDateUnix = startDateDatetime.getTime();
        
        tripDuration = tripDuration + 1;
        let originalStartTime = startTime;
        
        let wholeTrip = {};
        let otherEvents = {}
        let nightEvents = otherEvents.nightEvents = [];
        let remainingSpots = otherEvents.remainingSpots = [];
        let pendingArrangement = [];
        let tooEarlyArrangement = [];
        let tooEarlyArrangementCount = {}
        googleIds.map(id => tooEarlyArrangementCount[id] = 0);
        while(googleIds.length > 0) { //while 一直跑到安排完所有景點
            console.log('  ');
            console.log('1: -------------- New Day Start --------------');
    
            let poleSpotIds = findPolePoints(googleIds, spotsInfo);
            console.log('2: poleSpotIds');
            console.log(poleSpotIds);
            //確認起始點
            let startSpotId = poleSpotIds[Math.floor(Math.random() * poleSpotIds.length)];
    
            //若user當日已安排景點，以景點作為出發點計算kmeans結果
            let daysWithArrangedEvents = Object.keys(arrangedEvents)
            if (daysWithArrangedEvents) {
                for (let dayUnix of daysWithArrangedEvents) {
                    console.log('dayUnix and StartDateUnix:');
                    console.log(dayUnix);
                    console.log(startDateUnix);
                    if (dayUnix == startDateUnix) {
                        console.log('2-1: day and dayId match');
                        let arrangedEvent = arrangedEvents[dayUnix][Math.floor(Math.random() * arrangedEvents[dayUnix].length)]
                        // let vectors = [];
                        // for( let id of googleIds ) { 
                        //     vectors.push(spotsInfo[id].vector)
                        // }
                        let vectors = googleIds.map(id => spotsInfo[id].vector) //get all vectors
                        let spotClosestToArrangedEventIndex = calculateCloserPoint(vectors, [arrangedEvent.latitude, arrangedEvent.longtitude], 'getClosePoint')
                        startSpotId = googleIds[spotClosestToArrangedEventIndex]
                        console.log('2-2: new start spot id: ');
                        console.log(startSpotId);
                    }
                }
            }
    
            let clusters = Kmeans.getClusters(googleIds, spotsInfo, tripDuration, startSpotId);
            console.log("3: Day start with spot: "+ spotsInfo[startSpotId].name);
            console.log('-------------------------------------------');
    
            let spotInfo = await Automation.getSpotInfo(startSpotId);
            console.log('3-1: 當前景點資訊：');
            console.log(spotInfo);
            if (spotInfo.openHour >= 960) { //after 5 pm
                //紀錄nightEventSpotIds
                spotInfo.activity = spotsInfo[startSpotId].name;
                nightEvents.push(spotInfo);
                //刪除並找下一個startSpotId
                removeSpot(startSpotId, googleIds);  
                removeSpot(startSpotId, clusters[clusters.sequence[0]]); 
                // startSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);;
                continue;
            } else {
                //起始點當日是否營業：
                let open = false;
                let openDays = spotInfo.openDays.split(',');
                for (let day of openDays) {
                    if (parseInt(day) == parseInt(dayId)) {
                        open = true;
                    }
                }
                console.log('4: 起始點今天是否營業:');
                console.log(open);
                if (open) {
                    if (spotInfo.openHour > startTime + 120) { //起始點是否出門2小時內已營業
                        console.log('4-1: 此景點今日有營業但太早來了');
                        console.log( "4-2: 將  "+ startSpotId +"  放進tooEarlyArrangement稍待安排");
                        tooEarlyArrangement.push(startSpotId)
                        tooEarlyArrangementCount[startSpotId] += 1;
    
                        console.log("4-3: tooEarlyArrangement and count:"); 
                        console.log(tooEarlyArrangement);
                        console.log(tooEarlyArrangementCount[startSpotId]);
                        
                        removeSpot(startSpotId, clusters[clusters.sequence[0]]);
                        removeSpot(startSpotId, googleIds);
                        if(clusters[clusters.sequence[0]].length == 0) {
                            console.log('4-4: 叢集已沒有景點，刪除叢集編號：');
                            console.log(clusters.sequence[0]);
                            delete clusters[clusters.sequence[0]]
                            clusters.sequence.splice(0,1);
                            console.log("4-5: 刪除完used up叢集後的sequnce: ");
                            console.log(clusters.sequence);
                        }
                        continue;
                    } else {
                        startTime = (spotInfo.openHour >= startTime) ? spotInfo.openHour : startTime;
                        
                        //if startTime 介於 一行程的排程段, 新的start time 就是 卡住行程的結束
                        let arrangedEventsOfDay = arrangedEvents[startDateUnix];
                        if (arrangedEventsOfDay) {
                            console.log('arrangedEventsOfDay: '); 
                            console.log(arrangedEventsOfDay);
                            for (let event of arrangedEventsOfDay) {
                                if (
                                    (startTime <= event.end && startTime >= event.start) ||
                                    (startTime + 90 <= event.end && startTime + 90 >= event.start)
                                ) {
                                    let transitTime = await Automation.getTravelingTime(event.google_id, startSpotId, spotsInfo);
                                    startTime = event.end + transitTime;
                                    console.log('new startTime: ');
                                    console.log(startTime);
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
                        console.log('5: 本日起始行程');
                        console.log(wholeTrip[startDateUnix]);
                        removeSpot(startSpotId, googleIds);  
                        // removeSpot(startSpotId, poleSpotIds); 
                        removeSpot(startSpotId, clusters[clusters.sequence[0]]); 
                        if(clusters[clusters.sequence[0]].length == 0) {
                            console.log('5-1: 叢集已沒有景點，刪除叢集編號：');
                            console.log(clusters.sequence[0]);
                            delete clusters[clusters.sequence[0]]
                            clusters.sequence.splice(0,1);
                            console.log("5-2: 刪除完used up叢集後的sequnce: ");
                            console.log(clusters.sequence);
                        }
                    }
                } else {
                    //-> 從 clusters 去除景點並找下個景點來安排
                    console.log('6: 起始點今日沒有營業');
                    console.log( "7: 將  "+ startSpotId +"  加入到pendingArrangements");
                    pendingArrangement.push(startSpotId);
                    
                    console.log('8: Current Pending Arrangement: ');
                    console.log(pendingArrangement);
    
                    removeSpot(startSpotId, googleIds);
                    removeSpot(startSpotId, clusters[clusters.sequence[0]]);
                    if(clusters[clusters.sequence[0]].length == 0) {
                        console.log('9: 叢集已沒有景點，刪除叢集編號：');
                        console.log(clusters.sequence[0]);
                        delete clusters[clusters.sequence[0]]
                        clusters.sequence.splice(0,1);
                        console.log("9-1: 刪除完used up叢集後的sequnce: ");
                        console.log(clusters.sequence);
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
                    console.log('10: Object.keys(clusters)[0]: ');
                    console.log(Object.keys(clusters)[0]);
                    clusters.sequence.push(Object.keys(clusters)[0]);
                }
                console.log("11: current spot: " + spotsInfo[startSpotId].name);
                console.log("11-1: 要在這個編號的叢集裡面找下一個景點："+ clusters.sequence[0]);
                console.log('目前clusters狀況: ');
                console.log(clusters);
                let nextSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);
                if (startSpotId == -1) { //已無景點
                    console.log('11-2: startSpotId == -1，已無景點');
                    break;
                }
                console.log("12: calculated next spot: " + spotsInfo[nextSpotId].name);
                let nextActivity = await arrangeNextActivity(dayId, startTime, startSpotId, nextSpotId, spotsInfo, arrangedEvents, startDateUnix);
                console.log(spotsInfo[startSpotId].name + ' -> ' + spotsInfo[nextSpotId].name + ' : transit and Spot to be added:');
                console.log(nextActivity);
    
                if (tooEarlyArrangement.length > 0) { //將先前太早去的景點加回到cluster
                    console.log('13: ---- 將先前太早去的景點加回到cluster ----');
                    console.log("14: current early arrangement: ");
                    console.log(tooEarlyArrangement);
                    tooEarlyArrangement.map( googleId => {
                        if(tooEarlyArrangementCount[googleId] < 7) {
                            clusters[clusters.sequence[0]] = clusters[clusters.sequence[0]].concat(tooEarlyArrangement);
                        }
                    })
                    googleIds = googleIds.concat(tooEarlyArrangement);
                    tooEarlyArrangement = []; //清空too early
                    console.log(('15: full list with early arrangement added: '));
                    console.log(clusters); 
                }
                
                if (nextActivity == -1) { //行程超時(8pm)、太晚去、沒開(return -1) 
                    //-> 從 clusters 去除景點並找下個景點來安排，直到結束時間介於 6:30 ~ 8:00間
                    console.log( "16: 將  "+ nextSpotId +"  加入到pendingArrangements");
                    pendingArrangement.push(nextSpotId);
                    console.log('17: Current Pending Arrangement: ');
                    console.log(pendingArrangement);
    
                    removeSpot(nextSpotId, clusters[clusters.sequence[0]]);
                    removeSpot(nextSpotId, googleIds);
                    if(clusters[clusters.sequence[0]].length == 0) {
                        console.log('18: 叢集已沒有景點，刪除叢集編號：');
                        console.log(clusters.sequence[0]);
                        delete clusters[clusters.sequence[0]]
                        clusters.sequence.splice(0,1);
                        console.log("18-1: 刪除完used up叢集後的sequnce: ");
                        console.log(clusters.sequence);
                    }
                    // startSpotId = nextSpotId;
                } else if (nextActivity == -2) { // 太早去的行程放進too early稍待安排
                    console.log( "19: 將  "+ nextSpotId +"  放進tooEarlyArrangement稍待安排");
                    tooEarlyArrangement.push(nextSpotId);
                    tooEarlyArrangementCount[nextSpotId] += 1;
                    console.log("20: tooEarlyArrangement and count:"); 
                    console.log(tooEarlyArrangement);
                    console.log(tooEarlyArrangementCount[nextSpotId]);
    
                    removeSpot(nextSpotId, clusters[clusters.sequence[0]]);
                    removeSpot(nextSpotId, googleIds)
                    if(clusters[clusters.sequence[0]].length == 0) {
                        console.log('21: 叢集已沒有景點，刪除叢集編號：');
                        console.log(clusters.sequence[0]);
                        delete clusters[clusters.sequence[0]]
                        clusters.sequence.splice(0,1);
                        console.log("21-1: 刪除完used up叢集後的sequnce: ");
                        console.log(clusters.sequence);
                    }
                    // startSpotId = nextSpotId;
                } else {
                    keepArranging = nextActivity.keepArranging; //while(true or false)
                    wholeTrip[startDateUnix] = wholeTrip[startDateUnix].concat(nextActivity.arrangement);
                    console.log("22: Latest Arrangement of whole day: ");
                    console.log(wholeTrip[startDateUnix]);
                    startSpotId = nextSpotId;
                    if (keepArranging) {
                        startTime = nextActivity.arrangement[1].end;
                    }
                    removeSpot(nextSpotId, googleIds); //remove arranged spot
                    removeSpot(nextSpotId, poleSpotIds);
                    removeSpot(nextSpotId, clusters[clusters.sequence[0]]); 
                    if (clusters[clusters.sequence[0]].length == 0) {
                        console.log('23: 叢集已沒有景點，刪除叢集編號：');
                        console.log(clusters.sequence[0]);
                        delete clusters[clusters.sequence[0]];
                        clusters.sequence.splice(0,1);
                        console.log("23-1: 刪除完used up叢集後的sequnce: ");
                        console.log(clusters.sequence);
                    }
                }
            }
    
            if (pendingArrangement.length > 0) { //將太晚去、沒開、行程超時的景點加回到總清單
                console.log('24: ---- 將太晚去、沒開、行程超時pendingArrangment加回至總清單 ----');
                console.log("25: current pending arrangement: ");
                console.log(pendingArrangement);
                googleIds = googleIds.concat(pendingArrangement);
                console.log(('26: full list with pending arrangement added: '));
                console.log(googleIds);                
                pendingArrangement = []; //清空 pending arrangements
            }
    
            console.log("27: remaining spots before moving to new day:"); 
            googleIds.map(id => console.log(spotsInfo[id].name))
    
            dayId ++; //換日
            if (dayId == 7){
                dayId = 0;
            }
            //add one day to unix
            startDateUnix = startDateDatetime.setDate(startDateDatetime.getDate() + 1);
            console.log("28: Next Day Id: " + dayId);
            startTime = originalStartTime;
            tripDuration --;
        }
        console.log("29: remaining tooEarlyArrangement before sending whole trip response");
        console.log(tooEarlyArrangement);
        
        console.log("29-1: remaining spots before sending wholeTrip response");
        console.log(googleIds);
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
        console.log('30: wholeTrip');
        console.log(wholeTrip);
        console.log('night events:');
        console.log(otherEvents.nightEvents);
        console.log('remaining spots: ');
        console.log(otherEvents.remainingSpots);
    
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


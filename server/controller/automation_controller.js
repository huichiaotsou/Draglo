const Automation = require('../model/automation_model')
const Kmeans = require('../../utils/kmeans')
const { getNextSpotId , arrangeNextActivity, removeSpot, findPolePoints } = require('../../utils/organizeTrip');
const { calculateCloserPoint } = require('../../utils/geopackage')

//9am = 540, 12pm = 720, 1h30 = 810, 2pm = 840, 7pm = 1140

const calculateTrips = async (req, res, next) => {
    console.log(req.body);
    let { tripId, dayId, googleIds, spotsInfo, tripDuration, startTime, startDate } = req.body;
    startTime = parseInt(startTime)
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
    while(googleIds.length > 0) { //while 一直跑到安排完所有景點
        console.log('  ');
        console.log('1: -------------- New Day Start --------------');
        console.log("2: 剩下的景點：");
        googleIds.map(id => {
            console.log(spotsInfo[id].name);
        })
        console.log('---------------------------');

        let poleSpotIds = findPolePoints(googleIds, spotsInfo);
        console.log('2-1: poleSpotIds');
        console.log(poleSpotIds);
        //確認起始點
        let startSpotId = poleSpotIds[Math.floor(Math.random() * poleSpotIds.length)];
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
                if (spotInfo.openHour > startTime) { //起始點是否開門
                    console.log('4-1: 此景點今日有營業但太早來了');
                    console.log( "4-2: 將  "+ startSpotId +"  放進tooEarlyArrangement稍待安排");
                    tooEarlyArrangement.push(startSpotId)
                    console.log("4-3: tooEarlyArrangement:"); console.log(tooEarlyArrangement);
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
                    wholeTrip[startDateUnix] = [ //initialize the day
                        {
                            activity: spotsInfo[startSpotId].name,
                            spotId: spotsInfo[startSpotId].spotId,
                            startTime: startTime,
                            end: startTime + spotInfo.lingerTime
                        }
                    ];
                    console.log('5: 本日起始行程');
                    console.log(wholeTrip[startDateUnix]);
                    startTime += spotInfo.lingerTime; 
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
            let nextActivity = await arrangeNextActivity(dayId, startTime, startSpotId, nextSpotId, spotsInfo);
            console.log(spotsInfo[startSpotId].name + ' -> ' + spotsInfo[nextSpotId].name + ' : transit and Spot to be added:');
            console.log(nextActivity);

            if (tooEarlyArrangement.length > 0) { //將先前太早去的景點加回到cluster
                console.log('13: ---- 將先前太早去的景點加回到cluster ----');
                console.log("14: current early arrangement: ");
                console.log(tooEarlyArrangement);
                clusters[clusters.sequence[0]] = clusters[clusters.sequence[0]].concat(tooEarlyArrangement);
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
                tooEarlyArrangement.push(nextSpotId)
                console.log("20: tooEarlyArrangement:"); console.log(tooEarlyArrangement);

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
        googleIds.map(id => {
            console.log(spotsInfo[id].name);
        })
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
    
    console.log("29: remaining spots before sending wholeTrip response");
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
}

let reqBody = {
    'cities' : ['Paris', 'London', 'Aix-en-Provence'],
    'citiesInfo' : {
        'Paris' : {
            name: 'Paris',
            vector: ['latitude', 'longtitude'], 
        },
        'London' : {
            name: 'Paris',
            vector: ['latitude', 'longtitude'], 
        },
        'Aix-en-Provence' : {
            name: 'Paris',
            vector: ['latitude', 'longtitude'], 
        }
    }
}

const calculateIntercity = async (req, res, next) => { 
    let { cities, citiesInfo } = req.body;
    let poleCities = findPolePoints(cities, citiesInfo); //return 2 cities
    let startCity = poleCities[Math.floor(Math.random() * 2)];
    let startCityCoordinate = citiesInfo[startCity].vector

    let sequence = [];
    for (let i in cities) {
        let citiesCoordinates = cities.map( city => citiesInfo[city].vector);
        let cityIndex = calculateCloserPoint(citiesCoordinates, startCityCoordinate , 'getClosePoint');
        let closestCity = cities[cityIndex];
        sequence.push(closestCity);
        startCityCoordinate = citiesInfo[closestCity].vector;
        cities.splice(cityIndex , 1);
    }
    return sequence;
}

module.exports = {
    calculateTrips,
    calculateIntercity
}


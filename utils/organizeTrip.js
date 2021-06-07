const { response } = require('express');
const { getSpotInfo, getTravelingTime } = require('../server/model/automation_model');
const { getGeoDistance, calculateCloserPoint } = require('./geopackage');

let removeSpot = (removedItem, itemsArray) => {
    for (let i in itemsArray) {
        if (itemsArray[i] == removedItem) {
            itemsArray.splice(i, 1);
        }
    }
}

let getNextSpotId = (currentSpotId, sequence, clusters, spotsInfo) => {
    if (Object.keys(clusters).length == 2 && clusters[sequence].length == 1) {
        console.log("one last remaining spot: "+ clusters[sequence][0]);
        return clusters[sequence][0]
    }

    if (!clusters[sequence]) {
        return -1;
    }

    let currentClusterVectors = clusters[sequence].map(id => spotsInfo[id].vector);
    
    console.log("------------------------");
    console.log("叢集中的景點：");
    clusters[sequence].map(id => { 
        console.log(spotsInfo[id].name);
    })
    console.log("------------------------");

    let currentSpotVector = spotsInfo[currentSpotId].vector;
    let nextSpotIndex = calculateCloserPoint(currentClusterVectors, currentSpotVector,'getClosePoint')
    if (nextSpotIndex == -1) { // => cluster length == 1
        console.log("叢集已無其他景點，刪除叢集");
        delete clusters[sequence]; //remove used-up cluster
        sequence = clusters.sequence[1]; //assign new sequence
        clusters.sequence.splice(0,1); // remove the sequence of index 0
        console.log("currentSpot: " + spotsInfo[currentSpotId].name + ", 新的cluster ID : " + sequence);
        console.log("clusters:");
        console.log(clusters);
        return getNextSpotId(currentSpotId, sequence, clusters, spotsInfo);
    } else {
        return clusters[sequence][nextSpotIndex];
    }
}

let arrangeNextActivity = async (dayId, startTime, prevSpotId, nextSpotId, spotsInfo, arrangedEvents) => {
    let transitTime = await getTravelingTime(prevSpotId, nextSpotId, spotsInfo); //prevSpotId, nextSpotId == Google ids
    let spotInfo = await getSpotInfo(nextSpotId); 
    //linger_time, open_days, open_hour, closed_hour

    let eventEndsAt = startTime + transitTime + spotInfo.lingerTime;
    //if startTime || eventEndsAt 介於 一行程的排程段, 新的start time 就是 卡住行程的結束
    let arrangedEventsOfDay = arrangedEvents[dayId];
    console.log('arrangedEventsOfDay: '); 
    console.log(arrangedEventsOfDay);
    if (arrangedEventsOfDay) {
        for (let event of arrangedEventsOfDay) {
            if (
                (startTime <= event.end && startTime >= event.start) || 
                (eventEndsAt <= event.end && eventEndsAt >= event.start)
            ) {
                startTime = event.end;
                console.log('new startTime: ');
                console.log(startTime);
                transitTime = await getTravelingTime(event.google_id, nextSpotId, spotsInfo);
                eventEndsAt = startTime + transitTime + spotInfo.lingerTime;
                console.log('new eventEndsAt: ');
                console.log(eventEndsAt);
            }
        }
    }

    //檢查是否開門
    let open = false;
    let openDays = spotInfo.openDays.split(',');
    for (let day of openDays) {
        if (parseInt(day) == parseInt(dayId)) {
            open = true;
        }
    }
    
    if (eventEndsAt > 1200 || startTime > spotInfo.closedHour || !open) {
        console.log("-------------------------------------------");
        console.log("【行程將會超時(8pm)、太晚去、今天沒開】");
        console.log('今天是否營業:'); console.log(open);
        console.log("當日已使用時間(mins)："); console.log(eventEndsAt);
        console.log("此行程開始時間："); console.log(startTime);
        console.log("景點關門時間："); console.log(spotInfo.closedHour);
        return -1;
    } else if (startTime < spotInfo.openHour) {
        console.log("-------------------------------------------");
        console.log("【太早去】");
        console.log("此行程開始時間："); console.log(startTime);
        console.log("景點開門時間："); console.log(spotInfo.openHour);
        return -2;

    } else if ( eventEndsAt > 1110) { //行程安排後，若會晚於 18:30， call it a day
        console.log('【滿日】');
        console.log("當日已使用時間(mins)："); console.log(eventEndsAt);
        return {
            keepArranging : false,
            arrangement : [
                {
                    activity: 'transit',
                    startTime: startTime,
                    end: startTime + transitTime
                },
                {
                    activity: spotsInfo[nextSpotId].name,
                    spotId: spotsInfo[nextSpotId].spotId,
                    startTime: startTime + transitTime,
                    end: startTime + transitTime + spotInfo.lingerTime
                }
            ]
        }
    } else {
        if (startTime > 720 && startTime < 825) { //若行程開始於 12h ~ 13h45，新增午餐時間
            console.log('新增午餐時間');
            console.log('--------------------');
            console.log('原本開始時間'); console.log(startTime);
            startTime = startTime + 60;
            console.log("午餐後的開始時間"); console.log(startTime);
        }
        return {
            keepArranging: true,
            arrangement: [
                {
                    activity: 'transit',
                    startTime: startTime,
                    end: startTime + transitTime
                },
                {
                    activity: spotsInfo[nextSpotId].name,
                    spotId: spotsInfo[nextSpotId].spotId,
                    startTime: startTime + transitTime,
                    end: startTime + transitTime + spotInfo.lingerTime
                }
            ] 
        } 
    }
}

const findPolePoints = (keys, spotsInfo) => {
    if (keys.length == 1) {
        return keys;
    }
    let maxDistance = 0;
    let polePointsKeys= [];
    keys.map(base => {
        keys.map(comparison => {
            let distance = getGeoDistance(spotsInfo[base].vector, spotsInfo[comparison].vector)
            if (distance > maxDistance) {
                maxDistance = distance;
                polePointsKeys[0] = base;
                polePointsKeys[1] = comparison;
            }
        })
    })
    console.log('pole spots:');
    polePointsKeys.map(p =>{
        console.log(spotsInfo[p].name);
    })
    console.log('------------------');
    return polePointsKeys;
}


module.exports = {
    getNextSpotId,
    arrangeNextActivity,
    removeSpot,
    findPolePoints
}
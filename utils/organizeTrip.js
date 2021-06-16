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
        return clusters[sequence][0]
    }

    if (!clusters[sequence]) {
        return -1;
    }

    let currentClusterVectors = clusters[sequence].map(id => spotsInfo[id].vector);
    
    let currentSpotVector = spotsInfo[currentSpotId].vector;
    let nextSpotIndex = calculateCloserPoint(currentClusterVectors, currentSpotVector,'getClosePoint')
    if (nextSpotIndex == -1) { // => cluster length == 1
        delete clusters[sequence]; //remove used-up cluster
        sequence = clusters.sequence[1]; //assign new sequence
        clusters.sequence.splice(0,1); // remove the sequence of index 0
        return getNextSpotId(currentSpotId, sequence, clusters, spotsInfo);
    } else {
        return clusters[sequence][nextSpotIndex];
    }
}

let arrangeNextActivity = async (dayId, startTime, prevSpotId, nextSpotId, spotsInfo, arrangedEvents, startDateUnix) => {
    let transitTime = await getTravelingTime(prevSpotId, nextSpotId, spotsInfo); //prevSpotId, nextSpotId == Google ids
    let spotInfo = await getSpotInfo(nextSpotId); 
    //linger_time, open_days, open_hour, closed_hour

    let eventEndsAt = startTime + transitTime + spotInfo.lingerTime;
    //if startTime || eventEndsAt 介於 一行程的排程段, 新的start time 就是 卡住行程的結束
    let arrangedEventsOfDay = arrangedEvents[startDateUnix];
    if (arrangedEventsOfDay) {
        for (let event of arrangedEventsOfDay) {
            if (
                (startTime <= event.end && startTime >= event.start) || 
                (eventEndsAt <= event.end && eventEndsAt >= event.start)
            ) {
                startTime = event.end;
                transitTime = await getTravelingTime(event.google_id, nextSpotId, spotsInfo);
                eventEndsAt = startTime + transitTime + spotInfo.lingerTime;
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
        return -1;
    } else if (startTime + 60 < spotInfo.openHour) {
        return -2;
    } else if ( eventEndsAt > 1110) { //行程安排後，若會晚於 18:30， call it a day
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
            startTime = startTime + 60;
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
    return polePointsKeys;
}


module.exports = {
    getNextSpotId,
    arrangeNextActivity,
    removeSpot,
    findPolePoints
}
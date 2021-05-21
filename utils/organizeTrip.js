const { getSpotInfo, getTravelingTime } = require('../server/model/automation_model');
const { calculateCloserPoint } = require('./geopackage');

let removeSpot = (spotIdToRemove, spotIds) => {
    for (let i in spotIds) {
        if (spotIds[i] == spotIdToRemove) {
            spotIds.splice(i, 1);
        }
    }
}

let getNextSpotId = (currentSpotId, sequence, clusters, spotsInfo) => {
    if (Object.keys(clusters).length == 2 && clusters[sequence].length == 1) {
        console.log("one last remaining spot: "+ clusters[sequence][0]);
        return clusters[sequence][0]
    }
    let currentClusterVectors = clusters[sequence].map(id => spotsInfo[id].vector);
    let currentSpotVector = spotsInfo[currentSpotId].vector;
    let nextSpotIndex = calculateCloserPoint(currentClusterVectors, currentSpotVector,'getClosePoint')
    if (nextSpotIndex == -1) { // => cluster length == 1
        delete clusters[sequence]; //remove used-up cluster
        sequence = clusters.sequence[1]; //assign new sequence
        clusters.sequence.splice(0,1); // remove the sequence of index 0
        console.log("currentSpotId: " + currentSpotId + ", sequence : " + sequence);
        console.log("clusters");
        console.log(clusters);
        return getNextSpotId(currentSpotId, sequence, clusters, spotsInfo);
    } else {
        return clusters[sequence][nextSpotIndex];
    }
}

let arrangeNextActivity = async (dayId, startTime, prevSpotId, nextSpotId, spotsInfo) => {
    let transitTime = await getTravelingTime(prevSpotId, nextSpotId);
    let spotInfo = await getSpotInfo(nextSpotId); 
    //linger_time, open_days, open_hour, closed_hour

    //檢查是否開門
    let open = false;
    let openDays = spotInfo.openDays.split(',');
    for (let day of openDays) {
        if (parseInt(day) == parseInt(dayId)) {
            open = true;
        }
    }

    let checkDayFull = startTime + transitTime + spotInfo.lingerTime;
    if (checkDayFull > 1200 || startTime < spotInfo.openHour || startTime > spotInfo.closedHour || !open) {
        console.log("-------------------------------------------");
        console.log("行程將會超時(8pm)、太早去、太晚去、今天沒開");
        return -1;
    } else if ( checkDayFull > 1110 && checkDayFull <= 1200) { //行程安排後，若會介於 18:30 ~ 20:00 間，call it a day
        return {
            keepArranging : false,
            arrangement : [
                {
                    activity: 'transit',
                    startTime: startTime,
                    duration: transitTime,
                    end: startTime + transitTime
                },
                {
                    activity: spotsInfo[nextSpotId].name,
                    startTime: startTime + transitTime,
                    duration: spotInfo.lingerTime,
                    end: startTime + transitTime + spotInfo.lingerTime
                }
            ]
        }
    } else {
        if (startTime > 720 && startTime < 810) { //12h ~ 13h30 吃飯
            console.log('新增午餐時間 90 分鐘');
            console.log('--------------------');
            startTime = startTime + 90;
        }
        return {
            keepArranging: true,
            arrangement: [
                {
                    activity: 'transit',
                    startTime: startTime,
                    duration: transitTime,
                    end: startTime + transitTime
                },
                {
                    activity: spotsInfo[nextSpotId].name,
                    startTime: startTime + transitTime,
                    duration: spotInfo.lingerTime,
                    end: startTime + transitTime + spotInfo.lingerTime
                }
            ] 
        } 
    }
}


module.exports = {
    getNextSpotId,
    arrangeNextActivity,
    removeSpot
}
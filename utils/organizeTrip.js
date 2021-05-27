const { getSpotInfo, getTravelingTime } = require('../server/model/automation_model');
const { getGeoDistance, calculateCloserPoint } = require('./geopackage');

let removeSpot = (spotIdToRemove, spotIds) => {
    for (let i in spotIds) {
        if (spotIds[i] == spotIdToRemove) {
            spotIds.splice(i, 1);
        }
    }
}

let getNextSpotId = (currentSpotId, sequence, clusters, spotsInfo) => {
    console.log("當前景點（找下一個景點的依據）：");
    console.log(spotsInfo[currentSpotId].name);

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

let arrangeNextActivity = async (dayId, startTime, prevSpotId, nextSpotId, spotsInfo) => {
    let transitTime = await getTravelingTime(prevSpotId, nextSpotId, spotsInfo);
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
    console.log('今天是否營業:');
    console.log(open);

    let checkDayFull = startTime + transitTime + spotInfo.lingerTime;
    if (checkDayFull > 1200 || startTime > spotInfo.closedHour || !open) {
        console.log("-------------------------------------------");
        console.log("【行程將會超時(8pm)、太晚去、今天沒開】");
        console.log("當日已使用時間(mins)："); console.log(checkDayFull);
        console.log("此行程開始時間："); console.log(startTime);
        console.log("景點關門時間："); console.log(spotInfo.closedHour);
        return -1;
    } else if (startTime < spotInfo.openHour) {
        console.log("-------------------------------------------");
        console.log("【太早去】");
        console.log("此行程開始時間："); console.log(startTime);
        console.log("景點開門時間："); console.log(spotInfo.openHour);
        return -2;

    } else if ( checkDayFull > 1110 && checkDayFull <= 1200) { //行程安排後，若會介於 18:30 ~ 20:00 間，call it a day
        console.log('【滿日】');
        console.log("當日已使用時間(mins)："); console.log(checkDayFull);
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
        if (startTime > 720 && startTime < 810) { //若行程開始於 12h ~ 13h30，新增午餐時間
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

const findPoleSpotIds = (spotIds, spotsInfo) => {
    if (spotIds.length == 1) {
        return spotIds;
    }
    let maxDistance = 0;
    let poleSpotIds= [];
    spotIds.map(base => {
        spotIds.map(comparison => {
            let distance = getGeoDistance(spotsInfo[base].vector, spotsInfo[comparison].vector)
            if (distance > maxDistance) {
                maxDistance = distance;
                poleSpotIds[0] = base;
                poleSpotIds[1] = comparison;
            }
        })
    })
    console.log('pole spots:');
    poleSpotIds.map(p =>{
        console.log(spotsInfo[p].name);
    })
    console.log('------------------');
    return poleSpotIds;
}


module.exports = {
    getNextSpotId,
    arrangeNextActivity,
    removeSpot,
    findPoleSpotIds
}
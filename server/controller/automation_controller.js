const Automation = require('../model/automation_model')
const Kmeans = require('../../utils/kmeans')
const { getNextSpotId , arrangeNextActivity, removeSpot } = require('../../utils/organizeTrip');

// let spotIds = [
//     "id台北車站",
//     "id中正紀念堂",
//     "id士林夜市",
//     "id北投捷運站",
//     "id饒河街",
//     "id市政府",
//     "id國父紀念館",
//     "id松山高中",
// ]
// let spotsInfo = {
//     id台北車站:{
//         vector: [25.0477942,121.5169537],
//         name: "台北車站"
//     },
//     id中正紀念堂:{
//         vector: [25.0346119,121.521781],
//         name: "中正紀念堂"
//     },
//     id士林夜市: {
//         vector: [25.0879869,121.5242024],
//         name: "士林夜市"
//     },
//     id北投捷運站: {
//         vector: [25.1317795,121.4986418],
//         name: "北投捷運站"
//     },
//     id饒河街: {
//         vector: [25.0504785,121.5751126],
//         name: "饒河街",
//     }, 
//     id市政府: {
//         vector: [25.0375417,121.5644327],
//         name: "市政府",
//     },
//     id國父紀念館: {
//         vector: [25.0400306,121.5602452],
//         name: "國父紀念館",
//     },
//     id松山高中:{
//         vector: [25.0437709,121.5648601],
//         name: "松山高中",
//     }
// }
// let tripDuration = 2; 
// let startTime = 540; //9am
// let dayId = 5; //週五

//9am = 540, 12pm = 720, 1h30 = 810, 2pm = 840, 7pm = 1140

const calculateTrips = async (req, res, next) => {
    let { dayId, spotIds, spotsInfo, tripDuration, startTime, poleSpotIds } = req.body;

    let wholeTrip = {};
    while(spotIds.length > 0) { //一直跑到安排完所有景點
        let startSpotId = poleSpotIds[Math.floor(Math.random() * poleSpotIds.length)];
        let clusters = Kmeans.getClusters(spotIds, spotsInfo, tripDuration, startSpotId);
        wholeTrip[dayId] = [ //initialize the day, wholeTrip = { 5: [...] }
            {
                activity: spotsInfo.startSpotId.name,
                startTime: startTime,
                duration: await Automation.getLingerTime(startSpotId),
            },
        ];
        //remove arranged spot from 
        //spotIds (the real list to be arranged) and poleSpotIds (starting group)
        removeSpot(startSpotId, spotIds);  
        removeSpot(startSpotId, poleSpotIds); 

        let keepArranging = true;
        while (keepArranging) { //一直跑到當日景點排滿為止
            let nextSpotId = getNextSpotId(startSpotId, clusters.sequence[0], clusters, spotsInfo);
            let nextActivity = arrangeNextActivity(dayId, startTime, startSpotId, nextSpotId, spotsInfo);
            //行程超時(8pm)、太早去、太晚去、沒開(return -1) -> 從 clusters 去除景點並找下個景點來安排，直到結束時間介於 6:30 ~ 8:00間
            if (nextActivity == -1) {
                removeSpot(nextSpotId, clusters.sequence[0]);
            } else {
                keepArranging = nextActivity.keepArranging; //while(true or false)
                wholeTrip[dayId].concat(nextActivity.arragement);
                startSpotId = nextSpotId;
                if (keepArranging) {
                    startTime = nextActivity.arragement[1].end;
                }
                removeSpot(nextSpotId, spotIds); //remove arranged spot
            }
        }
        dayId ++; //換日
        tripDuration --;
    }
    res.send(wholeTrip);
}

module.exports = {
    calculateTrips
}


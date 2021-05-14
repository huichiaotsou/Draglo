const { getGeoDistance, 
    calculateCloserPoint,
} = require('./geopackage');

function getClusters(placeIds, vectors, k, polePoint){
    if(k > placeIds.length){
        return {error: 'cluster numbers exceed place numbers'};
    }
    // get k initial centroids
    let centroids = []
    for (let i = 0; i < k; i++){
        centroids.push(vectors[placeIds[i]]);
    }

    let groupIds = []
    let keepTuning = true;
    while (keepTuning) {
        //count the distance between (centroids : all points), define who’s closer
        for(let i = 0; i < placeIds.length; i++){
            let groupId = calculateCloserPoint(centroids, vectors[placeIds[i]], 'groupVectors');
            groupIds[i] = groupId;
        } 
        //照順序分好的叢集
        //groupIds: [1 0 1 0 2 2]
        //placeIds: [1 2 3 4 5 6]
        let groupedPlaces = {};
        let newCentroids = [];
        //loop k次，每次 loop 過全部的 groupid
        for (let i = 0; i < k; i++){
            let groupedPlace = []
            let sumX, sumY, count = 0;
            for (let j = 0; j < groupIds.length; j++) {
                if (groupIds[j] == i) {
                    groupedPlace.push(placeIds[j]);
                    //如果 groupId[j] 跟 i(叢集號) 對到 => 加總取平均 = newCentroids[i]
                    if (groupIds[j] == i){
                        sumX = sumX + vectors[placeIds[j]][0];
                        sumY = sumY + vectors[placeIds[j]][1];
                        count ++;
                    }
                    if (placeIds[j] == polePoint) {
                        groupedPlaces.inOrder = [i];
                    }
                }
            }
            groupedPlaces[i] = groupedPlace;
            newCentroids[i] = [sumX/count, sumY/count];
            if (isNaN(newCentroids[i][0])){ //若有叢集沒景點，sum會是0，此時指派原本重心
                newCentroids[i] = centroids[i];
            }
        }

        //check if centroids similar
        let countStableCentroids = 0;
        for (let i = 0; i < centroids.length; i++){
            if (getGeoDistance(centroids[i][0], centroids[i][1], newCentroids[i][0], newCentroids[i][1]) < 50){
                countStableCentroids++
            }
        }
        if (countStableCentroids == k){
            console.log('stop tuning');
            keepTuning = false;
            console.log(centroids);
            console.log(centroids[groupedPlaces.inOrder]);
            console.log(groupedPlaces.inOrder[0]);
            let closestGroupId = calculateCloserPoint(centroids, centroids[groupedPlaces.inOrder], 'getCloserCluster')
            groupedPlaces.inOrder.push(closestGroupId);
            return groupedPlaces;
        } else {
            for (let i = 0; i < centroids.length; i++){
                centroids[i] = newCentroids[i]
            }
            console.log('keep tuning');
            keepTuning = true;
        }
    }
}

let placeIds = [
    "台北車站",
    "中正紀念堂",
    "士林夜市",
    "北投捷運站",
    "饒河街",
    "市政府",
    "國父紀念館",
    "松山高中",
    "捷運大安站",
    "台灣大學",
    "捷運龍山寺站",
    "捷運西門站",
    "捷運大直站",
    "捷運內湖站"
]

let vectors = {
    台北車站:[25.0477942,121.5169537],
    中正紀念堂:[25.0346119,121.521781],
    士林夜市:[25.0879869,121.5242024],
    北投捷運站:[25.1317795,121.4986418],
    饒河街:[25.0504785,121.5751126],
    市政府:[25.0375417,121.5644327],
    國父紀念館:[25.0400306,121.5602452],
    松山高中:[25.0437709,121.5648601],
    捷運大安站:[25.0329936,121.5435968],
    台灣大學:[25.0173405,121.5397518],
    捷運龍山寺站:[25.0352501,121.5004297],
    捷運西門站:[25.0419242,121.5080936],
    捷運大直站:[25.0798837,121.5471493],
    捷運內湖站:[25.0835589,121.5942486]
}

let k = 4;
let result = getClusters(placeIds, vectors, k, '北投捷運站');
console.log(result);

module.exports = {
    getClusters
}



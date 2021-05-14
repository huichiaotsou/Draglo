const { 
    getGeoDistance, 
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



module.exports = {
    getClusters
}



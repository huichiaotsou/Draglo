const { 
    getGeoDistance, 
    calculateCloserPoint,
} = require('./geopackage');

function getClusters(spotIds, vectors, k, startSpotId){
    console.log("k: " + k);
    // if(k > spotIds.length){
    //     return {
    //         0 : spotIds,
    //         sequence : [0]
    //     };
    // }
    if(k == 1 || k == 0 || k > spotIds.length) {
        return {
            0: spotIds,
            sequence: [0]
        }
    }

    // get k initial centroids
    let centroids = []
    for (let i = 0; i < k; i++){
        centroids.push(vectors[spotIds[i]].vector);
    }
    
    let groupIds = []
    let keepTuning = true;
    while (keepTuning) {
        //count the distance between (centroids : all points), define who’s closer
        for(let i = 0; i < spotIds.length; i++){
            let groupId = calculateCloserPoint(centroids, vectors[spotIds[i]].vector, 'groupVectors');
            groupIds[i] = groupId;
        } 
        //照順序分好的叢集 groupIds: [1 0 1 0 2 2]
                    //  spotIds: [1 2 3 4 5 6]
        let groupedPlaces = {};
        let newCentroids = [];
        //loop k次，每次 loop 過全部的 groupid
        for (let i = 0; i < k; i++){
            let groupedPlace = []
            let sumX = 0;
            let sumY = 0;
            let count = 0;
            for (let j = 0; j < groupIds.length; j++) {
                if (groupIds[j] == i) {
                    groupedPlace.push(spotIds[j]);
                    //如果 groupId[j] 跟 i(叢集號) 對到 => 加總取平均 = newCentroids[i]
                    if (groupIds[j] == i){
                        sumX = sumX + vectors[spotIds[j]].vector[0];
                        sumY = sumY + vectors[spotIds[j]].vector[1];
                        count ++;
                    }
                    if (spotIds[j] == startSpotId) { //define starting cluster
                        groupedPlaces.sequence = [i];
                    }
                }
            }

            groupedPlaces[i] = groupedPlace;
            newCentroids[i] = [sumX/count, sumY/count];
            if (isNaN(newCentroids[i][0])){ //若有叢集沒被分配到景點，sum會是0，此時指派原本重心
                newCentroids[i] = centroids[i];
            }
        }

        //check if centroids are already stable
        let countStableCentroids = 0;
        for (let i = 0; i < centroids.length; i++){
            if (getGeoDistance(centroids[i], newCentroids[i]) < 50){
                countStableCentroids++
            }
        }
        if (countStableCentroids == k) {
            console.log('kmeans: clusters are established');
            console.log('--------------------------------');
            keepTuning = false;

            let centroidsForSequence = [ ...centroids ]
            centroids.splice(groupedPlaces.sequence[0],1)
            for (let i = 0 ; i < centroidsForSequence.length - 1; i++) {     
                let closestCentroidIndex = calculateCloserPoint(centroids, centroidsForSequence[groupedPlaces.sequence[i]], 'getClosePoint')
                for (let j in centroidsForSequence) {
                    if (centroidsForSequence[j][0] == centroids[closestCentroidIndex][0] && centroidsForSequence[j][0] == centroids[closestCentroidIndex][0]) {
                        groupedPlaces.sequence.push(j);
                        centroids.splice(closestCentroidIndex,1);
                        break;
                    }
                }
            }
            console.log("kmeans result: ");
            console.log(groupedPlaces);
            return groupedPlaces;
        } else {
            for (let i = 0; i < centroids.length; i++){
                centroids[i] = newCentroids[i]
            }
            console.log('kmeans: keep tuning');
            keepTuning = true;
        }
    }
}


module.exports = {
    getClusters
}



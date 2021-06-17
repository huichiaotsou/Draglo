/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
const {
  getGeoDistance,
  calculateCloserPoint,
} = require('./geopackage');

const getClusters = (spotIds, vectors, k, startSpotId) => {
  try {
    if (k <= 1 || k > spotIds.length) {
      return {
        0: spotIds,
        sequence: [0],
      };
    }

    // get k initial centroids
    const centroids = [];
    for (let i = 0; i < k; i += 1) {
      centroids.push(vectors[spotIds[i]].vector);
    }

    const groupIds = [];
    let keepTuning = true;
    while (keepTuning) {
      // count the distance between (centroids : all points), define who’s closer
      for (let i = 0; i < spotIds.length; i += 1) {
        const groupId = calculateCloserPoint(centroids, vectors[spotIds[i]].vector, 'groupVectors');
        groupIds[i] = groupId;
      }
      // clusters arranged in order:
      // groupIds: [1 0 1 0 2 2]
      //  spotIds: [1 2 3 4 5 6]
      const groupedPlaces = {};
      const newCentroids = [];
      // loop k times, each time loops over all groupid
      for (let i = 0; i < k; i += 1) {
        const groupedPlace = [];
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        for (let j = 0; j < groupIds.length; j += 1) {
          if (groupIds[j] === i) {
            groupedPlace.push(spotIds[j]);
            // 如果 groupId[j] 跟 i(叢集號) 對到 => 加總取平均 = newCentroids[i]
            if (groupIds[j] === i) {
              sumX += vectors[spotIds[j]].vector[0];
              sumY += vectors[spotIds[j]].vector[1];
              count += 1;
            }
            if (spotIds[j] === startSpotId) { // define starting cluster
              groupedPlaces.sequence = [i];
            }
          }
        }

        groupedPlaces[i] = groupedPlace;
        newCentroids[i] = [sumX / count, sumY / count];
        if (Number.isNaN(Number(newCentroids[i][0]))) {
          // if a cluster has no item, sum will be 0 -> assign original centroid
          newCentroids[i] = centroids[i];
        }
      }

      // check if centroids are already stable
      let countStableCentroids = 0;
      for (let i = 0; i < centroids.length; i += 1) {
        if (getGeoDistance(centroids[i], newCentroids[i]) < 50) {
          countStableCentroids += 1;
        }
      }
      if (countStableCentroids === k) {
        keepTuning = false;

        const centroidsForSequence = [...centroids];
        centroids.splice(groupedPlaces.sequence[0], 1);
        for (let i = 0; i < centroidsForSequence.length - 1; i += 1) {
          const closestCentroidIndex = calculateCloserPoint(centroids, centroidsForSequence[groupedPlaces.sequence[i]], 'getClosePoint');
          for (const j in centroidsForSequence) {
            if (centroidsForSequence[j][0] === centroids[closestCentroidIndex][0]
                && centroidsForSequence[j][0] === centroids[closestCentroidIndex][0]) {
              groupedPlaces.sequence.push(j);
              centroids.splice(closestCentroidIndex, 1);
              break;
            }
          }
        }
        return groupedPlaces;
      }

      for (let i = 0; i < centroids.length; i += 1) {
        centroids[i] = newCentroids[i];
      }
      keepTuning = true;
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getClusters,
};

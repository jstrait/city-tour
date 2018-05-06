"use strict";

var CityTour = CityTour || {};

CityTour.NeighborhoodGenerator = (function() {
  var MIN_DISTANCE_BETWEEN_NEIGHBORHOODS = 10;

  var closestNeighborhoodDistance = function(neighborhoods, x, z) {
    var minDistanceToNeighborhood = Number.POSITIVE_INFINITY;
    var distanceToClosestNeighborhood;
    var i;

    if (neighborhoods.length === 0) {
      return 0;
    }

    for (i = 0; i < neighborhoods.length; i++) {
      distanceToClosestNeighborhood = CityTour.Math.distanceBetweenPoints(x, z, neighborhoods[i].centerX, neighborhoods[i].centerZ);
      if (distanceToClosestNeighborhood < minDistanceToNeighborhood) {
        minDistanceToNeighborhood = distanceToClosestNeighborhood;
      }
    }

    return minDistanceToNeighborhood;
  };

  var bestNeighborhoodSite = function(terrain, neighborhoods) {
    var landHeight, averageHeightDifference;
    var bestSiteCoordinates = { x: terrain.minMapX(), z: terrain.minMapZ() };
    var bestSiteScore = Number.POSITIVE_INFINITY;
    var score, centralityScore, flatnessScore;
    var distanceToClosestNeighborhood;
    var x, z;

    for (x = terrain.minMapX() + 1; x < terrain.maxMapX(); x++) {
      for (z = terrain.minMapX() + 1; z < terrain.maxMapZ(); z++) {
        if (terrain.waterHeightAtCoordinates(x, z) > 0.0) {
          score = Number.POSITIVE_INFINITY;
        }
        else {
          centralityScore = Math.abs(x) + Math.abs(z);

          landHeight = terrain.landHeightAtCoordinates(x, z);
          averageHeightDifference = (Math.abs((landHeight - terrain.landHeightAtCoordinates(x - 1, z - 1))) +
                                     Math.abs((landHeight - terrain.landHeightAtCoordinates(x, z - 1))) +
                                     Math.abs((landHeight - terrain.landHeightAtCoordinates(x + 1, z - 1))) +
                                     Math.abs((landHeight - terrain.landHeightAtCoordinates(x - 1, z))) +
                                     Math.abs((landHeight - terrain.landHeightAtCoordinates(x + 1, z))) +
                                     Math.abs((landHeight - terrain.landHeightAtCoordinates(x - 1, z + 1))) +
                                     Math.abs((landHeight - terrain.landHeightAtCoordinates(x, z + 1))) +
                                     Math.abs((landHeight - terrain.landHeightAtCoordinates(x + 1, z + 1)))) / 8;
          flatnessScore = averageHeightDifference;

          distanceToClosestNeighborhood = closestNeighborhoodDistance(neighborhoods, x, z);
          if (distanceToClosestNeighborhood < MIN_DISTANCE_BETWEEN_NEIGHBORHOODS) {
            distanceToClosestNeighborhood = 1000;
          }

          score = centralityScore + (flatnessScore * 100) + distanceToClosestNeighborhood;
        }

        if (score < bestSiteScore) {
          bestSiteScore = score;
          bestSiteCoordinates.x = x;
          bestSiteCoordinates.z = z;
        }
      }
    }

    return bestSiteCoordinates;
  };

  var generate = function(terrain, count) {
    var neighborhoods = [];
    var neighborhoodCenter;
    var i;

    for (i = 0; i < count; i++) {
      neighborhoodCenter = bestNeighborhoodSite(terrain, neighborhoods);
      neighborhoods.push({ centerX: neighborhoodCenter.x, centerZ: neighborhoodCenter.z });
    }

    return neighborhoods;
  };

  return {
    generate: generate,
  };
})();

"use strict";

var CityTour = CityTour || {};

CityTour.NeighborhoodGenerator = (function() {
  var bestNeighborhoodSite = function(terrain) {
    var landHeight, averageHeightDifference;
    var bestSiteCoordinates = { x: terrain.minMapX(), z: terrain.minMapZ() };
    var bestSiteScore = Number.POSITIVE_INFINITY;
    var score, centralityScore, flatnessScore;
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

          score = centralityScore + (flatnessScore * 100);
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
    var neighborhoodCenterX, neighborhoodCenterZ;
    var neighborhoodCenter;
    var i;

    neighborhoodCenter = bestNeighborhoodSite(terrain);
    neighborhoods.push({ centerX: neighborhoodCenter.x, centerZ: neighborhoodCenter.z });
    for (i = 0; i < count - 1; i++) {
      do {
        neighborhoodCenterX = CityTour.Math.randomInteger(terrain.minMapX(), terrain.maxMapX());
        neighborhoodCenterZ = CityTour.Math.randomInteger(terrain.minMapZ(), terrain.maxMapZ());
      } while (terrain.waterHeightAtCoordinates(neighborhoodCenterX, neighborhoodCenterZ) > 0.0);

      neighborhoods.push({ centerX: neighborhoodCenterX, centerZ: neighborhoodCenterZ });
    }

    return neighborhoods;
  };

  return {
    generate: generate,
  };
})();

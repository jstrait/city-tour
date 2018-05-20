"use strict";

var CityTour = CityTour || {};

CityTour.NeighborhoodGenerator = (function() {
  var MIN_DISTANCE_BETWEEN_NEIGHBORHOODS = 7;

  var calculateFlatnessScores = function(terrain) {
    var flatnessScores = [];
    var x, z;

    for (x = terrain.minMapX(); x <= terrain.maxMapX(); x++) {
      flatnessScores[x] = [];

      for (z = terrain.minMapZ(); z <= terrain.maxMapZ(); z++) {
        if (terrain.waterHeightAtCoordinates(x, z) > 0.0) {
          flatnessScores[x][z] = Number.POSITIVE_INFINITY;
        }
        else {
          flatnessScores[x][z] = averageHeightDifferenceAroundPoint(terrain, x, z);
        }
      }
    }

    return flatnessScores;
  };

  var averageHeightDifferenceAroundPoint = function(terrain, centerX, centerZ) {
    var centerHeight = terrain.landHeightAtCoordinates(centerX, centerZ);
    var pointCount = 0;
    var totalHeightDeltas = 0.0;
    var minX = Math.max(terrain.minMapX(), centerX - 4);
    var maxX = Math.min(terrain.maxMapX(), centerX + 4);
    var minZ = Math.max(terrain.minMapZ(), centerZ - 4);
    var maxZ = Math.min(terrain.maxMapZ(), centerZ + 4);
    var x, z;

    for (x = minX; x <= maxX; x++) {
      for (z = minZ; z <= maxZ; z++) {
        totalHeightDeltas += Math.abs(centerHeight - terrain.landHeightAtCoordinates(x, z));
        pointCount += 1;
      }
    }

    return totalHeightDeltas / pointCount;
  };

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

  var bestNeighborhoodSite = function(terrain, flatnessScores, neighborhoods) {
    var bestSiteCoordinates = { x: terrain.minMapX(), z: terrain.minMapZ() };
    var bestSiteScore = Number.POSITIVE_INFINITY;
    var score, centralityScore, flatnessScore;
    var distanceToClosestNeighborhood;
    var x, z;

    for (x = terrain.minMapX() + 1; x < terrain.maxMapX(); x++) {
      for (z = terrain.minMapX() + 1; z < terrain.maxMapZ(); z++) {
        centralityScore = Math.abs(x) + Math.abs(z);

        flatnessScore = flatnessScores[x][z];

        distanceToClosestNeighborhood = closestNeighborhoodDistance(neighborhoods, x, z);
        if (distanceToClosestNeighborhood < MIN_DISTANCE_BETWEEN_NEIGHBORHOODS) {
          distanceToClosestNeighborhood = 1000;
        }

        score = centralityScore + (flatnessScore * 10) + distanceToClosestNeighborhood;

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
    var flatnessScores = calculateFlatnessScores(terrain);
    var neighborhoods = [];
    var neighborhoodCenter;
    var i;

    for (i = 0; i < count; i++) {
      neighborhoodCenter = bestNeighborhoodSite(terrain, flatnessScores, neighborhoods);
      neighborhoods.push({ centerX: neighborhoodCenter.x, centerZ: neighborhoodCenter.z });
    }

    return neighborhoods;
  };

  return {
    generate: generate,
  };
})();

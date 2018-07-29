"use strict";

var CityTour = CityTour || {};

CityTour.NeighborhoodGenerator = (function() {
  var MIN_DISTANCE_BETWEEN_NEIGHBORHOODS = 10;

  // The size of the square that is used to calculate the terrain flatness
  // around a given point. Each value should be an odd number.
  var NEIGHBORHOOD_CENTER_WIDTH = 9;
  var NEIGHBORHOOD_CENTER_DEPTH = 9;
  var FLATNESS_WINDOW_WIDTH_MARGIN = (NEIGHBORHOOD_CENTER_WIDTH - 1) / 2;
  var FLATNESS_WINDOW_DEPTH_MARGIN = (NEIGHBORHOOD_CENTER_DEPTH - 1) / 2;
  var MAX_HILLINESS = 1.0;
  var CENTRALITY_WEIGHT = 0.3;
  var FLATNESS_WEIGHT = 0.7;

  var calculateScores = function(terrain) {
    var scores = [];
    var score;
    var x, z;

    var minX = terrain.minMapX() + FLATNESS_WINDOW_WIDTH_MARGIN;
    var maxX = terrain.maxMapX() - FLATNESS_WINDOW_WIDTH_MARGIN;
    var minZ = terrain.minMapZ() + FLATNESS_WINDOW_DEPTH_MARGIN;
    var maxZ = terrain.maxMapZ() - FLATNESS_WINDOW_DEPTH_MARGIN;

    // Manhattan distance from the center
    var maxNeighborhoodDistanceFromCenter = Math.abs((terrain.minMapX() + FLATNESS_WINDOW_WIDTH_MARGIN) + (terrain.minMapZ() + FLATNESS_WINDOW_DEPTH_MARGIN));

    for (x = minX; x <= maxX; x++) {
      scores[x] = [];

      for (z = minZ; z <= maxZ; z++) {
        score = {
          flatness: Number.POSITIVE_INFINITY,
          centrality: ((Math.abs(x) + Math.abs(z)) / maxNeighborhoodDistanceFromCenter) * CENTRALITY_WEIGHT,
          closeNeighborhoodPenalty: 0,
        };

        if (terrain.waterHeightAtCoordinates(x, z) === 0.0) {
          score.flatness = CityTour.Math.clamp(averageHeightDifferenceAroundPoint(terrain, x, z) / MAX_HILLINESS, 0.0, 1.0) * FLATNESS_WEIGHT;
        }

        scores[x][z] = score;
      }
    }

    return scores;
  };

  var averageHeightDifferenceAroundPoint = function(terrain, centerX, centerZ) {
    var centerHeight = terrain.landHeightAtCoordinates(centerX, centerZ);
    var pointCount = 0;
    var totalHeightDeltas = 0.0;
    var minX = Math.max(terrain.minMapX(), centerX - FLATNESS_WINDOW_WIDTH_MARGIN);
    var maxX = Math.min(terrain.maxMapX(), centerX + FLATNESS_WINDOW_WIDTH_MARGIN);
    var minZ = Math.max(terrain.minMapZ(), centerZ - FLATNESS_WINDOW_DEPTH_MARGIN);
    var maxZ = Math.min(terrain.maxMapZ(), centerZ + FLATNESS_WINDOW_DEPTH_MARGIN);
    var x, z;

    for (x = minX; x <= maxX; x++) {
      for (z = minZ; z <= maxZ; z++) {
        totalHeightDeltas += Math.abs(centerHeight - terrain.landHeightAtCoordinates(x, z));
        pointCount += 1;
      }
    }

    return totalHeightDeltas / pointCount;
  };

  var setCloseNeighborhoodPenalties = function(neighborhoodCenterX, neighborhoodCenterZ, terrain, scores) {
    var distanceToNeighborhoodCenter;
    var x, z;

    var minX = Math.max(terrain.minMapX() + FLATNESS_WINDOW_WIDTH_MARGIN, neighborhoodCenterX - MIN_DISTANCE_BETWEEN_NEIGHBORHOODS);
    var maxX = Math.min(terrain.maxMapX() - FLATNESS_WINDOW_WIDTH_MARGIN, neighborhoodCenterX + MIN_DISTANCE_BETWEEN_NEIGHBORHOODS);
    var minZ = Math.max(terrain.minMapZ() + FLATNESS_WINDOW_DEPTH_MARGIN, neighborhoodCenterZ - MIN_DISTANCE_BETWEEN_NEIGHBORHOODS);
    var maxZ = Math.min(terrain.maxMapZ() - FLATNESS_WINDOW_DEPTH_MARGIN, neighborhoodCenterZ + MIN_DISTANCE_BETWEEN_NEIGHBORHOODS);

    for (x = minX; x <= maxX; x++) {
      for (z = minZ; z <= maxZ; z++) {
        distanceToNeighborhoodCenter = CityTour.Math.distanceBetweenPoints(x, z, neighborhoodCenterX, neighborhoodCenterZ);
        if (distanceToNeighborhoodCenter < MIN_DISTANCE_BETWEEN_NEIGHBORHOODS) {
          scores[x][z].closeNeighborhoodPenalty = Number.POSITIVE_INFINITY;
        }
      }
    }
  };

  var bestNeighborhoodSite = function(terrain, scores, neighborhoods) {
    var bestSiteCoordinates = { x: terrain.minMapX(), z: terrain.minMapZ() };
    var bestSiteScore = Number.POSITIVE_INFINITY;
    var score, scoreComponents;
    var distanceToClosestNeighborhood;
    var x, z;

    var minX = terrain.minMapX() + FLATNESS_WINDOW_WIDTH_MARGIN;
    var maxX = terrain.maxMapX() - FLATNESS_WINDOW_WIDTH_MARGIN;
    var minZ = terrain.minMapZ() + FLATNESS_WINDOW_DEPTH_MARGIN;
    var maxZ = terrain.maxMapZ() - FLATNESS_WINDOW_DEPTH_MARGIN;

    for (x = minX; x < maxX; x++) {
      for (z = minZ; z < maxZ; z++) {
        scoreComponents = scores[x][z];
        score = scoreComponents.centrality + scoreComponents.flatness * FLATNESS_WEIGHT + scoreComponents.closeNeighborhoodPenalty;

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
    var scores = calculateScores(terrain);
    var neighborhoods = [];
    var neighborhoodCenter;
    var distanceToClosestNeighborhood;
    var i, x, z;

    for (i = 0; i < count; i++) {
      neighborhoodCenter = bestNeighborhoodSite(terrain, scores, neighborhoods);
      neighborhoods.push({ centerX: neighborhoodCenter.x, centerZ: neighborhoodCenter.z });

      setCloseNeighborhoodPenalties(neighborhoodCenter.x, neighborhoodCenter.z, terrain, scores);
    }

    return neighborhoods;
  };

  return {
    generate: generate,
  };
})();

"use strict";

import { CityTourMath } from "./../math";

var NeighborhoodGenerator = (function() {
  var MIN_DISTANCE_BETWEEN_NEIGHBORHOODS = 10;

  // The size of the square that is used to calculate the terrain flatness
  // around a given point. Each value should be an odd number.
  var NEIGHBORHOOD_CENTER_WIDTH = 9;
  var NEIGHBORHOOD_CENTER_DEPTH = 9;
  var FLATNESS_WINDOW_WIDTH_MARGIN = (NEIGHBORHOOD_CENTER_WIDTH - 1) / 2;
  var FLATNESS_WINDOW_DEPTH_MARGIN = (NEIGHBORHOOD_CENTER_DEPTH - 1) / 2;
  var CENTRALITY_WEIGHT = 0.3;
  var FLATNESS_WEIGHT = 0.7;

  var calculateScores = function(terrain) {
    var scores = [];
    var score;
    var x, z;
    var averageHeightDistance;

    var minX = terrain.minX() + FLATNESS_WINDOW_WIDTH_MARGIN;
    var maxX = terrain.maxX() - FLATNESS_WINDOW_WIDTH_MARGIN;
    var minZ = terrain.minZ() + FLATNESS_WINDOW_DEPTH_MARGIN;
    var maxZ = terrain.maxZ() - FLATNESS_WINDOW_DEPTH_MARGIN;

    // Manhattan distance from the center. Assumption is terrain has
    // center point of {0,0}, and roads only run fully north/south or
    // west/east.
    var maxNeighborhoodDistanceFromCenter = (maxX + maxZ);

    for (x = minX; x <= maxX; x++) {
      scores[x] = [];

      for (z = minZ; z <= maxZ; z++) {
        score = {
          flatness: Number.POSITIVE_INFINITY,
          centrality: ((Math.abs(x) + Math.abs(z)) / maxNeighborhoodDistanceFromCenter) * CENTRALITY_WEIGHT,
          closeNeighborhoodPenalty: 0,
        };

        if (terrain.waterHeightAt(x, z) === 0.0) {
          averageHeightDistance = averageHeightDifferenceAroundPoint(terrain, x, z);

          if (averageHeightDistance === Number.POSITIVE_INFINITY) {
            score.flatness = Number.POSITIVE_INFINITY;
          }
          else {
            score.flatness = CityTourMath.clamp(averageHeightDistance, 0.0, 1.0) * FLATNESS_WEIGHT;
          }
        }

        scores[x][z] = score;
      }
    }

    return scores;
  };

  var averageHeightDifferenceAroundPoint = function(terrain, centerX, centerZ) {
    var centerHeight = terrain.landHeightAt(centerX, centerZ);
    var landPointCount = 0;
    var waterPointCount = 0;
    var totalHeightDeltas = 0.0;
    var minX = Math.max(terrain.minX(), centerX - FLATNESS_WINDOW_WIDTH_MARGIN);
    var maxX = Math.min(terrain.maxX(), centerX + FLATNESS_WINDOW_WIDTH_MARGIN);
    var minZ = Math.max(terrain.minZ(), centerZ - FLATNESS_WINDOW_DEPTH_MARGIN);
    var maxZ = Math.min(terrain.maxZ(), centerZ + FLATNESS_WINDOW_DEPTH_MARGIN);
    var x, z;

    for (x = minX; x <= maxX; x++) {
      for (z = minZ; z <= maxZ; z++) {
        if (terrain.waterHeightAt(x, z) > 0.0) {
          waterPointCount += 1;
        }
        else {
          totalHeightDeltas += Math.abs(centerHeight - terrain.landHeightAt(x, z));
          landPointCount += 1;
        }
      }
    }

    return (waterPointCount >= landPointCount) ? Number.POSITIVE_INFINITY : (totalHeightDeltas / landPointCount);
  };

  var setCloseNeighborhoodPenalties = function(neighborhoodCenterX, neighborhoodCenterZ, terrain, scores) {
    var distanceToNeighborhoodCenter;
    var x, z;

    var minX = Math.max(terrain.minX() + FLATNESS_WINDOW_WIDTH_MARGIN, neighborhoodCenterX - MIN_DISTANCE_BETWEEN_NEIGHBORHOODS);
    var maxX = Math.min(terrain.maxX() - FLATNESS_WINDOW_WIDTH_MARGIN, neighborhoodCenterX + MIN_DISTANCE_BETWEEN_NEIGHBORHOODS);
    var minZ = Math.max(terrain.minZ() + FLATNESS_WINDOW_DEPTH_MARGIN, neighborhoodCenterZ - MIN_DISTANCE_BETWEEN_NEIGHBORHOODS);
    var maxZ = Math.min(terrain.maxZ() - FLATNESS_WINDOW_DEPTH_MARGIN, neighborhoodCenterZ + MIN_DISTANCE_BETWEEN_NEIGHBORHOODS);

    for (x = minX; x <= maxX; x++) {
      for (z = minZ; z <= maxZ; z++) {
        distanceToNeighborhoodCenter = CityTourMath.distanceBetweenPoints(x, z, neighborhoodCenterX, neighborhoodCenterZ);
        if (distanceToNeighborhoodCenter < MIN_DISTANCE_BETWEEN_NEIGHBORHOODS) {
          scores[x][z].closeNeighborhoodPenalty = Number.POSITIVE_INFINITY;
        }
      }
    }
  };

  var bestNeighborhoodSite = function(terrain, scores) {
    var bestSiteScore = Number.POSITIVE_INFINITY;
    var score, scoreComponents;
    var x, z;
    var bestX, bestZ;

    var minX = terrain.minX() + FLATNESS_WINDOW_WIDTH_MARGIN;
    var maxX = terrain.maxX() - FLATNESS_WINDOW_WIDTH_MARGIN;
    var minZ = terrain.minZ() + FLATNESS_WINDOW_DEPTH_MARGIN;
    var maxZ = terrain.maxZ() - FLATNESS_WINDOW_DEPTH_MARGIN;

    for (x = minX; x < maxX; x++) {
      for (z = minZ; z < maxZ; z++) {
        scoreComponents = scores[x][z];
        score = scoreComponents.centrality + scoreComponents.flatness + scoreComponents.closeNeighborhoodPenalty;

        if (score < bestSiteScore) {
          bestSiteScore = score;
          bestX = x;
          bestZ = z;
        }
      }
    }

    if (bestX === undefined || bestZ === undefined) {
      return undefined;
    }
    else {
      return { x: bestX, z: bestZ };
    }
  };

  var generate = function(terrain, count) {
    var scores = calculateScores(terrain);
    var neighborhoods = [];
    var neighborhoodCenter;
    var i;

    for (i = 0; i < count; i++) {
      neighborhoodCenter = bestNeighborhoodSite(terrain, scores);
      if (neighborhoodCenter === undefined) {
        return neighborhoods;
      }

      neighborhoods.push({ centerX: neighborhoodCenter.x, centerZ: neighborhoodCenter.z });

      setCloseNeighborhoodPenalties(neighborhoodCenter.x, neighborhoodCenter.z, terrain, scores);
    }

    return neighborhoods;
  };

  return {
    generate: generate,
  };
})();

export { NeighborhoodGenerator };

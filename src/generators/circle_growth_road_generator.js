"use strict";

import { Config } from "./../config";
import { CityTourMath } from "./../math";
import { RoadNetwork } from "./../road_network";

var CircleGrowthRoadGenerator = (function() {
  var addNeighborhoodRoads = function(terrain, roadNetwork, neighborhoodCenterX, neighborhoodCenterZ, config) {
    var MIN_X = Math.max(terrain.minX(), -(config.neighborhoods.columnCount / 2) + neighborhoodCenterX);
    var MAX_X = Math.min(terrain.maxX(), (config.neighborhoods.columnCount / 2) + neighborhoodCenterX);
    var MIN_Z = Math.max(terrain.minZ(), -(config.neighborhoods.rowCount / 2) + neighborhoodCenterZ);
    var MAX_Z = Math.min(terrain.maxZ(), (config.neighborhoods.rowCount / 2) + neighborhoodCenterZ);

    var DISTANCE_TO_NEIGHBORHOOD_BOUNDARY = Math.min(config.neighborhoods.columnCount / 2, config.neighborhoods.rowCount / 2);
    var SAFE_FROM_DECAY_DISTANCE = config.safeFromDecayBlocks;

    var probabilityOfBranching = function(x1, z1, x2, z2) {
      // Guarantee roads along x and z axes
      if (x1 === neighborhoodCenterX && x2 === neighborhoodCenterX && z2 >= MIN_Z && z2 <= MAX_Z) {
        return 1.0;
      }
      else if (z1 === neighborhoodCenterZ && z2 === neighborhoodCenterZ && x2 >= MIN_X && x2 <= MAX_X) {
        return 1.0;
      }

      var distanceFromCenter = CityTourMath.distanceBetweenPoints(neighborhoodCenterX, neighborhoodCenterZ, x1, z1);
      var normalizedPercentageFromCenter;

      if (distanceFromCenter <= SAFE_FROM_DECAY_DISTANCE) {
        return 1.0;
      }

      normalizedPercentageFromCenter = (distanceFromCenter - SAFE_FROM_DECAY_DISTANCE) / (DISTANCE_TO_NEIGHBORHOOD_BOUNDARY - SAFE_FROM_DECAY_DISTANCE);
      return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
    };

    var isTerrainTooSteep = function(terrain, x, z, targetX, targetZ) {
      var heightAtPoint1 = terrain.heightAtCoordinates(x, z);
      var heightAtPoint2 = terrain.heightAtCoordinates(targetX, targetZ);
      var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), Config.BLOCK_DEPTH);

      return Math.abs(angle) > config.maxRoadAngle;
    };

    var shouldConnectIntersections = function(terrain, x1, z1, x2, z2) {
      var edgeIsOnLand = terrain.waterHeightAtCoordinates(x1, z1) === 0.0 &&
                         terrain.waterHeightAtCoordinates(x2, z2) === 0.0;

      return edgeIsOnLand &&
             (Math.random() < probabilityOfBranching(x1, z1, x2, z2)) &&
             !isTerrainTooSteep(terrain, x1, z1, x2, z2);
    };

    var branchFromIntersection = function(terrain, roadNetwork, x, z) {
      connectIntersections(terrain, roadNetwork, x, z, x - 1, z);
      connectIntersections(terrain, roadNetwork, x, z, x, z - 1);
      connectIntersections(terrain, roadNetwork, x, z, x + 1, z);
      connectIntersections(terrain, roadNetwork, x, z, x, z + 1);
    };


    var connectIntersections = function(terrain, roadNetwork, x, z, targetX, targetZ) {
      var bridgeAttributes;
      var bridgeIntersectionX, bridgeIntersectionZ;
      var targetIntersectionExists;

      if (targetX < MIN_X || targetX > MAX_X || targetZ < MIN_Z || targetZ > MAX_Z) {
        return;
      }

      if (shouldConnectIntersections(terrain, x, z, targetX, targetZ)) {
        targetIntersectionExists = roadNetwork.hasIntersection(targetX, targetZ);

        roadNetwork.addEdge(x, z, targetX, targetZ, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
        if (!targetIntersectionExists) {
          branchFromIntersection(terrain, roadNetwork, targetX, targetZ);
        }
      }
    };

    branchFromIntersection(terrain, roadNetwork, neighborhoodCenterX, neighborhoodCenterZ);
  };


  return {
    addNeighborhoodRoads: addNeighborhoodRoads,
  };
})();

export { CircleGrowthRoadGenerator };

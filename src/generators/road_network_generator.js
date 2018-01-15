"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetworkGenerator = (function() {
  var DISTANCE_TO_CITY_EDGE = Math.min(CityTour.Config.HALF_BLOCK_COLUMNS, CityTour.Config.HALF_BLOCK_ROWS);
  var MAX_STEEPNESS = Math.PI / 6;

  var buildRoadNetwork = function(terrain, config) {
    var centerMapX = config.centerMapX;
    var centerMapZ = config.centerMapZ;

    var MIN_MAP_X = Math.max(terrain.minMapX(), -CityTour.Config.HALF_BLOCK_COLUMNS + centerMapX);
    var MAX_MAP_X = Math.min(terrain.maxMapX(), CityTour.Config.HALF_BLOCK_COLUMNS + centerMapX);
    var MIN_MAP_Z = Math.max(terrain.minMapZ(), -CityTour.Config.HALF_BLOCK_ROWS + centerMapZ);
    var MAX_MAP_Z = Math.min(terrain.maxMapZ(), CityTour.Config.HALF_BLOCK_ROWS + centerMapZ);

    var SAFE_FROM_DECAY_DISTANCE = DISTANCE_TO_CITY_EDGE * config.safeFromDecayPercentage;

    var probabilityOfBranching = function(mapX1, mapZ1, mapX2, mapZ2) {
      // Guarantee roads along x and z axes
      if (mapX1 === centerMapX && mapX2 === centerMapX && mapZ2 >= MIN_MAP_Z && mapZ2 <= MAX_MAP_Z) {
        return 1.0;
      }
      else if (mapZ1 === centerMapZ && mapZ2 === centerMapZ && mapX2 >= MIN_MAP_X && mapX2 <= MAX_MAP_X) {
        return 1.0;
      }

      var distanceFromCenter = CityTour.Math.distanceBetweenPoints(centerMapX, centerMapZ, mapX1, mapZ1);
      var normalizedPercentageFromCenter;

      if (distanceFromCenter <= SAFE_FROM_DECAY_DISTANCE) {
        return 1.0;
      }

      normalizedPercentageFromCenter = (distanceFromCenter - SAFE_FROM_DECAY_DISTANCE) / (DISTANCE_TO_CITY_EDGE - SAFE_FROM_DECAY_DISTANCE);
      return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
    };

    var isTerrainTooSteep = function(terrain, mapX, mapZ, targetMapX, targetMapZ) {
      var heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
      var heightAtPoint2 = terrain.heightAtCoordinates(targetMapX, targetMapZ);
      var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_DEPTH);

      return Math.abs(angle) > MAX_STEEPNESS;
    };

    var shouldConnectIntersections = function(terrain, mapX1, mapZ1, mapX2, mapZ2) {
      var edgeIsOnLand = terrain.waterHeightAtCoordinates(mapX1, mapZ1) === 0.0 &&
                         terrain.waterHeightAtCoordinates(mapX2, mapZ2) === 0.0;

      return edgeIsOnLand &&
             (Math.random() < probabilityOfBranching(mapX1, mapZ1, mapX2, mapZ2)) &&
             !isTerrainTooSteep(terrain, mapX1, mapZ1, mapX2, mapZ2);
    };

    var branchFromIntersection = function(terrain, roadNetwork, mapX, mapZ) {
      connectIntersections(terrain, roadNetwork, mapX, mapZ, mapX - 1, mapZ);
      connectIntersections(terrain, roadNetwork, mapX, mapZ, mapX, mapZ - 1);
      connectIntersections(terrain, roadNetwork, mapX, mapZ, mapX + 1, mapZ);
      connectIntersections(terrain, roadNetwork, mapX, mapZ, mapX, mapZ + 1);
    };


    var connectIntersections = function(terrain, roadNetwork, mapX, mapZ, targetMapX, targetMapZ) {
      var bridgeAttributes;
      var bridgeIntersectionX, bridgeIntersectionZ;
      var targetIntersectionExists;

      if (targetMapX < MIN_MAP_X || targetMapX > MAX_MAP_X || targetMapZ < MIN_MAP_Z || targetMapZ > MAX_MAP_Z) {
        return;
      }

      if (terrain.waterHeightAtCoordinates(targetMapX, targetMapZ) > 0.0) {
        bridgeAttributes = CityTour.BridgeGenerator.buildBridge(terrain, roadNetwork, mapX, mapZ, targetMapX, targetMapZ, config);

        if (bridgeAttributes !== null) {
          bridgeIntersectionX = mapX;
          bridgeIntersectionZ = mapZ;
          while (bridgeIntersectionX !== bridgeAttributes.endX || bridgeIntersectionZ !== bridgeAttributes.endZ) {
            roadNetwork.addEdge(bridgeIntersectionX,
                                bridgeIntersectionZ,
                                bridgeIntersectionX + bridgeAttributes.xDelta,
                                bridgeIntersectionZ + bridgeAttributes.zDelta,
                                bridgeAttributes.roadDeckHeight,
                                CityTour.RoadNetwork.BRIDGE_SURFACE);
            bridgeIntersectionX += bridgeAttributes.xDelta;
            bridgeIntersectionZ += bridgeAttributes.zDelta;
          }

          branchFromIntersection(terrain, roadNetwork, bridgeAttributes.endX, bridgeAttributes.endZ);
        }
      }
      else {
        if (shouldConnectIntersections(terrain, mapX, mapZ, targetMapX, targetMapZ)) {
          targetIntersectionExists = roadNetwork.hasIntersection(targetMapX, targetMapZ);

          roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
          if (!targetIntersectionExists) {
            branchFromIntersection(terrain, roadNetwork, targetMapX, targetMapZ);
          }
        }
      }
    };

    var roadNetwork = new CityTour.RoadNetwork(terrain);
    branchFromIntersection(terrain, roadNetwork, centerMapX, centerMapZ);

    return roadNetwork;
  };

  var roadNetworkGenerator = {};

  roadNetworkGenerator.generate = function(terrain, config) {
    return buildRoadNetwork(terrain, config);
  };

  return roadNetworkGenerator;
})();

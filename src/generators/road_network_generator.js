"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetworkGenerator = (function() {
  var DISTANCE_TO_CITY_EDGE = Math.min(CityTour.Config.HALF_BLOCK_COLUMNS, CityTour.Config.HALF_BLOCK_ROWS);
  var MAX_STEEPNESS = Math.PI / 6;
  var MAX_BRIDGE_LENGTH = 10;
  var MIN_BRIDGE_HEIGHT_FROM_WATER = 5;
  var MAX_HEIGHT_DIFFERENCE_BETWEEN_BRIDGE_TERMINALS = 5.0;
  var MINIMUM_DISTANCE_BETWEEN_BRIDGES_IN_BLOCKS = 3;
  var PROBABILITY_OF_VALID_BRIDGE_BEING_BUILT = 0.5;

  var buildRoadNetwork = function(terrain, config) {
    var centerMapX = config.centerMapX;
    var centerMapZ = config.centerMapZ;

    var MIN_MAP_X = -CityTour.Config.HALF_BLOCK_COLUMNS + centerMapX;
    var MAX_MAP_X = CityTour.Config.HALF_BLOCK_COLUMNS + centerMapX;
    var MIN_MAP_Z = -CityTour.Config.HALF_BLOCK_ROWS + centerMapZ;
    var MAX_MAP_Z = CityTour.Config.HALF_BLOCK_ROWS + centerMapZ;

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
      var edgeIsOnLand = terrain.materialAtCoordinates(mapX1, mapZ1) === CityTour.Terrain.LAND &&
                         terrain.materialAtCoordinates(mapX2, mapZ2) === CityTour.Terrain.LAND;

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

    var calculateBridgeAttributes = function(terrain, roadNetwork, bridgeStartX, bridgeStartZ, targetMapX, targetMapZ) {
      var xDelta, zDelta;
      var bridgeEndX, bridgeEndZ;
      var bridgeLength;
      var heightAtTerminal1, heightAtTerminal2;
      var waterHeight, roadDeckHeight;

      var distanceFromCenter = CityTour.Math.distanceBetweenPoints(centerMapX, centerMapZ, bridgeStartX, bridgeStartZ);
      if (distanceFromCenter > SAFE_FROM_DECAY_DISTANCE) {
        return null;
      }

      if (targetMapX === bridgeStartX) {
        xDelta = 0.0;
      }
      else {
        xDelta = (targetMapX < bridgeStartX) ? -1 : 1;
      }
      if (targetMapZ === bridgeStartZ) {
        zDelta = 0.0;
      }
      else {
        zDelta = (targetMapZ < bridgeStartZ) ? -1 : 1;
      }
      bridgeEndX = targetMapX;
      bridgeEndZ = targetMapZ;

      bridgeLength = 1;
      while (terrain.materialAtCoordinates(bridgeEndX, bridgeEndZ) === CityTour.Terrain.WATER) {
        if (waterHeight === undefined) {
          waterHeight = terrain.heightAtCoordinates(bridgeEndX, bridgeEndZ);
        }
        if (roadNetwork.hasIntersection(bridgeEndX, bridgeEndZ)) {
          return null;
        }

        bridgeEndX += xDelta;
        bridgeEndZ += zDelta;
        bridgeLength += 1;

        if (bridgeEndX < -CityTour.Config.HALF_TERRAIN_COLUMNS ||
            bridgeEndX > CityTour.Config.HALF_TERRAIN_COLUMNS  ||
            bridgeEndZ < -CityTour.Config.HALF_TERRAIN_ROWS    ||
            bridgeEndZ > CityTour.Config.HALF_TERRAIN_ROWS) {
          return null;
        }
      }

      if (bridgeLength > MAX_BRIDGE_LENGTH) {
        return null;
      }

      heightAtTerminal1 = terrain.heightAtCoordinates(bridgeStartX, bridgeStartZ);
      heightAtTerminal2 = terrain.heightAtCoordinates(bridgeEndX, bridgeEndZ);
      if (Math.abs(heightAtTerminal1 - heightAtTerminal2) > MAX_HEIGHT_DIFFERENCE_BETWEEN_BRIDGE_TERMINALS) {
        return null;
      }
      roadDeckHeight = Math.max(heightAtTerminal1, heightAtTerminal2, waterHeight + MIN_BRIDGE_HEIGHT_FROM_WATER);

      if (parallelBridgeExistsNearby(bridgeStartX, bridgeStartZ, bridgeEndX, bridgeEndZ)) {
        return null;
      }

      if (Math.random() < PROBABILITY_OF_VALID_BRIDGE_BEING_BUILT) {
        return null;
      }

      return {
        roadDeckHeight: roadDeckHeight,
        endX: bridgeEndX,
        endZ: bridgeEndZ,
        xDelta: xDelta,
        zDelta: zDelta,
      };
    };

    var parallelBridgeExistsNearby = function(startX, startZ, endX, endZ) {
      var x, z;
      var xMin, xMax, zMin, zMax;

      if (endZ > startZ) {  // North/south bridge
        xMin = startX - MINIMUM_DISTANCE_BETWEEN_BRIDGES_IN_BLOCKS;
        xMax = endX + MINIMUM_DISTANCE_BETWEEN_BRIDGES_IN_BLOCKS;
        zMin = startZ;
        zMax = endZ;
      }
      else {  // East/west bridge
        xMin = startX;
        xMax = endX;
        zMin = startZ - MINIMUM_DISTANCE_BETWEEN_BRIDGES_IN_BLOCKS;
        zMax = endZ + MINIMUM_DISTANCE_BETWEEN_BRIDGES_IN_BLOCKS;
      }

      for (x = xMin; x <= xMax; x++) {
        for (z = zMin; z <= zMax; z++) {
          if (roadNetwork.hasIntersection(x, z) && roadNetwork.getIntersectionSurfaceType(x, z) === CityTour.RoadNetwork.BRIDGE_SURFACE) {
            return true;
          }
        }
      }

      return false;
    };

    var connectIntersections = function(terrain, roadNetwork, mapX, mapZ, targetMapX, targetMapZ) {
      var bridgeAttributes;
      var bridgeIntersectionX, bridgeIntersectionZ;
      var targetIntersectionExists;

      if (terrain.materialAtCoordinates(targetMapX, targetMapZ) === CityTour.Terrain.WATER) {
        bridgeAttributes = calculateBridgeAttributes(terrain, roadNetwork, mapX, mapZ, targetMapX, targetMapZ);

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

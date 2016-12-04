"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetworkGenerator = (function() {
  var DISTANCE_TO_CITY_EDGE = Math.min(CityTour.Config.HALF_BLOCK_COLUMNS, CityTour.Config.HALF_BLOCK_ROWS);
  var MAX_STEEPNESS = Math.PI / 6;
  var MAX_BRIDGE_LENGTH = 10;

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

      var xDistance = mapX1 - centerMapX;
      var zDistance = mapZ1 - centerMapZ; 
      var distanceFromCenter = Math.sqrt((xDistance * xDistance) + (zDistance * zDistance));
      var normalizedPercentageFromCenter;

      if (distanceFromCenter > SAFE_FROM_DECAY_DISTANCE) {
        normalizedPercentageFromCenter = (distanceFromCenter - SAFE_FROM_DECAY_DISTANCE) / (DISTANCE_TO_CITY_EDGE - SAFE_FROM_DECAY_DISTANCE);
      }
      else {
        normalizedPercentageFromCenter = 0.0;
      }

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

    var calculateBridgeAttributes = function(terrain, roadNetwork, mapX, mapZ, targetMapX, targetMapZ) {
      var xDistance = mapX - centerMapX;
      var zDistance = mapZ - centerMapZ; 
      var distanceFromCenter = Math.sqrt((xDistance * xDistance) + (zDistance * zDistance));
      if (distanceFromCenter > SAFE_FROM_DECAY_DISTANCE) {
        return null;
      }

      var xDelta, zDelta;
      if (targetMapX === mapX) {
        xDelta = 0.0;
      }
      else {
        xDelta = (targetMapX < mapX) ? -1 : 1;
      }
      if (targetMapZ === mapZ) {
        zDelta = 0.0;
      }
      else {
        zDelta = (targetMapZ < mapZ) ? -1 : 1;
      }
      var finalX = targetMapX;
      var finalZ = targetMapZ;

      var bridgeLength = 1;
      while (terrain.materialAtCoordinates(finalX, finalZ) === CityTour.Terrain.WATER) {
        if (roadNetwork.hasIntersection(finalX, finalZ)) {
          return null;
        }

        finalX += xDelta;
        finalZ += zDelta;
        bridgeLength += 1;

        if (finalX < -CityTour.Config.HALF_TERRAIN_COLUMNS ||
            finalX > CityTour.Config.HALF_TERRAIN_COLUMNS  ||
            finalZ < -CityTour.Config.HALF_TERRAIN_ROWS    ||
            finalZ > CityTour.Config.HALF_TERRAIN_ROWS) {
          return null;
        }
      }

      if (bridgeLength > MAX_BRIDGE_LENGTH) {
        return null;
      }

      var heightAtTerminal1 = terrain.heightAtCoordinates(mapX, mapZ);
      var heightAtTerminal2 = terrain.heightAtCoordinates(finalX, finalZ);
      if (heightAtTerminal1 !== heightAtTerminal2) {
        return null;
      }
      var roadDeckHeight = Math.max(heightAtTerminal1, heightAtTerminal2);

      if (Math.random() < 0.5) {
        return null;
      }

      return {
        roadDeckHeight: roadDeckHeight,
        endX: finalX,
        endZ: finalZ,
        xDelta: xDelta,
        zDelta: zDelta,
      };
    };

    var connectIntersections = function(terrain, roadNetwork, mapX, mapZ, targetMapX, targetMapZ) {
      if (terrain.materialAtCoordinates(targetMapX, targetMapZ) === CityTour.Terrain.WATER) {
        var bridgeAttributes = calculateBridgeAttributes(terrain, roadNetwork, mapX, mapZ, targetMapX, targetMapZ);

        if (bridgeAttributes !== null) {
          var tempX = mapX;
          var tempZ = mapZ;
          while (tempX < bridgeAttributes.endX || tempZ < bridgeAttributes.endZ) {
            roadNetwork.addEdge(tempX,
                                tempZ,
                                tempX + bridgeAttributes.xDelta,
                                tempZ + bridgeAttributes.zDelta,
                                bridgeAttributes.roadDeckHeight,
                                CityTour.RoadNetwork.BRIDGE_SURFACE);
            tempX += bridgeAttributes.xDelta;
            tempZ += bridgeAttributes.zDelta;
          }

          branchFromIntersection(terrain, roadNetwork, bridgeAttributes.endX, bridgeAttributes.endZ);
        }
      }
      else {
        if (shouldConnectIntersections(terrain, mapX, mapZ, targetMapX, targetMapZ)) {
          if (roadNetwork.hasIntersection(targetMapX, targetMapZ)) {
            roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
          }
          else {
            roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
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

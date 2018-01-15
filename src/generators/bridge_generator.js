"use strict";

var CityTour = CityTour || {};

CityTour.BridgeGenerator = (function() {
  var DISTANCE_TO_CITY_EDGE = Math.min(CityTour.Config.HALF_BLOCK_COLUMNS, CityTour.Config.HALF_BLOCK_ROWS);
  var MAX_BRIDGE_LENGTH = 10;
  var MIN_BRIDGE_HEIGHT_FROM_WATER = 5;
  var MAX_HEIGHT_DIFFERENCE_BETWEEN_BRIDGE_TERMINALS = 5.0;
  var MINIMUM_DISTANCE_BETWEEN_BRIDGES_IN_BLOCKS = 3;
  var PROBABILITY_OF_VALID_BRIDGE_BEING_BUILT = 0.5;

  var buildBridge = function(terrain, roadNetwork, bridgeStartX, bridgeStartZ, targetMapX, targetMapZ, config) {
    var SAFE_FROM_DECAY_DISTANCE = DISTANCE_TO_CITY_EDGE * config.safeFromDecayPercentage;

    var centerMapX = config.centerMapX;
    var centerMapZ = config.centerMapZ;
    var xDelta, zDelta;
    var bridgeEndX, bridgeEndZ;
    var bridgeLength;
    var heightAtTerminal1, heightAtTerminal2;
    var waterHeight, roadDeckHeight;
    var side1WaterCount = 0;
    var side2WaterCount = 0;

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
    while (terrain.waterHeightAtCoordinates(bridgeEndX, bridgeEndZ) > 0.0) {
      if (waterHeight === undefined) {
        waterHeight = terrain.heightAtCoordinates(bridgeEndX, bridgeEndZ);
      }
      if (roadNetwork.hasIntersection(bridgeEndX, bridgeEndZ)) {
        return null;
      }

      if (xDelta === 0.0) {  // North/south bridge
        if (terrain.waterHeightAtCoordinates(bridgeEndX - 1, bridgeEndZ) > 0.0) {
          side1WaterCount += 1;
        }
        if (terrain.waterHeightAtCoordinates(bridgeEndX + 1, bridgeEndZ) > 0.0) {
          side2WaterCount += 1;
        }
      }
      else if (zDelta === 0.0) {  // West/east bridge
        if (terrain.waterHeightAtCoordinates(bridgeEndX, bridgeEndZ - 1) > 0.0) {
          side1WaterCount += 1;
        }
        if (terrain.waterHeightAtCoordinates(bridgeEndX, bridgeEndZ + 1) > 0.0) {
          side2WaterCount += 1;
        }
      }

      bridgeEndX += xDelta;
      bridgeEndZ += zDelta;
      bridgeLength += 1;

      if (bridgeEndX < terrain.minMapX() ||
          bridgeEndX > terrain.maxMapX() ||
          bridgeEndZ < terrain.minMapZ() ||
          bridgeEndZ > terrain.maxMapZ()) {
        return null;
      }
    }

    if (bridgeLength > MAX_BRIDGE_LENGTH) {
      return null;
    }

    // Don't build the bridge if either only borders land
    if (side1WaterCount === 0 || side2WaterCount === 0) {
      return null;
    }

    heightAtTerminal1 = terrain.heightAtCoordinates(bridgeStartX, bridgeStartZ);
    heightAtTerminal2 = terrain.heightAtCoordinates(bridgeEndX, bridgeEndZ);
    if (Math.abs(heightAtTerminal1 - heightAtTerminal2) > MAX_HEIGHT_DIFFERENCE_BETWEEN_BRIDGE_TERMINALS) {
      return null;
    }
    roadDeckHeight = Math.max(heightAtTerminal1, heightAtTerminal2, waterHeight + MIN_BRIDGE_HEIGHT_FROM_WATER);

    if (parallelBridgeExistsNearby(roadNetwork, bridgeStartX, bridgeStartZ, bridgeEndX, bridgeEndZ)) {
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

  var parallelBridgeExistsNearby = function(roadNetwork, startX, startZ, endX, endZ) {
    var x, z;

    var xMin = Math.min(startX, endX);
    var xMax = Math.max(startX, endX);
    var zMin = Math.min(startZ, endZ);
    var zMax = Math.max(startZ, endZ);

    if (startZ !== endZ) {  // North/south bridge
      xMin = xMin - MINIMUM_DISTANCE_BETWEEN_BRIDGES_IN_BLOCKS;
      xMax = xMax + MINIMUM_DISTANCE_BETWEEN_BRIDGES_IN_BLOCKS;
    }
    else {  // West/east bridge
      zMin = zMin - MINIMUM_DISTANCE_BETWEEN_BRIDGES_IN_BLOCKS;
      zMax = zMax + MINIMUM_DISTANCE_BETWEEN_BRIDGES_IN_BLOCKS;
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


  return {
    buildBridge: buildBridge,
  };
})();

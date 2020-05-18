"use strict";

import { CityTourMath } from "./../math";
import { RoadNetwork } from "./../road_network";

var BridgeGenerator = (function() {
  var MAX_BRIDGE_LENGTH = Number.POSITIVE_INFINITY;
  var MIN_BRIDGE_HEIGHT_FROM_WATER = 0.1;
  var MAX_HEIGHT_DIFFERENCE_BETWEEN_BRIDGE_TERMINALS = 0.416666666666667;

  var buildBridge = function(terrain, roadNetwork, bridgeStartX, bridgeStartZ, targetX, targetZ, config) {
    var SAFE_FROM_DECAY_DISTANCE = config.safeFromDecayBlocks;

    var centerX = config.centerX;
    var centerZ = config.centerZ;
    var xDelta, zDelta;
    var bridgeEndX, bridgeEndZ;
    var bridgeLength;
    var heightAtTerminal1, heightAtTerminal2;
    var waterHeight, roadDeckHeight;

    var distanceFromCenter = CityTourMath.distanceBetweenPoints(centerX, centerZ, bridgeStartX, bridgeStartZ);
    if (distanceFromCenter > SAFE_FROM_DECAY_DISTANCE) {
      return;
    }

    if (targetX === bridgeStartX) {
      xDelta = 0.0;
    }
    else {
      xDelta = (targetX < bridgeStartX) ? -1 : 1;
    }
    if (targetZ === bridgeStartZ) {
      zDelta = 0.0;
    }
    else {
      zDelta = (targetZ < bridgeStartZ) ? -1 : 1;
    }
    bridgeEndX = targetX;
    bridgeEndZ = targetZ;

    bridgeLength = 1;
    while (terrain.waterHeightAtCoordinates(bridgeEndX, bridgeEndZ) > 0.0) {
      if (waterHeight === undefined) {
        waterHeight = terrain.heightAtCoordinates(bridgeEndX, bridgeEndZ);
      }
      if (roadNetwork.hasIntersection(bridgeEndX, bridgeEndZ)) {
        return;
      }

      bridgeEndX += xDelta;
      bridgeEndZ += zDelta;
      bridgeLength += 1;

      if (!terrain.isPointInBounds(bridgeEndX, bridgeEndZ)) {
        return;
      }
    }

    if (bridgeLength > MAX_BRIDGE_LENGTH) {
      return;
    }

    heightAtTerminal1 = terrain.heightAtCoordinates(bridgeStartX, bridgeStartZ);
    heightAtTerminal2 = terrain.heightAtCoordinates(bridgeEndX, bridgeEndZ);
    if (Math.abs(heightAtTerminal1 - heightAtTerminal2) > MAX_HEIGHT_DIFFERENCE_BETWEEN_BRIDGE_TERMINALS) {
      return;
    }
    roadDeckHeight = Math.max(heightAtTerminal1, heightAtTerminal2, waterHeight + MIN_BRIDGE_HEIGHT_FROM_WATER);

    return {
      roadDeckHeight: roadDeckHeight,
      endX: bridgeEndX,
      endZ: bridgeEndZ,
      xDelta: xDelta,
      zDelta: zDelta,
    };
  };


  return {
    buildBridge: buildBridge,
  };
})();

export { BridgeGenerator };

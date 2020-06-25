"use strict";

import { RoadNetwork } from "./../road_network";

var BridgeGenerator = (function() {
  var MAX_BRIDGE_LENGTH = Number.POSITIVE_INFINITY;
  var MIN_BRIDGE_HEIGHT_FROM_WATER = 0.1;
  var MAX_HEIGHT_DIFFERENCE_BETWEEN_BRIDGE_TERMINALS = 0.416666666666667;

  var buildBridge = function(terrain, roadNetwork, bridgeStartX, bridgeStartZ, directionX, directionZ) {
    var bridgeEndX, bridgeEndZ;
    var bridgeLength;
    var heightAtTerminal1, heightAtTerminal2;
    var waterHeight, roadDeckHeight;

    if (directionX !== 0 && directionZ !== 0) {
      throw new Error(`Attempt to build a bridge in a diagonal direction. Direction X: ${directionX}, Direction Z: ${directionZ}`);
    }

    bridgeEndX = bridgeStartX + directionX;
    bridgeEndZ = bridgeStartZ + directionZ;

    bridgeLength = 1;
    while (terrain.waterHeightAt(bridgeEndX, bridgeEndZ) > 0.0) {
      if (waterHeight === undefined) {
        waterHeight = terrain.heightAt(bridgeEndX, bridgeEndZ);
      }
      if (roadNetwork.hasIntersection(bridgeEndX, bridgeEndZ)) {
        return;
      }

      bridgeEndX += directionX;
      bridgeEndZ += directionZ;
      bridgeLength += 1;

      if (!roadNetwork.isPointInAllowedBounds(bridgeEndX, bridgeEndZ)) {
        return;
      }
    }

    if (bridgeLength > MAX_BRIDGE_LENGTH) {
      return;
    }

    heightAtTerminal1 = terrain.heightAt(bridgeStartX, bridgeStartZ);
    heightAtTerminal2 = terrain.heightAt(bridgeEndX, bridgeEndZ);
    if (Math.abs(heightAtTerminal1 - heightAtTerminal2) > MAX_HEIGHT_DIFFERENCE_BETWEEN_BRIDGE_TERMINALS) {
      return;
    }
    roadDeckHeight = Math.max(heightAtTerminal1, heightAtTerminal2, waterHeight + MIN_BRIDGE_HEIGHT_FROM_WATER);

    return {
      roadDeckHeight: roadDeckHeight,
      endX: bridgeEndX,
      endZ: bridgeEndZ,
      xDelta: directionX,
      zDelta: directionZ,
    };
  };


  return {
    buildBridge: buildBridge,
  };
})();

export { BridgeGenerator };

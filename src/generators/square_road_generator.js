"use strict";

import { Config } from "./../config";
import { RoadNetwork } from "./../road_network";

var SquareRoadGenerator = (function() {
  var addNeighborhoodRoads = function(terrain, roadNetwork, neighborhoodCenterX, neighborhoodCenterZ, config) {
    var leftX = Math.max(terrain.minX() + 1, neighborhoodCenterX - 6);
    var rightX = Math.min(terrain.maxX() - 1, neighborhoodCenterX + 6);
    var topZ = Math.max(terrain.minZ() + 1, neighborhoodCenterZ - 6);
    var bottomZ = Math.min(terrain.maxZ() - 1, neighborhoodCenterZ + 6);
    var x, z;

    for (x = leftX; x <= rightX; x++) {
      for (z = topZ; z <= bottomZ; z++) {
        if (x < rightX) {
          addEdge(terrain, roadNetwork, x, z, x + 1, z, config.maxRoadAngle);
        }

        if (z < bottomZ) {
          addEdge(terrain, roadNetwork, x, z, x, z + 1, config.maxRoadAngle);
        }
      }
    }
  };

  var isTerrainTooSteep = function(terrain, x, z, targetX, targetZ, maxRoadAngle) {
    var heightAtPoint1 = terrain.heightAtCoordinates(x, z);
    var heightAtPoint2 = terrain.heightAtCoordinates(targetX, targetZ);
    var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), Config.BLOCK_DEPTH);

    return Math.abs(angle) > maxRoadAngle;
  };

  var addEdge = function(terrain, roadNetwork, x1, z1, x2, z2, maxRoadAngle) {
    var edgeIsOnLand = terrain.waterHeightAtCoordinates(x1, z1) === 0.0 &&
                       terrain.waterHeightAtCoordinates(x2, z2) === 0.0;

    if (edgeIsOnLand && !isTerrainTooSteep(terrain, x1, z1, x2, z2, maxRoadAngle)) {
      roadNetwork.addEdge(x1, z1, x2, z2, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
    }
  };

  return {
    addNeighborhoodRoads: addNeighborhoodRoads,
  };
})();

export { SquareRoadGenerator };

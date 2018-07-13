"use strict";

var CityTour = CityTour || {};

CityTour.SquareRoadGenerator = (function() {
  var MAX_STEEPNESS = Math.PI / 6;

  var addNeighborhoodRoads = function(terrain, roadNetwork, neighborhoodCenterX, neighborhoodCenterZ, config) {
    var leftX = Math.max(terrain.minMapX(), neighborhoodCenterX - 6);
    var rightX = Math.min(terrain.maxMapX(), neighborhoodCenterX + 6);
    var topZ = Math.max(terrain.minMapZ(), neighborhoodCenterZ - 6);
    var bottomZ = Math.min(terrain.maxMapZ(), neighborhoodCenterZ + 6);
    var mapX, mapZ;

    for (mapX = leftX; mapX <= rightX; mapX++) {
      for (mapZ = topZ; mapZ <= bottomZ; mapZ++) {
        if (mapX < rightX) {
          addEdge(terrain, roadNetwork, mapX, mapZ, mapX + 1, mapZ);
        }

        if (mapZ < bottomZ) {
          addEdge(terrain, roadNetwork, mapX, mapZ, mapX, mapZ + 1);
        }
      }
    }
  };

  var isTerrainTooSteep = function(terrain, mapX, mapZ, targetMapX, targetMapZ) {
    var heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
    var heightAtPoint2 = terrain.heightAtCoordinates(targetMapX, targetMapZ);
    var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_DEPTH);

    return Math.abs(angle) > MAX_STEEPNESS;
  };

  var addEdge = function(terrain, roadNetwork, mapX1, mapZ1, mapX2, mapZ2) {
    var edgeIsOnLand = terrain.waterHeightAtCoordinates(mapX1, mapZ1) === 0.0 &&
                       terrain.waterHeightAtCoordinates(mapX2, mapZ2) === 0.0;

    if (edgeIsOnLand && !isTerrainTooSteep(terrain, mapX1, mapZ1, mapX2, mapZ2)) {
      roadNetwork.addEdge(mapX1, mapZ1, mapX2, mapZ2, 0.0, 1.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
    }
  };

  return {
    addNeighborhoodRoads: addNeighborhoodRoads,
  };
})();

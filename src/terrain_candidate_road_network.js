"use strict";

var CityTour = CityTour || {};

CityTour.TerrainCandidateRoadNetwork = function(terrain) {
  var MAX_STEEPNESS = Math.PI / 6;

  var edgeBetween = function(mapX1, mapZ1, mapX2, mapZ2) {
    var heightAtPoint1 = terrain.heightAtCoordinates(mapX1, mapZ1);
    var heightAtPoint2 = terrain.heightAtCoordinates(mapX2, mapZ2);
    var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_DEPTH);

    if (Math.abs(angle) <= MAX_STEEPNESS) {
      return { distance: 1.0, surfaceType: CityTour.RoadNetwork.TERRAIN_SURFACE };
    }
  };

  var minColumn = function() {
    return terrain.minMapX();
  };

  var maxColumn = function() {
    return terrain.maxMapX();
  };

  return {
    edgeBetween: edgeBetween,
    minColumn: minColumn,
    maxColumn: maxColumn,
  };
};

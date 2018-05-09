"use strict";

var CityTour = CityTour || {};

CityTour.TerrainCandidateRoadNetwork = function(terrain) {
  var MAX_STEEPNESS = Math.PI / 6;

  var edgesFrom = function(mapX, mapZ) {
    var edges = [];
    var heightAtCurrentPoint = terrain.heightAtCoordinates(mapX, mapZ);
    var northHeight = terrain.heightAtCoordinates(mapX, mapZ - 1);
    var northAngle = Math.atan2((heightAtCurrentPoint - northHeight), CityTour.Config.BLOCK_DEPTH);
    var southHeight = terrain.heightAtCoordinates(mapX, mapZ + 1);
    var southAngle = Math.atan2((heightAtCurrentPoint - southHeight), CityTour.Config.BLOCK_DEPTH);
    var westHeight = terrain.heightAtCoordinates(mapX - 1, mapZ);
    var westAngle = Math.atan2((heightAtCurrentPoint - westHeight), CityTour.Config.BLOCK_WIDTH);
    var eastHeight = terrain.heightAtCoordinates(mapX + 1, mapZ);
    var eastAngle = Math.atan2((heightAtCurrentPoint - eastHeight), CityTour.Config.BLOCK_WIDTH);

    if (Math.abs(northAngle) <= MAX_STEEPNESS) {
      edges.push({ destinationMapX: mapX, destinationMapZ: mapZ - 1, edge: { distance: 1.0, surfaceType: CityTour.RoadNetwork.TERRAIN_SURFACE }});
    }

    if (Math.abs(southAngle) <= MAX_STEEPNESS) {
      edges.push({ destinationMapX: mapX, destinationMapZ: mapZ + 1, edge: { distance: 1.0, surfaceType: CityTour.RoadNetwork.TERRAIN_SURFACE }});
    }

    if (Math.abs(westAngle) <= MAX_STEEPNESS) {
      edges.push({ destinationMapX: mapX - 1, destinationMapZ: mapZ, edge: { distance: 1.0, surfaceType: CityTour.RoadNetwork.TERRAIN_SURFACE }});
    }

    if (Math.abs(eastAngle) <= MAX_STEEPNESS) {
      edges.push({ destinationMapX: mapX + 1, destinationMapZ: mapZ, edge: { distance: 1.0, surfaceType: CityTour.RoadNetwork.TERRAIN_SURFACE }});
    }

    return edges;
  };

  var minColumn = function() {
    return terrain.minMapX();
  };

  var maxColumn = function() {
    return terrain.maxMapX();
  };

  return {
    edgesFrom: edgesFrom,
    minColumn: minColumn,
    maxColumn: maxColumn,
  };
};

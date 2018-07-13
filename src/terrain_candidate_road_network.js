"use strict";

var CityTour = CityTour || {};

CityTour.TerrainCandidateRoadNetwork = function(terrain) {
  var MAX_STEEPNESS = Math.PI / 6;
  var EMPTY_ROAD_NETWORK = CityTour.RoadNetwork(terrain);
  var BRIDGE_CONFIG = {
    centerMapX: 0,
    centerMapZ: 0,
    safeFromDecayBlocks: Number.POSITIVE_INFINITY,
    probability: 1.0,
  };

  var addBridgeEdge = function(edges, mapX, mapZ, targetMapX, targetMapZ) {
    var bridgeLength;
    var bridgeAttributes = CityTour.BridgeGenerator.buildBridge(terrain, EMPTY_ROAD_NETWORK, mapX, mapZ, targetMapX, targetMapZ, BRIDGE_CONFIG);

    if (bridgeAttributes !== undefined) {
      bridgeLength = CityTour.Math.distanceBetweenPoints(mapX, mapZ, bridgeAttributes.endX, bridgeAttributes.endZ);
      edges.push({ destinationMapX: bridgeAttributes.endX, destinationMapZ: bridgeAttributes.endZ, edge: { distance: bridgeLength, surfaceType: CityTour.RoadNetwork.BRIDGE_SURFACE }});
    }
  };

  var hasIntersection = function(mapX, mapZ) {
    return mapX >= terrain.minMapX() && mapX <= terrain.maxMapX() && mapZ >= terrain.minMapZ() && mapZ <= terrain.maxMapZ();
  };

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
    var bridgeAttributes, bridgeLength;

    if (terrain.waterHeightAtCoordinates(mapX, mapZ - 1) > 0.0) {
      addBridgeEdge(edges, mapX, mapZ, mapX, mapZ - 1);
    }
    else if (Math.abs(northAngle) <= MAX_STEEPNESS) {
      edges.push({ destinationMapX: mapX, destinationMapZ: mapZ - 1, edge: { distance: 1.0, surfaceType: CityTour.RoadNetwork.TERRAIN_SURFACE }});
    }

    if (terrain.waterHeightAtCoordinates(mapX, mapZ + 1) > 0.0) {
      addBridgeEdge(edges, mapX, mapZ, mapX, mapZ + 1);
    }
    else if (Math.abs(southAngle) <= MAX_STEEPNESS) {
      edges.push({ destinationMapX: mapX, destinationMapZ: mapZ + 1, edge: { distance: 1.0, surfaceType: CityTour.RoadNetwork.TERRAIN_SURFACE }});
    }


    if (terrain.waterHeightAtCoordinates(mapX - 1, mapZ) > 0.0) {
      addBridgeEdge(edges, mapX, mapZ, mapX - 1, mapZ);
    }
    else if (Math.abs(westAngle) <= MAX_STEEPNESS) {
      edges.push({ destinationMapX: mapX - 1, destinationMapZ: mapZ, edge: { distance: 1.0, surfaceType: CityTour.RoadNetwork.TERRAIN_SURFACE }});
    }

    if (terrain.waterHeightAtCoordinates(mapX + 1, mapZ) > 0.0) {
      addBridgeEdge(edges, mapX, mapZ, mapX + 1, mapZ);
    }
    else if (Math.abs(eastAngle) <= MAX_STEEPNESS) {
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
    hasIntersection: hasIntersection,
    edgesFrom: edgesFrom,
    minColumn: minColumn,
    maxColumn: maxColumn,
  };
};

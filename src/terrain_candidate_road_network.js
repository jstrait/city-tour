"use strict";

import { Config } from "./config";
import { CityTourMath } from "./math";
import { RoadNetwork } from "./road_network";
import { BridgeGenerator } from "./generators/bridge_generator";

var TerrainCandidateRoadNetwork = function(terrain, maxRoadAngle) {
  var EMPTY_ROAD_NETWORK = RoadNetwork(terrain);
  var BRIDGE_CONFIG = {
    centerX: 0,
    centerZ: 0,
    safeFromDecayBlocks: Number.POSITIVE_INFINITY,
    probability: 1.0,
  };

  var addBridgeEdge = function(edges, x, z, targetX, targetZ) {
    var bridgeLength;
    var bridgeAttributes = BridgeGenerator.buildBridge(terrain, EMPTY_ROAD_NETWORK, x, z, targetX, targetZ, BRIDGE_CONFIG);

    if (bridgeAttributes !== undefined) {
      bridgeLength = CityTourMath.distanceBetweenPoints(x, z, bridgeAttributes.endX, bridgeAttributes.endZ);
      edges.push({ destinationX: bridgeAttributes.endX, destinationZ: bridgeAttributes.endZ, edge: { distance: bridgeLength, surfaceType: RoadNetwork.BRIDGE_SURFACE }});
    }
  };

  var hasIntersection = function(x, z) {
    return terrain.isPointInBounds(x, z);
  };

  var edgesFrom = function(x, z) {
    var edges = [];
    var heightAtCurrentPoint = terrain.heightAtCoordinates(x, z);
    var northHeight = terrain.heightAtCoordinates(x, z - 1);
    var northAngle = Math.atan2((heightAtCurrentPoint - northHeight), Config.BLOCK_DEPTH);
    var southHeight = terrain.heightAtCoordinates(x, z + 1);
    var southAngle = Math.atan2((heightAtCurrentPoint - southHeight), Config.BLOCK_DEPTH);
    var westHeight = terrain.heightAtCoordinates(x - 1, z);
    var westAngle = Math.atan2((heightAtCurrentPoint - westHeight), Config.BLOCK_WIDTH);
    var eastHeight = terrain.heightAtCoordinates(x + 1, z);
    var eastAngle = Math.atan2((heightAtCurrentPoint - eastHeight), Config.BLOCK_WIDTH);

    if (terrain.waterHeightAtCoordinates(x, z - 1) > 0.0) {
      addBridgeEdge(edges, x, z, x, z - 1);
    }
    else if (Math.abs(northAngle) <= maxRoadAngle) {
      edges.push({ destinationX: x, destinationZ: z - 1, edge: { distance: 1.0, surfaceType: RoadNetwork.TERRAIN_SURFACE }});
    }

    if (terrain.waterHeightAtCoordinates(x, z + 1) > 0.0) {
      addBridgeEdge(edges, x, z, x, z + 1);
    }
    else if (Math.abs(southAngle) <= maxRoadAngle) {
      edges.push({ destinationX: x, destinationZ: z + 1, edge: { distance: 1.0, surfaceType: RoadNetwork.TERRAIN_SURFACE }});
    }


    if (terrain.waterHeightAtCoordinates(x - 1, z) > 0.0) {
      addBridgeEdge(edges, x, z, x - 1, z);
    }
    else if (Math.abs(westAngle) <= maxRoadAngle) {
      edges.push({ destinationX: x - 1, destinationZ: z, edge: { distance: 1.0, surfaceType: RoadNetwork.TERRAIN_SURFACE }});
    }

    if (terrain.waterHeightAtCoordinates(x + 1, z) > 0.0) {
      addBridgeEdge(edges, x, z, x + 1, z);
    }
    else if (Math.abs(eastAngle) <= maxRoadAngle) {
      edges.push({ destinationX: x + 1, destinationZ: z, edge: { distance: 1.0, surfaceType: RoadNetwork.TERRAIN_SURFACE }});
    }

    return edges;
  };

  var minColumn = function() {
    return terrain.minX();
  };

  var maxColumn = function() {
    return terrain.maxX();
  };

  return {
    hasIntersection: hasIntersection,
    edgesFrom: edgesFrom,
    minColumn: minColumn,
    maxColumn: maxColumn,
  };
};

export { TerrainCandidateRoadNetwork };

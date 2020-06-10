"use strict";

import { Config } from "./config";
import { CityTourMath } from "./math";
import { RoadNetwork } from "./road_network";
import { BridgeGenerator } from "./generators/bridge_generator";

var TerrainCandidateRoadNetwork = function(terrain, roadNetwork, maxRoadAngle) {
  var addBridgeEdge = function(edges, x, z, targetX, targetZ) {
    var bridgeLength;
    var bridgeAttributes = BridgeGenerator.buildBridge(terrain, roadNetwork, x, z, targetX, targetZ);

    if (bridgeAttributes !== undefined) {
      bridgeLength = CityTourMath.distanceBetweenPoints(x, z, bridgeAttributes.endX, bridgeAttributes.endZ);
      edges.push({ destinationX: bridgeAttributes.endX, destinationZ: bridgeAttributes.endZ, edge: { distance: bridgeLength, gradeType: RoadNetwork.BRIDGE_GRADE }});
    }
  };

  var hasIntersection = function(x, z) {
    return roadNetwork.isPointInAllowedBounds(x, z);
  };

  var edgesFrom = function(x, z) {
    var edges = [];
    var heightAtCurrentPoint = terrain.heightAt(x, z);
    var northHeight = terrain.heightAt(x, z - 1);
    var northAngle = Math.atan2((heightAtCurrentPoint - northHeight), Config.BLOCK_DEPTH);
    var southHeight = terrain.heightAt(x, z + 1);
    var southAngle = Math.atan2((heightAtCurrentPoint - southHeight), Config.BLOCK_DEPTH);
    var westHeight = terrain.heightAt(x - 1, z);
    var westAngle = Math.atan2((heightAtCurrentPoint - westHeight), Config.BLOCK_WIDTH);
    var eastHeight = terrain.heightAt(x + 1, z);
    var eastAngle = Math.atan2((heightAtCurrentPoint - eastHeight), Config.BLOCK_WIDTH);

    if (terrain.waterHeightAt(x, z - 1) > 0.0) {
      addBridgeEdge(edges, x, z, x, z - 1);
    }
    else if (Math.abs(northAngle) <= maxRoadAngle) {
      edges.push({ destinationX: x, destinationZ: z - 1, edge: { distance: 1.0, gradeType: RoadNetwork.SURFACE_GRADE }});
    }

    if (terrain.waterHeightAt(x, z + 1) > 0.0) {
      addBridgeEdge(edges, x, z, x, z + 1);
    }
    else if (Math.abs(southAngle) <= maxRoadAngle) {
      edges.push({ destinationX: x, destinationZ: z + 1, edge: { distance: 1.0, gradeType: RoadNetwork.SURFACE_GRADE }});
    }


    if (terrain.waterHeightAt(x - 1, z) > 0.0) {
      addBridgeEdge(edges, x, z, x - 1, z);
    }
    else if (Math.abs(westAngle) <= maxRoadAngle) {
      edges.push({ destinationX: x - 1, destinationZ: z, edge: { distance: 1.0, gradeType: RoadNetwork.SURFACE_GRADE }});
    }

    if (terrain.waterHeightAt(x + 1, z) > 0.0) {
      addBridgeEdge(edges, x, z, x + 1, z);
    }
    else if (Math.abs(eastAngle) <= maxRoadAngle) {
      edges.push({ destinationX: x + 1, destinationZ: z, edge: { distance: 1.0, gradeType: RoadNetwork.SURFACE_GRADE }});
    }

    return edges;
  };

  var minBoundingX = function() {
    return terrain.minX();
  };

  var maxBoundingX = function() {
    return terrain.maxX();
  };

  return {
    hasIntersection: hasIntersection,
    edgesFrom: edgesFrom,
    minBoundingX: minBoundingX,
    maxBoundingX: maxBoundingX,
  };
};

export { TerrainCandidateRoadNetwork };

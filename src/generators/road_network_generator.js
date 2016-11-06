"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetworkGenerator = (function() {
  var PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS = 0.4;
  var DISTANCE_TO_CITY_EDGE = Math.min(CityTour.Config.HALF_BLOCK_COLUMNS, CityTour.Config.HALF_BLOCK_ROWS);
  var SAFE_FROM_DECAY_DISTANCE = DISTANCE_TO_CITY_EDGE * PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS;
  var MAX_STEEPNESS = Math.PI / 6;

  var calculateBlockProbabilityOfBranching = function(centerMapX, centerMapZ, mapX1, mapZ1, mapX2, mapZ2) {
    // Guarantee roads along x and z axes
    if (mapX1 === centerMapX && mapX2 === centerMapX && mapZ2 >= (-CityTour.Config.HALF_BLOCK_ROWS + centerMapZ) && mapZ2 <= (CityTour.Config.HALF_BLOCK_ROWS + centerMapZ)) {
      return 1.0;
    }
    else if (mapZ1 === centerMapZ && mapZ2 === centerMapZ && mapX2 >= (-CityTour.Config.HALF_BLOCK_COLUMNS + centerMapX) && mapX2 <= (CityTour.Config.HALF_BLOCK_COLUMNS + centerMapX)) {
      return 1.0;
    }

    var xDistance = mapX1 - centerMapX;
    var zDistance = mapZ1 - centerMapZ; 
    var distanceFromCenter = Math.sqrt((xDistance * xDistance) + (zDistance * zDistance));
    var normalizedPercentageFromCenter;

    if (distanceFromCenter > SAFE_FROM_DECAY_DISTANCE) {
      normalizedPercentageFromCenter = (distanceFromCenter - SAFE_FROM_DECAY_DISTANCE) / (DISTANCE_TO_CITY_EDGE - SAFE_FROM_DECAY_DISTANCE);
    }
    else {
      normalizedPercentageFromCenter = 0.0;
    }

    return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
  };

  var isTerrainTooSteep = function(terrain, mapX, mapZ, targetMapX, targetMapZ) {
    var heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
    var heightAtPoint2 = terrain.heightAtCoordinates(targetMapX, targetMapZ);
    var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_DEPTH);

    return Math.abs(angle) > MAX_STEEPNESS;
  };

  var shouldConnectIntersections = function(terrain, centerMapX, centerMapZ, mapX1, mapZ1, mapX2, mapZ2) {
    var edgeIsOnLand = terrain.materialAtCoordinates(mapX1, mapZ1) === 'land' &&
                       terrain.materialAtCoordinates(mapX2, mapZ2) === 'land';

    return edgeIsOnLand &&
           (Math.random() < calculateBlockProbabilityOfBranching(centerMapX, centerMapZ, mapX1, mapZ1, mapX2, mapZ2)) &&
           !isTerrainTooSteep(terrain, mapX1, mapZ1, mapX2, mapZ2);
  };

  var branchFromIntersection = function(terrain, roadNetwork, centerMapX, centerMapZ, mapX, mapZ) {
    connectIntersections(terrain, roadNetwork, centerMapX, centerMapZ, mapX, mapZ, mapX - 1, mapZ);
    connectIntersections(terrain, roadNetwork, centerMapX, centerMapZ, mapX, mapZ, mapX, mapZ - 1);
    connectIntersections(terrain, roadNetwork, centerMapX, centerMapZ, mapX, mapZ, mapX + 1, mapZ);
    connectIntersections(terrain, roadNetwork, centerMapX, centerMapZ, mapX, mapZ, mapX, mapZ + 1);
  };

  var connectIntersections = function(terrain, roadNetwork, centerMapX, centerMapZ, mapX, mapZ, targetMapX, targetMapZ) {
    if (shouldConnectIntersections(terrain, centerMapX, centerMapZ, mapX, mapZ, targetMapX, targetMapZ)) {
      if (roadNetwork.hasIntersection(targetMapX, targetMapZ)) {
        roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ);
      }
      else {
        roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ);
        branchFromIntersection(terrain, roadNetwork, centerMapX, centerMapZ, targetMapX, targetMapZ);
      }
    }
  };

  var roadNetworkGenerator = {};

  roadNetworkGenerator.generate = function(terrain, centerMapX, centerMapZ) {
    var roadNetwork = new CityTour.RoadNetwork();
    branchFromIntersection(terrain, roadNetwork, centerMapX, centerMapZ, centerMapX, centerMapZ);

    return roadNetwork;
  };

  return roadNetworkGenerator;
})();

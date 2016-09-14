"use strict";

var CityTour = CityTour || {};

CityTour.RoadIntersection = function(mapX, mapZ) {
  var edges = [];

  var indexOfEdge = function(mapX, mapZ) {
    var i;

    for (i = 0; i < edges.length; i++) {
      if (edges[i][0] === mapX && edges[i][1] === mapZ) {
        return i;
      }
    }

    return -1;
  };

  var roadIntersection = {};

  roadIntersection.addEdge = function(mapX, mapZ) {
    if (indexOfEdge(mapX, mapZ) === -1) {
      edges.push([mapX, mapZ]);
    }
  };

  roadIntersection.removeEdge = function(mapX, mapZ) {
    var index = indexOfEdge(mapX, mapZ);

    if (index !== -1) {
      edges.splice(index, 1);
    }
  };

  roadIntersection.hasPathTo = function(mapX, mapZ) {
    return indexOfEdge(mapX, mapZ) > -1;
  };

  roadIntersection.isEmpty = function() {
    return edges.length === 0;
  };

  return roadIntersection;
};


CityTour.BaseRoadNetwork = function() {
  var network = [];

  var roadNetwork = {};

  roadNetwork.hasIntersection = function(mapX, mapZ) {
    return network[[mapX, mapZ]] != null;
  };

  roadNetwork.setIntersectionAt = function(mapX, mapZ, roadIntersection) {
    network[[mapX, mapZ]] = roadIntersection;
  };

  roadNetwork.intersectionAt = function(mapX, mapZ) {
    return network[[mapX, mapZ]];
  };

  roadNetwork.addEdge = function(mapX1, mapZ1, mapX2, mapZ2) {
    var roadIntersection1, roadIntersection2;

    roadIntersection1 = network[[mapX1, mapZ1]];
    roadIntersection2 = network[[mapX2, mapZ2]];

    if (!roadIntersection1) {
      roadIntersection1 = new CityTour.RoadIntersection(mapX1, mapZ1);
      roadNetwork.setIntersectionAt(mapX1, mapZ1, roadIntersection1);
    }
    if (!roadIntersection2) {
      roadIntersection2 = new CityTour.RoadIntersection(mapX2, mapZ2);
      roadNetwork.setIntersectionAt(mapX2, mapZ2, roadIntersection2);
    }

    roadIntersection1.addEdge(mapX2, mapZ2);
    roadIntersection2.addEdge(mapX1, mapZ1);
  };

  roadNetwork.hasEdgeBetween = function(mapX1, mapZ1, mapX2, mapZ2) {
    var roadIntersection1, roadIntersection2;

    roadIntersection1 = network[[mapX1, mapZ1]];
    roadIntersection2 = network[[mapX2, mapZ2]];

    return roadIntersection1 && roadIntersection2 &&
           roadIntersection1.hasPathTo(mapX2, mapZ2) && roadIntersection2.hasPathTo(mapX1, mapZ1);
  };

  return roadNetwork;
};


CityTour.AdditiveRoadNetwork = function(terrain, minColumn, maxColumn, minRow, maxRow) {
  var baseRoadNetwork = new CityTour.BaseRoadNetwork();

  var init = function() {
    var roadIntersection = new CityTour.RoadIntersection(0, 0);
    baseRoadNetwork.setIntersectionAt(0, 0, roadIntersection);
    branchFromIntersection(0, 0);
  };

  var calculateBlockProbabilityOfBranching = function(mapX, mapZ) {
    var PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS = 0.4;
    
    var distanceToCityEdge = Math.min(CityTour.Config.HALF_BLOCK_COLUMNS, CityTour.Config.HALF_BLOCK_ROWS);
    var distanceFromCenter = Math.sqrt((mapX * mapX) + (mapZ * mapZ));
    var percentageFromCenter = (distanceFromCenter / distanceToCityEdge);
    var normalizedPercentageFromCenter;

    if (percentageFromCenter >= PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS) {
      var safeFromDecayDistance = distanceToCityEdge * PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS;
      normalizedPercentageFromCenter = (distanceFromCenter - safeFromDecayDistance) / (distanceToCityEdge - safeFromDecayDistance);
    }
    else {
      normalizedPercentageFromCenter = 0.0;
    }

    return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
  };

  var branchFromIntersection = function(mapX, mapZ) {
    connectIntersections(mapX, mapZ, mapX - 1, mapZ);
    connectIntersections(mapX, mapZ, mapX, mapZ - 1);
    connectIntersections(mapX, mapZ, mapX + 1, mapZ);
    connectIntersections(mapX, mapZ, mapX, mapZ + 1);
  };

  var isTerrainTooSteep = function(mapX, mapZ, targetMapX, targetMapZ) {
    var MAX_STEEPNESS = Math.PI / 6;

    var heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
    var heightAtPoint2 = terrain.heightAtCoordinates(targetMapX, targetMapZ);
    var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_DEPTH);

    return Math.abs(angle) > MAX_STEEPNESS;
  };

  var connectIntersections = function(mapX, mapZ, targetMapX, targetMapZ) {
    var PROBABILITY = calculateBlockProbabilityOfBranching(mapX, mapZ);
    var random = Math.random();

    if (random < PROBABILITY && !isTerrainTooSteep(mapX, mapZ, targetMapX, targetMapZ)) {
      if (baseRoadNetwork.hasIntersection(targetMapX, targetMapZ)) {
        baseRoadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ);
      }
      else {
        baseRoadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ);
        branchFromIntersection(targetMapX, targetMapZ);
      }
    }
  };

  var additiveRoadNetwork = {};

  additiveRoadNetwork.hasIntersection = baseRoadNetwork.hasIntersection;
  additiveRoadNetwork.intersectionAt = baseRoadNetwork.intersectionAt;
  additiveRoadNetwork.hasEdgeBetween = baseRoadNetwork.hasEdgeBetween;

  init();

  return additiveRoadNetwork;
};

"use strict";

var CityTour = CityTour || {};

CityTour.BaseRoadNetwork = function() {
  var roadIntersection = function(mapX, mapZ) {
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

    roadIntersection.hasEdgeTo = function(mapX, mapZ) {
      return indexOfEdge(mapX, mapZ) > -1;
    };

    return roadIntersection;
  };


  var network = [];

  var roadNetwork = {};

  roadNetwork.hasIntersection = function(mapX, mapZ) {
    return network[[mapX, mapZ]] != null;
  };

  roadNetwork.addEdge = function(mapX1, mapZ1, mapX2, mapZ2) {
    var roadIntersection1 = network[[mapX1, mapZ1]];
    var roadIntersection2 = network[[mapX2, mapZ2]];

    if (!roadIntersection1) {
      roadIntersection1 = new roadIntersection(mapX1, mapZ1);
      network[[mapX1, mapZ2]] = roadIntersection1;
    }
    if (!roadIntersection2) {
      roadIntersection2 = new roadIntersection(mapX2, mapZ2);
      network[[mapX2, mapZ2]] = roadIntersection2;
    }

    roadIntersection1.addEdge(mapX2, mapZ2);
    roadIntersection2.addEdge(mapX1, mapZ1);
  };

  roadNetwork.hasEdgeBetween = function(mapX1, mapZ1, mapX2, mapZ2) {
    var roadIntersection1 = network[[mapX1, mapZ1]];
    var roadIntersection2 = network[[mapX2, mapZ2]];

    return roadIntersection1 && roadIntersection2 &&
           roadIntersection1.hasEdgeTo(mapX2, mapZ2) && roadIntersection2.hasEdgeTo(mapX1, mapZ1);
  };

  return roadNetwork;
};


CityTour.AdditiveRoadNetworkGenerator = function(terrain) {
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

  var isTerrainTooSteep = function(mapX, mapZ, targetMapX, targetMapZ) {
    var MAX_STEEPNESS = Math.PI / 6;

    var heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
    var heightAtPoint2 = terrain.heightAtCoordinates(targetMapX, targetMapZ);
    var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_DEPTH);

    return Math.abs(angle) > MAX_STEEPNESS;
  };

  var branchFromIntersection = function(roadNetwork, mapX, mapZ) {
    connectIntersections(roadNetwork, mapX, mapZ, mapX - 1, mapZ);
    connectIntersections(roadNetwork, mapX, mapZ, mapX, mapZ - 1);
    connectIntersections(roadNetwork, mapX, mapZ, mapX + 1, mapZ);
    connectIntersections(roadNetwork, mapX, mapZ, mapX, mapZ + 1);
  };

  var connectIntersections = function(roadNetwork, mapX, mapZ, targetMapX, targetMapZ) {
    var PROBABILITY = calculateBlockProbabilityOfBranching(mapX, mapZ);
    var random = Math.random();

    if (random < PROBABILITY && !isTerrainTooSteep(mapX, mapZ, targetMapX, targetMapZ)) {
      if (roadNetwork.hasIntersection(targetMapX, targetMapZ)) {
        roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ);
      }
      else {
        roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ);
        branchFromIntersection(roadNetwork, targetMapX, targetMapZ);
      }
    }
  };

  var additiveRoadNetworkGenerator = {};

  additiveRoadNetworkGenerator.generate = function() {
    var roadNetwork = new CityTour.BaseRoadNetwork();
    branchFromIntersection(roadNetwork, 0, 0);

    return roadNetwork;
  };

  return additiveRoadNetworkGenerator;
};

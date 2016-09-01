"use strict";

var RoadIntersection = function(mapX, mapZ) {
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

  return roadIntersection;
};


var RoadNetwork = function(minColumn, maxColumn, minRow, maxRow) {
  var network = [];

  var init = function() {
    var x, z, roadIntersection;

    for (x = minColumn; x <= maxColumn; x++) {
      for (z = minRow; z <= maxRow; z++) {
        roadIntersection = new RoadIntersection(x, z);

        roadIntersection.addEdge(x - 1, z);
        roadIntersection.addEdge(x + 1, z);
        roadIntersection.addEdge(x, z - 1);
        roadIntersection.addEdge(x, z + 1);

        network[[x, z]] = roadIntersection;
      }
    }
  };

  init();

  var roadNetwork = {};

  roadNetwork.intersectionAt = function(mapX, mapZ) {
    return network[[mapX, mapZ]];
  };

  roadNetwork.pruneSteepEdges = function(terrain) {
    var mapX, mapZ;
    var roadIntersection;
    var heightAtPoint1, heightAtPoint2, angle;
    var MAX_STEEPNESS = 0.3587;

    for (mapX = minColumn; mapX <= maxColumn; mapX++) {
      for (mapZ = minRow; mapZ <= maxRow; mapZ++) {
        roadIntersection = network[[mapX, mapZ]];

        heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
        heightAtPoint2 = terrain.heightAtCoordinates(mapX, mapZ - 1);
        angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityConfig.BLOCK_DEPTH);
        if (Math.abs(angle) > MAX_STEEPNESS) {
          roadIntersection.removeEdge(mapX, mapZ - 1);
        }

        heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
        heightAtPoint2 = terrain.heightAtCoordinates(mapX, mapZ + 1);
        angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityConfig.BLOCK_DEPTH);
        if (Math.abs(angle) > MAX_STEEPNESS) {
          roadIntersection.removeEdge(mapX, mapZ + 1);
        }

        heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
        heightAtPoint2 = terrain.heightAtCoordinates(mapX - 1, mapZ);
        angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityConfig.BLOCK_DEPTH);
        if (Math.abs(angle) > MAX_STEEPNESS) {
          roadIntersection.removeEdge(mapX - 1, mapZ);
        }

        heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
        heightAtPoint2 = terrain.heightAtCoordinates(mapX + 1, mapZ);
        angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityConfig.BLOCK_DEPTH);
        if (Math.abs(angle) > MAX_STEEPNESS) {
          roadIntersection.removeEdge(mapX + 1, mapZ);
        }
      }
    }
  };

  return roadNetwork;
};

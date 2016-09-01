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


var RoadNetwork = function(minRow, maxRow, minColumn, maxColumn) {
  var network = [];

  var init = function() {
    var x, z, roadIntersection;

    for (x = minRow; x <= maxRow; x++) {
      for (z = minColumn; z <= maxColumn; z++) {
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

  return roadNetwork;
};

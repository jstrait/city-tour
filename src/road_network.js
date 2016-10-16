"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetwork = function() {
  var Intersection = function(mapX, mapZ) {
    var edges = [];

    var intersection = {};

    intersection.addEdge = function(mapX, mapZ) {
      if (!edges[mapX]) {
        edges[mapX] = [];
      }
      edges[mapX][mapZ] = true;
    };

    intersection.hasEdgeTo = function(mapX, mapZ) {
      return edges[mapX] != undefined && edges[mapX][mapZ] != null;
    };

    return intersection;
  };


  var intersections = [];
  for (var mapX = -CityTour.Config.HALF_TERRAIN_COLUMNS; mapX <= CityTour.Config.HALF_TERRAIN_COLUMNS; mapX++) {
    intersections[mapX] = []; 
  }

  var roadNetwork = {};

  roadNetwork.hasIntersection = function(mapX, mapZ) {
    return (intersections[mapX] && intersections[mapX][mapZ] != null) || false;
  };

  roadNetwork.addEdge = function(mapX1, mapZ1, mapX2, mapZ2) {
    var intersection1 = intersections[mapX1][mapZ1];
    var intersection2 = intersections[mapX2][mapZ2];

    if (!intersection1) {
      intersection1 = new Intersection(mapX1, mapZ1);
      intersections[mapX1][mapZ1] = intersection1;
    }
    if (!intersection2) {
      intersection2 = new Intersection(mapX2, mapZ2);
      intersections[mapX2][mapZ2] = intersection2;
    }

    intersection1.addEdge(mapX2, mapZ2);
    intersection2.addEdge(mapX1, mapZ1);
  };

  roadNetwork.hasEdgeBetween = function(mapX1, mapZ1, mapX2, mapZ2) {
    var intersection1 = intersections[mapX1][mapZ1] || false;
    var intersection2 = intersections[mapX2][mapZ2] || false;

    return intersection1 && intersection2 &&
           intersection1.hasEdgeTo(mapX2, mapZ2) && intersection2.hasEdgeTo(mapX1, mapZ1);
  };

  return roadNetwork;
};

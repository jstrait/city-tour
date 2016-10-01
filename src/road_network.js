"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetwork = function() {
  var roadIntersection = function(mapX, mapZ) {
    var edges = [];

    var roadIntersection = {};

    roadIntersection.addEdge = function(mapX, mapZ) {
      if (!edges[mapX]) {
        edges[mapX] = [];
      }
      edges[mapX][mapZ] = true;
    };

    roadIntersection.hasEdgeTo = function(mapX, mapZ) {
      return edges[mapX] != undefined && edges[mapX][mapZ] != null;
    };

    return roadIntersection;
  };


  var intersections = [];
  for (var mapX = -CityTour.Config.HALF_TERRAIN_COLUMNS; mapX <= CityTour.Config.HALF_TERRAIN_COLUMNS; mapX++) {
    intersections[mapX] = []; 
  }

  var roadNetwork = {};

  roadNetwork.hasIntersection = function(mapX, mapZ) {
    return intersections[mapX][mapZ] != null;
  };

  roadNetwork.addEdge = function(mapX1, mapZ1, mapX2, mapZ2) {
    var roadIntersection1 = intersections[mapX1][mapZ1];
    var roadIntersection2 = intersections[mapX2][mapZ2];

    if (!roadIntersection1) {
      roadIntersection1 = new roadIntersection(mapX1, mapZ1);
      intersections[mapX1][mapZ1] = roadIntersection1;
    }
    if (!roadIntersection2) {
      roadIntersection2 = new roadIntersection(mapX2, mapZ2);
      intersections[mapX2][mapZ2] = roadIntersection2;
    }

    roadIntersection1.addEdge(mapX2, mapZ2);
    roadIntersection2.addEdge(mapX1, mapZ1);
  };

  roadNetwork.hasEdgeBetween = function(mapX1, mapZ1, mapX2, mapZ2) {
    var roadIntersection1 = intersections[mapX1][mapZ1] || false;
    var roadIntersection2 = intersections[mapX2][mapZ2] || false;

    return roadIntersection1 && roadIntersection2 &&
           roadIntersection1.hasEdgeTo(mapX2, mapZ2) && roadIntersection2.hasEdgeTo(mapX1, mapZ1);
  };

  return roadNetwork;
};

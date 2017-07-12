"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetwork = function(terrain) {
  var Intersection = function(mapX, mapZ, height, surfaceType) {
    var edges = [];

    var intersection = {};

    intersection.getHeight = function() { return height; };
    intersection.getSurfaceType = function() { return surfaceType; };

    intersection.addEdge = function(mapX, mapZ, surfaceType) {
      if (!edges[mapX]) {
        edges[mapX] = [];
      }
      edges[mapX][mapZ] = surfaceType;
    };

    intersection.hasEdgeTo = function(mapX, mapZ, surfaceType) {
      var hasEdge = edges[mapX] != undefined && edges[mapX][mapZ] != null;
      if (surfaceType) {
        return hasEdge && edges[mapX][mapZ] === surfaceType;
      }
      else {
        return hasEdge;
      }
    };

    intersection.getEdge = function(mapX, mapZ) {
      var hasEdge = edges[mapX] != undefined && edges[mapX][mapZ] != null;
      if (hasEdge) {
        return edges[mapX][mapZ];
      }
      else {
        return false;
      }
    };

    return intersection;
  };


  var minColumn = 0, maxColumn = 0, minRow = 0, maxRow = 0;
  var intersections = [];
  for (var mapX = -CityTour.Config.HALF_TERRAIN_COLUMNS; mapX <= CityTour.Config.HALF_TERRAIN_COLUMNS; mapX++) {
    intersections[mapX] = [];
  }

  var roadNetwork = {};

  roadNetwork.hasIntersection = function(mapX, mapZ) {
    return (intersections[mapX] && intersections[mapX][mapZ] != null) || false;
  };

  roadNetwork.getIntersectionHeight = function(mapX, mapZ) {
    if (roadNetwork.hasIntersection(mapX, mapZ)) {
      return intersections[mapX][mapZ].getHeight();
    }
    else {
      return false;
    }
  };

  roadNetwork.getIntersectionSurfaceType = function(mapX, mapZ) {
    if (roadNetwork.hasIntersection(mapX, mapZ)) {
      return intersections[mapX][mapZ].getSurfaceType();
    }
    else {
      return false;
    }
  };

  roadNetwork.addEdge = function(mapX1, mapZ1, mapX2, mapZ2, nonTerrainHeight, surfaceType) {
    var intersection1 = intersections[mapX1][mapZ1];
    var intersection2 = intersections[mapX2][mapZ2];
    var intersectionHeight, intersectionSurfaceType;

    if (!intersection1) {
      intersectionHeight = (terrain.materialAtCoordinates(mapX1, mapZ1) === CityTour.Terrain.LAND) ? terrain.heightAtCoordinates(mapX1, mapZ1) : nonTerrainHeight;
      intersectionSurfaceType = (terrain.materialAtCoordinates(mapX1, mapZ1) === CityTour.Terrain.LAND) ? CityTour.RoadNetwork.TERRAIN_SURFACE : CityTour.RoadNetwork.BRIDGE_SURFACE;
      intersection1 = new Intersection(mapX1, mapZ1, intersectionHeight, intersectionSurfaceType);
      intersections[mapX1][mapZ1] = intersection1;
    }

    if (!intersection2) {
      intersectionHeight = (terrain.materialAtCoordinates(mapX2, mapZ2) === CityTour.Terrain.LAND) ? terrain.heightAtCoordinates(mapX2, mapZ2) : nonTerrainHeight;
      intersectionSurfaceType = (terrain.materialAtCoordinates(mapX2, mapZ2) === CityTour.Terrain.LAND) ? CityTour.RoadNetwork.TERRAIN_SURFACE : CityTour.RoadNetwork.BRIDGE_SURFACE;
      intersection2 = new Intersection(mapX2, mapZ2, intersectionHeight, intersectionSurfaceType);
      intersections[mapX2][mapZ2] = intersection2;
    }

    intersection1.addEdge(mapX2, mapZ2, surfaceType);
    intersection2.addEdge(mapX1, mapZ1, surfaceType);

    minColumn = Math.min(minColumn, mapX1, mapX2);
    maxColumn = Math.max(maxColumn, mapX1, mapX2);
    minRow = Math.min(minRow, mapZ1, mapZ2);
    maxRow = Math.max(maxRow, mapZ1, mapZ2);
  };

  roadNetwork.hasEdgeBetween = function(mapX1, mapZ1, mapX2, mapZ2, surfaceType) {
    var intersection1 = intersections[mapX1][mapZ1] || false;
    var intersection2 = intersections[mapX2][mapZ2] || false;

    return intersection1 && intersection2 &&
           intersection1.hasEdgeTo(mapX2, mapZ2, surfaceType) && intersection2.hasEdgeTo(mapX1, mapZ1, surfaceType);
  };

  roadNetwork.edgeBetween = function(mapX1, mapZ1, mapX2, mapZ2) {
    var intersection1 = intersections[mapX1][mapZ1] || false;

    return intersection1.getEdge(mapX2, mapZ2);
  };

  roadNetwork.minColumn = function() { return minColumn; }
  roadNetwork.maxColumn = function() { return maxColumn; }
  roadNetwork.minRow = function() { return minRow; }
  roadNetwork.maxRow = function() { return maxRow; }

  return roadNetwork;
};

CityTour.RoadNetwork.TERRAIN_SURFACE = 'terrain';
CityTour.RoadNetwork.BRIDGE_SURFACE = 'bridge';

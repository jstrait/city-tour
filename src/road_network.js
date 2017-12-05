"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetwork = function(terrain) {
  var Intersection = function(mapX, mapZ, height, surfaceType) {
    var edges = [];

    var addEdge = function(mapX, mapZ, surfaceType) {
      if (!edges[mapX]) {
        edges[mapX] = [];
      }
      edges[mapX][mapZ] = surfaceType;
    };

    var hasEdgeTo = function(mapX, mapZ, surfaceType) {
      var hasEdge = edges[mapX] !== undefined && edges[mapX][mapZ] !== undefined;
      if (surfaceType) {
        return hasEdge && edges[mapX][mapZ] === surfaceType;
      }
      else {
        return hasEdge;
      }
    };

    var getEdge = function(mapX, mapZ) {
      var hasEdge = edges[mapX] !== undefined && edges[mapX][mapZ] !== undefined;
      if (hasEdge) {
        return edges[mapX][mapZ];
      }
      else {
        return false;
      }
    };

    return {
      getHeight: function() { return height; },
      getSurfaceType: function() { return surfaceType; },
      addEdge: addEdge,
      hasEdgeTo: hasEdgeTo,
      getEdge: getEdge,
    };
  };


  var minColumn = Number.POSITIVE_INFINITY, maxColumn = Number.NEGATIVE_INFINITY, minRow = Number.POSITIVE_INFINITY, maxRow = Number.NEGATIVE_INFINITY;
  var intersections = [];
  for (var mapX = terrain.minColumn(); mapX <= terrain.maxColumn(); mapX++) {
    intersections[mapX] = [];
  }


  var hasIntersection = function(mapX, mapZ) {
    return (intersections[mapX] !== undefined && intersections[mapX][mapZ] !== undefined) || false;
  };

  var getIntersectionHeight = function(mapX, mapZ) {
    if (hasIntersection(mapX, mapZ)) {
      return intersections[mapX][mapZ].getHeight();
    }
    else {
      return undefined;
    }
  };

  var getRoadHeight = function(mapX, mapZ) {
    var xIsExact = Math.floor(mapX) === mapX;
    var zIsExact = Math.floor(mapZ) === mapZ;
    var floor, ceil;
    var heightDifferential, percentage;

    if (xIsExact && zIsExact) {
      return getIntersectionHeight(mapX, mapZ);
    }
    else if (xIsExact) {
      ceil = getIntersectionHeight(mapX, Math.ceil(mapZ));
      floor = getIntersectionHeight(mapX, Math.floor(mapZ));

      if (ceil !== undefined && floor !== undefined) {
        return CityTour.Math.lerp(floor, ceil, mapZ - Math.floor(mapZ));
      }
      else {
        return undefined;
      }
    }
    else if (zIsExact) {
      ceil = getIntersectionHeight(Math.ceil(mapX), mapZ);
      floor = getIntersectionHeight(Math.floor(mapX), mapZ);

      if (ceil !== undefined && floor !== undefined) {
        return CityTour.Math.lerp(floor, ceil, mapX - Math.floor(mapX));
      }
      else {
        return undefined;
      }
    }

    return undefined;
  };

  var getIntersectionSurfaceType = function(mapX, mapZ) {
    if (hasIntersection(mapX, mapZ)) {
      return intersections[mapX][mapZ].getSurfaceType();
    }
    else {
      return false;
    }
  };

  var addEdge = function(mapX1, mapZ1, mapX2, mapZ2, nonTerrainHeight, surfaceType) {
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

  var hasEdgeBetween = function(mapX1, mapZ1, mapX2, mapZ2, surfaceType) {
    var intersection1, intersection2;

    if (mapX1 < terrain.minColumn() || mapX1 > terrain.maxColumn() || mapX2 < terrain.minColumn() || mapX2 > terrain.maxColumn()) {
      return false;
    }

    var intersection1 = intersections[mapX1][mapZ1] || false;
    var intersection2 = intersections[mapX2][mapZ2] || false;

    return intersection1 && intersection2 &&
           intersection1.hasEdgeTo(mapX2, mapZ2, surfaceType) && intersection2.hasEdgeTo(mapX1, mapZ1, surfaceType);
  };

  var edgeBetween = function(mapX1, mapZ1, mapX2, mapZ2) {
    var intersection1 = intersections[mapX1][mapZ1] || false;

    return intersection1.getEdge(mapX2, mapZ2);
  };


  return {
    hasIntersection: hasIntersection,
    getRoadHeight: getRoadHeight,
    getIntersectionSurfaceType: getIntersectionSurfaceType,
    addEdge: addEdge,
    hasEdgeBetween: hasEdgeBetween,
    edgeBetween: edgeBetween,
    minColumn: function() { return minColumn; },
    maxColumn: function() { return maxColumn; },
    minRow: function() { return minRow; },
    maxRow: function() { return maxRow; },
  };
};

CityTour.RoadNetwork.TERRAIN_SURFACE = 'terrain';
CityTour.RoadNetwork.BRIDGE_SURFACE = 'bridge';

"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetwork = function(terrain) {
  var Intersection = function(mapX, mapZ, height, surfaceType) {
    var edges = [];
    var edgeCount = 0;

    var addEdge = function(destinationMapX, destinationMapZ, surfaceType) {
      if (!edges[destinationMapX]) {
        edges[destinationMapX] = [];
      }
      if (edges[destinationMapX][destinationMapZ] === undefined) {
        edgeCount += 1;
      }
      edges[destinationMapX][destinationMapZ] = surfaceType;
    };

    var removeEdge = function(mapX, mapZ) {
      if (edges[mapX]) {
        // Splice doesn't work here, since array indices can be negative
        edges[mapX][mapZ] = undefined;
        edgeCount -= 1;
      }
    };

    var hasEdgeTo = function(destinationMapX, destinationMapZ, surfaceType) {
      var hasEdge = edges[destinationMapX] !== undefined && edges[destinationMapX][destinationMapZ] !== undefined;
      if (surfaceType) {
        return hasEdge && edges[destinationMapX][destinationMapZ] === surfaceType;
      }
      else {
        return hasEdge;
      }
    };

    var getEdge = function(destinationMapX, destinationMapZ) {
      var edge = undefined;

      if (edges[destinationMapX] !== undefined) {
        edge = edges[destinationMapX][destinationMapZ];
      }

      return edge;
    };

    return {
      getHeight: function() { return height; },
      getSurfaceType: function() { return surfaceType; },
      addEdge: addEdge,
      removeEdge: removeEdge,
      hasEdgeTo: hasEdgeTo,
      getEdge: getEdge,
      edgeCount: function() { return edgeCount; },
    };
  };


  var minColumn = Number.POSITIVE_INFINITY, maxColumn = Number.NEGATIVE_INFINITY, minRow = Number.POSITIVE_INFINITY, maxRow = Number.NEGATIVE_INFINITY;
  var intersections = [];
  for (var mapX = terrain.minColumn(); mapX <= terrain.maxColumn(); mapX++) {
    intersections[mapX] = [];
  }


  var hasIntersection = function(mapX, mapZ) {
    return intersections[mapX] !== undefined && intersections[mapX][mapZ] !== undefined;
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

  var removeEdge = function(mapX1, mapZ1, mapX2, mapZ2) {
    var intersection1 = (intersections[mapX1] === undefined) ? undefined : intersections[mapX1][mapZ1];
    var intersection2 = (intersections[mapX2] === undefined) ? undefined : intersections[mapX2][mapZ2];

    if (intersection1) {
      intersection1.removeEdge(mapX2, mapZ2);
      if (intersection1.edgeCount() === 0) {
        intersections[mapX1][mapZ1] = undefined;
      }
    }
    if (intersection2) {
      intersection2.removeEdge(mapX1, mapZ1);
      if (intersection2.edgeCount() === 0) {
        intersections[mapX2][mapZ2] = undefined;
      }
    }
  };

  var hasEdgeBetween = function(mapX1, mapZ1, mapX2, mapZ2, surfaceType) {
    var intersection1 = (intersections[mapX1] === undefined) ? undefined : intersections[mapX1][mapZ1];
    var intersection2 = (intersections[mapX2] === undefined) ? undefined : intersections[mapX2][mapZ2];

    return intersection1 !== undefined &&
           intersection2 !== undefined &&
           intersection1.hasEdgeTo(mapX2, mapZ2, surfaceType) && intersection2.hasEdgeTo(mapX1, mapZ1, surfaceType);
  };

  var edgeBetween = function(mapX1, mapZ1, mapX2, mapZ2) {
    var intersection1 = (intersections[mapX1] === undefined) ? undefined : intersections[mapX1][mapZ1];

    return (intersection1 === undefined) ? undefined : intersection1.getEdge(mapX2, mapZ2);
  };


  return {
    hasIntersection: hasIntersection,
    getRoadHeight: getRoadHeight,
    getIntersectionSurfaceType: getIntersectionSurfaceType,
    addEdge: addEdge,
    removeEdge: removeEdge,
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

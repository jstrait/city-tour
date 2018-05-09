"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetwork = function(terrain) {
  var Intersection = function(mapX, mapZ, height, surfaceType) {
    var edges = [];

    var addEdge = function(destinationMapX, destinationMapZ, distance, surfaceType) {
      var i;

      for(i = 0; i < edges.length; i++) {
        if (edges[i].destinationMapX === destinationMapX && edges[i].destinationMapZ === destinationMapZ) {
          edges[i].edge = { distance: distance, surfaceType: surfaceType };
          return;
        }
      }

      edges.push({ destinationMapX: destinationMapX, destinationMapZ: destinationMapZ, edge: { distance: distance, surfaceType: surfaceType }});
    };

    var removeEdge = function(mapX, mapZ) {
      var i, indexToRemove;

      for (i = 0; i < edges.length; i++) {
        if (edges[i].destinationMapX === mapX && edges[i].destinationMapZ == mapZ) {
          indexToRemove = i;
        }
      }

      if (indexToRemove !== undefined) {
        edges.splice(indexToRemove, 1);
      }
    };

    var hasEdgeTo = function(destinationMapX, destinationMapZ, surfaceType) {
      var i;

      for (i = 0; i < edges.length; i++) {
        if (edges[i].destinationMapX === destinationMapX && edges[i].destinationMapZ === destinationMapZ) {
          if (surfaceType) {
            return edges[i].edge.surfaceType === surfaceType;
          }
          else {
            return true;
          }
        }
      }

      return false;
    };

    var getEdge = function(destinationMapX, destinationMapZ) {
      var i;

      for (i = 0; i < edges.length; i++) {
        if (edges[i].destinationMapX === destinationMapX && edges[i].destinationMapZ === destinationMapZ) {
          return edges[i].edge;
        }
      }

      return undefined;
    };

    return {
      getHeight: function() { return height; },
      getSurfaceType: function() { return surfaceType; },
      addEdge: addEdge,
      removeEdge: removeEdge,
      hasEdgeTo: hasEdgeTo,
      getEdge: getEdge,
      edgeCount: function() { return edges.length; },
    };
  };


  var minColumn = Number.POSITIVE_INFINITY, maxColumn = Number.NEGATIVE_INFINITY, minRow = Number.POSITIVE_INFINITY, maxRow = Number.NEGATIVE_INFINITY;
  var intersections = [];
  for (var mapX = Math.ceil(terrain.minMapX()); mapX <= Math.floor(terrain.maxMapX()); mapX++) {
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
      intersectionHeight = (terrain.waterHeightAtCoordinates(mapX1, mapZ1) === 0.0) ? terrain.heightAtCoordinates(mapX1, mapZ1) : nonTerrainHeight;
      intersectionSurfaceType = (terrain.waterHeightAtCoordinates(mapX1, mapZ1) === 0.0) ? CityTour.RoadNetwork.TERRAIN_SURFACE : CityTour.RoadNetwork.BRIDGE_SURFACE;
      intersection1 = new Intersection(mapX1, mapZ1, intersectionHeight, intersectionSurfaceType);
      intersections[mapX1][mapZ1] = intersection1;
    }

    if (!intersection2) {
      intersectionHeight = (terrain.waterHeightAtCoordinates(mapX2, mapZ2) === 0.0) ? terrain.heightAtCoordinates(mapX2, mapZ2) : nonTerrainHeight;
      intersectionSurfaceType = (terrain.waterHeightAtCoordinates(mapX2, mapZ2) === 0.0) ? CityTour.RoadNetwork.TERRAIN_SURFACE : CityTour.RoadNetwork.BRIDGE_SURFACE;
      intersection2 = new Intersection(mapX2, mapZ2, intersectionHeight, intersectionSurfaceType);
      intersections[mapX2][mapZ2] = intersection2;
    }

    intersection1.addEdge(mapX2, mapZ2, 1.0, surfaceType);
    intersection2.addEdge(mapX1, mapZ1, 1.0, surfaceType);

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

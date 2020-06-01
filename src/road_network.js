"use strict";

import { CityTourMath } from "./math";
import { Config } from "./config";

var RoadNetwork = function(terrain) {
  var Intersection = function(x, z, height, surfaceType) {
    var edges = [];

    var addEdge = function(destinationX, destinationZ, edge) {
      var i;

      for(i = 0; i < edges.length; i++) {
        if (edges[i].destinationX === destinationX && edges[i].destinationZ === destinationZ) {
          edges[i].edge = edge;
          return;
        }
      }

      edges.push({ destinationX: destinationX, destinationZ: destinationZ, edge: edge});
    };

    var removeEdge = function(x, z) {
      var i, indexToRemove;

      for (i = 0; i < edges.length; i++) {
        if (edges[i].destinationX === x && edges[i].destinationZ == z) {
          indexToRemove = i;
        }
      }

      if (indexToRemove !== undefined) {
        edges.splice(indexToRemove, 1);
      }
    };

    var hasEdgeTo = function(destinationX, destinationZ, surfaceType) {
      var i;

      for (i = 0; i < edges.length; i++) {
        if (edges[i].destinationX === destinationX && edges[i].destinationZ === destinationZ) {
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

    var getEdge = function(destinationX, destinationZ) {
      var i;

      for (i = 0; i < edges.length; i++) {
        if (edges[i].destinationX === destinationX && edges[i].destinationZ === destinationZ) {
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
      edgesFrom: function() { return edges; },
      edgeCount: function() { return edges.length; },
    };
  };


  var minColumn = Number.POSITIVE_INFINITY, maxColumn = Number.NEGATIVE_INFINITY, minRow = Number.POSITIVE_INFINITY, maxRow = Number.NEGATIVE_INFINITY;

  // Don't allow roads on the terrain edges
  var minAllowedX = terrain.minX() + 1;
  var maxAllowedX = terrain.maxX() - 1;
  var minAllowedZ = terrain.minZ() + 1;
  var maxAllowedZ = terrain.maxZ() - 1;

  var intersections = [];
  for (var x = Math.ceil(terrain.minX()); x <= Math.floor(terrain.maxX()); x++) {
    intersections[x] = [];
  }


  var hasIntersection = function(x, z) {
    return intersections[x] !== undefined && intersections[x][z] !== undefined;
  };

  var getIntersectionHeight = function(x, z) {
    if (hasIntersection(x, z)) {
      return intersections[x][z].getHeight();
    }
    else {
      return undefined;
    }
  };

  var getRoadHeight = function(x, z) {
    var xIsExact = Math.floor(x) === x;
    var zIsExact = Math.floor(z) === z;
    var floor, ceil;
    var xEdge;
    var zEdge;

    if (xIsExact && zIsExact) {
      return getIntersectionHeight(x, z);
    }
    else if (xIsExact) {
      ceil = getIntersectionHeight(x, Math.ceil(z));
      floor = getIntersectionHeight(x, Math.floor(z));

      if (ceil !== undefined && floor !== undefined) {
        zEdge = z - Math.floor(z);

        if (zEdge <= Config.HALF_STREET_DEPTH) {
          return floor;
        }
        else if (zEdge >= (1.0 - Config.HALF_STREET_DEPTH)) {
          return ceil;
        }

        return CityTourMath.lerp(floor, ceil, (zEdge - Config.HALF_STREET_DEPTH) / (1.0 - Config.STREET_DEPTH));
      }
      else {
        return undefined;
      }
    }
    else if (zIsExact) {
      ceil = getIntersectionHeight(Math.ceil(x), z);
      floor = getIntersectionHeight(Math.floor(x), z);

      if (ceil !== undefined && floor !== undefined) {
        xEdge = x - Math.floor(x);

        if (xEdge <= Config.HALF_STREET_WIDTH) {
          return floor;
        }
        else if (xEdge >= (1.0 - Config.HALF_STREET_WIDTH)) {
          return ceil;
        }

        return CityTourMath.lerp(floor, ceil, (xEdge - Config.HALF_STREET_WIDTH) / (1.0 - Config.STREET_WIDTH));
      }
      else {
        return undefined;
      }
    }

    return undefined;
  };

  var getIntersectionSurfaceType = function(x, z) {
    if (hasIntersection(x, z)) {
      return intersections[x][z].getSurfaceType();
    }
    else {
      return false;
    }
  };

  var addEdge = function(x1, z1, x2, z2, nonTerrainHeight, distance, surfaceType) {
    var intersection1 = intersections[x1][z1];
    var intersection2 = intersections[x2][z2];
    var intersectionHeight, intersectionSurfaceType;
    var edge = { distance: distance, surfaceType: surfaceType };

    if (x1 < minAllowedX || x1 > maxAllowedX || z1 < minAllowedZ || z1 > maxAllowedZ) {
      throw new Error(`Road coordinates are out of allowed bounds: {${x1}, ${z1}}`);
    }
    if (x2 < minAllowedX || x2 > maxAllowedX || z2 < minAllowedZ || z2 > maxAllowedZ) {
      throw new Error(`Road coordinates are out of allowed bounds: {${x2}, ${z2}}`);
    }

    if (intersection1 === undefined) {
      intersectionHeight = (terrain.waterHeightAt(x1, z1) === 0.0) ? terrain.heightAt(x1, z1) : nonTerrainHeight;
      intersectionSurfaceType = (terrain.waterHeightAt(x1, z1) === 0.0) ? RoadNetwork.TERRAIN_SURFACE : RoadNetwork.BRIDGE_SURFACE;
      intersection1 = Intersection(x1, z1, intersectionHeight, intersectionSurfaceType);
      intersections[x1][z1] = intersection1;
    }

    if (intersection2 === undefined) {
      intersectionHeight = (terrain.waterHeightAt(x2, z2) === 0.0) ? terrain.heightAt(x2, z2) : nonTerrainHeight;
      intersectionSurfaceType = (terrain.waterHeightAt(x2, z2) === 0.0) ? RoadNetwork.TERRAIN_SURFACE : RoadNetwork.BRIDGE_SURFACE;
      intersection2 = Intersection(x2, z2, intersectionHeight, intersectionSurfaceType);
      intersections[x2][z2] = intersection2;
    }

    intersection1.addEdge(x2, z2, edge);
    intersection2.addEdge(x1, z1, edge);

    minColumn = Math.min(minColumn, x1, x2);
    maxColumn = Math.max(maxColumn, x1, x2);
    minRow = Math.min(minRow, z1, z2);
    maxRow = Math.max(maxRow, z1, z2);
  };

  var removeEdge = function(x1, z1, x2, z2) {
    var intersection1 = (intersections[x1] === undefined) ? undefined : intersections[x1][z1];
    var intersection2 = (intersections[x2] === undefined) ? undefined : intersections[x2][z2];

    if (intersection1 !== undefined) {
      intersection1.removeEdge(x2, z2);
      if (intersection1.edgeCount() === 0) {
        intersections[x1][z1] = undefined;
      }
    }
    if (intersection2 !== undefined) {
      intersection2.removeEdge(x1, z1);
      if (intersection2.edgeCount() === 0) {
        intersections[x2][z2] = undefined;
      }
    }
  };

  var hasEdgeBetween = function(x1, z1, x2, z2, surfaceType) {
    var intersection1 = (intersections[x1] === undefined) ? undefined : intersections[x1][z1];
    var intersection2 = (intersections[x2] === undefined) ? undefined : intersections[x2][z2];

    return intersection1 !== undefined &&
           intersection2 !== undefined &&
           intersection1.hasEdgeTo(x2, z2, surfaceType) && intersection2.hasEdgeTo(x1, z1, surfaceType);
  };

  var edgeBetween = function(x1, z1, x2, z2) {
    var intersection1 = (intersections[x1] === undefined) ? undefined : intersections[x1][z1];

    return (intersection1 === undefined) ? undefined : intersection1.getEdge(x2, z2);
  };

  var edgesFrom = function(x, z) {
    var intersection = (intersections[x] === undefined) ? undefined : intersections[x][z];

    return (intersection === undefined) ? undefined : intersection.edgesFrom();
  };

  var isPointInAllowedBounds = function(x, z) {
    return x >= minAllowedX && x <= maxAllowedX && z >= minAllowedZ && z <= maxAllowedZ;
  };


  return {
    hasIntersection: hasIntersection,
    getRoadHeight: getRoadHeight,
    getIntersectionSurfaceType: getIntersectionSurfaceType,
    addEdge: addEdge,
    removeEdge: removeEdge,
    hasEdgeBetween: hasEdgeBetween,
    edgeBetween: edgeBetween,
    edgesFrom: edgesFrom,
    minColumn: function() { return minColumn; },
    maxColumn: function() { return maxColumn; },
    minRow: function() { return minRow; },
    maxRow: function() { return maxRow; },
    minAllowedX: function() { return minAllowedX; },
    maxAllowedX: function() { return maxAllowedX; },
    minAllowedZ: function() { return minAllowedZ; },
    maxAllowedZ: function() { return maxAllowedZ; },
    isPointInAllowedBounds: isPointInAllowedBounds,
  };
};

RoadNetwork.TERRAIN_SURFACE = "terrain";
RoadNetwork.BRIDGE_SURFACE = "bridge";

export { RoadNetwork };

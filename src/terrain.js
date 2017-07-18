"use strict";

var CityTour = CityTour || {};

CityTour.Terrain = function(coordinates, subDivisions) {
  var xStep = 1 / subDivisions;
  var zStep = 1 / subDivisions;

  var interpolateHeight = function(point, floor, ceiling) {
    var heightDifferential = ceiling - floor;
    var percentage = point - Math.floor(point);
    return floor + (heightDifferential * percentage);
  };

  var terrain = {};

  terrain.subDivisions = function() { return subDivisions; };

  terrain.materialAtCoordinates = function(x, z) {
    return coordinates[x][z].material;
  };

  terrain.heightAtCoordinates = function(x, z) {
    var leftHeight, rightHeight, topHeight, bottomHeight;
    var topRowInterpolatedHeight, bottomRowInterpolatedHeight;

    var xIntegerCoordinate = x / xStep;
    var zIntegerCoordinate = z / zStep;
    var xIsExact = Math.floor(xIntegerCoordinate) === xIntegerCoordinate;
    var zIsExact = Math.floor(zIntegerCoordinate) === zIntegerCoordinate;

    if (xIsExact && zIsExact) {
      return coordinates[x][z].height;
    }

    if (!xIsExact && zIsExact) {
      leftHeight = coordinates[Math.floor(x)][z].height;
      rightHeight = coordinates[Math.ceil(x)][z].height;

      return interpolateHeight(x, leftHeight, rightHeight);
    }
    else if (xIsExact && !zIsExact) {
      topHeight = coordinates[x][Math.floor(z)].height;
      bottomHeight = coordinates[x][Math.ceil(z)].height;

      return interpolateHeight(z, topHeight, bottomHeight);
    }
    else {
      leftHeight = coordinates[Math.floor(x)][Math.floor(z)].height;
      rightHeight = coordinates[Math.ceil(x)][Math.floor(z)].height;
      topRowInterpolatedHeight = interpolateHeight(x, leftHeight, rightHeight);

      leftHeight = coordinates[Math.floor(x)][Math.ceil(z)].height;
      rightHeight = coordinates[Math.ceil(x)][Math.ceil(z)].height;
      bottomRowInterpolatedHeight = interpolateHeight(x, leftHeight, rightHeight);

      return interpolateHeight(z, topRowInterpolatedHeight, bottomRowInterpolatedHeight);
    }
  };

  return terrain;
};

CityTour.Terrain.LAND = 'land';
CityTour.Terrain.WATER = 'water';

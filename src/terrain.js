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

  var materialAtCoordinates = function(x, z) {
    return (coordinates[x][z].waterHeight > 0.0) ? CityTour.Terrain.WATER : CityTour.Terrain.LAND;
  };

  var componentHeightAtCoordinates = function(x, z, component) {
    var leftHeight, rightHeight, topHeight, bottomHeight;
    var topRowInterpolatedHeight, bottomRowInterpolatedHeight;

    var xIntegerCoordinate = x / xStep;
    var zIntegerCoordinate = z / zStep;
    var xIsExact = Math.floor(xIntegerCoordinate) === xIntegerCoordinate;
    var zIsExact = Math.floor(zIntegerCoordinate) === zIntegerCoordinate;

    if((coordinates[Math.ceil(x)] === undefined) || (coordinates[Math.ceil(x)][Math.ceil(z)] === undefined) ||
       (coordinates[Math.floor(x)] === undefined) || (coordinates[Math.floor(x)][Math.floor(z)] === undefined)) {
      return undefined;
    }

    if (xIsExact && zIsExact) {
      return coordinates[x][z][component];
    }

    if (!xIsExact && zIsExact) {
      leftHeight = coordinates[Math.floor(x)][z][component];
      rightHeight = coordinates[Math.ceil(x)][z][component];

      return interpolateHeight(x, leftHeight, rightHeight);
    }
    else if (xIsExact && !zIsExact) {
      topHeight = coordinates[x][Math.floor(z)][component];
      bottomHeight = coordinates[x][Math.ceil(z)][component];

      return interpolateHeight(z, topHeight, bottomHeight);
    }
    else {
      leftHeight = coordinates[Math.floor(x)][Math.floor(z)][component];
      rightHeight = coordinates[Math.ceil(x)][Math.floor(z)][component];
      topRowInterpolatedHeight = interpolateHeight(x, leftHeight, rightHeight);

      leftHeight = coordinates[Math.floor(x)][Math.ceil(z)][component];
      rightHeight = coordinates[Math.ceil(x)][Math.ceil(z)][component];
      bottomRowInterpolatedHeight = interpolateHeight(x, leftHeight, rightHeight);

      return interpolateHeight(z, topRowInterpolatedHeight, bottomRowInterpolatedHeight);
    }
  };

  var heightAtCoordinates = function(x, z) {
    var landHeight = componentHeightAtCoordinates(x, z, "height");
    if (landHeight === undefined) {
      return undefined;
    }

    return landHeight + componentHeightAtCoordinates(x, z, "waterHeight");
  };


  return {
    subDivisions: function() { return subDivisions; },
    materialAtCoordinates: materialAtCoordinates,
    heightAtCoordinates: heightAtCoordinates,
  };
};

CityTour.Terrain.LAND = 'land';
CityTour.Terrain.WATER = 'water';

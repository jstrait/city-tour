"use strict";

var CityTour = CityTour || {};

CityTour.Terrain = function(coordinates) {
  var interpolateHeight = function(point, floor, ceiling) {
    var heightDifferential = ceiling - floor;
    var percentage = point - Math.floor(point);
    return floor + (heightDifferential * percentage);
  };

  var terrain = {};

  terrain.materialAtCoordinates = function(x, z) {
    return coordinates[x][z].material;
  }

  terrain.heightAtCoordinates = function(x, z) {
    var xIsWhole = (Math.floor(x) === x);
    var zIsWhole = (Math.floor(z) === z);
    var leftHeight, rightHeight, topHeight, bottomHeight;
    var topRowInterpolatedHeight, bottomRowInterpolatedHeight;

    if (xIsWhole && zIsWhole) {
      return coordinates[x][z].height;
    }

    if (!xIsWhole && zIsWhole) {
      leftHeight = coordinates[Math.floor(x)][z].height;
      rightHeight = coordinates[Math.ceil(x)][z].height;

      return interpolateHeight(x, leftHeight, rightHeight);
    }
    else if (xIsWhole && !zIsWhole) {
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

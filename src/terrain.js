"use strict";

var Terrain = function(coordinates) {
  var interpolateHeight = function(point, floor, ceiling) {
    var heightDifferential = ceiling - floor;
    var percentage = point - Math.floor(point);
    return floor + (heightDifferential * percentage);
  };

  var terrain = {};

  terrain.heightAtCoordinates = function(x, z) {
    var xIsWhole = (Math.floor(x) === x);
    var zIsWhole = (Math.floor(z) === z);

    if (xIsWhole && zIsWhole) {
      return coordinates[x][z];
    }

    if (!xIsWhole && zIsWhole) {
      var leftHeight = coordinates[Math.floor(x)][z];
      var rightHeight = coordinates[Math.ceil(x)][z];

      return interpolateHeight(x, leftHeight, rightHeight);
    }
    else if (xIsWhole && !zIsWhole) {
      var topHeight = coordinates[x][Math.floor(z)];
      var bottomHeight = coordinates[x][Math.ceil(z)];

      return interpolateHeight(z, topHeight, bottomHeight);
    }
    else {
      var leftHeight = coordinates[Math.floor(x)][Math.floor(z)];
      var rightHeight = coordinates[Math.ceil(x)][Math.floor(z)];

      var foo = interpolateHeight(x, leftHeight, rightHeight);

      leftHeight = coordinates[Math.floor(x)][Math.ceil(z)];
      rightHeight = coordinates[Math.ceil(x)][Math.ceil(z)];

      var bar = interpolateHeight(x, leftHeight, rightHeight);

      return interpolateHeight(z, foo, bar);
    }
  };

  return terrain;
};

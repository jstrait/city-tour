"use strict";

var CityTour = CityTour || {};

CityTour.Terrain = function(coordinates, scale) {
  var subDivisions = 1 / scale;
  var columnCount = coordinates.length;
  var rowCount = coordinates[0].length;
  var maxMapX = (columnCount - 1) * 0.5 * scale;
  var minMapX = -maxMapX;
  var maxMapZ = (rowCount - 1) * 0.5 * scale;
  var minMapZ = -maxMapZ;

  var mapXToNormalizedX = function(mapX) {
    return (mapX + maxMapX) * subDivisions;
  };

  var mapZToNormalizedZ = function(mapZ) {
    return (mapZ + maxMapZ) * subDivisions;
  };

  var interpolateHeight = function(point, floor, ceiling) {
    return CityTour.Math.lerp(floor, ceiling, point - Math.floor(point));
  };

  var componentHeightAtCoordinates = function(x, z, component) {
    var leftHeight, rightHeight, topHeight, bottomHeight;
    var topRowInterpolatedHeight, bottomRowInterpolatedHeight;

    var xIntegerCoordinate = x / scale;
    var zIntegerCoordinate = z / scale;
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

  var landHeightAtCoordinates = function(mapX, mapZ) {
    return componentHeightAtCoordinates(mapXToNormalizedX(mapX), mapZToNormalizedZ(mapZ), "landHeight");
  };

  var waterHeightAtCoordinates = function(mapX, mapZ) {
    return componentHeightAtCoordinates(mapXToNormalizedX(mapX), mapZToNormalizedZ(mapZ), "waterHeight");
  };

  var heightAtCoordinates = function(mapX, mapZ) {
    var normalizedX = mapXToNormalizedX(mapX);
    var normalizedZ = mapZToNormalizedZ(mapZ);

    var landHeight = componentHeightAtCoordinates(normalizedX, normalizedZ, "landHeight");
    if (landHeight === undefined) {
      return undefined;
    }

    return landHeight + componentHeightAtCoordinates(normalizedX, normalizedZ, "waterHeight");
  };


  return {
    scale: function() { return scale; },
    minMapX: function() { return minMapX; },
    maxMapX: function() { return maxMapX; },
    minMapZ: function() { return minMapZ; },
    maxMapZ: function() { return maxMapZ; },
    landHeightAtCoordinates: landHeightAtCoordinates,
    waterHeightAtCoordinates: waterHeightAtCoordinates,
    heightAtCoordinates: heightAtCoordinates,
  };
};

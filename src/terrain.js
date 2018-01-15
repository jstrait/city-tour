"use strict";

var CityTour = CityTour || {};

CityTour.Terrain = function(coordinates, subDivisions) {
  var scale = 1 / subDivisions;
  var columnCount = coordinates.length;
  var rowCount = coordinates[0].length;
  var columnIndexOffset = Math.floor(columnCount / 2 / subDivisions);
  var rowIndexOffset = Math.floor(rowCount / 2 / subDivisions);
  var minColumn = 0 - columnIndexOffset;
  var maxColumn = columnIndexOffset;
  var minRow = 0 - rowIndexOffset;
  var maxRow = rowIndexOffset;
  var maxWorldX = (columnCount - 1) * 0.5 * scale;
  var minWorldX = -maxWorldX;
  var maxWorldZ = (rowCount - 1) * 0.5 * scale;
  var minWorldZ = -maxWorldZ;

  var worldXToNormalizedX = function(worldX) {
    return (worldX + maxWorldX) * subDivisions;
  };

  var worldZToNormalizedZ = function(worldZ) {
    return (worldZ + maxWorldZ) * subDivisions;
  };

  var interpolateHeight = function(point, floor, ceiling) {
    return CityTour.Math.lerp(floor, ceiling, point - Math.floor(point));
  };

  var materialAtCoordinates = function(worldX, worldZ) {
    return (coordinates[worldXToNormalizedX(worldX)][worldZToNormalizedZ(worldZ)].waterHeight > 0.0) ? CityTour.Terrain.WATER : CityTour.Terrain.LAND;
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

  var landHeightAtCoordinates = function(worldX, worldZ) {
    return componentHeightAtCoordinates(worldXToNormalizedX(worldX), worldZToNormalizedZ(worldZ), "landHeight");
  };

  var waterHeightAtCoordinates = function(worldX, worldZ) {
    return componentHeightAtCoordinates(worldXToNormalizedX(worldX), worldZToNormalizedZ(worldZ), "waterHeight");
  };

  var heightAtCoordinates = function(worldX, worldZ) {
    var normalizedX = worldXToNormalizedX(worldX);
    var normalizedZ = worldZToNormalizedZ(worldZ);

    var landHeight = componentHeightAtCoordinates(normalizedX, normalizedZ, "landHeight");
    if (landHeight === undefined) {
      return undefined;
    }

    return landHeight + componentHeightAtCoordinates(normalizedX, normalizedZ, "waterHeight");
  };


  return {
    scale: function() { return scale; },
    minColumn: function() { return minColumn; },
    maxColumn: function() { return maxColumn; },
    minRow: function() { return minRow; },
    maxRow: function() { return maxRow; },
    materialAtCoordinates: materialAtCoordinates,
    landHeightAtCoordinates: landHeightAtCoordinates,
    waterHeightAtCoordinates: waterHeightAtCoordinates,
    heightAtCoordinates: heightAtCoordinates,
  };
};

CityTour.Terrain.LAND = 'land';
CityTour.Terrain.WATER = 'water';

"use strict";

import { CityTourMath } from "./math";

var Terrain = function(coordinates, scale) {
  var LAND_HEIGHT_COMPONENT = "landHeight";
  var WATER_HEIGHT_COMPONENT = "waterHeight";

  var subDivisions = 1 / scale;
  var columnCount = coordinates.length;
  var rowCount = coordinates[0].length;
  var maxXIndex = columnCount - 1;
  var maxZIndex = rowCount - 1;
  var maxX = maxXIndex * 0.5 * scale;
  var minX = -maxX;
  var maxZ = maxZIndex * 0.5 * scale;
  var minZ = -maxZ;

  var mapXToNormalizedX = function(mapX) {
    return (mapX + maxX) * subDivisions;
  };

  var mapZToNormalizedZ = function(mapZ) {
    return (mapZ + maxZ) * subDivisions;
  };

  var interpolateHeight = function(point, floor, ceiling) {
    return CityTourMath.lerp(floor, ceiling, point - Math.floor(point));
  };

  var componentHeightAt = function(x, z, component) {
    var leftHeight, rightHeight, topHeight, bottomHeight;
    var topRowInterpolatedHeight, bottomRowInterpolatedHeight;
    var xIsExact, zIsExact;

    if (x < 0 || x > maxXIndex || z < 0 || z > maxZIndex) {
      return undefined;
    }

    xIsExact = (Math.floor(x) === x);
    zIsExact = (Math.floor(z) === z);

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

  var landHeightAt = function(mapX, mapZ) {
    return componentHeightAt(mapXToNormalizedX(mapX), mapZToNormalizedZ(mapZ), LAND_HEIGHT_COMPONENT);
  };

  var waterHeightAt = function(mapX, mapZ) {
    return componentHeightAt(mapXToNormalizedX(mapX), mapZToNormalizedZ(mapZ), WATER_HEIGHT_COMPONENT);
  };

  var heightAt = function(mapX, mapZ) {
    var normalizedX = mapXToNormalizedX(mapX);
    var normalizedZ = mapZToNormalizedZ(mapZ);

    var landHeight = componentHeightAt(normalizedX, normalizedZ, LAND_HEIGHT_COMPONENT);
    if (landHeight === undefined) {
      return undefined;
    }

    return landHeight + componentHeightAt(normalizedX, normalizedZ, WATER_HEIGHT_COMPONENT);
  };

  var isPointInBounds = function(mapX, mapZ) {
    return mapX >= minX && mapX <= maxX && mapZ >= minZ && mapZ <= maxZ;
  };


  return {
    scale: function() { return scale; },
    minX: function() { return minX; },
    maxX: function() { return maxX; },
    minZ: function() { return minZ; },
    maxZ: function() { return maxZ; },
    landHeightAt: landHeightAt,
    waterHeightAt: waterHeightAt,
    heightAt: heightAt,
    isPointInBounds: isPointInBounds,
  };
};

export { Terrain };

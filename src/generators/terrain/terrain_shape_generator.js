"use strict";

import { CityTourMath } from "./../../math";

var TerrainShapeGenerator = (function() {
  var addPlateau = function(terrainCoordinates, centerX, centerZ, width, height, depth) {
    var x, z;

    var halfWidth = width / 2;
    var halfDepth = depth / 2;

    var startX = Math.max(0, centerX - halfWidth);
    var endX = Math.min(terrainCoordinates.length - 1, centerX + halfWidth);
    var startZ = Math.max(0, centerZ - halfDepth);
    var endZ = Math.min(terrainCoordinates[0].length - 1, centerZ + halfDepth);

    for (x = startX; x <= endX; x++) {
      for (z = startZ; z <= endZ; z++) {
        terrainCoordinates[x][z].landHeight += height;
      }
    }
  };

  var addPyramid = function(terrainCoordinates, centerX, centerZ, baseLength, height) {
    if ((baseLength % 2) !== 0) {
      throw new Error("Base length of '" + baseLength + "' is invalid, it must be an even number");
    }

    var halfBaseLength = baseLength / 2;
    var heightDifference = height / halfBaseLength;

    var startX = Math.max(0, centerX - halfBaseLength);
    var endX = Math.min(terrainCoordinates.length - 1, centerX + halfBaseLength);
    var startZ = Math.max(0, centerZ - halfBaseLength);
    var endZ = Math.min(terrainCoordinates[0].length - 1, centerZ + halfBaseLength);

    var x, z;
    var distanceFromCenter, pointHeight;

    for (x = startX; x <= endX; x++) {
      for (z = startZ; z <= endZ; z++) {
        distanceFromCenter = Math.max(Math.abs(centerX - x), Math.abs(centerZ - z));
        pointHeight = (halfBaseLength - distanceFromCenter) * heightDifference;

        if (height < 0) {
          terrainCoordinates[x][z].landHeight = Math.min(terrainCoordinates[x][z].landHeight, pointHeight);
        }
        else {
          terrainCoordinates[x][z].landHeight = Math.max(terrainCoordinates[x][z].landHeight, pointHeight);
        }
      }
    }
  };

  var addCone = function(terrainCoordinates, centerX, centerZ, radius, height) {
    var startX = Math.max(0, centerX - radius);
    var endX = Math.min(terrainCoordinates.length - 1, centerX + radius);
    var startZ = Math.max(0, centerZ - radius);
    var endZ = Math.min(terrainCoordinates[0].length - 1, centerZ + radius);

    var x, z;
    var distanceFromCenter, pointHeight;

    for (x = startX; x <= endX; x++) {
      for (z = startZ; z <= endZ; z++) {
        distanceFromCenter = CityTourMath.distanceBetweenPoints(x, z, centerX, centerZ);
        if (distanceFromCenter <= radius) {
          pointHeight = height - ((distanceFromCenter / radius) * height);

          if (height < 0) {
            terrainCoordinates[x][z].landHeight = Math.min(terrainCoordinates[x][z].landHeight, pointHeight);
          }
          else {
            terrainCoordinates[x][z].landHeight = Math.max(terrainCoordinates[x][z].landHeight, pointHeight);
          }
        }
      }
    }
  };

  var addLine = function(terrainCoordinates, startX, startZ, endX, endZ, thickness, height) {
    var halfThickness = thickness / 2;
    var boundingStartX = Math.max(0, startX - halfThickness);
    var boundingStartZ = Math.max(0, startZ - halfThickness);
    var boundingEndX = Math.min(terrainCoordinates.length - 1, endX + halfThickness);
    var boundingEndZ = Math.min(terrainCoordinates[0].length - 1, endZ + halfThickness);
    var numerator, denominator, distanceToLine;
    var x, z;

    denominator = CityTourMath.distanceBetweenPoints(startX, startZ, endX, endZ);

    for (x = boundingStartX; x <= boundingEndX; x++) {
      for (z = boundingStartZ; z <= boundingEndZ; z++) {
        distanceToLine = Math.random();

        // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
        numerator = Math.abs(((endZ - startZ) * x) - ((endX - startX) * z) + (endX * startZ) - (endZ * startX));
        distanceToLine = numerator / denominator;

        if (distanceToLine <= halfThickness) {
          terrainCoordinates[x][z].landHeight += height;
        }
      }
    }
  };

  var addRidge = function(terrainCoordinates, startX, startZ, endX, endZ, thickness, height) {
    var halfThickness = thickness / 2;
    var boundingStartX = Math.max(0, startX - halfThickness);
    var boundingStartZ = Math.max(0, startZ - halfThickness);
    var boundingEndX = Math.min(terrainCoordinates.length - 1, endX + halfThickness);
    var boundingEndZ = Math.min(terrainCoordinates[0].length - 1, endZ + halfThickness);
    var numerator, denominator, distanceToLine;
    var pointHeight;
    var x, z;

    console.log("Coordinates: " + startX + ", " + startZ + " : " + endX + ", " + endZ);
    console.log("Bounding:    " + boundingStartX + ", " + boundingStartZ + " : " + boundingEndX + ", " + boundingEndZ);

    denominator = CityTourMath.distanceBetweenPoints(startX, startZ, endX, endZ);

    for (x = boundingStartX; x <= boundingEndX; x++) {
      for (z = boundingStartZ; z <= boundingEndZ; z++) {
        distanceToLine = Math.random();

        // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
        numerator = Math.abs(((endZ - startZ) * x) - ((endX - startX) * z) + (endX * startZ) - (endZ * startX));
        distanceToLine = numerator / denominator;

        if (distanceToLine <= halfThickness) {
          pointHeight = (1.0 - (distanceToLine / halfThickness)) * height;
          terrainCoordinates[x][z].landHeight += pointHeight;
        }
      }
    }
  };


  return {
    addPlateau: addPlateau,
    addPyramid: addPyramid,
    addCone: addCone,
    addLine: addLine,
    addRidge: addRidge,
  };
})();

export { TerrainShapeGenerator };

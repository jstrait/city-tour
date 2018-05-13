"use strict";

var CityTour = CityTour || {};

CityTour.TerrainShapeGenerator = (function() {
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

  var addPyramid = function(terrainCoordinates, centerX, centerZ, width, height, depth) {
    var x, z;

    var halfWidth = (width % 2 === 0) ? width / 2 : (width - 1) / 2;
    var halfDepth = (depth % 2 === 0) ? depth / 2 : (depth - 1) / 2;

    var startX = Math.max(0, centerX - halfWidth);
    var endX = Math.min(terrainCoordinates.length - 1, centerX + halfWidth);
    var startZ = Math.max(0, centerZ - halfDepth);
    var endZ = Math.min(terrainCoordinates[0].length - 1, centerZ + halfDepth);

    var maxDistance = CityTour.Math.distanceBetweenPoints(startX, startZ, centerX, centerZ);
    var currentDistance;

    for (x = startX; x <= endX; x++) {
      for (z = startZ; z <= endZ; z++) {
        currentDistance = CityTour.Math.distanceBetweenPoints(x, z, centerX, centerZ);

        terrainCoordinates[x][z].landHeight += (height * (1 - (currentDistance / maxDistance)));
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

    denominator = CityTour.Math.distanceBetweenPoints(startX, startZ, endX, endZ);

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

    denominator = CityTour.Math.distanceBetweenPoints(startX, startZ, endX, endZ);

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
    addLine: addLine,
    addRidge: addRidge,
  };
})();

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

    var halfWidth = width / 2;
    var halfDepth = depth / 2;

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


  return {
    addPlateau: addPlateau,
    addPyramid: addPyramid,
  };
})();

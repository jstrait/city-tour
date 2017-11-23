"use strict";

var CityTour = CityTour || {};

CityTour.BlurEroder = (function() {
  var EROSION_PERCENTAGE_FROM_PREVIOUS = 0.5;
  var EROSION_PERCENTAGE_FOR_CURRENT = 1 - EROSION_PERCENTAGE_FROM_PREVIOUS;

  // Adapted from http://www.dreamincode.net/forums/blog/2250/entry-4550-terrain-erosion/
  var erode = function(terrainCoordinates) {
    var x, z;
    var previous, current;

    for (x = 0; x < terrainCoordinates.length; x++) {
      // Top -> Down
      previous = terrainCoordinates[x][0].height;
      for (z = 1; z < terrainCoordinates[0].length; z++) {
        current = terrainCoordinates[x][z].height;

        if (terrainCoordinates[x][z].waterHeight <= 0.0) {
          terrainCoordinates[x][z].height = (EROSION_PERCENTAGE_FROM_PREVIOUS * previous) + (EROSION_PERCENTAGE_FOR_CURRENT * current);
        }
        previous = current;
      }

      // Down -> Up
      previous = terrainCoordinates[x][terrainCoordinates[0].length - 1].height;
      for (z = terrainCoordinates[0].length - 2; z >= 0; z--) {
        current = terrainCoordinates[x][z].height;

        if (terrainCoordinates[x][z].waterHeight <= 0.0) {
          terrainCoordinates[x][z].height = (EROSION_PERCENTAGE_FROM_PREVIOUS * previous) + (EROSION_PERCENTAGE_FOR_CURRENT * current);
        }
        previous = current;
      }
    }

    for (z = 0; z < terrainCoordinates[0].length; z++) {
      // Left -> Right
      previous = terrainCoordinates[0][z].height;
      for (x = 1; x < terrainCoordinates.length; x++) {
        current = terrainCoordinates[x][z].height;

        if (terrainCoordinates[x][z].waterHeight <= 0.0) {
          terrainCoordinates[x][z].height = (EROSION_PERCENTAGE_FROM_PREVIOUS * previous) + (EROSION_PERCENTAGE_FOR_CURRENT * current);
        }
        previous = current;
      }

      // Right -> Left
      previous = terrainCoordinates[terrainCoordinates.length - 1][z].height;
      for (x = terrainCoordinates.length - 2; x >= 0; x--) {
        current = terrainCoordinates[x][z].height;

        if (terrainCoordinates[x][z].waterHeight <= 0.0) {
          terrainCoordinates[x][z].height = (EROSION_PERCENTAGE_FROM_PREVIOUS * previous) + (EROSION_PERCENTAGE_FOR_CURRENT * current);
        }
        previous = current;
      }
    }
  };

  return {
    erode: erode,
  };
})();

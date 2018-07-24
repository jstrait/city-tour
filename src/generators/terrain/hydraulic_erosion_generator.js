"use strict";

var CityTour = CityTour || {};

// Adapted from http://ranmantaru.com/blog/2011/10/08/water-erosion-on-heightmap-terrain/
CityTour.HydraulicErosionGenerator = (function() {
  var lowestAdjacentTerrain = function(terrainCoordinates, x, z) {
    var candidateLandHeight;
    var minAdjacentLandHeight = Number.POSITIVE_INFINITY;
    var minAdjacentX, minAdjacentZ;

    // North
    if (z > 0) {
      candidateLandHeight = terrainCoordinates[x][z - 1].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x;
        minAdjacentZ = z - 1;
      }
    }

    // South
    if (z < terrainCoordinates[0].length - 1) {
      candidateLandHeight = terrainCoordinates[x][z + 1].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x;
        minAdjacentZ = z + 1;
      }
    }

    // West
    if (x > 0) {
      candidateLandHeight = terrainCoordinates[x - 1][z].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x - 1;
        minAdjacentZ = z;
      }
    }

    // East
    if (x < terrainCoordinates.length - 1) {
      candidateLandHeight = terrainCoordinates[x + 1][z].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x + 1;
        minAdjacentZ = z;
      }
    }

    // Southwest
    if (x > 0 && z < (terrainCoordinates[0].length - 1)) {
      candidateLandHeight = terrainCoordinates[x - 1][z + 1].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x - 1;
        minAdjacentZ = z + 1;
      }
    }

    // Northeast
    if (x < (terrainCoordinates.length - 1) && z > 0) {
      candidateLandHeight = terrainCoordinates[x + 1][z - 1].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x + 1;
        minAdjacentZ = z - 1;
      }
    }

    return {
      minAdjacentLandHeight: minAdjacentLandHeight,
      minAdjacentX: minAdjacentX,
      minAdjacentZ: minAdjacentZ,
    };
  };

  var erode = function(terrainCoordinates, iterationCount) {
    var STARTING_WATER_HEIGHT = 4.166666666666667;
    var WATER_CARRYING_CAPACITY = 0.416666666666667;
    var WATER_EVAPORATION_RATE = 0.833333333333333;
    var MAX_EROSION_HEIGHT = 0.416666666666667;
    var MAX_SOIL_DEPOSIT_HEIGHT = 0.416666666666667;

    var lowestAdjacentLandHeight, lowestAdjacentX, lowestAdjacentZ;
    var lowestAdjacentTerrainAttributes;

    var maxColumnIndex = terrainCoordinates.length - 1;
    var maxRowIndex = terrainCoordinates[0].length - 1;
    var waterAmount;
    var soilAmount, soilDepositHeight;
    var erosionHeight;

    var i, x, z;

    for (i = 0; i < iterationCount; i++) {
      x = CityTour.Math.randomInteger(0, maxColumnIndex);
      z = CityTour.Math.randomInteger(0, maxRowIndex);
      waterAmount = STARTING_WATER_HEIGHT;
      soilAmount = 0.0;

      do {
        lowestAdjacentTerrainAttributes = lowestAdjacentTerrain(terrainCoordinates, x, z);
        lowestAdjacentLandHeight = lowestAdjacentTerrainAttributes.minAdjacentLandHeight;
        lowestAdjacentX = lowestAdjacentTerrainAttributes.minAdjacentX;
        lowestAdjacentZ = lowestAdjacentTerrainAttributes.minAdjacentZ;

        if (soilAmount > WATER_CARRYING_CAPACITY) {
          soilDepositHeight = Math.min(MAX_SOIL_DEPOSIT_HEIGHT, soilAmount);
          terrainCoordinates[x][z].landHeight += soilDepositHeight;
          soilAmount -= soilDepositHeight;
          waterAmount -= WATER_EVAPORATION_RATE;
        }
        else if (terrainCoordinates[x][z].landHeight >= lowestAdjacentLandHeight) {
          erosionHeight = Math.min(MAX_EROSION_HEIGHT, (terrainCoordinates[x][z].landHeight - lowestAdjacentLandHeight));
          terrainCoordinates[x][z].landHeight -= erosionHeight;
          soilAmount += erosionHeight;
          waterAmount -= WATER_EVAPORATION_RATE;
        }

        x = lowestAdjacentX;
        z = lowestAdjacentZ;
      } while (waterAmount > 0.0 && lowestAdjacentLandHeight <= terrainCoordinates[x][z].landHeight);
    }
  };


  return {
    erode: erode,
  };
})();

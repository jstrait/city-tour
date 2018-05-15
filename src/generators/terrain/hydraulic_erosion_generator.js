"use strict";

var CityTour = CityTour || {};

// Adapted from http://ranmantaru.com/blog/2011/10/08/water-erosion-on-heightmap-terrain/
CityTour.HydraulicErosionGenerator = (function() {
  var lowestAdjacentTerrain = function(terrainCoordinates, x, z) {
    var candidateLandHeight;
    var minTargetLandHeight = Number.POSITIVE_INFINITY;
    var minTargetX, minTargetZ;

    // North
    if (z > 0) {
      candidateLandHeight = terrainCoordinates[x][z - 1].landHeight;
      if (candidateLandHeight < minTargetLandHeight) {
        minTargetLandHeight = candidateLandHeight;
        minTargetX = x;
        minTargetZ = z - 1;
      }
    }

    // South
    if (z < terrainCoordinates[0].length - 1) {
      candidateLandHeight = terrainCoordinates[x][z + 1].landHeight;
      if (candidateLandHeight < minTargetLandHeight) {
        minTargetLandHeight = candidateLandHeight;
        minTargetX = x;
        minTargetZ = z + 1;
      }
    }

    // West
    if (x > 0) {
      candidateLandHeight = terrainCoordinates[x - 1][z].landHeight;
      if (candidateLandHeight < minTargetLandHeight) {
        minTargetLandHeight = candidateLandHeight;
        minTargetX = x - 1;
        minTargetZ = z;
      }
    }

    // East
    if (x < terrainCoordinates.length - 1) {
      candidateLandHeight = terrainCoordinates[x + 1][z].landHeight;
      if (candidateLandHeight < minTargetLandHeight) {
        minTargetLandHeight = candidateLandHeight;
        minTargetX = x + 1;
        minTargetZ = z;
      }
    }

    // Southwest
    if (x > 0 && z < (terrainCoordinates[0].length - 1)) {
      candidateLandHeight = terrainCoordinates[x - 1][z + 1].landHeight;
      if (candidateLandHeight < minTargetLandHeight) {
        minTargetLandHeight = candidateLandHeight;
        minTargetX = x - 1;
        minTargetZ = z + 1;
      }
    }

    // Northeast
    if (x < (terrainCoordinates.length - 1) && z > 0) {
      candidateLandHeight = terrainCoordinates[x + 1][z - 1].landHeight;
      if (candidateLandHeight < minTargetLandHeight) {
        minTargetLandHeight = candidateLandHeight;
        minTargetX = x + 1;
        minTargetZ = z - 1;
      }
    }

    return {
      minTargetLandHeight: minTargetLandHeight,
      minTargetX: minTargetX,
      minTargetZ: minTargetZ,
    };
  };

  var erode = function(terrainCoordinates, iterationCount) {
    var STARTING_WATER_HEIGHT = 5.0;
    var WATER_CARRYING_CAPACITY = 2.5;
    var WATER_EVAPORATION_RATE = 1.0;
    var MAX_EROSION_HEIGHT = 2.5;
    var MAX_SOIL_DEPOSIT_HEIGHT = 2.5;

    var minTargetLandHeight, minTargetX, minTargetZ;
    var i, x, z;
    var lowestAdjacentTerrainAttributes;

    var maxColumnIndex = terrainCoordinates.length - 1;
    var maxRowIndex = terrainCoordinates[0].length - 1;
    var waterAmount;
    var soilAmount, soilDepositHeight;
    var erosionHeight;

    for (i = 0; i < iterationCount; i++) {
      x = CityTour.Math.randomInteger(0, maxColumnIndex);
      z = CityTour.Math.randomInteger(0, maxRowIndex);
      waterAmount = STARTING_WATER_HEIGHT;
      soilAmount = 0.0;

      do {
        lowestAdjacentTerrainAttributes = lowestAdjacentTerrain(terrainCoordinates, x, z);
        minTargetLandHeight = lowestAdjacentTerrainAttributes.minTargetLandHeight;
        minTargetX = lowestAdjacentTerrainAttributes.minTargetX;
        minTargetZ = lowestAdjacentTerrainAttributes.minTargetZ;

        if (soilAmount > WATER_CARRYING_CAPACITY) {
          soilDepositHeight = Math.min(MAX_SOIL_DEPOSIT_HEIGHT, soilAmount);
          terrainCoordinates[x][z].landHeight += soilDepositHeight;
          soilAmount -= soilDepositHeight;
          waterAmount -= WATER_EVAPORATION_RATE;
        }
        else if (terrainCoordinates[x][z].landHeight >= minTargetLandHeight) {
          erosionHeight = Math.min(MAX_EROSION_HEIGHT, (terrainCoordinates[x][z].landHeight - minTargetLandHeight));
          terrainCoordinates[x][z].landHeight -= erosionHeight;
          soilAmount += erosionHeight;
          waterAmount -= WATER_EVAPORATION_RATE;
        }

        x = minTargetX;
        z = minTargetZ;
      } while (waterAmount > 0.0 && minTargetLandHeight <= terrainCoordinates[x][z].landHeight);
    }
  };


  return {
    erode: erode,
  };
})();

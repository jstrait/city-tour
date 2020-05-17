"use strict";

import { CityTourMath } from "./../../math";

// Adapted from http://ranmantaru.com/blog/2011/10/08/water-erosion-on-heightmap-terrain/
var HydraulicErosionGenerator = (function() {
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
    var STARTING_WATER_HEIGHT = 4.0;
    var MAX_DISSOLVED_SOIL_PERCENTAGE = 0.3;
    var WATER_EVAPORATION_RATE = 0.1;
    var MAX_EROSION_HEIGHT = 1.0;

    var lowestAdjacentLandHeight, lowestAdjacentX, lowestAdjacentZ;
    var lowestAdjacentTerrainAttributes;

    var maxColumnIndex = terrainCoordinates.length - 1;
    var maxRowIndex = terrainCoordinates[0].length - 1;
    var waterAmount;
    var dissolvedSoilAmount;
    var maxDissolvedSoil;
    var soilDepositHeight;
    var erosionHeight;

    var i, x, z;

    for (i = 0; i < iterationCount; i++) {
      x = CityTourMath.randomInteger(0, maxColumnIndex);
      z = CityTourMath.randomInteger(0, maxRowIndex);

      waterAmount = STARTING_WATER_HEIGHT;
      dissolvedSoilAmount = 0.0;

      do {
        lowestAdjacentTerrainAttributes = lowestAdjacentTerrain(terrainCoordinates, x, z);
        lowestAdjacentLandHeight = lowestAdjacentTerrainAttributes.minAdjacentLandHeight;
        lowestAdjacentX = lowestAdjacentTerrainAttributes.minAdjacentX;
        lowestAdjacentZ = lowestAdjacentTerrainAttributes.minAdjacentZ;

        soilDepositHeight = 0.0;
        erosionHeight = 0.0;
        maxDissolvedSoil = (waterAmount * MAX_DISSOLVED_SOIL_PERCENTAGE);

        if (dissolvedSoilAmount > maxDissolvedSoil) {
          soilDepositHeight = dissolvedSoilAmount - maxDissolvedSoil;
          dissolvedSoilAmount -= soilDepositHeight;
        }
        else if (terrainCoordinates[x][z].landHeight >= lowestAdjacentLandHeight) {
          erosionHeight = Math.min(MAX_EROSION_HEIGHT, maxDissolvedSoil - dissolvedSoilAmount, (terrainCoordinates[x][z].landHeight - lowestAdjacentLandHeight));
          dissolvedSoilAmount += erosionHeight;
        }

        terrainCoordinates[x][z].landHeight += soilDepositHeight;
        terrainCoordinates[x][z].landHeight -= erosionHeight;

        waterAmount -= WATER_EVAPORATION_RATE;

        x = lowestAdjacentX;
        z = lowestAdjacentZ;
      } while (waterAmount > 0.0 && lowestAdjacentLandHeight <= terrainCoordinates[x][z].landHeight);

      // Deposit any soil remaining after all water has evaporated
      terrainCoordinates[x][z].landHeight += dissolvedSoilAmount;
    }
  };


  return {
    erode: erode,
  };
})();

export { HydraulicErosionGenerator };

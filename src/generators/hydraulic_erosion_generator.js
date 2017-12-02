"use strict";

var CityTour = CityTour || {};

CityTour.HydraulicErosionGenerator = (function() {
  var RAINDROP_COUNT = 5000;
  var WATER_HEIGHT_PER_RAINDROP = 1.0;
  var EVAPORATION_WATER_HEIGHT = 2.5;

  var addRandomRainfall = function(terrainCoordinates) {
    var i;
    var maxColumnIndex = terrainCoordinates.length - 1;
    var maxRowIndex = terrainCoordinates[0].length - 1;
    var column, row;

    for (i = 0; i < RAINDROP_COUNT; i++) {
      column = Math.round(Math.random() * maxColumnIndex);
      row = Math.round(Math.random() * maxRowIndex);

      terrainCoordinates[column][row].waterHeight += WATER_HEIGHT_PER_RAINDROP;
    }
  };

  var addUniformRainfall = function(terrainCoordinates) {
    var columnCount = terrainCoordinates.length;
    var rowCount = terrainCoordinates[0].length;
    var x, z;

    for (x = 0; x < columnCount; x++) {
      for (z = 0; z < rowCount; z++) {
        terrainCoordinates[x][z].waterHeight += WATER_HEIGHT_PER_RAINDROP;
      }
    }
  };

  var emptyWaterFlowCoordinates = function(terrainCoordinates) {
    var x, z;
    var waterFlowCoordinates = [];

    for (x = 0; x < terrainCoordinates.length; x++) {
      waterFlowCoordinates[x] = [];

      for (z = 0; z < terrainCoordinates[0].length; z++) {
        waterFlowCoordinates[x][z] = { landDelta: 0.0, waterDelta: 0.0 };
      }
    }

    return waterFlowCoordinates;
  };

  var erode = function(terrainCoordinates, iterationCount) {
    var waterFlowCoordinates;
    var northTotalHeight, southTotalHeight, westTotalHeight, eastTotalHeight, southWestTotalHeight, northEastTotalHeight;
    var currentLandHeight, currentTotalHeight, minTargetTotalHeight;
    var minTargetX, minTargetZ;
    var landDelta, waterDelta, maxLandDelta, maxWaterDelta;
    var i, x, z;

    var columnCount = terrainCoordinates.length;
    var rowCount = terrainCoordinates[0].length;

    for (i = 0; i < iterationCount; i++) {
      waterFlowCoordinates = emptyWaterFlowCoordinates(terrainCoordinates);

      for (x = 0; x < columnCount; x++) {
        for (z = 0; z < rowCount; z++) {
          currentLandHeight = terrainCoordinates[x][z].landHeight;
          currentTotalHeight = currentLandHeight + terrainCoordinates[x][z].waterHeight;
          minTargetTotalHeight = Number.POSITIVE_INFINITY;

          // North
          if (z > 0) {
            northTotalHeight = terrainCoordinates[x][z - 1].landHeight + terrainCoordinates[x][z - 1].waterHeight;
            if (northTotalHeight < minTargetTotalHeight) {
              minTargetTotalHeight = northTotalHeight;
              minTargetX = x;
              minTargetZ = z - 1;
            }
          }

          // South
          if (z < terrainCoordinates[0].length - 1) {
            southTotalHeight = terrainCoordinates[x][z + 1].landHeight + terrainCoordinates[x][z + 1].waterHeight;
            if (southTotalHeight < minTargetTotalHeight) {
              minTargetTotalHeight = southTotalHeight;
              minTargetX = x;
              minTargetZ = z + 1;
            }
          }

          // West
          if (x > 0) {
            westTotalHeight = terrainCoordinates[x - 1][z].landHeight + terrainCoordinates[x - 1][z].waterHeight;
            if (westTotalHeight < minTargetTotalHeight) {
              minTargetTotalHeight = westTotalHeight;
              minTargetX = x - 1;
              minTargetZ = z;
            }
          }

          // East
          if (x < terrainCoordinates.length - 1) {
            eastTotalHeight = terrainCoordinates[x + 1][z].landHeight + terrainCoordinates[x + 1][z].waterHeight;
            if (eastTotalHeight < minTargetTotalHeight) {
              minTargetTotalHeight = eastTotalHeight;
              minTargetX = x + 1;
              minTargetZ = z;
            }
          }

          // Southwest
          if (x > 0 && z < (terrainCoordinates[0].length - 1)) {
            southWestTotalHeight = terrainCoordinates[x - 1][z + 1].landHeight + terrainCoordinates[x - 1][z + 1].waterHeight;
            if (southWestTotalHeight < minTargetTotalHeight) {
              minTargetTotalHeight = southWestTotalHeight;
              minTargetX = x - 1;
              minTargetZ = z + 1;
            }
          }

          // Northeast
          if (x < (terrainCoordinates.length - 1) && z > 0) {
            northEastTotalHeight = terrainCoordinates[x + 1][z - 1].landHeight + terrainCoordinates[x + 1][z - 1].waterHeight;
            if (northEastTotalHeight < minTargetTotalHeight) {
              minTargetTotalHeight = northEastTotalHeight;
              minTargetX = x + 1;
              minTargetZ = z - 1;
            }
          }

          if (currentTotalHeight > minTargetTotalHeight && terrainCoordinates[x][z].waterHeight > 0.0) {
            maxLandDelta = (currentLandHeight - terrainCoordinates[minTargetX][minTargetZ].landHeight) / 2;
            landDelta = (maxLandDelta > 0.0) ? Math.min(1.0, maxLandDelta) : 0.0;

            maxWaterDelta = (currentTotalHeight - minTargetTotalHeight) / 2;
            waterDelta = Math.min(maxWaterDelta, terrainCoordinates[x][z].waterHeight);

            waterFlowCoordinates[x][z].landDelta -= landDelta;
            waterFlowCoordinates[x][z].waterDelta -= waterDelta;

            waterFlowCoordinates[minTargetX][minTargetZ].landDelta += landDelta;
            waterFlowCoordinates[minTargetX][minTargetZ].waterDelta += waterDelta;
          }
        }
      }

      for (x = 0; x < columnCount; x++) {
        for (z = 0; z < rowCount; z++) {
          terrainCoordinates[x][z].landHeight += waterFlowCoordinates[x][z].landDelta;
          terrainCoordinates[x][z].waterHeight += waterFlowCoordinates[x][z].waterDelta;
        }
      }
    }
  };

  var evaporate = function(terrainCoordinates) {
    var x, z;
    var columnCount = terrainCoordinates.length;
    var rowCount = terrainCoordinates[0].length;

    for (x = 0; x < columnCount; x++) {
      for (z = 0; z < rowCount; z++) {
        terrainCoordinates[x][z].waterHeight = Math.max(terrainCoordinates[x][z].waterHeight - EVAPORATION_WATER_HEIGHT, 0.0);
      }
    }
  };


  return {
    addRandomRainfall: addRandomRainfall,
    addUniformRainfall: addUniformRainfall,
    evaporate: evaporate,
    erode: erode,
  };
})();

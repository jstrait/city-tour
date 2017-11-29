"use strict";

var CityTour = CityTour || {};

CityTour.HydraulicErosionGenerator = (function() {
  var RAINDROP_COUNT = 10000;
  var WATER_HEIGHT_PER_RAINDROP = 1.0;
  var EVAPORATION_WATER_HEIGHT = 2.5;

  var addRainfall = function(terrainCoordinates) {
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
    var northHeight, southHeight, westHeight, eastHeight, southWestHeight, northEastHeight;
    var currentLandHeight, currentHeight, minTargetHeight;
    var maxLandDelta, maxWaterDelta;
    var i, x, z;

    var columnCount = terrainCoordinates.length;
    var rowCount = terrainCoordinates[0].length;

    for (i = 0; i < iterationCount; i++) {
      waterFlowCoordinates = emptyWaterFlowCoordinates(terrainCoordinates);

      for (x = 0; x < columnCount; x++) {
        for (z = 0; z < rowCount; z++) {
          currentLandHeight = terrainCoordinates[x][z].height;
          currentHeight = currentLandHeight + terrainCoordinates[x][z].waterHeight;

          // North
          if (z > 0) {
            northHeight = terrainCoordinates[x][z - 1].height + terrainCoordinates[x][z - 1].waterHeight;
          }
          else {
            northHeight = Number.POSITIVE_INFINITY;
          }

          // South
          if (z < terrainCoordinates[0].length - 1) {
            southHeight = terrainCoordinates[x][z + 1].height + terrainCoordinates[x][z + 1].waterHeight;
          }
          else {
            southHeight = Number.POSITIVE_INFINITY;
          }

          // West
          if (x > 0) {
            westHeight = terrainCoordinates[x - 1][z].height + terrainCoordinates[x - 1][z].waterHeight;
          }
          else {
            westHeight = Number.POSITIVE_INFINITY;
          }

          // East
          if (x < terrainCoordinates.length - 1) {
            eastHeight = terrainCoordinates[x + 1][z].height + terrainCoordinates[x + 1][z].waterHeight;
          }
          else {
            eastHeight = Number.POSITIVE_INFINITY;
          }

          // Southwest
          if (x > 0 && z < (terrainCoordinates[0].length - 1)) {
            southWestHeight = terrainCoordinates[x - 1][z + 1].height + terrainCoordinates[x - 1][z + 1].waterHeight;
          }
          else {
            southWestHeight = Number.POSITIVE_INFINITY;
          }

          // Northeast
          if (x < (terrainCoordinates.length - 1) && z > 0) {
            northEastHeight = terrainCoordinates[x + 1][z - 1].height + terrainCoordinates[x + 1][z - 1].waterHeight;
          }
          else {
            northEastHeight = Number.POSITIVE_INFINITY;
          }

          minTargetHeight = Math.min(northHeight, southHeight, westHeight, eastHeight, southWestHeight, northEastHeight);

          if (currentHeight > minTargetHeight && terrainCoordinates[x][z].waterHeight > 0.0) {
            maxWaterDelta = (currentHeight - minTargetHeight) / 2;

            if (northHeight === minTargetHeight) {
              maxLandDelta = (currentLandHeight - terrainCoordinates[x][z - 1].height) / 2;
              if (maxLandDelta > 0.0) {
                waterFlowCoordinates[x][z - 1].landDelta += Math.min(1.0, maxLandDelta);
              }
              waterFlowCoordinates[x][z - 1].waterDelta += Math.min(maxWaterDelta, terrainCoordinates[x][z].waterHeight);
            }
            else if (southHeight === minTargetHeight) {
              maxLandDelta = (currentLandHeight - terrainCoordinates[x][z + 1].height) / 2;
              if (maxLandDelta > 0.0) {
                waterFlowCoordinates[x][z + 1].landDelta += Math.min(1.0, maxLandDelta);
              }
              waterFlowCoordinates[x][z + 1].waterDelta += Math.min(maxWaterDelta, terrainCoordinates[x][z].waterHeight);
            }
            else if (westHeight === minTargetHeight) {
              maxLandDelta = (currentLandHeight - terrainCoordinates[x - 1][z].height) / 2;
              if (maxLandDelta > 0.0) {
                waterFlowCoordinates[x - 1][z].landDelta += Math.min(1.0, maxLandDelta);
              }
              waterFlowCoordinates[x - 1][z].waterDelta += Math.min(maxWaterDelta, terrainCoordinates[x][z].waterHeight);
            }
            else if (eastHeight === minTargetHeight) {
              maxLandDelta = (currentLandHeight - terrainCoordinates[x + 1][z].height) / 2;
              if (maxLandDelta > 0.0) {
                waterFlowCoordinates[x + 1][z].landDelta += Math.min(1.0, maxLandDelta);
              }
              waterFlowCoordinates[x + 1][z].waterDelta += Math.min(maxWaterDelta, terrainCoordinates[x][z].waterHeight);
            }
            else if (southWestHeight === minTargetHeight) {
              maxLandDelta = (currentLandHeight - terrainCoordinates[x - 1][z + 1].height) / 2;
              if (maxLandDelta > 0.0) {
                waterFlowCoordinates[x - 1][z + 1].landDelta += Math.min(1.0, maxLandDelta);
              }
              waterFlowCoordinates[x - 1][z + 1].waterDelta += Math.min(maxWaterDelta, terrainCoordinates[x][z].waterHeight);
            }
            else if (northEastHeight === minTargetHeight) {
              maxLandDelta = (currentLandHeight - terrainCoordinates[x + 1][z - 1].height) / 2;
              if (maxLandDelta > 0.0) {
                waterFlowCoordinates[x + 1][z - 1].landDelta += Math.min(1.0, maxLandDelta);
              }
              waterFlowCoordinates[x + 1][z - 1].waterDelta += Math.min(maxWaterDelta, terrainCoordinates[x][z].waterHeight);
            }

            if (maxLandDelta > 0.0) {
              waterFlowCoordinates[x][z].landDelta -= Math.min(1.0, maxLandDelta);
            }
            waterFlowCoordinates[x][z].waterDelta -= Math.min(maxWaterDelta, terrainCoordinates[x][z].waterHeight);
          }
        }
      }

      for (x = 0; x < columnCount; x++) {
        for (z = 0; z < rowCount; z++) {
          terrainCoordinates[x][z].height += waterFlowCoordinates[x][z].landDelta;
          terrainCoordinates[x][z].waterHeight += waterFlowCoordinates[x][z].waterDelta;
        }
      }
    }
  };

  var evaporate = function(terrainCoordinates) {
    var x, z;

    for (x = 0; x < terrainCoordinates.length; x++) {
      for (z = 0; z < terrainCoordinates[0].length; z++) {
        terrainCoordinates[x][z].waterHeight = Math.max(terrainCoordinates[x][z].waterHeight - EVAPORATION_WATER_HEIGHT, 0.0);
      }
    }
  };


  return {
    addRainfall: addRainfall,
    evaporate: evaporate,
    erode: erode,
  };
})();

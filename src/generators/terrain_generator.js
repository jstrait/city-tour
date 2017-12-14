"use strict";

var CityTour = CityTour || {};

CityTour.TerrainGenerator = (function() {
  var SUB_DIVISIONS = 1;
  var MAX_INITIAL_TERRAIN_HEIGHT = 6;

  var emptyTerrain = function(columnCount, rowCount) {
    var x, z;
    var terrainCoordinates = [];

    for (x = 0; x < columnCount; x++) {
      terrainCoordinates[x] = [];

      for (z = 0; z < rowCount; z++) {
        terrainCoordinates[x][z] = { landHeight: 0.0, waterHeight: 0.0 };
      }
    }

    return terrainCoordinates;
  };


  var nextPowerOfTwo = function(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  };


  var buildTerrainCoordinates = function(columns, rows, config) {
    var TOTAL_HYDRAULIC_EROSION_ITERATIONS = 10;
    var hydraulicErosionIteration;
    var columnsToGenerate = nextPowerOfTwo(columns * SUB_DIVISIONS) + 1;
    var rowsToGenerate = nextPowerOfTwo(rows * SUB_DIVISIONS) + 1;

    var terrainCoordinates = emptyTerrain(columnsToGenerate, rowsToGenerate);

    // Initial randomization of corners
    terrainCoordinates[0][0].landHeight = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[0][rowsToGenerate - 1].landHeight = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate - 1][0].landHeight = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate - 1][rowsToGenerate - 1].landHeight = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    diamondSquare(terrainCoordinates,
                  config.heightJitter,
                  config.heightJitterDecay,
                  0,
                  rowsToGenerate - 1,
                  columnsToGenerate - 1,
                  0);

    if (config.river) {
      CityTour.RiverGenerator.addRiver(terrainCoordinates, (rowsToGenerate - 1) * (68 / 128), columnsToGenerate - 1);
    }

    // Hydraulic erosion
    /*for (hydraulicErosionIteration = 0; hydraulicErosionIteration < TOTAL_HYDRAULIC_EROSION_ITERATIONS; hydraulicErosionIteration++) {
      CityTour.HydraulicErosionGenerator.addRandomRainfall(terrainCoordinates);
      CityTour.HydraulicErosionGenerator.erode(terrainCoordinates, 50);
      CityTour.HydraulicErosionGenerator.evaporate(terrainCoordinates);
    }*/

    // Blur erosion
    //CityTour.BlurEroder.erode(terrainCoordinates);

    return terrainCoordinates;
  };


  var flattenLowTerrain = function(terrainCoordinates, minHeightThreshold, top, right, bottom, left) {
    var x, z;

    for (x = left; x <= right; x++) {
      for (z = top; z <= bottom; z++) {
        if (terrainCoordinates[x][z].landHeight < minHeightThreshold) {
          terrainCoordinates[x][z].landHeight = minHeightThreshold;
        }
      }
    }

    return terrainCoordinates;
  };


  // Adapted from http://stevelosh.com/blog/2016/02/midpoint-displacement/
  var midpointDisplace = function(terrainCoordinates, jitterAmount, jitterDecay, top, right, bottom, left) {
    var topLeftHeight     = terrainCoordinates[top][left].landHeight;
    var topRightHeight    = terrainCoordinates[top][right].landHeight;
    var bottomLeftHeight  = terrainCoordinates[bottom][left].landHeight;
    var bottomRightHeight = terrainCoordinates[bottom][right].landHeight;

    var midY = top + ((bottom - top) / 2);
    var midX = left + ((right - left) / 2);

    var jitter;
    var newJitterAmount;
    var halfJitterAmount = jitterAmount / 2;

    // Left column
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[midY][left].landHeight = ((topLeftHeight + bottomLeftHeight) / 2) + jitter;
    // Right column
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[midY][right].landHeight = ((topRightHeight + bottomRightHeight) / 2) + jitter;
    // Top row
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[top][midX].landHeight = ((topLeftHeight + topRightHeight) / 2) + jitter;
    // Bottom row
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[bottom][midX].landHeight = ((bottomLeftHeight + bottomRightHeight) / 2) + jitter;

    // Middle
    var middleAverage = (terrainCoordinates[midY][left].landHeight + terrainCoordinates[midY][right].landHeight + terrainCoordinates[top][midX].landHeight + terrainCoordinates[bottom][midX].landHeight) / 4;
    terrainCoordinates[midY][midX].landHeight = middleAverage;

    if ((midY - top) >= 2) {
      newJitterAmount = jitterAmount * jitterDecay;
      midpointDisplace(terrainCoordinates, newJitterAmount, jitterDecay, top, midX, midY, left);
      midpointDisplace(terrainCoordinates, newJitterAmount, jitterDecay, top, right, midY, midX);
      midpointDisplace(terrainCoordinates, newJitterAmount, jitterDecay, midY, midX, bottom, left);
      midpointDisplace(terrainCoordinates, newJitterAmount, jitterDecay, midY, right, bottom, midX);
    }
  };


  // As described at https://en.wikipedia.org/wiki/Diamond-square_algorithm and http://stevelosh.com/blog/2016/06/diamond-square/
  var diamondSquare = function(terrainCoordinates, jitterAmount, jitterDecay, top, right, bottom, left) {
    var x, y, startX = 0;
    var jitter;
    var halfJitterAmount = jitterAmount / 2;
    var terms;

    var leftDiamondHeight, topDiamondHeight, rightDiamondHeight, bottomDiamondHeight;

    var width = right - left;
    var height = bottom - top;
    var halfWidth = width / 2;
    var halfHeight = height / 2;

    while(width >= 2) {
      // Square step
      for (x = left; x < right; x += width) {
        for (y = top; y < bottom; y += height) {
          jitter = (Math.random() * jitterAmount) - halfJitterAmount;
          terrainCoordinates[x + halfWidth][y + halfHeight].landHeight = ((terrainCoordinates[x][y].landHeight +
                                                                         terrainCoordinates[x + width][y].landHeight +
                                                                         terrainCoordinates[x][y + height].landHeight +
                                                                         terrainCoordinates[x + width][y + height].landHeight) / 4) + jitter;
        }
      }

      startX = 0;

      // Diamond step
      for (y = top; y <= bottom; y += halfHeight) {
        if (startX === 0) {
          startX = halfWidth;
        }
        else {
          startX = 0;
        }

        for (x = startX; x <= right; x += width) {
          terms = 4;

          if (x === left) {
            leftDiamondHeight = 0;
            terms -= 1;
          }
          else {
            leftDiamondHeight = terrainCoordinates[x - halfWidth][y].landHeight;
          }

          if (y === top) {
            topDiamondHeight = 0;
            terms -= 1;
          }
          else {
            topDiamondHeight = terrainCoordinates[x][y - halfHeight].landHeight;
          }

          if (x === right) {
            rightDiamondHeight = 0;
            terms -= 1;
          }
          else {
            rightDiamondHeight = terrainCoordinates[x + halfWidth][y].landHeight;
          }

          if (y === bottom) {
            bottomDiamondHeight = 0;
            terms -= 1;
          }
          else {
            bottomDiamondHeight = terrainCoordinates[x][y + halfHeight].landHeight;
          }

          jitter = (Math.random() * jitterAmount) - halfJitterAmount;
          terrainCoordinates[x][y].landHeight = ((leftDiamondHeight + topDiamondHeight + rightDiamondHeight + bottomDiamondHeight) / terms) + jitter;
        }
      }

      width /= 2;
      halfWidth = width / 2;
      height /= 2;
      halfHeight = height / 2;
      jitterAmount *= jitterDecay;
      halfJitterAmount = jitterAmount / 2;
    }
  };


  var terrainGenerator = {};

  terrainGenerator.generate = function(columns, rows, config) {
    var terrainCoordinates = buildTerrainCoordinates(columns, rows, config);
    return new CityTour.Terrain(terrainCoordinates, SUB_DIVISIONS);
  };

  return terrainGenerator;
})();

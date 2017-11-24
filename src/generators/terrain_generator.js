"use strict";

var CityTour = CityTour || {};

CityTour.TerrainGenerator = (function() {
  var SUB_DIVISIONS = 1;
  var MAX_INITIAL_TERRAIN_HEIGHT = 6;

  var emptyTerrain = function(columns, rows) {
    var x, z;
    var terrainCoordinates = [];

    for (x = 0; x <= columns; x++) {
      terrainCoordinates[x] = [];

      for (z = 0; z <= rows; z++) {
        terrainCoordinates[x][z] = { height: 0.0, waterHeight: 0.0 };
      }
    }

    return terrainCoordinates;
  };

  var normalizeCoordinates = function(terrainCoordinates, columns, columnsToGenerate, rows, rowsToGenerate) {
    var x, z;
    var halfColumns = columns / 2;
    var halfRows = rows / 2;
    var columnOffset = halfColumns + ((columnsToGenerate - columns) / 2);
    var rowOffset = halfRows + ((rowsToGenerate - rows) / 2);
    var stepAmount = 1 / SUB_DIVISIONS;
    var oldXIndex, oldZIndex;

    var normalizedTerrainCoordinates = [];

    for (x = -halfColumns; x <= halfColumns; x += stepAmount) {
      normalizedTerrainCoordinates[x] = [];
      oldXIndex = (x * SUB_DIVISIONS) + columnOffset;

      for (z = -halfRows; z <= halfRows; z += stepAmount) {
        oldZIndex = (z * SUB_DIVISIONS) + rowOffset;

        normalizedTerrainCoordinates[x][z] = {
          height: terrainCoordinates[oldXIndex][oldZIndex].height,
          waterHeight: terrainCoordinates[oldXIndex][oldZIndex].waterHeight,
        };
      }
    }

    return normalizedTerrainCoordinates;
  };


  var nextPowerOfTwo = function(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  };


  var buildTerrainCoordinates = function(columns, rows, config) {
    var TOTAL_HYDRAULIC_EROSION_ITERATIONS = 10;
    var hydraulicErosionIteration;
    var columnsToGenerate = nextPowerOfTwo(columns * SUB_DIVISIONS);
    var rowsToGenerate = nextPowerOfTwo(rows * SUB_DIVISIONS);

    var terrainCoordinates = emptyTerrain(columnsToGenerate, rowsToGenerate);

    // Initial randomization of corners
    terrainCoordinates[0][0].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[0][rowsToGenerate].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate][0].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate][rowsToGenerate].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    diamondSquare(terrainCoordinates,
                  config.heightJitter,
                  config.heightJitterDecay,
                  0,
                  rowsToGenerate,
                  columnsToGenerate,
                  0);

    if (config.river) {
      CityTour.RiverGenerator.addRiver(terrainCoordinates, rowsToGenerate * (68 / 128), columnsToGenerate);
    }

    // Hydraulic erosion
    for (hydraulicErosionIteration = 0; hydraulicErosionIteration < TOTAL_HYDRAULIC_EROSION_ITERATIONS; hydraulicErosionIteration++) {
      CityTour.HydraulicErosionGenerator.addRainfall(terrainCoordinates);
      CityTour.HydraulicErosionGenerator.erode(terrainCoordinates, 200);
      CityTour.HydraulicErosionGenerator.evaporate(terrainCoordinates);
    }

    // Blur erosion
    CityTour.BlurEroder.erode(terrainCoordinates);

    // Convert to final coordinates
    var finalTerrainCoordinates = normalizeCoordinates(terrainCoordinates, columns, columnsToGenerate, rows, rowsToGenerate);

    return finalTerrainCoordinates;
  };


  var flattenLowTerrain = function(terrainCoordinates, minHeightThreshold, top, right, bottom, left) {
    var x, z;

    for (x = left; x <= right; x++) {
      for (z = top; z <= bottom; z++) {
        if (terrainCoordinates[x][z].height < minHeightThreshold) {
          terrainCoordinates[x][z].height = minHeightThreshold;
        }
      }
    }

    return terrainCoordinates;
  };


  // Adapted from http://stevelosh.com/blog/2016/02/midpoint-displacement/
  var midpointDisplace = function(terrainCoordinates, jitterAmount, jitterDecay, top, right, bottom, left) {
    var topLeftHeight     = terrainCoordinates[top][left].height;
    var topRightHeight    = terrainCoordinates[top][right].height;
    var bottomLeftHeight  = terrainCoordinates[bottom][left].height;
    var bottomRightHeight = terrainCoordinates[bottom][right].height;

    var midY = top + ((bottom - top) / 2);
    var midX = left + ((right - left) / 2);

    var jitter;
    var newJitterAmount;
    var halfJitterAmount = jitterAmount / 2;

    // Left column
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[midY][left].height = ((topLeftHeight + bottomLeftHeight) / 2) + jitter;
    // Right column
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[midY][right].height = ((topRightHeight + bottomRightHeight) / 2) + jitter;
    // Top row
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[top][midX].height = ((topLeftHeight + topRightHeight) / 2) + jitter;
    // Bottom row
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[bottom][midX].height = ((bottomLeftHeight + bottomRightHeight) / 2) + jitter;

    // Middle
    var middleAverage = (terrainCoordinates[midY][left].height + terrainCoordinates[midY][right].height + terrainCoordinates[top][midX].height + terrainCoordinates[bottom][midX].height) / 4;
    terrainCoordinates[midY][midX].height = middleAverage;

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
          terrainCoordinates[x + halfWidth][y + halfHeight].height = ((terrainCoordinates[x][y].height +
                                                                      terrainCoordinates[x + width][y].height +
                                                                      terrainCoordinates[x][y + height].height +
                                                                      terrainCoordinates[x + width][y + height].height) / 4) + jitter;
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
            leftDiamondHeight = terrainCoordinates[x - halfWidth][y].height;
          }

          if (y === top) {
            topDiamondHeight = 0;
            terms -= 1;
          }
          else {
            topDiamondHeight = terrainCoordinates[x][y - halfHeight].height;
          }

          if (x === right) {
            rightDiamondHeight = 0;
            terms -= 1;
          }
          else {
            rightDiamondHeight = terrainCoordinates[x + halfWidth][y].height;
          }

          if (y === bottom) {
            bottomDiamondHeight = 0;
            terms -= 1;
          }
          else {
            bottomDiamondHeight = terrainCoordinates[x][y + halfHeight].height;
          }

          jitter = (Math.random() * jitterAmount) - halfJitterAmount;
          terrainCoordinates[x][y].height = ((leftDiamondHeight + topDiamondHeight + rightDiamondHeight + bottomDiamondHeight) / terms) + jitter;
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

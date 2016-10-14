"use strict";

var CityTour = CityTour || {};

CityTour.TerrainGenerator = (function() {
  var MAX_INITIAL_TERRAIN_HEIGHT = 6;
  var HEIGHT_JITTER_PER_ITERATION = 20;
  var HEIGHT_JITTER_DECAY_PER_ITERATION = 0.65;
  var LAND = 'land';
  var WATER = 'water';

  var emptyTerrain = function(columns, rows) {
    var x, z;
    var terrainCoordinates = [];

    for (x = 0; x <= columns; x++) {
      terrainCoordinates[x] = [];

      for (z = 0; z <= rows; z++) {
        terrainCoordinates[x][z] = { material: LAND, height: 0.0 };
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
    var material;

    var normalizedTerrainCoordinates = [];

    for (x = -halfColumns; x <= halfColumns; x++) {
      normalizedTerrainCoordinates[x] = [];

      for (z = -halfRows; z <= halfRows; z++) {
        normalizedTerrainCoordinates[x][z] = {
          material: terrainCoordinates[x + columnOffset][z + rowOffset].material,
          height: terrainCoordinates[x + columnOffset][z + rowOffset].height,
        }
      }
    }

    return normalizedTerrainCoordinates;
  };


  var nextPowerOfTwo = function(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  };


  var buildTerrainCoordinates = function(columns, rows) {
    var columnsToGenerate = nextPowerOfTwo(columns);
    var rowsToGenerate = nextPowerOfTwo(rows);

    var terrainCoordinates = emptyTerrain(columnsToGenerate, rowsToGenerate);

    // Initial randomization of corners
    terrainCoordinates[0][0].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[0][rows].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columns][0].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columns][rows].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    midpointDisplace(terrainCoordinates,
                     HEIGHT_JITTER_PER_ITERATION,
                     HEIGHT_JITTER_DECAY_PER_ITERATION,
                     0,
                     rowsToGenerate,
                     columnsToGenerate,
                     0);

    var x, z;

    var minimumRiverBankHeight = Number.POSITIVE_INFINITY;
    var z = (rows / 2) + 4;
    for (x = 0; x <= columns; x++) {
      if (terrainCoordinates[x][z].height < minimumRiverBankHeight) {
        minimumRiverBankHeight = terrainCoordinates[x][z].height;
      }
    }
    var z = rows / 2;
    for (x = 0; x <= columns; x++) {
      if (terrainCoordinates[x][z].height < minimumRiverBankHeight) {
        minimumRiverBankHeight = terrainCoordinates[x][z].height;
      }
    }

    for (z = (rows / 2) + 4; z > (rows / 2); z--) {
      for (x = 0; x <= columns; x++) {
        terrainCoordinates[x][z].material = WATER;
        terrainCoordinates[x][z].height = minimumRiverBankHeight;
      }
    }


    // Convert to final coordinates
    var finalTerrainCoordinates = normalizeCoordinates(terrainCoordinates, columns, columnsToGenerate, rows, rowsToGenerate);

    return finalTerrainCoordinates;
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

  var terrainGenerator = {};

  terrainGenerator.generate = function(columns, rows) {
    var terrainCoordinates = buildTerrainCoordinates(columns, rows);
    return new CityTour.Terrain(terrainCoordinates);
  };

  return terrainGenerator;
})();

"use strict";

var Terrain = function() {
  var buildTerrainCoordinates = function() {
    var MAX_HEIGHT = 6;
    var i, j;

    var terrainCoordinates = [];
    for (i = 0; i <= CityConfig.BLOCK_ROWS; i++) {
      terrainCoordinates[i] = [];

      for (j = 0; j <= CityConfig.BLOCK_COLUMNS; j++) {
        terrainCoordinates[i][j] = 0.0;
      }
    }

    // Initial randomization of corners
    terrainCoordinates[0][0] = Math.floor(Math.random() * MAX_HEIGHT);
    terrainCoordinates[0][CityConfig.BLOCK_COLUMNS] = Math.floor(Math.random() * MAX_HEIGHT);
    terrainCoordinates[CityConfig.BLOCK_ROWS][0] = Math.floor(Math.random() * MAX_HEIGHT);
    terrainCoordinates[CityConfig.BLOCK_ROWS][CityConfig.BLOCK_COLUMNS] = Math.floor(Math.random() * MAX_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    midpointDisplace(terrainCoordinates, 20, 0.65, 0, CityConfig.BLOCK_ROWS, CityConfig.BLOCK_COLUMNS, 0);

    // Clamp negative heights to 0
    for (i = 0; i <= CityConfig.BLOCK_ROWS; i++) {
      for (j = 0; j <= CityConfig.BLOCK_COLUMNS; j++) {
        terrainCoordinates[i][j] = Math.max(0.0, terrainCoordinates[i][j]);
      }
    }

    console.log(terrainCoordinates);

    return terrainCoordinates;
  };

  // Adapted from http://stevelosh.com/blog/2016/02/midpoint-displacement/
  var midpointDisplace = function(terrainCoordinates, jitterAmount, jitterDecay, top, right, bottom, left) {
    var topLeft = terrainCoordinates[top][left];
    var topRight = terrainCoordinates[top][right];
    var bottomLeft = terrainCoordinates[bottom][left];
    var bottomRight = terrainCoordinates[bottom][right];

    var midY = top + ((bottom - top) / 2);
    var midX = left + ((right - left) / 2);

    var jitter;

    // Left column
    jitter = (Math.random() * jitterAmount) - (jitterAmount / 2);
    terrainCoordinates[midY][left] = ((topLeft + bottomLeft) / 2) + jitter;
    // Right column
    jitter = (Math.random() * jitterAmount) - (jitterAmount / 2);
    terrainCoordinates[midY][right] = ((topRight + bottomRight) / 2) + jitter;
    // Top row
    jitter = (Math.random() * jitterAmount) - (jitterAmount / 2);
    terrainCoordinates[top][midX] = ((topLeft + bottomLeft) / 2) + jitter;
    // Bottom row
    jitter = (Math.random() * jitterAmount) - (jitterAmount / 2);
    terrainCoordinates[bottom][midX] = ((topLeft + bottomLeft) / 2) + jitter;

    // Middle
    var middleAverage = (terrainCoordinates[midY][left] + terrainCoordinates[midY][right] + terrainCoordinates[top][midX] + terrainCoordinates[bottom][midX]) / 4
    terrainCoordinates[midY][midX] = middleAverage;

    if ((midY - top) >= 2) {
      midpointDisplace(terrainCoordinates, (jitterAmount * jitterDecay), jitterDecay, top, midX, midY, left);
      midpointDisplace(terrainCoordinates, (jitterAmount * jitterDecay), jitterDecay, top, right, midY, midX);
      midpointDisplace(terrainCoordinates, (jitterAmount * jitterDecay), jitterDecay, midY, midX, bottom, left);
      midpointDisplace(terrainCoordinates, (jitterAmount * jitterDecay), jitterDecay, midY, right, bottom, midX);
    }
  };

  var terrainCoordinates = buildTerrainCoordinates();

  var terrain = {};

  terrain.coordinates = function() { return terrainCoordinates; };

  return terrain;
};

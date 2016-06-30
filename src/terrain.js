"use strict";

var Terrain = function() {
  var MAX_TERRAIN_HEIGHT = 6;
  var HEIGHT_JITTER_PER_ITERATION = 20;
  var HEIGHT_JITTER_DECAY_PER_ITERATION = 0.65;

  var buildTerrainCoordinates = function() {
    var x, z;

    var terrainCoordinates = [];
    for (x = 0; x <= CityConfig.BLOCK_COLUMNS; x++) {
      terrainCoordinates[x] = [];

      for (z = 0; z <= CityConfig.BLOCK_ROWS; z++) {
        terrainCoordinates[x][z] = 0.0;
      }
    }

    // Initial randomization of corners
    terrainCoordinates[0][0] = Math.floor(Math.random() * MAX_TERRAIN_HEIGHT);
    terrainCoordinates[0][CityConfig.BLOCK_ROWS] = Math.floor(Math.random() * MAX_TERRAIN_HEIGHT);
    terrainCoordinates[CityConfig.BLOCK_COLUMNS][0] = Math.floor(Math.random() * MAX_TERRAIN_HEIGHT);
    terrainCoordinates[CityConfig.BLOCK_COLUMNS][CityConfig.BLOCK_ROWS] = Math.floor(Math.random() * MAX_TERRAIN_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    midpointDisplace(terrainCoordinates,
                     HEIGHT_JITTER_PER_ITERATION,
                     HEIGHT_JITTER_DECAY_PER_ITERATION,
                     0,
                     CityConfig.BLOCK_ROWS,
                     CityConfig.BLOCK_COLUMNS,
                     0);

    // Clamp negative heights to 0
    for (x = 0; x <= CityConfig.BLOCK_COLUMNS; x++) {
      for (z = 0; z <= CityConfig.BLOCK_ROWS; z++) {
        terrainCoordinates[x][z] = Math.max(0.0, terrainCoordinates[x][z]);
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

  var coordinates = buildTerrainCoordinates();

  var terrain = {};

  terrain.heightAtCoordinates = function(x, z) {
    var xIsWhole = (Math.floor(x) === x);
    var zIsWhole = (Math.floor(z) === z);

    if (xIsWhole && zIsWhole) {
      return coordinates[x][z];
    }

    if (!xIsWhole && zIsWhole) {
      var leftHeight = coordinates[Math.floor(x)][z];
      var rightHeight = coordinates[Math.ceil(x)][z];
      var heightDifferential = rightHeight - leftHeight;
      var percentage = x - Math.floor(x);
      var interpolatedHeight = leftHeight + (heightDifferential * percentage);

      return interpolatedHeight;
    }
    else if (xIsWhole && !zIsWhole) {
      var topHeight = coordinates[x][Math.floor(z)];
      var bottomHeight = coordinates[x][Math.ceil(z)];
      var heightDifferential = bottomHeight - topHeight;
      var percentage = z - Math.floor(z);
      var interpolatedHeight = topHeight + (heightDifferential * percentage);

      return interpolatedHeight;
    }
  };

  return terrain;
};

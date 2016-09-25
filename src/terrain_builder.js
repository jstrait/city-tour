"use strict";

var CityTour = CityTour || {};

CityTour.TerrainBuilder = function() {
  var MAX_TERRAIN_HEIGHT = 6;
  var HEIGHT_JITTER_PER_ITERATION = 20;
  var HEIGHT_JITTER_DECAY_PER_ITERATION = 0.65;

  var emptyTerrain = function(columns, rows) {
    var x, z;
    var terrainCoordinates = [];

    for (x = 0; x <= columns; x++) {
      terrainCoordinates[x] = [];

      for (z = 0; z <= rows; z++) {
        terrainCoordinates[x][z] = 0.0;
      }
    }

    return terrainCoordinates;
  };

  var normalizeCoordinates = function(terrainCoordinates, columns, rows) {
    var halfColumns = columns / 2;
    var halfRows = rows / 2;
    var x, z;

    var normalizedTerrainCoordinates = [];

    for (x = 0; x <= columns; x++) {
      normalizedTerrainCoordinates[x - halfColumns] = [];
      for (z = 0; z <= rows; z++) {
        normalizedTerrainCoordinates[x - halfColumns][z - halfRows] = terrainCoordinates[x][z];
      }
    }

    return normalizedTerrainCoordinates;
  };


  var buildTerrainCoordinates = function(columns, rows) {
    var x, z;

    var terrainCoordinates = emptyTerrain(columns, rows);

    // Initial randomization of corners
    terrainCoordinates[0][0] = Math.floor(Math.random() * MAX_TERRAIN_HEIGHT);
    terrainCoordinates[0][rows] = Math.floor(Math.random() * MAX_TERRAIN_HEIGHT);
    terrainCoordinates[columns][0] = Math.floor(Math.random() * MAX_TERRAIN_HEIGHT);
    terrainCoordinates[columns][rows] = Math.floor(Math.random() * MAX_TERRAIN_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    midpointDisplace(terrainCoordinates,
                     HEIGHT_JITTER_PER_ITERATION,
                     HEIGHT_JITTER_DECAY_PER_ITERATION,
                     0,
                     rows,
                     columns,
                     0);

    // Clamp negative heights to 0
    for (x = 0; x <= columns; x++) {
      for (z = 0; z <= rows; z++) {
        //terrainCoordinates[x][z] = Math.max(0.0, terrainCoordinates[x][z]);
      }
    }

    // Convert to final coordinates
    var finalTerrainCoordinates = normalizeCoordinates(terrainCoordinates, columns, rows);

    return finalTerrainCoordinates;
  };

  // Adapted from http://stevelosh.com/blog/2016/02/midpoint-displacement/
  var midpointDisplace = function(terrainCoordinates, jitterAmount, jitterDecay, top, right, bottom, left) {
    var topLeftHeight     = terrainCoordinates[top][left];
    var topRightHeight    = terrainCoordinates[top][right];
    var bottomLeftHeight  = terrainCoordinates[bottom][left];
    var bottomRightHeight = terrainCoordinates[bottom][right];

    var midY = top + ((bottom - top) / 2);
    var midX = left + ((right - left) / 2);

    var jitter;
    var newJitterAmount;
    var halfJitterAmount = jitterAmount / 2;

    // Left column
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[midY][left] = ((topLeftHeight + bottomLeftHeight) / 2) + jitter;
    // Right column
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[midY][right] = ((topRightHeight + bottomRightHeight) / 2) + jitter;
    // Top row
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[top][midX] = ((topLeftHeight + topRightHeight) / 2) + jitter;
    // Bottom row
    jitter = (Math.random() * jitterAmount) - halfJitterAmount;
    terrainCoordinates[bottom][midX] = ((bottomLeftHeight + bottomRightHeight) / 2) + jitter;

    // Middle
    var middleAverage = (terrainCoordinates[midY][left] + terrainCoordinates[midY][right] + terrainCoordinates[top][midX] + terrainCoordinates[bottom][midX]) / 4;
    terrainCoordinates[midY][midX] = middleAverage;

    if ((midY - top) >= 2) {
      newJitterAmount = jitterAmount * jitterDecay;
      midpointDisplace(terrainCoordinates, newJitterAmount, jitterDecay, top, midX, midY, left);
      midpointDisplace(terrainCoordinates, newJitterAmount, jitterDecay, top, right, midY, midX);
      midpointDisplace(terrainCoordinates, newJitterAmount, jitterDecay, midY, midX, bottom, left);
      midpointDisplace(terrainCoordinates, newJitterAmount, jitterDecay, midY, right, bottom, midX);
    }
  };

  var terrainBuilder = {};

  terrainBuilder.build = function(columns, rows) {
    var terrainCoordinates = buildTerrainCoordinates(columns, rows);
    return new CityTour.Terrain(terrainCoordinates);
  };

  return terrainBuilder;
};

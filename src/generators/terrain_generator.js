"use strict";

var CityTour = CityTour || {};

CityTour.TerrainGenerator = (function() {
  var SUB_DIVISIONS = 1;
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
    var stepAmount = 1 / SUB_DIVISIONS;
    var oldXIndex, oldZIndex;

    var normalizedTerrainCoordinates = [];

    for (x = -halfColumns; x <= halfColumns; x += stepAmount) {
      normalizedTerrainCoordinates[x] = [];
      oldXIndex = (x * SUB_DIVISIONS) + columnOffset;

      for (z = -halfRows; z <= halfRows; z += stepAmount) {
        oldZIndex = (z * SUB_DIVISIONS) + rowOffset;

        normalizedTerrainCoordinates[x][z] = {
          material: terrainCoordinates[oldXIndex][oldZIndex].material,
          height: terrainCoordinates[oldXIndex][oldZIndex].height,
        }
      }
    }

    return normalizedTerrainCoordinates;
  };


  var nextPowerOfTwo = function(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  };


  var buildTerrainCoordinates = function(columns, rows) {
    var columnsToGenerate = nextPowerOfTwo(columns * SUB_DIVISIONS);
    var rowsToGenerate = nextPowerOfTwo(rows * SUB_DIVISIONS);

    var terrainCoordinates = emptyTerrain(columnsToGenerate, rowsToGenerate);

    // Initial randomization of corners
    terrainCoordinates[0][0].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[0][rowsToGenerate].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate][0].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate][rowsToGenerate].height = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    midpointDisplace(terrainCoordinates,
                     HEIGHT_JITTER_PER_ITERATION,
                     HEIGHT_JITTER_DECAY_PER_ITERATION,
                     0,
                     rowsToGenerate,
                     columnsToGenerate,
                     0);

    addRiver(terrainCoordinates, rowsToGenerate / 2, columnsToGenerate);

    // Convert to final coordinates
    var finalTerrainCoordinates = normalizeCoordinates(terrainCoordinates, columns, columnsToGenerate, rows, rowsToGenerate);

    return finalTerrainCoordinates;
  };


  var addRiver = function(terrainCoordinates, middleRow, columnsToGenerate) {
    var x, z, xStep;
    var xCoordinate, zCoordinate;
    var minimumRiverBankHeight;
    var vector, topVector, bottomVector;
    var topCurve, bottomCurve;

    topCurve = new THREE.SplineCurve([
      new THREE.Vector2(0, middleRow + 4),
      new THREE.Vector2(columnsToGenerate / 3, middleRow + 10),
      new THREE.Vector2((columnsToGenerate / 3) * 2, middleRow + 4),
      new THREE.Vector2(columnsToGenerate, middleRow + 6),
    ]);

    bottomCurve = new THREE.SplineCurve([
      new THREE.Vector2(0, middleRow + 20),
      new THREE.Vector2(columnsToGenerate / 3, middleRow + 22),
      new THREE.Vector2((columnsToGenerate / 3) * 2, middleRow + 15),
      new THREE.Vector2(columnsToGenerate, middleRow + 22),
    ]);

    xStep = 1 / columnsToGenerate;

    minimumRiverBankHeight = Number.POSITIVE_INFINITY;
    for (x = 0.0; x <= 1.0; x += xStep) {
      vector = topCurve.getPointAt(x);
      xCoordinate = Math.round(vector.x);
      zCoordinate = Math.round(vector.y);

      if (terrainCoordinates[xCoordinate][zCoordinate].height < minimumRiverBankHeight) {
        minimumRiverBankHeight = terrainCoordinates[xCoordinate][zCoordinate].height;
      }
    }
    for (x = 0.0; x <= 1.0; x += xStep) {
      vector = bottomCurve.getPointAt(x);
      xCoordinate = Math.round(vector.x);
      zCoordinate = Math.round(vector.y);

      if (terrainCoordinates[xCoordinate][zCoordinate].height < minimumRiverBankHeight) {
        minimumRiverBankHeight = terrainCoordinates[xCoordinate][zCoordinate].height;
      }
    }

    for (x = 0.0; x <= 1.0; x += xStep) {
      topVector = topCurve.getPointAt(x);
      bottomVector = bottomCurve.getPointAt(x);

      for (z = Math.ceil(topVector.y); z < bottomVector.y; z++) {
        terrainCoordinates[Math.round(topVector.x)][z].height = minimumRiverBankHeight;
      }
    }

    floodFill(terrainCoordinates, 0, topCurve.getPointAt(0.0).y, minimumRiverBankHeight, WATER);
  };


  var floodFill = function(terrainCoordinates, x, z, height, material) {
    terrainCoordinates[x][z].height = height;
    terrainCoordinates[x][z].material = material;

    if (terrainCoordinates[x - 1] &&
        terrainCoordinates[x - 1][z] &&
        terrainCoordinates[x - 1][z].height <= height &&
        terrainCoordinates[x - 1][z].material != material) { 
      floodFill(terrainCoordinates, x - 1, z, height, material);
    }
    if (terrainCoordinates[x + 1] &&
        terrainCoordinates[x + 1][z] &&
        terrainCoordinates[x + 1][z].height <= height &&
        terrainCoordinates[x + 1][z].material != material) { 
      floodFill(terrainCoordinates, x + 1, z, height, material);
    }
    if (terrainCoordinates[x] &&
        terrainCoordinates[x][z - 1] &&
        terrainCoordinates[x][z - 1].height <= height &&
        terrainCoordinates[x][z - 1].material != material) { 
      floodFill(terrainCoordinates, x, z - 1, height, material);
    }
    if (terrainCoordinates[x] &&
        terrainCoordinates[x][z + 1] &&
        terrainCoordinates[x][z + 1].height <= height &&
        terrainCoordinates[x][z + 1].material != material) { 
      floodFill(terrainCoordinates, x, z + 1, height, material);
    }
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
    return new CityTour.Terrain(terrainCoordinates, SUB_DIVISIONS);
  };

  return terrainGenerator;
})();

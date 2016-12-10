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
        terrainCoordinates[x][z] = { material: CityTour.Terrain.LAND, height: 0.0 };
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


  var buildTerrainCoordinates = function(columns, rows, config) {
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
      addRiver(terrainCoordinates, rowsToGenerate * (68 / 128), columnsToGenerate);
    }

    // Convert to final coordinates
    var finalTerrainCoordinates = normalizeCoordinates(terrainCoordinates, columns, columnsToGenerate, rows, rowsToGenerate);

    return finalTerrainCoordinates;
  };


  var generateRiverCurves = function(middleRow, columnsToGenerate) {
    var MIN_RIVER_BENDS = 3;
    var MAX_RIVER_BENDS = 8;
    var MAX_BEND_AMOUNT = 20 * SUB_DIVISIONS;
    var TOP_BANK_OFFSET = 4 * SUB_DIVISIONS;
    var BOTTOM_BANK_OFFSET = 12 * SUB_DIVISIONS;
    var TOP_BANK_MAX_JITTER = 6 * SUB_DIVISIONS;
    var HALF_TOP_BANK_MAX_JITTER = TOP_BANK_MAX_JITTER / 2;
    var BOTTOM_BANK_MAX_JITTER = 6 * SUB_DIVISIONS;
    var HALF_BOTTOM_BANK_MAX_JITTER = BOTTOM_BANK_MAX_JITTER / 2;

    var i;
    var baseCurvePoints, topCurvePoints, bottomCurvePoints;
    var randomJitter;
    var baseCurve, topCurve, bottomCurve;

    var riverSubDivisions = Math.round((Math.random() * (MAX_RIVER_BENDS - MIN_RIVER_BENDS))) + MIN_RIVER_BENDS;
    baseCurvePoints = [new THREE.Vector2(0, middleRow)];
    for (i = 1; i <= riverSubDivisions; i++) {
      var column = columnsToGenerate * i * (1 / riverSubDivisions);
      baseCurvePoints.push(new THREE.Vector2(column, middleRow + ((Math.random() * MAX_BEND_AMOUNT) - (MAX_BEND_AMOUNT / 2))));
    }
    baseCurve = new THREE.SplineCurve(baseCurvePoints);

    topCurvePoints = [];
    bottomCurvePoints = [];
    for (i = 0; i < baseCurvePoints.length; i++) {
      randomJitter = Math.round(((Math.random() * TOP_BANK_MAX_JITTER) - HALF_TOP_BANK_MAX_JITTER));
      topCurvePoints.push(new THREE.Vector2(baseCurvePoints[i].x, baseCurvePoints[i].y + TOP_BANK_OFFSET + randomJitter));

      randomJitter = Math.round(((Math.random() * BOTTOM_BANK_MAX_JITTER) - HALF_BOTTOM_BANK_MAX_JITTER));
      bottomCurvePoints.push(new THREE.Vector2(baseCurvePoints[i].x, baseCurvePoints[i].y + BOTTOM_BANK_OFFSET + randomJitter));
    }

    topCurve = new THREE.SplineCurve(topCurvePoints);
    bottomCurve = new THREE.SplineCurve(bottomCurvePoints);

    return { topCurve: topCurve, bottomCurve: bottomCurve, };
  };


  var addRiver = function(terrainCoordinates, middleRow, columnsToGenerate) {
    var x, z, xStep;
    var xCoordinate, zCoordinate;
    var minimumRiverBankHeight;
    var vector, topVector, bottomVector;

    var riverCurves = generateRiverCurves(middleRow, columnsToGenerate);
    var topCurve = riverCurves.topCurve;
    var bottomCurve = riverCurves.bottomCurve;

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

    for (x = 0.0; x <= 1.0; x += xStep / 2) {
      topVector = topCurve.getPointAt(x);
      bottomVector = bottomCurve.getPointAt(x);
      xCoordinate = Math.round(topVector.x);

      for (z = Math.ceil(topVector.y); z < bottomVector.y; z++) {
        terrainCoordinates[xCoordinate][z].height = minimumRiverBankHeight;
      }
    }

    floodFill(terrainCoordinates, 0, topCurve.getPointAt(0.0).y, minimumRiverBankHeight, CityTour.Terrain.WATER);
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

      // Diamond step
      for (y = top; y <= bottom; y += height) {
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

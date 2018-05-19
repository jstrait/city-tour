"use strict";

var CityTour = CityTour || {};

CityTour.TerrainGenerator = (function() {
  var SCALE = 1;   // Should be a power of 0.5
  var MIN_INITIAL_TERRAIN_HEIGHT = -3;
  var MAX_INITIAL_TERRAIN_HEIGHT = 3;

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
    var TOTAL_HYDRAULIC_EROSION_ITERATIONS = 500000;
    var hydraulicErosionIteration;
    var columnsToGenerate = nextPowerOfTwo(columns / SCALE) + 1;
    var rowsToGenerate = nextPowerOfTwo(rows / SCALE) + 1;

    var terrainCoordinates = emptyTerrain(columnsToGenerate, rowsToGenerate);

    // Initial randomization of corners
    terrainCoordinates[0][0].landHeight = CityTour.Math.randomInteger(MIN_INITIAL_TERRAIN_HEIGHT, MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[0][rowsToGenerate - 1].landHeight = CityTour.Math.randomInteger(MIN_INITIAL_TERRAIN_HEIGHT, MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate - 1][0].landHeight = CityTour.Math.randomInteger(MIN_INITIAL_TERRAIN_HEIGHT, MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate - 1][rowsToGenerate - 1].landHeight = CityTour.Math.randomInteger(MIN_INITIAL_TERRAIN_HEIGHT, MAX_INITIAL_TERRAIN_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    CityTour.DiamondSquareGenerator.generate(terrainCoordinates,
                                             config.heightJitter,
                                             config.heightJitterDecay,
                                             0,
                                             columnsToGenerate - 1,
                                             rowsToGenerate - 1,
                                             0);

    addRandomPyramids(terrainCoordinates, 50);

    // Hydraulic erosion
    CityTour.HydraulicErosionGenerator.erode(terrainCoordinates, TOTAL_HYDRAULIC_EROSION_ITERATIONS);

    // Blur erosion
    CityTour.BlurEroder.erode(terrainCoordinates);

    if (config.river) {
      CityTour.RiverGenerator.addRiver(terrainCoordinates, (rowsToGenerate - 1) * (68 / 128), columnsToGenerate - 1);
    }

    return terrainCoordinates;
  };

  var addRandomPyramids = function(terrainCoordinates, pyramidCount) {
    var MAX_HEIGHT = 300;
    var COLUMN_COUNT = terrainCoordinates.length;
    var ROW_COUNT = terrainCoordinates[0].length;
    var HALF_ROW_COUNT = ROW_COUNT / 2;

    var centerX, centerZ;
    var maxHeightForCenterCoordinate;
    var i;

    for (i = 0; i < pyramidCount; i++) {
      centerX = CityTour.Math.randomInteger(0, COLUMN_COUNT - 1);
      centerZ = CityTour.Math.randomInteger(0, ROW_COUNT - 1);
      maxHeightForCenterCoordinate = Math.min(MAX_HEIGHT, (Math.abs(centerZ - HALF_ROW_COUNT) / (HALF_ROW_COUNT * 0.75)) * MAX_HEIGHT);

      CityTour.TerrainShapeGenerator.addPyramid(terrainCoordinates,
                                                centerX,
                                                centerZ,
                                                CityTour.Math.randomInteger(10, 70),
                                                CityTour.Math.randomInteger(0, maxHeightForCenterCoordinate),
                                                CityTour.Math.randomInteger(10, 70));
    }
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


  var terrainGenerator = {};

  terrainGenerator.generate = function(columns, rows, config) {
    var terrainCoordinates = buildTerrainCoordinates(columns, rows, config);
    return new CityTour.Terrain(terrainCoordinates, SCALE);
  };

  return terrainGenerator;
})();
"use strict";

var CityTour = CityTour || {};

CityTour.TerrainGenerator = (function() {
  var SCALE = 1;   // Should be a power of 0.5
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
    var columnsToGenerate = nextPowerOfTwo(columns / SCALE) + 1;
    var rowsToGenerate = nextPowerOfTwo(rows / SCALE) + 1;

    var terrainCoordinates = emptyTerrain(columnsToGenerate, rowsToGenerate);

    // Initial randomization of corners
    terrainCoordinates[0][0].landHeight = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[0][rowsToGenerate - 1].landHeight = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate - 1][0].landHeight = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate - 1][rowsToGenerate - 1].landHeight = Math.floor(Math.random() * MAX_INITIAL_TERRAIN_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    CityTour.DiamondSquareGenerator.generate(terrainCoordinates,
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

    // Hydraulic erosion
    //CityTour.HydraulicErosionGenerator2.erode(terrainCoordinates, 500000);

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


  var terrainGenerator = {};

  terrainGenerator.generate = function(columns, rows, config) {
    var terrainCoordinates = buildTerrainCoordinates(columns, rows, config);
    return new CityTour.Terrain(terrainCoordinates, SCALE);
  };

  return terrainGenerator;
})();

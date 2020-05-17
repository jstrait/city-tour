"use strict";

import { CityTourMath } from "./../../math";
import { Terrain } from "./../../terrain";
import { BlurEroder } from "./blur_eroder";
import { DiamondSquareGenerator } from "./diamond_square_generator";
import { HydraulicErosionGenerator } from "./hydraulic_erosion_generator";
import { RiverGenerator } from "./river_generator";
import { TerrainShapeGenerator } from "./terrain_shape_generator";

var TerrainGenerator = (function() {
  var SCALE = 1;   // Should be a power of 0.5
  var MIN_INITIAL_TERRAIN_HEIGHT = -0.25;
  var MAX_INITIAL_TERRAIN_HEIGHT = 0.25;

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
    var TOTAL_HYDRAULIC_EROSION_ITERATIONS = 10000;
    var columnsToGenerate = nextPowerOfTwo(columns / SCALE) + 1;
    var rowsToGenerate = nextPowerOfTwo(rows / SCALE) + 1;

    var terrainCoordinates = emptyTerrain(columnsToGenerate, rowsToGenerate);

    // Initial randomization of corners
    terrainCoordinates[0][0].landHeight = CityTourMath.randomInteger(MIN_INITIAL_TERRAIN_HEIGHT, MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[0][rowsToGenerate - 1].landHeight = CityTourMath.randomInteger(MIN_INITIAL_TERRAIN_HEIGHT, MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate - 1][0].landHeight = CityTourMath.randomInteger(MIN_INITIAL_TERRAIN_HEIGHT, MAX_INITIAL_TERRAIN_HEIGHT);
    terrainCoordinates[columnsToGenerate - 1][rowsToGenerate - 1].landHeight = CityTourMath.randomInteger(MIN_INITIAL_TERRAIN_HEIGHT, MAX_INITIAL_TERRAIN_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    DiamondSquareGenerator.generate(terrainCoordinates,
                                    config.heightJitter,
                                    config.heightJitterDecay,
                                    0,
                                    columnsToGenerate - 1,
                                    rowsToGenerate - 1,
                                    0);

    addRandomPyramids(terrainCoordinates, Math.round(config.hillCount * 0.5), config.maxHillHeight, 0, 0, columnsToGenerate - 1, 6);
    addRandomPyramids(terrainCoordinates, Math.round(config.hillCount * 0.5), config.maxHillHeight, 0, rowsToGenerate - 6 - 1, columnsToGenerate - 1, rowsToGenerate - 1);

    // Hydraulic erosion
    HydraulicErosionGenerator.erode(terrainCoordinates, TOTAL_HYDRAULIC_EROSION_ITERATIONS);

    // Blur erosion
    BlurEroder.erode(terrainCoordinates);

    if (config.river) {
      RiverGenerator.addRiver(terrainCoordinates, (rowsToGenerate - 1) * (68 / 128), columnsToGenerate - 1);
    }

    return terrainCoordinates;
  };

  var addRandomPyramids = function(terrainCoordinates, pyramidCount, maxHillHeight, minX, minZ, maxX, maxZ) {
    var MIN_BASE_LENGTH = 15;
    var MAX_BASE_LENGTH = 35;
    var centerX;
    var centerZ;
    var baseLength;
    var hillHeight;
    var i;

    for (i = 0; i < pyramidCount; i++) {
      centerX = CityTourMath.randomInteger(minX, maxX);
      centerZ = CityTourMath.randomInteger(minZ, maxZ);

      baseLength = CityTourMath.randomInteger(MIN_BASE_LENGTH, MAX_BASE_LENGTH) * 2;
      hillHeight = CityTourMath.randomInteger(0, maxHillHeight);

      TerrainShapeGenerator.addCone(terrainCoordinates, centerX, centerZ, baseLength, hillHeight);
    }
  };

  var floodTerrain = function(terrainCoordinates, floodWaterHeight) {
    var x;
    var z;

    for (x = 0; x < terrainCoordinates.length; x++) {
      for(z = 0; z < terrainCoordinates[x].length; z++) {
        if (terrainCoordinates[x][z].landHeight < floodWaterHeight) {
          terrainCoordinates[x][z].waterHeight = floodWaterHeight - terrainCoordinates[x][z].landHeight;
        }
      }
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
    return new Terrain(terrainCoordinates, SCALE);
  };

  return terrainGenerator;
})();

export { TerrainGenerator };

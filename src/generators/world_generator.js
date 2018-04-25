"use strict";

var CityTour = CityTour || {};

CityTour.WorldGenerator = (function() {
  var generate = function(config) {
    var GENERATE_ROAD_NETWORK = (config.roadNetwork.present === true);
    var GENERATE_BUILDINGS = true && GENERATE_ROAD_NETWORK;

    var findLandPointNearCenter = function(terrain) {
      var x, z;
      var squareSize = 1;

      while (squareSize < config.terrain.rowCount && squareSize < config.terrain.columnCount) {
        for (x = -(squareSize - 1) / 2; x <= (squareSize - 1) / 2; x++) {
          for (z = -(squareSize - 1) / 2; z <= (squareSize - 1) / 2; z++) {
            if (terrain.waterHeightAtCoordinates(x, z) === 0.0) {
              return {x: x, z: z};
            }
          }
        }

        squareSize += 2;
      }

      return undefined;
    };

    var combinedStartTime = new Date();

    var terrainConfig = {
      heightJitter: config.terrain.heightJitter,
      heightJitterDecay: config.terrain.heightJitterDecay,
      river: (Math.random() < config.terrain.probabilityOfRiver),
    };

    var terrainStartTime = new Date();
    var terrain = CityTour.TerrainGenerator.generate(config.terrain.columnCount, config.terrain.rowCount, terrainConfig);
    var terrainEndTime = new Date();

    var cityCenter = findLandPointNearCenter(terrain);
    var centerX, centerZ;
    if (cityCenter !== undefined) {
      centerX = cityCenter.x;
      centerZ = cityCenter.z;
    }

    var neighborhoods = CityTour.NeighborhoodGenerator.generate(terrain, centerX, centerZ, config.neighborhoods.count);

    var roadConfig = {
      centerMapX: centerX,
      centerMapZ: centerZ,
      neighborhoods: {
        columnCount: config.neighborhoods.columnCount,
        rowCount: config.neighborhoods.rowCount,
      },
      safeFromDecayBlocks: config.roadNetwork.safeFromDecayBlocks,
    };

    var roadStartTime = new Date();
    var roadNetwork;
    if (!GENERATE_ROAD_NETWORK || cityCenter === undefined) {
      roadNetwork = new CityTour.RoadNetwork(terrain);
    }
    else {
      roadNetwork = CityTour.NeighborhoodRoadNetworkGenerator.generate(terrain, neighborhoods, roadConfig);
    }
    var roadEndTime = new Date();

    var zonedBlockConfig = {
      blockDistanceDecayBegins: config.zonedBlocks.blockDistanceDecayBegins,
      maxBuildingStories: config.zonedBlocks.maxBuildingStories,
    };

    var zonedBlocksStartTime = new Date();
    var zonedBlocks;
    if (!GENERATE_BUILDINGS || cityCenter === undefined) {
      zonedBlocks = [];
    }
    else {
      zonedBlocks = CityTour.ZonedBlockGenerator.generate(terrain, neighborhoods, roadNetwork, zonedBlockConfig);
    }
    var zonedBlocksEndTime = new Date();
    var buildingsStartTime = new Date();
    var buildings = CityTour.BuildingsGenerator.generate(terrain, zonedBlocks);
    var buildingsEndTime = new Date();

    var simplifierStartTime = new Date();
    //CityTour.RoadNetworkSimplifier.simplify(roadNetwork, buildings);
    var simplifierEndTime = new Date();

    var combinedEndTime = new Date();

    console.log("Time to generate world data: " + (combinedEndTime - combinedStartTime) + "ms");
    console.log("  Terrain:      " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Road Network: " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Lots:         " + (zonedBlocksEndTime - zonedBlocksStartTime) + "ms");
    console.log("  Buildings:    " + (buildingsEndTime - buildingsStartTime) + "ms");
    console.log("  Road network simplification: " + (simplifierEndTime - simplifierStartTime) + "ms");

    return {
      terrain: terrain,
      roadNetwork: roadNetwork,
      buildings: buildings,
      centerX: centerX,
      centerZ: centerZ,
    };
  };

  return {
    generate: generate,
  };
})();

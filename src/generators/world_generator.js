"use strict";

var CityTour = CityTour || {};

CityTour.WorldGenerator = (function() {
  var generate = function(config) {
    var GENERATE_ROAD_NETWORK = (config.roadNetwork.present === true);
    var GENERATE_BUILDINGS = true && GENERATE_ROAD_NETWORK;

    var terrain, neighborhoods, cityCenter, roadNetwork, zonedBlocks, buildings;
    var terrainConfig, roadConfig, zonedBlockConfig;

    var combinedStartTime, combinedEndTime;
    var terrainStartTime, terrainEndTime;
    var neighborhoodsStartTime, neighborhoodsEndTime;
    var roadStartTime, roadEndTime;
    var zonedBlocksStartTime, zonedBlocksEndTime;
    var buildingsStartTime, buildingsEndTime;
    var simplifierStartTime, simplifierEndTime;

    combinedStartTime = new Date();

    terrainConfig = {
      heightJitter: config.terrain.heightJitter,
      heightJitterDecay: config.terrain.heightJitterDecay,
      river: (Math.random() < config.terrain.probabilityOfRiver),
    };

    terrainStartTime = new Date();
    terrain = CityTour.TerrainGenerator.generate(config.terrain.columnCount, config.terrain.rowCount, terrainConfig);
    terrainEndTime = new Date();

    neighborhoodsStartTime = new Date();
    neighborhoods = CityTour.NeighborhoodGenerator.generate(terrain, config.neighborhoods.count);
    cityCenter = { x: neighborhoods[0].centerX, z: neighborhoods[0].centerZ };
    neighborhoodsEndTime = new Date();

    roadConfig = {
      centerMapX: neighborhoods[0].centerX,
      centerMapZ: neighborhoods[0].centerZ,
      neighborhoods: {
        columnCount: config.neighborhoods.columnCount,
        rowCount: config.neighborhoods.rowCount,
      },
      safeFromDecayBlocks: config.roadNetwork.safeFromDecayBlocks,
    };

    roadStartTime = new Date();
    if (!GENERATE_ROAD_NETWORK || cityCenter === undefined) {
      roadNetwork = new CityTour.RoadNetwork(terrain);
    }
    else {
      roadNetwork = CityTour.NeighborhoodRoadNetworkGenerator.generate(terrain, neighborhoods, roadConfig);
    }
    roadEndTime = new Date();

    zonedBlockConfig = {
      blockDistanceDecayBegins: config.zonedBlocks.blockDistanceDecayBegins,
      maxBuildingStories: config.zonedBlocks.maxBuildingStories,
    };

    zonedBlocksStartTime = new Date();
    zonedBlocks;
    if (!GENERATE_BUILDINGS || cityCenter === undefined) {
      zonedBlocks = [];
    }
    else {
      zonedBlocks = CityTour.ZonedBlockGenerator.generate(terrain, neighborhoods, roadNetwork, zonedBlockConfig);
    }
    zonedBlocksEndTime = new Date();
    buildingsStartTime = new Date();
    buildings = CityTour.BuildingsGenerator.generate(terrain, zonedBlocks);
    buildingsEndTime = new Date();

    simplifierStartTime = new Date();
    //CityTour.RoadNetworkSimplifier.simplify(roadNetwork, buildings);
    simplifierEndTime = new Date();

    combinedEndTime = new Date();

    console.log("Time to generate world data: " + (combinedEndTime - combinedStartTime) + "ms");
    console.log("  Terrain:       " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Neighborhoods: " + (neighborhoodsEndTime - neighborhoodsStartTime) + "ms");
    console.log("  Road Network:  " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Lots:          " + (zonedBlocksEndTime - zonedBlocksStartTime) + "ms");
    console.log("  Buildings:     " + (buildingsEndTime - buildingsStartTime) + "ms");
    console.log("  Road network simplification: " + (simplifierEndTime - simplifierStartTime) + "ms");

    return {
      terrain: terrain,
      roadNetwork: roadNetwork,
      buildings: buildings,
      centerX: cityCenter.x,
      centerZ: cityCenter.z,
    };
  };

  return {
    generate: generate,
  };
})();

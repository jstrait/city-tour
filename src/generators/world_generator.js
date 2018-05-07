"use strict";

var CityTour = CityTour || {};

CityTour.WorldGenerator = (function() {
  var generate = function(config) {
    var GENERATE_ROAD_NETWORK = (config.roadNetwork.present === true);
    var GENERATE_BUILDINGS = true && GENERATE_ROAD_NETWORK;

    var combinedStartTime = new Date();

    var terrainConfig = {
      heightJitter: config.terrain.heightJitter,
      heightJitterDecay: config.terrain.heightJitterDecay,
      river: (Math.random() < config.terrain.probabilityOfRiver),
    };

    var terrainStartTime = new Date();
    var terrain = CityTour.TerrainGenerator.generate(config.terrain.columnCount, config.terrain.rowCount, terrainConfig);
    var terrainEndTime = new Date();

    var neighborhoodsStartTime = new Date();
    var neighborhoods = CityTour.NeighborhoodGenerator.generate(terrain, config.neighborhoods.count);
    var cityCenter = { x: neighborhoods[0].centerX, z: neighborhoods[0].centerZ };
    var neighborhoodsEndTime = new Date();

    var roadConfig = {
      centerMapX: neighborhoods[0].centerX,
      centerMapZ: neighborhoods[0].centerZ,
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

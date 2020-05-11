"use strict";

import { BuildingsGenerator } from "./buildings_generator";
import { NeighborhoodGenerator } from "./neighborhood_generator";
import { NeighborhoodRoadNetworkGenerator } from "./neighborhood_road_network_generator";
import { RoadNetworkSimplifier } from "./road_network_simplifier";
import { ZonedBlockGenerator } from "./zoned_block_generator";
import { TerrainGenerator } from "./terrain/terrain_generator";

var WorldGenerator = (function() {
  var generate = function(config) {
    var GENERATE_ROAD_NETWORK = (config.roadNetwork.present === true && config.neighborhoods.count > 0);
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
      hillCount: config.terrain.hillCount,
      maxHillHeight: config.terrain.maxHillHeight,
      river: (Math.random() < config.terrain.probabilityOfRiver),
    };

    terrainStartTime = new Date();
    terrain = TerrainGenerator.generate(config.terrain.columnCount, config.terrain.rowCount, terrainConfig);
    terrainEndTime = new Date();

    neighborhoodsStartTime = new Date();
    if (config.neighborhoods.count <= 0) {
      neighborhoods = [];
    }
    else {
      neighborhoods = NeighborhoodGenerator.generate(terrain, config.neighborhoods.count);
    }
    neighborhoodsEndTime = new Date();

    roadStartTime = new Date();
    if (!GENERATE_ROAD_NETWORK) {
      roadNetwork = new RoadNetwork(terrain);
    }
    else {
      roadConfig = {
        centerX: neighborhoods[0].centerX,
        centerZ: neighborhoods[0].centerZ,
        neighborhoods: {
          columnCount: config.neighborhoods.columnCount,
          rowCount: config.neighborhoods.rowCount,
        },
        safeFromDecayBlocks: config.roadNetwork.safeFromDecayBlocks,
        maxRoadAngle: config.roadNetwork.maxRoadAngle,
      };

      roadNetwork = NeighborhoodRoadNetworkGenerator.generate(terrain, neighborhoods, roadConfig);
    }
    roadEndTime = new Date();

    zonedBlockConfig = {
      blockDistanceDecayBegins: config.zonedBlocks.blockDistanceDecayBegins,
      maxBuildingStories: config.zonedBlocks.maxBuildingStories,
    };

    zonedBlocksStartTime = new Date();
    zonedBlocks;
    if (!GENERATE_BUILDINGS) {
      zonedBlocks = [];
    }
    else {
      zonedBlocks = ZonedBlockGenerator.generate(terrain, neighborhoods, roadNetwork, zonedBlockConfig);
    }
    zonedBlocksEndTime = new Date();
    buildingsStartTime = new Date();
    buildings = BuildingsGenerator.generate(terrain, zonedBlocks);
    buildingsEndTime = new Date();

    simplifierStartTime = new Date();
    //RoadNetworkSimplifier.simplify(roadNetwork, buildings);
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
      neighborhoods: neighborhoods,
      centerX: (neighborhoods.length >= 1) ? neighborhoods[0].centerX : undefined,
      centerZ: (neighborhoods.length >= 1) ? neighborhoods[0].centerZ : undefined,
    };
  };

  return {
    generate: generate,
  };
})();

export { WorldGenerator };

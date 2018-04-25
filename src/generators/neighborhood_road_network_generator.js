"use strict";

var CityTour = CityTour || {};

CityTour.NeighborhoodRoadNetworkGenerator = (function() {
  var MAX_STEEPNESS = Math.PI / 6;

  var buildRoadNetwork = function(terrain, neighborhoods, config) {
    var roadNetwork = new CityTour.RoadNetwork(terrain);
    var i;

    buildNeighborhood(terrain, roadNetwork, neighborhoods[0].centerX, neighborhoods[0].centerZ, config);

    for (i = 1; i < neighborhoods.length; i++) {
      buildRoadBetweenNeighborhoods(terrain, roadNetwork, neighborhoods[i].centerX, neighborhoods[i].centerZ, config.centerMapX, config.centerMapZ);
      buildNeighborhood(terrain, roadNetwork, neighborhoods[i].centerX, neighborhoods[i].centerZ, config);
    }

    return roadNetwork;
  };

  var buildRoadBetweenNeighborhoods = function(terrain, roadNetwork, mapX1, mapZ1, mapX2, mapZ2) {
    var terrainCandidateRoadNetwork = new CityTour.TerrainCandidateRoadNetwork(terrain);
    var pathFinder = new CityTour.PathFinder(terrainCandidateRoadNetwork);

    var targetPredicate = function(x, z) {
      return roadNetwork.hasIntersection(x, z);
    };

    var shortestPath = pathFinder.shortestPath(mapX1, mapZ1, mapX2, mapZ2, targetPredicate);
    var previousIntersectionX, previousIntersectionZ;
    var i;

    previousIntersectionX = mapX1;
    previousIntersectionZ = mapZ1;
    for (i = 0; i < shortestPath.length; i++) {
      roadNetwork.addEdge(previousIntersectionX, previousIntersectionZ, shortestPath[i][0], shortestPath[i][1], 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
      previousIntersectionX = shortestPath[i][0];
      previousIntersectionZ = shortestPath[i][1];
    }
  };

  var buildNeighborhood = function(terrain, roadNetwork, neighborhoodCenterX, neighborhoodCenterZ, config) {
    var MIN_MAP_X = Math.max(terrain.minMapX(), -(config.neighborhoods.columnCount / 2) + neighborhoodCenterX);
    var MAX_MAP_X = Math.min(terrain.maxMapX(), (config.neighborhoods.columnCount / 2) + neighborhoodCenterX);
    var MIN_MAP_Z = Math.max(terrain.minMapZ(), -(config.neighborhoods.rowCount / 2) + neighborhoodCenterZ);
    var MAX_MAP_Z = Math.min(terrain.maxMapZ(), (config.neighborhoods.rowCount / 2) + neighborhoodCenterZ);

    var DISTANCE_TO_NEIGHBORHOOD_BOUNDARY = Math.min(config.neighborhoods.columnCount / 2, config.neighborhoods.rowCount / 2);
    var SAFE_FROM_DECAY_DISTANCE = config.safeFromDecayBlocks;

    var probabilityOfBranching = function(mapX1, mapZ1, mapX2, mapZ2) {
      // Guarantee roads along x and z axes
      if (mapX1 === neighborhoodCenterX && mapX2 === neighborhoodCenterX && mapZ2 >= MIN_MAP_Z && mapZ2 <= MAX_MAP_Z) {
        return 1.0;
      }
      else if (mapZ1 === neighborhoodCenterZ && mapZ2 === neighborhoodCenterZ && mapX2 >= MIN_MAP_X && mapX2 <= MAX_MAP_X) {
        return 1.0;
      }

      var distanceFromCenter = CityTour.Math.distanceBetweenPoints(neighborhoodCenterX, neighborhoodCenterZ, mapX1, mapZ1);
      var normalizedPercentageFromCenter;

      if (distanceFromCenter <= SAFE_FROM_DECAY_DISTANCE) {
        return 1.0;
      }

      normalizedPercentageFromCenter = (distanceFromCenter - SAFE_FROM_DECAY_DISTANCE) / (DISTANCE_TO_NEIGHBORHOOD_BOUNDARY - SAFE_FROM_DECAY_DISTANCE);
      return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
    };

    var isTerrainTooSteep = function(terrain, mapX, mapZ, targetMapX, targetMapZ) {
      var heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
      var heightAtPoint2 = terrain.heightAtCoordinates(targetMapX, targetMapZ);
      var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_DEPTH);

      return Math.abs(angle) > MAX_STEEPNESS;
    };

    var shouldConnectIntersections = function(terrain, mapX1, mapZ1, mapX2, mapZ2) {
      var edgeIsOnLand = terrain.waterHeightAtCoordinates(mapX1, mapZ1) === 0.0 &&
                         terrain.waterHeightAtCoordinates(mapX2, mapZ2) === 0.0;

      return edgeIsOnLand &&
             (Math.random() < probabilityOfBranching(mapX1, mapZ1, mapX2, mapZ2)) &&
             !isTerrainTooSteep(terrain, mapX1, mapZ1, mapX2, mapZ2);
    };

    var branchFromIntersection = function(terrain, roadNetwork, mapX, mapZ) {
      connectIntersections(terrain, roadNetwork, mapX, mapZ, mapX - 1, mapZ);
      connectIntersections(terrain, roadNetwork, mapX, mapZ, mapX, mapZ - 1);
      connectIntersections(terrain, roadNetwork, mapX, mapZ, mapX + 1, mapZ);
      connectIntersections(terrain, roadNetwork, mapX, mapZ, mapX, mapZ + 1);
    };


    var connectIntersections = function(terrain, roadNetwork, mapX, mapZ, targetMapX, targetMapZ) {
      var bridgeAttributes;
      var bridgeIntersectionX, bridgeIntersectionZ;
      var targetIntersectionExists;

      if (targetMapX < MIN_MAP_X || targetMapX > MAX_MAP_X || targetMapZ < MIN_MAP_Z || targetMapZ > MAX_MAP_Z) {
        return;
      }

      if (terrain.waterHeightAtCoordinates(targetMapX, targetMapZ) > 0.0) {
        bridgeAttributes = CityTour.BridgeGenerator.buildBridge(terrain, roadNetwork, mapX, mapZ, targetMapX, targetMapZ, config);

        if (bridgeAttributes !== null) {
          bridgeIntersectionX = mapX;
          bridgeIntersectionZ = mapZ;
          while (bridgeIntersectionX !== bridgeAttributes.endX || bridgeIntersectionZ !== bridgeAttributes.endZ) {
            roadNetwork.addEdge(bridgeIntersectionX,
                                bridgeIntersectionZ,
                                bridgeIntersectionX + bridgeAttributes.xDelta,
                                bridgeIntersectionZ + bridgeAttributes.zDelta,
                                bridgeAttributes.roadDeckHeight,
                                CityTour.RoadNetwork.BRIDGE_SURFACE);
            bridgeIntersectionX += bridgeAttributes.xDelta;
            bridgeIntersectionZ += bridgeAttributes.zDelta;
          }

          branchFromIntersection(terrain, roadNetwork, bridgeAttributes.endX, bridgeAttributes.endZ);
        }
      }
      else {
        if (shouldConnectIntersections(terrain, mapX, mapZ, targetMapX, targetMapZ)) {
          targetIntersectionExists = roadNetwork.hasIntersection(targetMapX, targetMapZ);

          roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
          if (!targetIntersectionExists) {
            branchFromIntersection(terrain, roadNetwork, targetMapX, targetMapZ);
          }
        }
      }
    };

    branchFromIntersection(terrain, roadNetwork, neighborhoodCenterX, neighborhoodCenterZ);
  };


  return {
    generate: function(terrain, neighborhoods, config) {
      return buildRoadNetwork(terrain, neighborhoods, config);
    },
  };

  return neighborhoodRoadNetworkGenerator;
})();

"use strict";

var CityTour = CityTour || {};

CityTour.NeighborhoodRoadNetworkGenerator = (function() {
  var BRIDGE_CONFIG = {
    centerMapX: 0,
    centerMapZ: 0,
    safeFromDecayBlocks: Number.POSITIVE_INFINITY,
    probability: 1.0,
  };

  var buildRoadNetwork = function(terrain, neighborhoods, config) {
    var terrainCandidateRoadNetwork = new CityTour.TerrainCandidateRoadNetwork(terrain);
    var pathFinder = new CityTour.PathFinder(terrainCandidateRoadNetwork);
    var roadNetwork = new CityTour.RoadNetwork(terrain);
    var targetPredicate = function(x, z) {
      return roadNetwork.hasIntersection(x, z);
    };
    var shortestPathToRestOfCity;
    var i;

    CityTour.CircleGrowthRoadGenerator.addNeighborhoodRoads(terrain, roadNetwork, neighborhoods[0].centerX, neighborhoods[0].centerZ, config);

    for (i = 1; i < neighborhoods.length; i++) {
      shortestPathToRestOfCity = pathFinder.shortestPath(neighborhoods[i].centerX, neighborhoods[i].centerZ, config.centerMapX, config.centerMapZ, targetPredicate);
      if (shortestPathToRestOfCity !== undefined) {
        buildRoadBetweenNeighborhoods(terrain, roadNetwork, neighborhoods[i].centerX, neighborhoods[i].centerZ, shortestPathToRestOfCity);
        CityTour.CircleGrowthRoadGenerator.addNeighborhoodRoads(terrain, roadNetwork, neighborhoods[i].centerX, neighborhoods[i].centerZ, config);
      }
    }

    return roadNetwork;
  };

  var buildRoadBetweenNeighborhoods = function(terrain, roadNetwork, startMapX, startMapZ, path) {
    var previousIntersectionX, previousIntersectionZ;
    var bridgeAttributes, bridgeIntersectionX, bridgeIntersectionZ;
    var i;

    previousIntersectionX = startMapX;
    previousIntersectionZ = startMapZ;
    for (i = 0; i < path.length; i++) {
      // Assumption is that a distance larger than 1 means a bridge, since normal on-surface road paths will involve steps between adjacent
      // coordinates with length 1.
      if (CityTour.Math.distanceBetweenPoints(previousIntersectionX, previousIntersectionZ, path[i][0], path[i][1]) > 1.0) {
        if (path[i][1] > previousIntersectionZ) {
          // North -> South
          bridgeAttributes = CityTour.BridgeGenerator.buildBridge(terrain, roadNetwork, previousIntersectionX, previousIntersectionZ, previousIntersectionX, previousIntersectionZ + 1, BRIDGE_CONFIG);
        }
        else if (path[i][1] < previousIntersectionZ) {
          // South -> North
          bridgeAttributes = CityTour.BridgeGenerator.buildBridge(terrain, roadNetwork, previousIntersectionX, previousIntersectionZ, previousIntersectionX, previousIntersectionZ - 1, BRIDGE_CONFIG);
        }
        else if (path[i][0] > previousIntersectionX) {
          // West -> East
          bridgeAttributes = CityTour.BridgeGenerator.buildBridge(terrain, roadNetwork, previousIntersectionX, previousIntersectionZ, previousIntersectionX + 1, previousIntersectionZ, BRIDGE_CONFIG);
        }
        else if (path[i][0] < previousIntersectionX) {
          // East -> West
          bridgeAttributes = CityTour.BridgeGenerator.buildBridge(terrain, roadNetwork, previousIntersectionX, previousIntersectionZ, previousIntersectionX - 1, previousIntersectionZ, BRIDGE_CONFIG);
        }

        if (bridgeAttributes !== undefined) {
          bridgeIntersectionX = previousIntersectionX;
          bridgeIntersectionZ = previousIntersectionZ;
          while (bridgeIntersectionX !== bridgeAttributes.endX || bridgeIntersectionZ !== bridgeAttributes.endZ) {
            roadNetwork.addEdge(bridgeIntersectionX,
                                bridgeIntersectionZ,
                                bridgeIntersectionX + bridgeAttributes.xDelta,
                                bridgeIntersectionZ + bridgeAttributes.zDelta,
                                bridgeAttributes.roadDeckHeight,
                                1.0,
                                CityTour.RoadNetwork.BRIDGE_SURFACE);
            bridgeIntersectionX += bridgeAttributes.xDelta;
            bridgeIntersectionZ += bridgeAttributes.zDelta;
          }
        }
      }
      else {
        roadNetwork.addEdge(previousIntersectionX, previousIntersectionZ, path[i][0], path[i][1], 0.0, 1.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
      }

      previousIntersectionX = path[i][0];
      previousIntersectionZ = path[i][1];
    }
  };


  return {
    generate: buildRoadNetwork,
  };
})();

"use strict";

import { CityTourMath } from "./../math";
import { PathFinder } from "./../path_finder";
import { RoadNetwork } from "./../road_network";
import { TerrainCandidateRoadNetwork } from "./../terrain_candidate_road_network";
import { BridgeGenerator } from "./bridge_generator";
import { CircleGrowthRoadGenerator } from "./circle_growth_road_generator";

var NeighborhoodRoadNetworkGenerator = (function() {
  var buildRoadNetwork = function(terrain, neighborhoods, config) {
    var roadNetwork = new RoadNetwork(terrain);
    var terrainCandidateRoadNetwork = new TerrainCandidateRoadNetwork(terrain, roadNetwork, config.maxRoadAngle);
    var pathFinder = new PathFinder(terrainCandidateRoadNetwork);
    var targetPredicate = function(x, z) {
      return roadNetwork.hasIntersection(x, z);
    };
    var shortestPathToRestOfCity;
    var i;

    CircleGrowthRoadGenerator.addNeighborhoodRoads(terrain, roadNetwork, neighborhoods[0].centerX, neighborhoods[0].centerZ, config);

    for (i = 1; i < neighborhoods.length; i++) {
      shortestPathToRestOfCity = pathFinder.shortestPath(neighborhoods[i].centerX, neighborhoods[i].centerZ, neighborhoods[0].centerX, neighborhoods[0].centerZ, targetPredicate);
      if (shortestPathToRestOfCity !== undefined) {
        buildRoadBetweenNeighborhoods(terrain, roadNetwork, neighborhoods[i].centerX, neighborhoods[i].centerZ, shortestPathToRestOfCity);
        CircleGrowthRoadGenerator.addNeighborhoodRoads(terrain, roadNetwork, neighborhoods[i].centerX, neighborhoods[i].centerZ, config);
      }
    }

    return roadNetwork;
  };

  var buildRoadBetweenNeighborhoods = function(terrain, roadNetwork, startX, startZ, path) {
    var previousIntersectionX, previousIntersectionZ;
    var nextIntersectionX, nextIntersectionZ;
    var isBridge;
    var bridgeAttributes, bridgeIntersectionX, bridgeIntersectionZ;
    var i;

    previousIntersectionX = startX;
    previousIntersectionZ = startZ;
    for (i = 0; i < path.length; i++) {
      nextIntersectionX = path[i].x;
      nextIntersectionZ = path[i].z;

      // Assumption is that a distance larger than 1 means a bridge, since normal on-surface road paths will involve steps between adjacent
      // coordinates with length 1.
      isBridge = CityTourMath.distanceBetweenPoints(previousIntersectionX, previousIntersectionZ, nextIntersectionX, nextIntersectionZ) > 1.0;

      if (isBridge === true) {
        bridgeAttributes = BridgeGenerator.buildBridge(terrain,
                                                       roadNetwork,
                                                       previousIntersectionX,
                                                       previousIntersectionZ,
                                                       Math.sign(nextIntersectionX - previousIntersectionX),
                                                       Math.sign(nextIntersectionZ - previousIntersectionZ));

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
                                RoadNetwork.BRIDGE_GRADE);
            bridgeIntersectionX += bridgeAttributes.xDelta;
            bridgeIntersectionZ += bridgeAttributes.zDelta;
          }
        }
      }
      else {
        roadNetwork.addEdge(previousIntersectionX, previousIntersectionZ, nextIntersectionX, nextIntersectionZ, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
      }

      previousIntersectionX = nextIntersectionX;
      previousIntersectionZ = nextIntersectionZ;
    }
  };


  return {
    generate: buildRoadNetwork,
  };
})();

export { NeighborhoodRoadNetworkGenerator };

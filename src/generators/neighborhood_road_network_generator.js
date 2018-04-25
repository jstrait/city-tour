"use strict";

var CityTour = CityTour || {};

CityTour.NeighborhoodRoadNetworkGenerator = (function() {
  var buildRoadNetwork = function(terrain, neighborhoods, config) {
    var roadNetwork = new CityTour.RoadNetwork(terrain);
    var i;

    CityTour.CircleGrowthRoadGenerator.addNeighborhoodRoads(terrain, roadNetwork, neighborhoods[0].centerX, neighborhoods[0].centerZ, config);

    for (i = 1; i < neighborhoods.length; i++) {
      buildRoadBetweenNeighborhoods(terrain, roadNetwork, neighborhoods[i].centerX, neighborhoods[i].centerZ, config.centerMapX, config.centerMapZ);
      CityTour.CircleGrowthRoadGenerator.addNeighborhoodRoads(terrain, roadNetwork, neighborhoods[i].centerX, neighborhoods[i].centerZ, config);
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


  return {
    generate: buildRoadNetwork,
  };
})();

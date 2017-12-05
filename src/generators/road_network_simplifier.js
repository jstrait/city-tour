"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetworkSimplifier = (function() {
  var simplify = function(roadNetwork, buildings) {
    var mapX, mapZ, targetMapX, targetMapZ;
    var southEastBlock, northEastBlock, southWestBlock;
    var southEastBlockHasBuildings, northEastBlockHasBuildings, southWestBlockHasBuildings;

    var pathFinder = new CityTour.PathFinder(roadNetwork);

    for (mapX = roadNetwork.minColumn(); mapX < roadNetwork.maxColumn(); mapX++) {
      for (mapZ = roadNetwork.minRow(); mapZ < roadNetwork.maxRow(); mapZ++) {
        targetMapX = mapX + 1;
        targetMapZ = mapZ;

        // Road to the east
        if (roadNetwork.hasEdgeBetween(mapX, mapZ, targetMapX, targetMapZ) &&
            roadNetwork.edgeBetween(mapX, mapZ, targetMapX, targetMapZ) === CityTour.RoadNetwork.TERRAIN_SURFACE) {
          southEastBlock = buildings.blockAtCoordinates(mapX, mapZ) || [];
          northEastBlock = buildings.blockAtCoordinates(mapX, mapZ - 1) || [];

          southEastBlockHasBuildings = southEastBlock && (southEastBlock.length > 0);
          northEastBlockHasBuildings = northEastBlock && (northEastBlock.length > 0);

          if (southEastBlockHasBuildings === false && northEastBlockHasBuildings === false) {
            roadNetwork.removeEdge(mapX, mapZ, targetMapX, targetMapZ);

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (roadNetwork.hasIntersection(mapX, mapZ) &&
                roadNetwork.hasIntersection(targetMapX, targetMapZ) &&
                pathFinder.shortestPath(mapX, mapZ, targetMapX, targetMapZ) === undefined) {
              roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
            }
          }
        }

        targetMapX = mapX;
        targetMapZ = mapZ + 1;

        // Road the south
        if (roadNetwork.hasEdgeBetween(mapX, mapZ, targetMapX, targetMapZ) &&
            roadNetwork.edgeBetween(mapX, mapZ, targetMapX, targetMapZ) === CityTour.RoadNetwork.TERRAIN_SURFACE) {
          southWestBlock = buildings.blockAtCoordinates(mapX - 1, mapZ) || [];
          southEastBlock = buildings.blockAtCoordinates(mapX, mapZ) || [];

          southWestBlockHasBuildings = southWestBlock && (southWestBlock.length > 0);
          southEastBlockHasBuildings = southEastBlock && (southEastBlock.length > 0);

          if (southWestBlockHasBuildings === false && southEastBlockHasBuildings === false) {
            roadNetwork.removeEdge(mapX, mapZ, targetMapX, targetMapZ);

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (roadNetwork.hasIntersection(mapX, mapZ) &&
                roadNetwork.hasIntersection(targetMapX, targetMapZ) &&
                pathFinder.shortestPath(mapX, mapZ, targetMapX, targetMapZ) === undefined) {
              roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
            }
          }
        }
      }
    }
  };

  return {
    simplify: simplify,
  };
})();

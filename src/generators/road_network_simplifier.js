"use strict";

var CityTour = CityTour || {};

CityTour.RoadNetworkSimplifier = (function() {
  var blockHasBottomTouchingBuilding = function(block) {
    var l;

    for (l = 0; l < block.length; l++) {
      if (block[l].dimensions.bottom === 1.0) {
        return true;
      }
    }

    return false;
  };

  var blockHasTopTouchingBuilding = function(block) {
    var l;

    for (l = 0; l < block.length; l++) {
      if (block[l].dimensions.top === 0.0) {
        return true;
      }
    }

    return false;
  };

  var blockHasLeftTouchingBuilding = function(block) {
    var l;

    for (l = 0; l < block.length; l++) {
      if (block[l].dimensions.left === 0.0) {
        return true;
      }
    }

    return false;
  };

  var blockHasRightTouchingBuilding = function(block) {
    var l;

    for (l = 0; l < block.length; l++) {
      if (block[l].dimensions.right === 1.0) {
        return true;
      }
    }

    return false;
  };

  var simplifyHelper = function(roadNetwork, buildings) {
    var mapX, mapZ, targetMapX, targetMapZ;
    var southWestBlock, northWestBlock, southEastBlock, northEastBlock;
    var southWestBlockHasBuildings, northWestBlockHasBuildings, southEastBlockHasBuildings, northEastBlockHasBuildings;

    var pathFinder = new CityTour.PathFinder(roadNetwork);

    var roadNetworkMinColumn = roadNetwork.minColumn();
    var roadNetworkMaxColumn = roadNetwork.maxColumn();
    var roadNetworkMinRow = roadNetwork.minRow();
    var roadNetworkMaxRow = roadNetwork.maxRow();

    var edgesRemovedCount = 0;

    // Road to the east
    for (mapX = roadNetworkMinColumn; mapX < roadNetworkMaxColumn; mapX++) {
      for (mapZ = roadNetworkMinRow; mapZ < roadNetworkMaxRow; mapZ++) {
        targetMapX = mapX + 1;
        targetMapZ = mapZ;

        if (roadNetwork.hasEdgeBetween(mapX, mapZ, targetMapX, targetMapZ) &&
            roadNetwork.edgeBetween(mapX, mapZ, targetMapX, targetMapZ).surfaceType === CityTour.RoadNetwork.TERRAIN_SURFACE) {
          southEastBlock = buildings.blockAtCoordinates(mapX, mapZ);
          northEastBlock = buildings.blockAtCoordinates(mapX, mapZ - 1);

          southEastBlockHasBuildings = blockHasTopTouchingBuilding(southEastBlock);
          northEastBlockHasBuildings = blockHasBottomTouchingBuilding(northEastBlock);

          if (southEastBlockHasBuildings === false && northEastBlockHasBuildings === false) {
            roadNetwork.removeEdge(mapX, mapZ, targetMapX, targetMapZ);
            edgesRemovedCount += 1;

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (roadNetwork.hasIntersection(mapX, mapZ) &&
                roadNetwork.hasIntersection(targetMapX, targetMapZ) &&
                pathFinder.shortestPath(mapX, mapZ, targetMapX, targetMapZ) === undefined) {
              roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    // Road to the west
    for (mapX = roadNetworkMaxColumn; mapX > roadNetworkMinColumn; mapX--) {
      for (mapZ = roadNetworkMinRow; mapZ < roadNetworkMaxRow; mapZ++) {
        targetMapX = mapX - 1;
        targetMapZ = mapZ;

        if (roadNetwork.hasEdgeBetween(mapX, mapZ, targetMapX, targetMapZ) &&
            roadNetwork.edgeBetween(mapX, mapZ, targetMapX, targetMapZ).surfaceType === CityTour.RoadNetwork.TERRAIN_SURFACE) {
          southWestBlock = buildings.blockAtCoordinates(mapX - 1, mapZ);
          northWestBlock = buildings.blockAtCoordinates(mapX - 1, mapZ - 1);

          southWestBlockHasBuildings = blockHasTopTouchingBuilding(southWestBlock);
          northWestBlockHasBuildings = blockHasBottomTouchingBuilding(northWestBlock);

          if (southWestBlockHasBuildings === false && northWestBlockHasBuildings === false) {
            roadNetwork.removeEdge(mapX, mapZ, targetMapX, targetMapZ);
            edgesRemovedCount += 1;

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (roadNetwork.hasIntersection(mapX, mapZ) &&
                roadNetwork.hasIntersection(targetMapX, targetMapZ) &&
                pathFinder.shortestPath(mapX, mapZ, targetMapX, targetMapZ) === undefined) {
              roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    // Road the south
    for (mapX = roadNetworkMinColumn; mapX < roadNetworkMaxColumn; mapX++) {
      for (mapZ = roadNetworkMinRow; mapZ < roadNetworkMaxRow; mapZ++) {
        targetMapX = mapX;
        targetMapZ = mapZ + 1;

        if (roadNetwork.hasEdgeBetween(mapX, mapZ, targetMapX, targetMapZ) &&
            roadNetwork.edgeBetween(mapX, mapZ, targetMapX, targetMapZ).surfaceType === CityTour.RoadNetwork.TERRAIN_SURFACE) {
          southWestBlock = buildings.blockAtCoordinates(mapX - 1, mapZ);
          southEastBlock = buildings.blockAtCoordinates(mapX, mapZ);

          southWestBlockHasBuildings = blockHasRightTouchingBuilding(southWestBlock);
          southEastBlockHasBuildings = blockHasLeftTouchingBuilding(southEastBlock);

          if (southWestBlockHasBuildings === false && southEastBlockHasBuildings === false) {
            roadNetwork.removeEdge(mapX, mapZ, targetMapX, targetMapZ);
            edgesRemovedCount += 1;

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (roadNetwork.hasIntersection(mapX, mapZ) &&
                roadNetwork.hasIntersection(targetMapX, targetMapZ) &&
                pathFinder.shortestPath(mapX, mapZ, targetMapX, targetMapZ) === undefined) {
              roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    // Road the north
    for (mapX = roadNetworkMinColumn; mapX < roadNetworkMaxColumn; mapX++) {
      for (mapZ = roadNetworkMaxRow; mapZ > roadNetworkMinRow; mapZ--) {
        targetMapX = mapX;
        targetMapZ = mapZ - 1;

        if (roadNetwork.hasEdgeBetween(mapX, mapZ, targetMapX, targetMapZ) &&
            roadNetwork.edgeBetween(mapX, mapZ, targetMapX, targetMapZ).surfaceType === CityTour.RoadNetwork.TERRAIN_SURFACE) {
          northWestBlock = buildings.blockAtCoordinates(mapX - 1, mapZ - 1);
          northEastBlock = buildings.blockAtCoordinates(mapX, mapZ - 1);

          northWestBlockHasBuildings = blockHasRightTouchingBuilding(northWestBlock);
          northEastBlockHasBuildings = blockHasLeftTouchingBuilding(northEastBlock);

          if (northWestBlockHasBuildings === false && northEastBlockHasBuildings === false) {
            roadNetwork.removeEdge(mapX, mapZ, targetMapX, targetMapZ);
            edgesRemovedCount += 1;

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (roadNetwork.hasIntersection(mapX, mapZ) &&
                roadNetwork.hasIntersection(targetMapX, targetMapZ) &&
                pathFinder.shortestPath(mapX, mapZ, targetMapX, targetMapZ) === undefined) {
              roadNetwork.addEdge(mapX, mapZ, targetMapX, targetMapZ, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    return edgesRemovedCount;
  };

  var simplify = function(roadNetwork, buildings) {
    var edgesRemovedCount;

    do {
      edgesRemovedCount = simplifyHelper(roadNetwork, buildings);
    } while(edgesRemovedCount > 0);
  };


  return {
    simplify: simplify,
  };
})();

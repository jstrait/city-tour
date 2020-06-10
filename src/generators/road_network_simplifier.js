"use strict";

import { PathFinder } from "./../path_finder";
import { RoadNetwork } from "./../road_network";

var RoadNetworkSimplifier = (function() {
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
    var x, z, targetX, targetZ;
    var southWestBlock, northWestBlock, southEastBlock, northEastBlock;
    var southWestBlockHasBuildings, northWestBlockHasBuildings, southEastBlockHasBuildings, northEastBlockHasBuildings;

    var pathFinder = new PathFinder(roadNetwork);

    var roadNetworkMinColumn = roadNetwork.minBoundingX();
    var roadNetworkMaxColumn = roadNetwork.maxBoundingX();
    var roadNetworkMinRow = roadNetwork.minBoundingZ();
    var roadNetworkMaxRow = roadNetwork.maxBoundingZ();

    var edgesRemovedCount = 0;

    // Road to the east
    for (x = roadNetworkMinColumn; x < roadNetworkMaxColumn; x++) {
      for (z = roadNetworkMinRow; z < roadNetworkMaxRow; z++) {
        targetX = x + 1;
        targetZ = z;

        if (roadNetwork.hasEdgeBetween(x, z, targetX, targetZ) &&
            roadNetwork.edgeBetween(x, z, targetX, targetZ).gradeType === RoadNetwork.SURFACE_GRADE) {
          southEastBlock = buildings.blockAtCoordinates(x, z);
          northEastBlock = buildings.blockAtCoordinates(x, z - 1);

          southEastBlockHasBuildings = blockHasTopTouchingBuilding(southEastBlock);
          northEastBlockHasBuildings = blockHasBottomTouchingBuilding(northEastBlock);

          if (southEastBlockHasBuildings === false && northEastBlockHasBuildings === false) {
            roadNetwork.removeEdge(x, z, targetX, targetZ);
            edgesRemovedCount += 1;

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (roadNetwork.hasIntersection(x, z) &&
                roadNetwork.hasIntersection(targetX, targetZ) &&
                pathFinder.shortestPath(x, z, targetX, targetZ) === undefined) {
              roadNetwork.addEdge(x, z, targetX, targetZ, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    // Road to the west
    for (x = roadNetworkMaxColumn; x > roadNetworkMinColumn; x--) {
      for (z = roadNetworkMinRow; z < roadNetworkMaxRow; z++) {
        targetX = x - 1;
        targetZ = z;

        if (roadNetwork.hasEdgeBetween(x, z, targetX, targetZ) &&
            roadNetwork.edgeBetween(x, z, targetX, targetZ).gradeType === RoadNetwork.SURFACE_GRADE) {
          southWestBlock = buildings.blockAtCoordinates(x - 1, z);
          northWestBlock = buildings.blockAtCoordinates(x - 1, z - 1);

          southWestBlockHasBuildings = blockHasTopTouchingBuilding(southWestBlock);
          northWestBlockHasBuildings = blockHasBottomTouchingBuilding(northWestBlock);

          if (southWestBlockHasBuildings === false && northWestBlockHasBuildings === false) {
            roadNetwork.removeEdge(x, z, targetX, targetZ);
            edgesRemovedCount += 1;

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (roadNetwork.hasIntersection(x, z) &&
                roadNetwork.hasIntersection(targetX, targetZ) &&
                pathFinder.shortestPath(x, z, targetX, targetZ) === undefined) {
              roadNetwork.addEdge(x, z, targetX, targetZ, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    // Road the south
    for (x = roadNetworkMinColumn; x < roadNetworkMaxColumn; x++) {
      for (z = roadNetworkMinRow; z < roadNetworkMaxRow; z++) {
        targetX = x;
        targetZ = z + 1;

        if (roadNetwork.hasEdgeBetween(x, z, targetX, targetZ) &&
            roadNetwork.edgeBetween(x, z, targetX, targetZ).gradeType === RoadNetwork.SURFACE_GRADE) {
          southWestBlock = buildings.blockAtCoordinates(x - 1, z);
          southEastBlock = buildings.blockAtCoordinates(x, z);

          southWestBlockHasBuildings = blockHasRightTouchingBuilding(southWestBlock);
          southEastBlockHasBuildings = blockHasLeftTouchingBuilding(southEastBlock);

          if (southWestBlockHasBuildings === false && southEastBlockHasBuildings === false) {
            roadNetwork.removeEdge(x, z, targetX, targetZ);
            edgesRemovedCount += 1;

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (roadNetwork.hasIntersection(x, z) &&
                roadNetwork.hasIntersection(targetX, targetZ) &&
                pathFinder.shortestPath(x, z, targetX, targetZ) === undefined) {
              roadNetwork.addEdge(x, z, targetX, targetZ, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    // Road the north
    for (x = roadNetworkMinColumn; x < roadNetworkMaxColumn; x++) {
      for (z = roadNetworkMaxRow; z > roadNetworkMinRow; z--) {
        targetX = x;
        targetZ = z - 1;

        if (roadNetwork.hasEdgeBetween(x, z, targetX, targetZ) &&
            roadNetwork.edgeBetween(x, z, targetX, targetZ).gradeType === RoadNetwork.SURFACE_GRADE) {
          northWestBlock = buildings.blockAtCoordinates(x - 1, z - 1);
          northEastBlock = buildings.blockAtCoordinates(x, z - 1);

          northWestBlockHasBuildings = blockHasRightTouchingBuilding(northWestBlock);
          northEastBlockHasBuildings = blockHasLeftTouchingBuilding(northEastBlock);

          if (northWestBlockHasBuildings === false && northEastBlockHasBuildings === false) {
            roadNetwork.removeEdge(x, z, targetX, targetZ);
            edgesRemovedCount += 1;

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (roadNetwork.hasIntersection(x, z) &&
                roadNetwork.hasIntersection(targetX, targetZ) &&
                pathFinder.shortestPath(x, z, targetX, targetZ) === undefined) {
              roadNetwork.addEdge(x, z, targetX, targetZ, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
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

export { RoadNetworkSimplifier };

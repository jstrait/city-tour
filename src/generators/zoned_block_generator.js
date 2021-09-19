"use strict";

import { CityTourMath } from "./../math";
import { RoadNetwork } from "./../road_network";

var ZonedBlockGenerator = (function() {
  var HALF_BLOCK_COLUMNS = 32;
  var HALF_BLOCK_ROWS = 32;

  var BLOCK_LAYOUTS = [
    {
      maxBlockSteepness: 0.083333333333333,
      lots: [ { left:     0.0,  right: 1.0,  top: 0.0,  bottom: 1.0, } ],
    },

    {
      maxBlockSteepness: 0.083333333333333,
      lots: [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom:  1.0 },
              { left:     0.5,  right: 1.0,  top: 0.0,  bottom:  1.0 } ],
    },


    {
      maxBlockSteepness: 0.083333333333333,
      lots: [ { left:     0.0,  right: 1.0,  top: 0.0,  bottom: 0.5 },
              { left:     0.0,  right: 1.0,  top: 0.5,  bottom: 1.0 } ],
    },


    {
      maxBlockSteepness: 0.083333333333333,
      lots: [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom: 1.0 },
              { left:     0.5,  right: 1.0,  top: 0.0,  bottom: 0.5 },
              { left:     0.5,  right: 1.0,  top: 0.5,  bottom: 1.0 } ],
    },


    {
      maxBlockSteepness: 0.083333333333333,
      lots: [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom: 0.5, },
              { left:     0.5,  right: 1.0,  top: 0.0,  bottom: 0.5, },
              { left:     0.0,  right: 0.5,  top: 0.5,  bottom: 1.0, },
              { left:     0.5,  right: 1.0,  top: 0.5,  bottom: 1.0, } ],
    },


    {
      maxBlockSteepness: 0.5,
      lots: [ { left:     0.0,  right: (1 / 3),  top: 0.0,  bottom:  0.5 },
              { left: (1 / 3),  right: (2 / 3),  top: 0.0,  bottom:  0.5 },
              { left: (2 / 3),  right:     1.0,  top: 0.0,  bottom:  0.5 },
              { left:     0.0,  right:     0.5,  top: 0.5,  bottom: 1.0 },
              { left:     0.5,  right:     1.0,  top: 0.5,  bottom: 1.0 } ],
    },


    {
      maxBlockSteepness: Number.POSITIVE_INFINITY,
      lots: [ { left:     0.0,  right: 0.25,  top: 0.0,    bottom:  (1/3), },
              { left:     0.75, right: 1.0,   top: 0.0,    bottom:  (1/3), },
              { left:     0.0,  right: 0.25,  top: (2/3),  bottom:  1.0, },
              { left:     0.75, right: 1.0,   top: (2/3),  bottom:  1.0, },

              { left:     0.0, right: 0.25,   top: (1/3),  bottom:  0.5, },
              { left:     0.0, right: 0.25,   top:   0.5,  bottom:  (2/3), },
              { left:     0.75, right: 1.0,   top: (1/3),  bottom:  0.5, },
              { left:     0.75, right: 1.0,   top:   0.5,  bottom:  (2/3), },

              { left:     0.25,   right: 0.4167,  top: 0.0,  bottom:  0.5, },
              { left:     0.4167, right: 0.5834,  top: 0.0,  bottom:  0.5, },
              { left:     0.5834, right: 0.75,    top: 0.0,  bottom:  0.5, },
              { left:     0.25,   right: 0.4167,  top: 0.5,  bottom:  1.0, },
              { left:     0.4167, right: 0.5834,  top: 0.5,  bottom:  1.0, },
              { left:     0.5834, right: 0.75,    top: 0.5,  bottom:  1.0, }, ],
    },

    {
      maxBlockSteepness: Number.POSITIVE_INFINITY,
      lots: [ { left:     0.0,  right: 0.5,    top: 0.0,    bottom:  (1/3), },
              { left:     0.0,  right: 0.5,    top: (1/3),  bottom:  0.5, },
              { left:     0.0,  right: 0.5,    top: 0.5,    bottom:  (2/3), },
              { left:     0.0,  right: (1/3),  top: (2/3),  bottom:  0.8333, },
              { left:     0.0,  right: (1/3),  top: 0.8333, bottom:  1.0, },

              { left:     0.5,  right: 1.0,    top: 0.0,    bottom:  0.1667, },
              { left:     0.5,  right: 1.0,    top: 0.1677, bottom:  (1/3), },
              { left:     0.5,  right: 1.0,    top: (1/3),  bottom:  0.5, },
              { left:     0.5,  right: 1.0,    top: 0.5,    bottom:  (2/3), },

              { left:     (1/3),  right: (2/3),  top: (2/3),    bottom:  1.0, },
              { left:     (2/3),  right: 0.8333, top: (2/3),    bottom:  1.0, },
              { left:    0.8333,  right: 1.0,    top: (2/3),    bottom:  1.0, },
            ],
    },

    {
      maxBlockSteepness: Number.POSITIVE_INFINITY,
      lots: [ { left:     0.0,  right: 0.25,  top: 0.0,     bottom:  0.1667, },
              { left:     0.0,  right: 0.25,  top: 0.1667,  bottom:  (1/3), },
              { left:     0.0,  right: 0.25,  top: (1/3),   bottom:  0.5, },
              { left:     0.0,  right: 0.25,  top: 0.5,     bottom:  (2/3), },
              { left:     0.0,  right: 0.25,  top: (2/3),   bottom:  0.8333, },
              { left:     0.0,  right: 0.25,  top: 0.8333,  bottom:  1.0, },

              { left:     0.75,  right: 1.0,  top: 0.0,     bottom:  0.1667, },
              { left:     0.75,  right: 1.0,  top: 0.1667,  bottom:  (1/3), },
              { left:     0.75,  right: 1.0,  top: (1/3),   bottom:  0.5, },
              { left:     0.75,  right: 1.0,  top: 0.5,     bottom:  (2/3), },
              { left:     0.75,  right: 1.0,  top: (2/3),   bottom:  0.8333, },
              { left:     0.75,  right: 1.0,  top: 0.8333,  bottom:  1.0, },

              { left:     0.25,    right: 0.4167,  top: 0.0,     bottom:  0.5, },
              { left:     0.4167,  right: 0.5833,  top: 0.0,     bottom:  0.5, },
              { left:     0.5833,  right: 0.75,    top: 0.0,     bottom:  0.5, },

              { left:     0.25,    right: 0.4167,  top: 0.5,     bottom:  1.0, },
              { left:     0.4167,  right: 0.5833,  top: 0.5,     bottom:  1.0, },
              { left:     0.5833,  right: 0.75,    top: 0.5,     bottom:  1.0, },
            ],
    },
  ];

  BLOCK_LAYOUTS.forEach(function(blockLayout) {
    blockLayout.lots.forEach(function(lot) {
      lot.width = lot.right - lot.left;
      lot.depth = lot.bottom - lot.top;
      lot.midpointX = lot.left + (lot.width / 2);
      lot.midpointZ = lot.top + (lot.depth / 2);

      if (lot.width < 0.25 || lot.depth < 0.25) {
        lot.maxStories = 4;
      }
      else if (lot.width < 0.5 || lot.depth < 0.5) {
        lot.maxStories = 10;
      }
      else {
        lot.maxStories = Number.POSITIVE_INFINITY;
      }
    });
  });

  var calculateBlockProbabilityOfBuilding = function(x, z, distanceToClosestNeighborhoodCenter, blockDistanceDecayBegins) {
    var normalizedPercentageFromCenter;

    if (distanceToClosestNeighborhoodCenter >= blockDistanceDecayBegins) {
      normalizedPercentageFromCenter = (distanceToClosestNeighborhoodCenter - blockDistanceDecayBegins) / blockDistanceDecayBegins;
    }
    else {
      normalizedPercentageFromCenter = 0.0;
    }

    return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
  };

  var calculateMaxStoriesForBlock = function(x, z, centerX, centerZ, maxBuildingStories) {
    var squareRootOfMaxBuildingStories = Math.pow(maxBuildingStories, (1/9));

    var multiplierX = squareRootOfMaxBuildingStories * (1 - (Math.abs(x - centerX) / HALF_BLOCK_COLUMNS));
    var multiplierZ = squareRootOfMaxBuildingStories * (1 - (Math.abs(z - centerZ) / HALF_BLOCK_ROWS));
    var multiplier = Math.min(multiplierX, multiplierZ);

    return Math.max(1, Math.round(Math.pow(multiplier, 9)));
  };

  var blockTerrainAttributes = function(terrain, left, top, right, bottom) {
    var topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight, minimumHeight, maximumHeight;

    topLeftHeight     = terrain.heightAt(left, top);
    topRightHeight    = terrain.heightAt(right, top);
    bottomLeftHeight  = terrain.heightAt(left, bottom);
    bottomRightHeight = terrain.heightAt(right, bottom);

    minimumHeight = Math.min(topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight);
    maximumHeight = Math.max(topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight);

    return { minimumHeight: minimumHeight,
             maximumHeight: maximumHeight,
             steepness: maximumHeight - minimumHeight };
  };

  var nearestNeighborhoodCenterDistance = function(neighborhoods, x, z) {
    var nearestCenterDistance = Number.POSITIVE_INFINITY;
    var distanceToNeighborhoodCenter;
    var i;

    for (i = 0; i < neighborhoods.length; i++) {
      distanceToNeighborhoodCenter = CityTourMath.distanceBetweenPoints(neighborhoods[i].centerX, neighborhoods[i].centerZ, x, z);

      if (distanceToNeighborhoodCenter < nearestCenterDistance) {
        nearestCenterDistance = distanceToNeighborhoodCenter;
      }
    }

    return nearestCenterDistance;
  };

  var generate = function(terrain, neighborhoods, roadNetwork, config) {
    var x, z;
    var blocks = [];
    var block;
    var hasTopRoad, hasRightRoad, hasBottomRoad, hasLeftRoad;
    var blockLayout, terrainAttributes, blockSteepness, maxBlockSteepness;
    var distanceToClosestNeighborhoodCenter;

    var minX = roadNetwork.minBoundingX() - 1;
    var maxX = roadNetwork.maxBoundingX();
    var minZ = roadNetwork.minBoundingZ() - 1;
    var maxZ = roadNetwork.maxBoundingZ();

    for (x = minX; x <= maxX; x++) {
      for (z = minZ; z <= maxZ; z++) {
        hasTopRoad = roadNetwork.hasEdgeBetween(x, z, x + 1, z, RoadNetwork.SURFACE_GRADE);
        hasRightRoad = roadNetwork.hasEdgeBetween(x + 1, z, x + 1, z + 1, RoadNetwork.SURFACE_GRADE);
        hasBottomRoad = roadNetwork.hasEdgeBetween(x, z + 1, x + 1, z + 1, RoadNetwork.SURFACE_GRADE);
        hasLeftRoad = roadNetwork.hasEdgeBetween(x, z, x, z + 1, RoadNetwork.SURFACE_GRADE);

        if (hasTopRoad === true || hasRightRoad === true || hasBottomRoad === true || hasLeftRoad === true) {
          distanceToClosestNeighborhoodCenter = nearestNeighborhoodCenterDistance(neighborhoods, x, z);

          block = {};

          block.x = x;
          block.z = z;
          block.probabilityOfBuilding = calculateBlockProbabilityOfBuilding(x, z, distanceToClosestNeighborhoodCenter, config.blockDistanceDecayBegins);
          block.maxStories = calculateMaxStoriesForBlock(neighborhoods[0].centerX, neighborhoods[0].centerZ, x, z, config.maxBuildingStories);

          block.hasTopRoad = hasTopRoad;
          block.hasRightRoad = hasRightRoad;
          block.hasBottomRoad = hasBottomRoad;
          block.hasLeftRoad = hasLeftRoad;

          terrainAttributes = blockTerrainAttributes(terrain, x, z, x + 1, z + 1);
          blockSteepness = terrainAttributes.steepness;

          maxBlockSteepness = Number.NEGATIVE_INFINITY;
          while (blockSteepness > maxBlockSteepness) {
            blockLayout = BLOCK_LAYOUTS[Math.floor(Math.random() * BLOCK_LAYOUTS.length)];
            maxBlockSteepness = blockLayout.maxBlockSteepness;
          }
          block.minimumHeight = terrainAttributes.minimumHeight;
          block.layout = blockLayout;

          blocks.push(block);
        }
      }
    }

    return {
      blocks: blocks,
      boundingBox: {
        minX: minX,
        maxX: maxX,
        minZ: minZ,
        maxZ: maxZ,
      },
    };
  };


  return {
    generate: generate,
  }
})();

export { ZonedBlockGenerator };

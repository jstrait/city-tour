"use strict";

var CityTour = CityTour || {};

CityTour.ZonedBlockGenerator = (function() {
  var BLOCK_LAYOUTS = [
    {
      maxBlockSteepness: 1,
      lots: [ { left:     0.0,  right: 1.0,  top: 0.0,  bottom: 1.0, } ],
    },

    {
      maxBlockSteepness: 1,
      lots: [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom:  1.0 },
              { left:     0.5,  right: 1.0,  top: 0.0,  bottom:  1.0 } ],
    },


    {
      maxBlockSteepness: 1,
      lots: [ { left:     0.0,  right: 1.0,  top: 0.0,  bottom: 0.5 },
              { left:     0.0,  right: 1.0,  top: 0.5,  bottom: 1.0 } ],
    },


    {
      maxBlockSteepness: 1,
      lots: [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom: 1.0 },
              { left:     0.5,  right: 1.0,  top: 0.0,  bottom: 0.5 },
              { left:     0.5,  right: 1.0,  top: 0.5,  bottom: 1.0 } ],
    },


    {
      maxBlockSteepness: 1,
      lots: [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom: 0.5, },
              { left:     0.5,  right: 1.0,  top: 0.0,  bottom: 0.5, },
              { left:     0.0,  right: 0.5,  top: 0.5,  bottom: 1.0, },
              { left:     0.5,  right: 1.0,  top: 0.5,  bottom: 1.0, } ],
    },


    {
      maxBlockSteepness: 6,
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

  var calculateBlockProbabilityOfBuilding = function(centerMapX, centerMapZ, mapX, mapZ, percentageDistanceDecayBegins) {    
    var distanceToCityEdge = Math.min(CityTour.Config.HALF_BLOCK_COLUMNS, CityTour.Config.HALF_BLOCK_ROWS);
    var xDistance = mapX - centerMapX;
    var zDistance = mapZ - centerMapZ;
    var distanceFromCenter = Math.sqrt((xDistance * xDistance) + (zDistance * zDistance));
    var percentageFromCenter = (distanceFromCenter / distanceToCityEdge);
    var normalizedPercentageFromCenter;

    if (percentageFromCenter >= percentageDistanceDecayBegins) {
      var safeFromDecayDistance = distanceToCityEdge * percentageDistanceDecayBegins;
      normalizedPercentageFromCenter = (distanceFromCenter - safeFromDecayDistance) / (distanceToCityEdge - safeFromDecayDistance);
    }
    else {
      normalizedPercentageFromCenter = 0.0;
    }

    return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
  };

  var calculateMaxStoriesForBlock = function(centerMapX, centerMapZ, mapX, mapZ, maxBuildingStories) {
    var squareRootOfMaxBuildingStories = Math.pow(maxBuildingStories, (1/9));

    var multiplierX = squareRootOfMaxBuildingStories * (1 - (Math.abs(mapX - centerMapX) / CityTour.Config.HALF_BLOCK_COLUMNS));
    var multiplierZ = squareRootOfMaxBuildingStories * (1 - (Math.abs(mapZ - centerMapZ) / CityTour.Config.HALF_BLOCK_ROWS));
    var multiplier = Math.min(multiplierX, multiplierZ);

    return Math.max(1, Math.round(Math.pow(multiplier, 9)));
  };

  var blockTerrainAttributes = function(terrain, left, top, right, bottom) {
    var topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight, minimumHeight, maximumHeight;

    topLeftHeight     = terrain.heightAtCoordinates(left, top);
    topRightHeight    = terrain.heightAtCoordinates(right, top);
    bottomLeftHeight  = terrain.heightAtCoordinates(left, bottom);
    bottomRightHeight = terrain.heightAtCoordinates(right, bottom);

    minimumHeight = Math.min(topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight);
    maximumHeight = Math.max(topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight);

    return { minimumHeight: minimumHeight,
             maximumHeight: maximumHeight,
             steepness: maximumHeight - minimumHeight };
  };

  var zonedBlockGenerator = {};

  zonedBlockGenerator.generate = function(terrain, roadNetwork, centerMapX, centerMapZ, config) {
    var mapX, mapZ;
    var block, blocks = [];
    var hasTopRoad, hasRightRoad, hasBottomRoad, hasLeftRoad;
    var blockLayout, terrainAttributes, blockSteepness, maxBlockSteepness;

    for (mapX = -CityTour.Config.HALF_BLOCK_COLUMNS + centerMapX; mapX < CityTour.Config.HALF_BLOCK_COLUMNS + centerMapX; mapX++) {
      for (mapZ = -CityTour.Config.HALF_BLOCK_ROWS + centerMapZ; mapZ < CityTour.Config.HALF_BLOCK_ROWS + centerMapZ; mapZ++) {
        hasTopRoad = roadNetwork.hasEdgeBetween(mapX, mapZ, mapX + 1, mapZ, CityTour.RoadNetwork.TERRAIN_SURFACE);
        hasRightRoad = roadNetwork.hasEdgeBetween(mapX + 1, mapZ, mapX + 1, mapZ + 1, CityTour.RoadNetwork.TERRAIN_SURFACE);
        hasBottomRoad = roadNetwork.hasEdgeBetween(mapX, mapZ + 1, mapX + 1, mapZ + 1, CityTour.RoadNetwork.TERRAIN_SURFACE);
        hasLeftRoad = roadNetwork.hasEdgeBetween(mapX, mapZ, mapX, mapZ + 1, CityTour.RoadNetwork.TERRAIN_SURFACE);

        if (hasTopRoad || hasRightRoad || hasBottomRoad || hasLeftRoad) {
          block = {};

          block.mapX = mapX;
          block.mapZ = mapZ;
          block.probabilityOfBuilding = calculateBlockProbabilityOfBuilding(centerMapX, centerMapZ, mapX, mapZ, config.percentageDistanceDecayBegins);
          block.maxStories = calculateMaxStoriesForBlock(centerMapX, centerMapZ, mapX, mapZ, config.maxBuildingStories);

          block.hasTopRoad = hasTopRoad;
          block.hasRightRoad = hasRightRoad;
          block.hasBottomRoad = hasBottomRoad;
          block.hasLeftRoad = hasLeftRoad;

          terrainAttributes = blockTerrainAttributes(terrain, mapX, mapZ, mapX + 1, mapZ + 1);
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

    return blocks;
  };

  return zonedBlockGenerator;
})();

"use strict";

var CityTour = CityTour || {};

CityTour.ZonedBlockGenerator = function() {
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
      maxBlockSteepness: 1000000,
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
      maxBlockSteepness: 1000000,
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
      maxBlockSteepness: 1000000,
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

  var MAX_BUILDING_STORIES = 40;

  var calculateBlockProbabilityOfBuilding = function(mapX, mapZ) {
    var PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS = 0.4;
    
    var distanceToCityEdge = Math.min(CityTour.Config.HALF_BLOCK_COLUMNS, CityTour.Config.HALF_BLOCK_ROWS);
    var distanceFromCenter = Math.sqrt((mapX * mapX) + (mapZ * mapZ));
    var percentageFromCenter = (distanceFromCenter / distanceToCityEdge);
    var normalizedPercentageFromCenter;

    if (percentageFromCenter >= PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS) {
      var safeFromDecayDistance = distanceToCityEdge * PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS;
      normalizedPercentageFromCenter = (distanceFromCenter - safeFromDecayDistance) / (distanceToCityEdge - safeFromDecayDistance);
    }
    else {
      normalizedPercentageFromCenter = 0.0;
    }

    return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
  };

  var calculateMaxStoriesForBlock = function(mapX, mapZ) {
    var squareRootOfMaxBuildingStories = Math.pow(MAX_BUILDING_STORIES, (1/9));

    var multiplierX = squareRootOfMaxBuildingStories * (1 - (Math.abs(mapX) / CityTour.Config.HALF_BLOCK_COLUMNS));
    var multiplierZ = squareRootOfMaxBuildingStories * (1 - (Math.abs(mapZ) / CityTour.Config.HALF_BLOCK_ROWS));
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

  zonedBlockGenerator.build = function(terrain) {
    var mapX, mapZ;
    var block, blocks = [];
    var blockLayout, blockSteepness, maxBlockSteepness;

    for (mapX = -CityTour.Config.HALF_BLOCK_COLUMNS; mapX < CityTour.Config.HALF_BLOCK_COLUMNS; mapX++) {
      for (mapZ = -CityTour.Config.HALF_BLOCK_ROWS; mapZ < CityTour.Config.HALF_BLOCK_ROWS; mapZ++) {
        block = {};

        block.mapX = mapX;
        block.mapZ = mapZ;
        block.probabilityOfBuilding = calculateBlockProbabilityOfBuilding(mapX, mapZ);
        block.maxStories = calculateMaxStoriesForBlock(mapX, mapZ);

        blockSteepness = blockTerrainAttributes(terrain, mapX, mapZ, mapX + 1, mapZ + 1).steepness;

        maxBlockSteepness = -100000;
        while (blockSteepness > maxBlockSteepness) {
          blockLayout = BLOCK_LAYOUTS[Math.floor(Math.random() * BLOCK_LAYOUTS.length)];
          maxBlockSteepness = blockLayout.maxBlockSteepness;
        }
        block.layout = blockLayout;

        blocks.push(block);
      }
    }

    return blocks;
  };

  return zonedBlockGenerator;
};



CityTour.Buildings = function(terrain, roadNetwork) {
  var MAX_TERRAIN_STEEPNESS_FOR_BUILDING = 3;

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

  var generateUnitBlocks = function(terrain, roadNetwork, zonedBlocks) {
    var blocks = [];
    var block;
    var mapX, mapZ;
    var lotTerrainAttributes;
    var maxStoriesForLotSize, maxStories, actualStories;
    var hasAdjacentRoad;

    zonedBlocks.forEach(function(zonedBlock) {
      mapX = zonedBlock.mapX;
      mapZ = zonedBlock.mapZ;
      block = [];

      zonedBlock.layout.lots.forEach(function(lot) {
        if (Math.random() < zonedBlock.probabilityOfBuilding) {
          hasAdjacentRoad = (lot.left === 0.0   && roadNetwork.hasEdgeBetween(mapX, mapZ, mapX, mapZ + 1)) ||
                            (lot.top === 0.0    && roadNetwork.hasEdgeBetween(mapX, mapZ, mapX + 1, mapZ)) ||
                            (lot.right === 1.0  && roadNetwork.hasEdgeBetween(mapX + 1, mapZ, mapX + 1, mapZ + 1)) ||
                            (lot.bottom === 1.0 && roadNetwork.hasEdgeBetween(mapX, mapZ + 1, mapX + 1, mapZ + 1));

          if (hasAdjacentRoad) {
            lotTerrainAttributes = blockTerrainAttributes(terrain, mapX + lot.left, mapZ + lot.top, mapX + lot.right, mapZ + lot.bottom);

            if (lotTerrainAttributes.steepness < MAX_TERRAIN_STEEPNESS_FOR_BUILDING) {
              maxStoriesForLotSize = calculateMaxStoriesForLotSize(lot.right - lot.left, lot.bottom - lot.top);
              maxStories = Math.min(zonedBlock.maxStories, maxStoriesForLotSize);

              actualStories = Math.max(1, Math.round(Math.random() * maxStories));

              block.push({
                left: lot.left,
                right: lot.right,
                top: lot.top,
                bottom: lot.bottom,
                yFloor: lotTerrainAttributes.minimumHeight,
                ySurface: lotTerrainAttributes.maximumHeight,
                stories: actualStories,
              });
            }
          }
        }
      });

      if (!blocks[mapX]) {
        blocks[mapX] = [];
      }
      blocks[mapX][mapZ] = block;
    });

    return blocks;
  };

  var calculateMaxStoriesForLotSize = function(width, height) {
    if (width < 0.25 || height < 0.25) {
      return 4; 
    }
    else if (width < 0.5 || height < 0.5) {
      return 10;
    }
    else {
      return 10000;
    }
  };

  var blocks = generateUnitBlocks(terrain, roadNetwork, new CityTour.ZonedBlockGenerator().build(terrain));

  var buildings = {};

  buildings.blockAtCoordinates = function(mapX, mapZ) {
    return blocks[mapX][mapZ];
  };

  return buildings;
};

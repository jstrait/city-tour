"use strict";

var Buildings = function(terrain) {
  var MAX_BUILDING_STORIES = 40;
  var MAX_TERRAIN_STEEPNESS_FOR_BUILDING = 3;

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

  var generateUnitBlocks = function(terrain) {
    var blocks = [];
    var block;
    var mapX, mapZ;
    var shouldBuildBuilding, xPercentageFromCenter, zPercentageFromCenter;
    var maxStoriesForBlock, maxStoriesForLot, maxStories, actualStories;

    for (mapX = -CityConfig.HALF_BLOCK_COLUMNS; mapX < CityConfig.HALF_BLOCK_COLUMNS; mapX++) {
      blocks[mapX] = [];

      for (mapZ = -CityConfig.HALF_BLOCK_ROWS; mapZ < CityConfig.HALF_BLOCK_ROWS; mapZ++) {
        block = [];

        var blockTerrainCoordinates = [
          terrain.heightAtCoordinates(mapX, mapZ),
          terrain.heightAtCoordinates(mapX + 1, mapZ),
          terrain.heightAtCoordinates(mapX, mapZ + 1),
          terrain.heightAtCoordinates(mapX + 1, mapZ + 1),
        ];
        var minimumBlockTerrainHeight = Math.min(...blockTerrainCoordinates);
        var maximumBlockTerrainHeight = Math.max(...blockTerrainCoordinates);
        var blockSteepness = maximumBlockTerrainHeight - minimumBlockTerrainHeight;

        var blockLayout;
        var maxBlockSteepness = -100000;
        while (blockSteepness > maxBlockSteepness) {
          blockLayout = BLOCK_LAYOUTS[Math.floor(Math.random() * BLOCK_LAYOUTS.length)];
          maxBlockSteepness = blockLayout.maxBlockSteepness;
        }

        blockLayout.lots.forEach(function(lot) {
          shouldBuildBuilding = true;

          xPercentageFromCenter = 1 - (Math.abs(mapX) / CityConfig.HALF_BLOCK_COLUMNS);
          zPercentageFromCenter = 1 - (Math.abs(mapZ) / CityConfig.HALF_BLOCK_ROWS);

          var percentage = Math.min(xPercentageFromCenter, zPercentageFromCenter);

          if (percentage < 0.4) {
            percentage = percentage / 0.4;
          }
          else {
            percentage = 1.0;
          }

          var threshold = 1.0 - Math.pow(0.5, percentage);
          shouldBuildBuilding = Math.random() < percentage;

          if (shouldBuildBuilding) {
            var lotTerrainCoordinates = [
              terrain.heightAtCoordinates(mapX + lot.left, mapZ + lot.top),
              terrain.heightAtCoordinates(mapX + lot.right, mapZ + lot.top),
              terrain.heightAtCoordinates(mapX + lot.left, mapZ + lot.bottom),
              terrain.heightAtCoordinates(mapX + lot.right, mapZ + lot.bottom),
            ];
            var minimumLotTerrainHeight = Math.min(...lotTerrainCoordinates);
            var maximumLotTerrainHeight = Math.max(...lotTerrainCoordinates);
            var lotSteepness = maximumLotTerrainHeight - minimumLotTerrainHeight;

            if (lotSteepness < MAX_TERRAIN_STEEPNESS_FOR_BUILDING) {
              maxStoriesForBlock = calculateMaxStoriesForBlock(mapX, mapZ);
              maxStoriesForLot = calculateMaxStoriesForLot(lot.right - lot.left, lot.bottom - lot.top);
              maxStories = Math.min(maxStoriesForBlock, maxStoriesForLot);

              actualStories = Math.max(1, Math.round(Math.random() * maxStories));

              block.push({
                left: lot.left,
                right: lot.right,
                top: lot.top,
                bottom: lot.bottom,
                yFloor: minimumLotTerrainHeight,
                ySurface: maximumLotTerrainHeight,
                stories: actualStories,
              });
            }
          }
        });

        blocks[mapX][mapZ] = block;
      }
    }

    console.log(blocks);
    return blocks;
  };

  var calculateMaxStoriesForBlock = function(mapX, mapZ) {
    var squareRootOfMaxBuildingStories = Math.pow(MAX_BUILDING_STORIES, (1/9));

    var multiplierX = squareRootOfMaxBuildingStories * (1 - (Math.abs(mapX) / CityConfig.HALF_BLOCK_COLUMNS));
    var multiplierZ = squareRootOfMaxBuildingStories * (1 - (Math.abs(mapZ) / CityConfig.HALF_BLOCK_ROWS));
    var multiplier = Math.min(multiplierX, multiplierZ);

    return Math.max(1, Math.round(Math.pow(multiplier, 9)));
  };

  var calculateMaxStoriesForLot = function(width, height) {
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

  var blocks = generateUnitBlocks(terrain);

  var buildings = {};

  buildings.blockAtCoordinates = function(mapX, mapZ) {
    return blocks[mapX][mapZ];
  };

  return buildings;
};

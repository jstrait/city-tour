"use strict";

var Buildings = function(terrain) {
  var BLOCK_LAYOUTS = [
    [ { left:     0.0,  right: 1.0,  top: 0.0,  bottom: 1.0, } ],


    [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom:  1.0 },
      { left:     0.5,  right: 1.0,  top: 0.0,  bottom:  1.0 } ],


    [ { left:     0.0,  right: 1.0,  top: 0.0,  bottom: 0.5 },
      { left:     0.0,  right: 1.0,  top: 0.5,  bottom: 1.0 } ],


    [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom: 1.0 },
      { left:     0.5,  right: 1.0,  top: 0.0,  bottom: 0.5 },
      { left:     0.5,  right: 1.0,  top: 0.5,  bottom: 1.0 } ],


    [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom: 0.5, },
      { left:     0.5,  right: 1.0,  top: 0.0,  bottom: 0.5, },
      { left:     0.0,  right: 0.5,  top: 0.5,  bottom: 1.0, },
      { left:     0.5,  right: 1.0,  top: 0.5,  bottom: 1.0, } ],


    [ { left:     0.0,  right: (1 / 3),  top: 0.0,  bottom:  0.5 },
      { left: (1 / 3),  right: (2 / 3),  top: 0.0,  bottom:  0.5 },
      { left: (2 / 3),  right:     1.0,  top: 0.0,  bottom:  0.5 },
      { left:     0.0,  right:     0.5,  top: 0.5,  bottom: 1.0 },
      { left:     0.5,  right:     1.0,  top: 0.5,  bottom: 1.0 } ],


    [ { left:     0.0,  right: 0.25,  top: 0.0,    bottom:  (1/3), },
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
  ];

  var generateUnitBlocks = function(terrain) {
    var blocks = [];
    var block;
    var mapX, mapZ;
    var buildingHeight, buildingBottom, buildingMinimumHeight;

    for (mapX = 0; mapX < CityConfig.BLOCK_COLUMNS; mapX++) {
      blocks[mapX] = [];

      for (mapZ = 0; mapZ < CityConfig.BLOCK_ROWS; mapZ++) {
        var blockLayout = BLOCK_LAYOUTS[Math.floor(Math.random() * BLOCK_LAYOUTS.length)];

        var blockTerrainCoordinates = [
          terrain.heightAtCoordinates(mapX, mapZ),
          terrain.heightAtCoordinates(mapX + 1, mapZ),
          terrain.heightAtCoordinates(mapX, mapZ + 1),
          terrain.heightAtCoordinates(mapX + 1, mapZ + 1),
        ];
        var minimumTerrainHeight = Math.min(...blockTerrainCoordinates);
        var maximumTerrainHeight = Math.max(...blockTerrainCoordinates);

        block = [];
        blockLayout.forEach(function(lot) {
          buildingHeight = calculateBuildingHeight(mapX, mapZ) + maximumTerrainHeight;
          buildingMinimumHeight = maximumTerrainHeight + CityConfig.MIN_BUILDING_HEIGHT;
          buildingBottom = minimumTerrainHeight;

          block.push({
            left: lot.left,
            right: lot.right,
            top: lot.top,
            bottom: lot.bottom,
            yFloor: buildingBottom,
            yMinimumHeight: buildingMinimumHeight,
            yTargetHeight: buildingHeight,
          });
        });

        blocks[mapX][mapZ] = block;
      }
    }

    console.log(blocks);
    return blocks;
  };

  var calculateBuildingHeight = function(x, z) {
    var squareRootOfMaxBuildingHeight = Math.pow(CityConfig.MAX_BUILDING_HEIGHT, (1/12));

    var halfColumns = CityConfig.BLOCK_COLUMNS / 2;
    var halfRows = CityConfig.BLOCK_ROWS / 2;

    var multiplierX = squareRootOfMaxBuildingHeight * ((halfColumns - Math.abs(halfColumns - x)) / halfColumns);
    var multiplierZ = squareRootOfMaxBuildingHeight * ((halfRows - Math.abs(halfRows - z)) / halfRows);
    var multiplier = Math.min(multiplierX, multiplierZ);

    return Math.pow(multiplier, 12);
  };

  var blocks = generateUnitBlocks(terrain);

  var buildings = {};

  buildings.blockAtCoordinates = function(mapX, mapZ) {
    return blocks[mapX][mapZ];
  };

  return buildings;
};

"use strict";

var CityTour = CityTour || {};

CityTour.BuildingsGenerator = (function() {
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

  var generateUnitBlocks = function(terrain, zonedBlocks) {
    var blocks = [];
    var block;
    var mapX, mapZ;
    var lotTerrainAttributes;
    var maxStories, actualStories;
    var hasAdjacentRoad;

    zonedBlocks.forEach(function(zonedBlock) {
      mapX = zonedBlock.mapX;
      mapZ = zonedBlock.mapZ;
      block = [];

      zonedBlock.layout.lots.forEach(function(lot) {
        if (Math.random() < zonedBlock.probabilityOfBuilding) {
          hasAdjacentRoad = (lot.left === 0.0   && zonedBlock.hasLeftRoad) ||
                            (lot.top === 0.0    && zonedBlock.hasTopRoad) ||
                            (lot.right === 1.0  && zonedBlock.hasRightRoad) ||
                            (lot.bottom === 1.0 && zonedBlock.hasBottomRoad);

          if (hasAdjacentRoad) {
            lotTerrainAttributes = blockTerrainAttributes(terrain, mapX + lot.left, mapZ + lot.top, mapX + lot.right, mapZ + lot.bottom);

            if (lotTerrainAttributes.steepness < MAX_TERRAIN_STEEPNESS_FOR_BUILDING) {
              maxStories = Math.min(zonedBlock.maxStories, lot.maxStories);
              actualStories = Math.max(1, Math.round(Math.random() * maxStories));

              block.push({
                dimensions: lot,
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


  var buildingsGenerator = {};

  buildingsGenerator.generate = function(terrain, zonedBlocks) {
    var blocks = generateUnitBlocks(terrain, zonedBlocks);

    var buildings = {};

    buildings.blockAtCoordinates = function(mapX, mapZ) {
      return blocks[mapX][mapZ];
    };

    return buildings;
  }

  return buildingsGenerator;
})();

"use strict";

var CityTour = CityTour || {};

CityTour.BuildingsGenerator = (function() {
  var MIN_STORIES_FOR_ANTENNA = 25;
  var PROBABILITY_OF_TALL_BUILDING_ANTENNA = 0.3;
  var ROOF_STYLE_ANTENNA = 'antenna';
  var ROOF_STYLE_FLAT = 'flat';

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
    var roofStyle;

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

            if (lotTerrainAttributes.steepness < CityTour.Config.MIN_STORY_HEIGHT) {
              maxStories = Math.min(zonedBlock.maxStories, lot.maxStories);
              actualStories = Math.max(1, Math.round(Math.random() * maxStories));

              if (actualStories > MIN_STORIES_FOR_ANTENNA && (Math.random() < PROBABILITY_OF_TALL_BUILDING_ANTENNA)) {
                roofStyle = ROOF_STYLE_ANTENNA;
              }
              else {
                roofStyle = ROOF_STYLE_FLAT;
              }

              block.push({
                dimensions: lot,
                roofStyle: roofStyle,
                yFloor: zonedBlock.minimumHeight,
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
  };

  return buildingsGenerator;
})();

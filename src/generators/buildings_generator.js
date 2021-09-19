"use strict";

import { CityTourMath } from "./../math";

var BuildingsGenerator = (function() {
  var MIN_STORY_HEIGHT = 0.1;
  var MAX_STORY_HEIGHT = 0.125;
  var MIN_STORIES_FOR_ANTENNA = 25;
  var PROBABILITY_OF_TALL_BUILDING_ANTENNA = 0.3;
  var ROOF_STYLE_ANTENNA = "antenna";
  var ROOF_STYLE_FLAT = "flat";

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

  var generateBuildingOnLot = function(lot, zonedBlock, terrain) {
    var lotTerrainAttributes;
    var maxStories, actualStories, storyHeight;
    var hasAdjacentRoad;
    var roofStyle;
    var x = zonedBlock.x;
    var z = zonedBlock.z;

    if (Math.random() < zonedBlock.probabilityOfBuilding) {
      hasAdjacentRoad = (lot.left === 0.0   && zonedBlock.hasLeftRoad) ||
                        (lot.top === 0.0    && zonedBlock.hasTopRoad) ||
                        (lot.right === 1.0  && zonedBlock.hasRightRoad) ||
                        (lot.bottom === 1.0 && zonedBlock.hasBottomRoad);

      if (hasAdjacentRoad) {
        lotTerrainAttributes = blockTerrainAttributes(terrain, x + lot.left, z + lot.top, x + lot.right, z + lot.bottom);

        if (lotTerrainAttributes.steepness < MIN_STORY_HEIGHT) {
          maxStories = Math.min(zonedBlock.maxStories, lot.maxStories);
          actualStories = CityTourMath.randomInteger(1, maxStories);
          storyHeight = CityTourMath.randomInRange(MIN_STORY_HEIGHT, MAX_STORY_HEIGHT);

          if (actualStories > MIN_STORIES_FOR_ANTENNA && (Math.random() < PROBABILITY_OF_TALL_BUILDING_ANTENNA)) {
            roofStyle = ROOF_STYLE_ANTENNA;
          }
          else {
            roofStyle = ROOF_STYLE_FLAT;
          }

          return {
            dimensions: lot,
            roofStyle: roofStyle,
            yFloor: zonedBlock.minimumHeight,
            height: (actualStories * storyHeight) + (lotTerrainAttributes.maximumHeight - zonedBlock.minimumHeight),
          };
        }
      }
    }

    return undefined;
  };

  var generateUnitBlocks = function(terrain, zonedBlocks) {
    var blocks = [];
    var buildingCount = 0;
    var antennaCount = 0;

    zonedBlocks.blocks.forEach(function(zonedBlock) {
      var x = zonedBlock.x;
      var z = zonedBlock.z;
      var lots = zonedBlock.layout.lots;
      var block = [];
      var building;
      var l;

      for (l = 0; l < lots.length; l++) {
        building = generateBuildingOnLot(lots[l], zonedBlock, terrain);
        if (building !== undefined) {
          block.push(building);
          buildingCount += 1;

          if (building.roofStyle === "antenna") {
            antennaCount += 1;
          }
        }
      }

      if (block !== []) {
        if (blocks[x] === undefined) {
          blocks[x] = [];
        }
        blocks[x][z] = block;
      }
    });

    return {
      buildingCount: buildingCount,
      antennaCount: antennaCount,
      blocks: blocks,
      boundingBox: {
        minX: zonedBlocks.boundingBox.minX,
        maxX: zonedBlocks.boundingBox.maxX,
        minZ: zonedBlocks.boundingBox.minZ,
        maxZ: zonedBlocks.boundingBox.maxZ,
      },
    };
  };


  var EMPTY_ARRAY = Object.freeze([]);

  var buildingsGenerator = {};

  buildingsGenerator.generate = function(terrain, zonedBlocks) {
    var buildingData = generateUnitBlocks(terrain, zonedBlocks);
    var blocks = buildingData.blocks;

    var buildings = {};

    buildings.buildingCount = buildingData.buildingCount;
    buildings.antennaCount = buildingData.antennaCount,
    buildings.blockAtCoordinates = function(x, z) {
      return (blocks[x] === undefined || blocks[x][z] === undefined) ? EMPTY_ARRAY : blocks[x][z];
    };
    buildings.boundingBox = buildingData.boundingBox;

    return buildings;
  };

  return buildingsGenerator;
})();

export { BuildingsGenerator };

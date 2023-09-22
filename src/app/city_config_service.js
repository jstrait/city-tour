"use strict";

var CityConfigService = function() {
  var TERRAIN_COLUMN_COUNT = 128;
  var TERRAIN_ROW_COUNT = 128;
  var NEIGHBORHOOD_MAX_COLUMNS = 20;
  var NEIGHBORHOOD_MAX_ROWS = 20;

  var heightJitter = 2.2;
  var heightJitterDecay = 0.7;
  var includeRiver = true;
  var hillCount = 0;
  var maxHillHeight = 0.0;
  var safeFromDecayBlocks = 6;
  var blockDistanceDecayBegins = 6;
  var maxBuildingStories = 40;
  var neighborhoodCount = 15;

  var toWorldConfig = function() {
    return {
      terrain: {
        columnCount: TERRAIN_COLUMN_COUNT,
        rowCount: TERRAIN_ROW_COUNT,
        heightJitter: heightJitter,
        heightJitterDecay: heightJitterDecay,
        hillCount: hillCount,
        maxHillHeight: maxHillHeight,
        probabilityOfRiver: includeRiver ? 1.0 : 0.0,
      },
      neighborhoods: {
        count: neighborhoodCount,
        columnCount: NEIGHBORHOOD_MAX_COLUMNS,
        rowCount: NEIGHBORHOOD_MAX_ROWS,
      },
      roadNetwork: {
        isPresent: true,
        maxRoadAngle: Math.PI / 9,
        safeFromDecayBlocks: safeFromDecayBlocks,
      },
      zonedBlocks: {
        isPresent: true,
        blockDistanceDecayBegins: blockDistanceDecayBegins,
        maxBuildingStories: maxBuildingStories,
      },
    };
  };


  return {
    heightJitter: function() { return heightJitter; },
    setHeightJitter: function(newHeightJitter) { heightJitter = newHeightJitter; },
    heightJitterDecay: function() { return heightJitterDecay; },
    setHeightJitterDecay: function(newHeightJitterDecay) { heightJitterDecay = newHeightJitterDecay; },
    hillCount: function() { return hillCount; },
    setHillCount: function(newHillCount) { hillCount = newHillCount; },
    maxHillHeight: function() { return maxHillHeight; },
    setMaxHillHeight: function(newMaxHillHeight) { maxHillHeight = newMaxHillHeight; },
    includeRiver: function() { return includeRiver; },
    setIncludeRiver: function(newIncludeRiver) { includeRiver = newIncludeRiver; },
    safeFromDecayBlocks: function() { return safeFromDecayBlocks; },
    setSafeFromDecayBlocks: function(newSafeFromDecayBlocks) { safeFromDecayBlocks = newSafeFromDecayBlocks; },
    blockDistanceDecayBegins: function() { return blockDistanceDecayBegins; },
    setBlockDistanceDecayBegins: function(newBlockDistanceDecayBegins) { blockDistanceDecayBegins = newBlockDistanceDecayBegins; },
    maxBuildingStories: function() { return maxBuildingStories; },
    setMaxBuildingStories: function(newMaxBuildingStories) { maxBuildingStories = newMaxBuildingStories; },
    setNeighborhoodCount: function(newNeighborhoodCount) { neighborhoodCount = newNeighborhoodCount; },
    toWorldConfig: toWorldConfig,
  };
};

export { CityConfigService };

"use strict";

var CityTour = CityTour || {};

CityTour.CityConfigService = function() {
  var TERRAIN_COLUMN_COUNT = 128;
  var TERRAIN_ROW_COUNT = 128;
  var NEIGHBORHOOD_COUNT = 5;

  var heightJitter = 20;
  var heightJitterDecay = 0.65;
  var includeRiver = true;
  var safeFromDecayBlocks = 4;
  var blockDistanceDecayBegins = 4;
  var maxBuildingStories = 40;

  var toWorldConfig = function() {
    return {
      neighborhoodCount: NEIGHBORHOOD_COUNT,
      terrain: {
        columnCount: TERRAIN_COLUMN_COUNT,
        rowCount: TERRAIN_ROW_COUNT,
        heightJitter: heightJitter,
        heightJitterDecay: heightJitterDecay,
        probabilityOfRiver: includeRiver ? 1.0 : 0.0,
      },
      roadNetwork: {
        present: true,
        safeFromDecayBlocks: safeFromDecayBlocks,
      },
      zonedBlocks: {
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
    includeRiver: function() { return includeRiver; },
    setIncludeRiver: function(newIncludeRiver) { includeRiver = newIncludeRiver; },
    safeFromDecayBlocks: function() { return safeFromDecayBlocks; },
    setSafeFromDecayBlocks: function(newSafeFromDecayBlocks) { safeFromDecayBlocks = newSafeFromDecayBlocks; },
    blockDistanceDecayBegins: function() { return blockDistanceDecayBegins; },
    setBlockDistanceDecayBegins: function(newBlockDistanceDecayBegins) { blockDistanceDecayBegins = newBlockDistanceDecayBegins; },
    maxBuildingStories: function() { return maxBuildingStories; },
    setMaxBuildingStories: function(newMaxBuildingStories) { maxBuildingStories = newMaxBuildingStories; },
    toWorldConfig: toWorldConfig,
  };
};

"use strict";

var CityTour = CityTour || {};

CityTour.CityConfigService = function() {
  var heightJitter = 20;
  var heightJitterDecay = 0.65;
  var includeRiver = true;
  var safeFromDecayPercentage = 0.4;
  var percentageDistanceDecayBegins = 0.4;
  var maxBuildingStories = 40;

  var toWorldConfig = function() {
    return {
      terrain: {
        heightJitter: heightJitter,
        heightJitterDecay: heightJitterDecay,
        probabilityOfRiver: includeRiver ? 1.0 : 0.0,
      },
      roadNetwork: {
        present: true,
        safeFromDecayPercentage: safeFromDecayPercentage,
      },
      zonedBlocks: {
        percentageDistanceDecayBegins: percentageDistanceDecayBegins,
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
    safeFromDecayPercentage: function() { return safeFromDecayPercentage; },
    setSafeFromDecayPercentage: function(newSafeFromDecayPercentage) { safeFromDecayPercentage = newSafeFromDecayPercentage; },
    percentageDistanceDecayBegins: function() { return percentageDistanceDecayBegins; },
    setPercentageDistanceDecayBegins: function(newPercentageDistanceDecayBegins) { percentageDistanceDecayBegins = newPercentageDistanceDecayBegins; },
    maxBuildingStories: function() { return maxBuildingStories; },
    setMaxBuildingStories: function(newMaxBuildingStories) { maxBuildingStories = newMaxBuildingStories; },
    toWorldConfig: toWorldConfig,
  };
};

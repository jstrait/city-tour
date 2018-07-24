"use strict";

var CityTour = CityTour || {};

CityTour.Config = (function() {
  var config = {};

  config.STREET_WIDTH = 4;
  config.STREET_DEPTH = 4;
  config.SIDEWALK_WIDTH = config.STREET_WIDTH * 0.24;
  config.SIDEWALK_DEPTH = config.STREET_DEPTH * 0.24;
  config.ROAD_WIDTH = config.STREET_WIDTH - (config.SIDEWALK_WIDTH * 2);
  config.ROAD_DEPTH = config.STREET_DEPTH - (config.SIDEWALK_DEPTH * 2);
  config.BLOCK_WIDTH = 8;
  config.BLOCK_DEPTH = 8;
  config.BLOCK_AND_STREET_WIDTH = config.BLOCK_WIDTH + config.STREET_WIDTH;
  config.BLOCK_AND_STREET_DEPTH = config.BLOCK_DEPTH + config.STREET_DEPTH;
  config.MIN_STORY_HEIGHT = 1.2;
  config.MAX_STORY_HEIGHT = 1.5;
  config.MAX_BUILDING_MATERIALS = 50;

  return config;
})();

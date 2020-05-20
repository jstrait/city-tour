"use strict";

var Config = (function() {
  var config = {};

  config.BLOCK_WIDTH = (2 / 3);
  config.BLOCK_DEPTH = (2 / 3);
  config.STREET_WIDTH = config.BLOCK_WIDTH * 0.5;
  config.STREET_DEPTH = config.BLOCK_DEPTH * 0.5;
  config.HALF_STREET_WIDTH = config.STREET_WIDTH * 0.5;
  config.HALF_STREET_DEPTH = config.STREET_DEPTH * 0.5;
  config.SIDEWALK_WIDTH = config.STREET_WIDTH * 0.24;
  config.SIDEWALK_DEPTH = config.STREET_DEPTH * 0.24;
  config.ROAD_WIDTH = config.STREET_WIDTH - (config.SIDEWALK_WIDTH * 2);
  config.ROAD_DEPTH = config.STREET_DEPTH - (config.SIDEWALK_DEPTH * 2);
  config.BLOCK_AND_STREET_WIDTH = config.BLOCK_WIDTH + config.STREET_WIDTH;
  config.BLOCK_AND_STREET_DEPTH = config.BLOCK_DEPTH + config.STREET_DEPTH;

  return config;
})();

export { Config };

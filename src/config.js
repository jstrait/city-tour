"use strict";

var Config = (function() {
  var config = {};

  config.BLOCK_WIDTH = (2 / 3);
  config.BLOCK_DEPTH = (2 / 3);
  config.STREET_WIDTH = config.BLOCK_WIDTH * 0.5;
  config.STREET_DEPTH = config.BLOCK_DEPTH * 0.5;
  config.HALF_STREET_WIDTH = config.STREET_WIDTH * 0.5;
  config.HALF_STREET_DEPTH = config.STREET_DEPTH * 0.5;
  config.SIDEWALL_BOTTOM = -8.333333333333333;

  return config;
})();

export { Config };

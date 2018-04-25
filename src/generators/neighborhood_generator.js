"use strict";

var CityTour = CityTour || {};

CityTour.NeighborhoodGenerator = (function() {
  var generate = function(cityCenterX, cityCenterZ, count) {
    var neighborhoods = [];
    var neighborhoodCenterX, neighborhoodCenterZ;
    var i;

    neighborhoods.push({ centerX: cityCenterX, centerZ: cityCenterZ });
    for (i = 0; i < count - 1; i++) {
      neighborhoodCenterX = CityTour.Math.randomInteger(-CityTour.Config.BLOCK_COLUMNS, CityTour.Config.BLOCK_COLUMNS);
      neighborhoodCenterZ = CityTour.Math.randomInteger(-CityTour.Config.BLOCK_ROWS, CityTour.Config.BLOCK_ROWS);

      neighborhoods.push({ centerX: neighborhoodCenterX, centerZ: neighborhoodCenterZ });
    }

    return neighborhoods;
  };

  return {
    generate: generate,
  };
})();

"use strict";

var CityTour = CityTour || {};

CityTour.NeighborhoodGenerator = (function() {
  var generate = function(terrain, cityCenterX, cityCenterZ, count) {
    var neighborhoods = [];
    var neighborhoodCenterX, neighborhoodCenterZ;
    var i;

    neighborhoods.push({ centerX: cityCenterX, centerZ: cityCenterZ });
    for (i = 0; i < count - 1; i++) {
      do {
        neighborhoodCenterX = CityTour.Math.randomInteger(terrain.minMapX(), terrain.maxMapX());
        neighborhoodCenterZ = CityTour.Math.randomInteger(terrain.minMapZ(), terrain.maxMapZ());
      } while (terrain.waterHeightAtCoordinates(neighborhoodCenterX, neighborhoodCenterZ) > 0.0);

      neighborhoods.push({ centerX: neighborhoodCenterX, centerZ: neighborhoodCenterZ });
    }

    return neighborhoods;
  };

  return {
    generate: generate,
  };
})();

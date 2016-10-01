"use strict";

var CityTour = CityTour || {};

CityTour.AerialNavigator = function(roadNetwork, initialTargetMapX, initialTargetMapZ) {
  var targetMapX = initialTargetMapX;
  var targetMapZ = initialTargetMapZ;
  var deltaX = 0.0;
  var deltaZ = 1.0;

  var determineNextTargetPoint = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;

    while ((oldTargetMapX === targetMapX && oldTargetMapZ === targetMapZ) || !roadNetwork.hasIntersection(targetMapX, targetMapZ)) {
      if (deltaX === 0.0) {
        targetMapX = Math.floor(Math.random() * CityTour.Config.BLOCK_ROWS) - CityTour.Config.HALF_BLOCK_ROWS;
      }
      else if (deltaZ === 0.0) {
        targetMapZ = Math.floor(Math.random() * CityTour.Config.BLOCK_COLUMNS) - CityTour.Config.HALF_BLOCK_COLUMNS;
      }
    }

    deltaX = (deltaX === 0.0) ? 1.0 : 0.0;
    deltaZ = (deltaZ === 0.0) ? 1.0 : 0.0;
  };

  var aerialNavigator = {};

  aerialNavigator.targetMapX = function() { return targetMapX; };
  aerialNavigator.targetMapZ = function() { return targetMapZ; };

  aerialNavigator.nextTarget = function() {
    determineNextTargetPoint();
  };

  return aerialNavigator;
};

"use strict";

var CityTour = CityTour || {};

CityTour.RoadNavigator = function(roadNetwork, pathFinder, initialTargetMapX, initialTargetMapZ) {
  var targetMapX = initialTargetMapX;
  var targetMapZ = initialTargetMapZ;
  var subTargetMapX = initialTargetMapX;
  var subTargetMapZ = initialTargetMapZ;

  var path = [];

  var chooseNewTarget = function() {
    var newTargetMapX;
    var newTargetMapZ;

    do {
      newTargetMapX = (Math.round(Math.random() * CityTour.Config.BLOCK_COLUMNS)) - CityTour.Config.HALF_BLOCK_COLUMNS;
      newTargetMapZ = (Math.round(Math.random() * CityTour.Config.BLOCK_ROWS)) - CityTour.Config.HALF_BLOCK_ROWS;
    } while (!roadNetwork.hasIntersection(newTargetMapX, newTargetMapZ));

    return [newTargetMapX, newTargetMapZ];
  };

  var simplifyPath = function(path) {
    var xRun = 0;
    var zRun = 0;
    var previousX = subTargetMapX;
    var previousZ = subTargetMapZ;

    var simplifiedPath = [];

    var i, x, z;
    for (i = 0; i < path.length; i++) {
      x = path[i][0];
      z = path[i][1];
      xRun = (x === previousX) ? xRun + 1 : 0;
      zRun = (z === previousZ) ? zRun + 1 : 0;

      if (((xRun === 1 && zRun === 0) || (xRun === 0 && zRun === 1)) && (i > 0)) {
        simplifiedPath.push([previousX, previousZ]);
      }

      previousX = x;
      previousZ = z;
    };

    simplifiedPath.push([x, z]);

    return simplifiedPath;
  };

  var roadNavigator = {};

  roadNavigator.targetMapX = function() { return subTargetMapX; };
  roadNavigator.targetMapZ = function() { return subTargetMapZ; };

  roadNavigator.nextTarget = function() {
    if (path.length === 0) {
      var newTargetCoordinates = chooseNewTarget();
      path = pathFinder.shortestPath(targetMapX, targetMapZ, newTargetCoordinates[0], newTargetCoordinates[1]);
      path = simplifyPath(path);

      targetMapX = newTargetCoordinates[0];
      targetMapZ = newTargetCoordinates[1];
    }

    var nextTargetPoint = path.splice(0, 1);
    subTargetMapX = nextTargetPoint[0][0];
    subTargetMapZ = nextTargetPoint[0][1];
  };

  return roadNavigator;
};

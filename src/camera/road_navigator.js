"use strict";

var CityTour = CityTour || {};


/*
   Generates target points for the camera to move to, simulating the camera
   driving on the road network.

   A target road intersection is chosen at random, and the injected path finder
   then finds a path to that intersection. A path is a sequence of intersections
   to travel to that will ultimately end up at the target intersection.
*/
CityTour.RoadNavigator = function(roadNetwork, pathFinder, initialTargetMapX, initialTargetMapZ) {
  var targetMapX = initialTargetMapX;
  var targetMapZ = initialTargetMapZ;
  var subTargetMapX = initialTargetMapX;
  var subTargetMapZ = initialTargetMapZ;

  var path = [];

  var chooseNewTarget = function() {
    var newTargetMapX;
    var newTargetMapZ;

    var roadNetworkWidth = roadNetwork.maxColumn() - roadNetwork.minColumn();
    var roadNetworkDepth = roadNetwork.maxRow() - roadNetwork.minRow();
    var halfRoadNetworkWidth = roadNetworkWidth / 2;
    var halfRoadNetworkDepth = roadNetworkDepth / 2;

    do {
      newTargetMapX = Math.round((Math.random() * roadNetworkWidth) - halfRoadNetworkWidth);
      newTargetMapZ = Math.round((Math.random() * roadNetworkDepth) - halfRoadNetworkDepth);
    } while (!roadNetwork.hasIntersection(newTargetMapX, newTargetMapZ));

    return [newTargetMapX, newTargetMapZ];
  };


  // Reduces path sequences that travel in the same direction to multiple intersections
  // to a path sequence that directly travels to the final point in that direction.
  //
  // For example, reduces {0, 0} -> {0, 1} -> {0, 2} -> {0, 3} to {0, 0} -> {0, 3}
  //
  // The reason for doing this is to cause the camera to smoothly move to the final
  // target point in the direction, and avoid stutter stops at each intermediate
  // intersection on the way.
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

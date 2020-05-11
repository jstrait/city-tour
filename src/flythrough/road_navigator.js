"use strict";

import { CityTourMath } from "./../math";

/*
   Generates target points for the camera to move to, simulating the camera
   driving on the road network.

   A target road intersection is chosen at random, and the injected path finder
   then finds a path to that intersection. A path is a sequence of intersections
   to travel to that will ultimately end up at the target intersection.
*/
var RoadNavigator = function(roadNetwork, pathFinder, initialTargetX, initialTargetZ) {
  var targetX = initialTargetX;
  var targetZ = initialTargetZ;
  var subTargetX = initialTargetX;
  var subTargetZ = initialTargetZ;

  var path = [];

  var chooseNewTarget = function() {
    var newTargetX;
    var newTargetZ;

    do {
      newTargetX = CityTourMath.randomInteger(roadNetwork.minColumn(), roadNetwork.maxColumn());
      newTargetZ = CityTourMath.randomInteger(roadNetwork.minRow(), roadNetwork.maxRow());
    } while (!roadNetwork.hasIntersection(newTargetX, newTargetZ));

    return [newTargetX, newTargetZ];
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
    var previousX = subTargetX;
    var previousZ = subTargetZ;

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
    }

    simplifiedPath.push([x, z]);

    return simplifiedPath;
  };

  var nextTarget = function() {
    if (path.length === 0) {
      var newTargetCoordinates = chooseNewTarget();
      path = pathFinder.shortestPath(targetX, targetZ, newTargetCoordinates[0], newTargetCoordinates[1]);
      path = simplifyPath(path);

      targetX = newTargetCoordinates[0];
      targetZ = newTargetCoordinates[1];
    }

    var nextTargetPoint = path.splice(0, 1);
    subTargetX = nextTargetPoint[0][0];
    subTargetZ = nextTargetPoint[0][1];
  };


  return {
    targetX: function() { return subTargetX; },
    targetZ: function() { return subTargetZ; },
    nextTarget: nextTarget,
  };
};

export { RoadNavigator };

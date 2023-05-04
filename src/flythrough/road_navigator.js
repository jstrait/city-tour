"use strict";

import { CityTourMath } from "./../math";

/*
   Generates target points for the camera to move to, simulating the camera
   driving on the road network.

   A target road intersection is chosen at random, and the injected path finder
   then finds a path to that intersection. A path is a sequence of intersections
   to travel to that will ultimately end up at the target intersection.
*/
var RoadNavigator = function(roadNetwork, pathFinder, targetX, targetZ) {
  var path = [];

  var chooseNewTarget = function() {
    var newTargetX;
    var newTargetZ;

    do {
      newTargetX = CityTourMath.randomInteger(roadNetwork.minBoundingX(), roadNetwork.maxBoundingX());
      newTargetZ = CityTourMath.randomInteger(roadNetwork.minBoundingZ(), roadNetwork.maxBoundingZ());
    } while ((targetX === newTargetX && targetZ === newTargetZ) ||
             roadNetwork.hasIntersection(newTargetX, newTargetZ) !== true);

    return [newTargetX, newTargetZ];
  };

  var nextTarget = function() {
    if (path.length === 0) {
      var newTargetCoordinates = chooseNewTarget();
      path = pathFinder.shortestPath(targetX, targetZ, newTargetCoordinates[0], newTargetCoordinates[1]);
    }

    var nextTargetPoint = path.splice(0, 1);
    targetX = nextTargetPoint[0].x;
    targetZ = nextTargetPoint[0].z;
  };


  return {
    targetX: function() { return targetX; },
    targetZ: function() { return targetZ; },
    nextTarget: nextTarget,
  };
};

export { RoadNavigator };

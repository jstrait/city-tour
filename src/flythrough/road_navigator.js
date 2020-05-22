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

  var nextTarget = function() {
    if (path.length === 0) {
      var newTargetCoordinates = chooseNewTarget();
      path = pathFinder.shortestPath(targetX, targetZ, newTargetCoordinates[0], newTargetCoordinates[1]);

      targetX = newTargetCoordinates[0];
      targetZ = newTargetCoordinates[1];
    }

    var nextTargetPoint = path.splice(0, 1);
    subTargetX = nextTargetPoint[0].x;
    subTargetZ = nextTargetPoint[0].z;
  };


  return {
    targetX: function() { return subTargetX; },
    targetZ: function() { return subTargetZ; },
    nextTarget: nextTarget,
  };
};

export { RoadNavigator };

"use strict";

var CityTour = CityTour || {};


/*
   Generates target points for the camera to move to, simulating the camera
   flying in the air over the city.

   Since the movement is assumed to happen in the air, points are selected without
   worrying about whether it requires moving over roads or terrain. However, the
   target point will always be over a road intersection, to prevent choosing a
   target point that is outside of the city or over an area of land with no
   roads or buildings.

   Target points are chosen to alternate between either a point north or south of
   the previous target, or east or west of the previous target.
*/
CityTour.AerialNavigator = function(roadNetwork, initialTargetMapX, initialTargetMapZ) {
  var MAX_ITERATIONS = 100;

  var X_AXIS = 1;
  var Z_AXIS = 2;

  var targetMapX = initialTargetMapX;
  var targetMapZ = initialTargetMapZ;
  var movementAxis = X_AXIS;

  var searchForTargetOnAxis = function() {
    var iterationCount = 0;
    var newTargetMapX = targetMapX;
    var newTargetMapZ = targetMapZ;

    while ((targetMapX === newTargetMapX && targetMapZ === newTargetMapZ) || !roadNetwork.hasIntersection(newTargetMapX, newTargetMapZ)) {
      if (iterationCount >= MAX_ITERATIONS) {
        return;
      }

      if (movementAxis === X_AXIS) {
        newTargetMapX = CityTour.Math.randomInteger(roadNetwork.minColumn(), roadNetwork.maxColumn());
      }
      else if (movementAxis === Z_AXIS) {
        newTargetMapZ = CityTour.Math.randomInteger(roadNetwork.minRow(), roadNetwork.maxRow());
      }

      iterationCount += 1;
    }

    return [newTargetMapX, newTargetMapZ];
  };

  var nextTarget = function() {
    var newTargetCoordinates;

    newTargetCoordinates = searchForTargetOnAxis();

    // If target on intended axis not found, check the other axis instead
    if (newTargetCoordinates === undefined) {
      movementAxis = (movementAxis === X_AXIS) ? Z_AXIS : X_AXIS;
      newTargetCoordinates = searchForTargetOnAxis();

      // If target can't be found on _either_ axis (implying road network is empty),
      // then set the target to the current position.
      if (newTargetCoordinates === undefined) {
        newTargetCoordinates = [targetMapX, targetMapZ];
      }
    }

    targetMapX = newTargetCoordinates[0];
    targetMapZ = newTargetCoordinates[1];
    movementAxis = (movementAxis === X_AXIS) ? Z_AXIS : X_AXIS;
  };


  return {
    targetMapX: function() { return targetMapX; },
    targetMapZ: function() { return targetMapZ; },
    nextTarget: nextTarget,
  };
};

"use strict";

import { CityTourMath } from "./../math";
import { SmoothStepEasing } from "./easing";
import { MotionGenerator } from "./motion_generator";

var VehicleView = function(vehicleController) {
  var MIN_ROTATION_X_OFFSET = -Math.PI / 6;
  var MAX_ROTATION_X_OFFSET = Math.PI / 4;
  var MIN_ROTATION_Y_OFFSET = -Math.PI;
  var MAX_ROTATION_Y_OFFSET = Math.PI;
  var RESET_TO_CENTER_ANIMATION_FRAME_COUNT = 40;

  var resetToCenterRotationXMotionGenerator;
  var resetToCenterRotationYMotionGenerator;

  var lockedRotationX;
  var lockedRotationY;
  var lockedRotationOffsetX;
  var lockedRotationOffsetY;
  var finalLockedRotationX;
  var finalLockedRotationY;

  var rotationX = vehicleController.rotationX();
  var rotationY = vehicleController.rotationY();

  var lockAngles = function() {
    lockedRotationX = rotationX;
    lockedRotationY = rotationY;
    lockedRotationOffsetX = 0.0;
    lockedRotationOffsetY = 0.0;
  };

  var setLockedRotationOffsetX = function(newLockedRotationOffsetX) {
    lockedRotationOffsetX = CityTourMath.clamp(newLockedRotationOffsetX, MIN_ROTATION_X_OFFSET, MAX_ROTATION_X_OFFSET);
  };

  var setLockedRotationOffsetY = function(newLockedRotationOffsetY) {
    lockedRotationOffsetY = CityTourMath.clamp(newLockedRotationOffsetY, MIN_ROTATION_Y_OFFSET, MAX_ROTATION_Y_OFFSET);
  };

  var tick = function() {
    if (resetToCenterRotationXMotionGenerator !== undefined) {
      rotationX = CityTourMath.lerp(finalLockedRotationX, vehicleController.rotationX(), resetToCenterRotationXMotionGenerator.next());

      if (resetToCenterRotationXMotionGenerator.finished()) {
        finalLockedRotationX = undefined;
        resetToCenterRotationXMotionGenerator = undefined;
      }
    }
    else if (lockedRotationX === undefined) {
      rotationX = vehicleController.rotationX();
    }
    else {
      rotationX = lockedRotationX + lockedRotationOffsetX;
    }

    if (resetToCenterRotationYMotionGenerator !== undefined) {
      rotationY = CityTourMath.lerp(finalLockedRotationY, vehicleController.rotationY(), resetToCenterRotationYMotionGenerator.next());

      if (resetToCenterRotationYMotionGenerator.finished()) {
        finalLockedRotationY = undefined;
        resetToCenterRotationYMotionGenerator = undefined;
      }
    }
    else if (lockedRotationY === undefined) {
      rotationY = vehicleController.rotationY();
    }
    else {
      rotationY = lockedRotationY + lockedRotationOffsetY;
    }
  };

  var enableResetToCenterAnimation = function() {
    var resetToCenterRotationXEasing = SmoothStepEasing(RESET_TO_CENTER_ANIMATION_FRAME_COUNT);
    var resetToCenterRotationYEasing = SmoothStepEasing(RESET_TO_CENTER_ANIMATION_FRAME_COUNT);

    finalLockedRotationX = lockedRotationX + lockedRotationOffsetX;
    finalLockedRotationY = lockedRotationY + lockedRotationOffsetY;
    lockedRotationX = undefined;
    lockedRotationY = undefined;

    resetToCenterRotationXMotionGenerator = MotionGenerator(0.0, 1.0, resetToCenterRotationXEasing);
    resetToCenterRotationYMotionGenerator = MotionGenerator(0.0, 1.0, resetToCenterRotationYEasing);
  };

  var disableResetToCenterAnimation = function() {
    resetToCenterRotationXMotionGenerator = undefined;
    resetToCenterRotationYMotionGenerator = undefined;
  };

  return {
    positionX: function() { return vehicleController.positionX(); },
    positionY: function() { return vehicleController.positionY(); },
    positionZ: function() { return vehicleController.positionZ(); },
    rotationX: function() { return rotationX; },
    rotationY: function() { return rotationY; },
    lockedRotationOffsetX: function() { return lockedRotationOffsetX; },
    lockedRotationOffsetY: function() { return lockedRotationOffsetY; },
    lockAngles: lockAngles,
    setLockedRotationOffsetX: setLockedRotationOffsetX,
    setLockedRotationOffsetY: setLockedRotationOffsetY,
    tick: tick,
    enableResetToCenterAnimation: enableResetToCenterAnimation,
    disableResetToCenterAnimation: disableResetToCenterAnimation,
  };
};

export { VehicleView };

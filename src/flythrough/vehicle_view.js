"use strict";

import { CityTourMath } from "./../math";
import { SmoothStepEasing } from "./easing";
import { MotionGenerator } from "./motion_generator";

var VehicleView = function(vehicleController) {
  var MIN_AZIMUTH_ANGLE_OFFSET = -Math.PI / 2;
  var MAX_AZIMUTH_ANGLE_OFFSET = Math.PI / 2;
  var MIN_TILTANGLE_OFFSET = -Math.PI / 6;
  var MAX_TILTANGLE_OFFSET = Math.PI / 4;
  var RESET_TO_CENTER_ANIMATION_FRAME_COUNT = 40;

  var azimuthAngleOffset = 0.0;
  var tiltAngleOffset = 0.0;
  var resetToCenterAzimuthAngleMotionGenerator, resetToCenterTiltAngleMotionGenerator;

  var setAzimuthAngleOffset = function(newAzimuthAngleOffset) {
    azimuthAngleOffset = CityTourMath.clamp(newAzimuthAngleOffset, MIN_AZIMUTH_ANGLE_OFFSET, MAX_AZIMUTH_ANGLE_OFFSET);
  };

  var setTiltAngleOffset = function(newTiltAngleOffset) {
    tiltAngleOffset = CityTourMath.clamp(newTiltAngleOffset, MIN_TILTANGLE_OFFSET, MAX_TILTANGLE_OFFSET);
  };

  var tick = function() {
    if (resetToCenterAzimuthAngleMotionGenerator) {
      setAzimuthAngleOffset(resetToCenterAzimuthAngleMotionGenerator.next());
      if (resetToCenterAzimuthAngleMotionGenerator.finished()) {
        resetToCenterAzimuthAngleMotionGenerator = undefined;
      }
    }

    if (resetToCenterTiltAngleMotionGenerator) {
      setTiltAngleOffset(resetToCenterTiltAngleMotionGenerator.next());
      if (resetToCenterTiltAngleMotionGenerator.finished()) {
        resetToCenterTiltAngleMotionGenerator = undefined;
      }
    }
  };

  var enableResetToCenterAnimation = function() {
    var resetToCenterAzimuthAngleEasing = SmoothStepEasing(RESET_TO_CENTER_ANIMATION_FRAME_COUNT);
    var resetToCenterTiltAngleEasing = SmoothStepEasing(RESET_TO_CENTER_ANIMATION_FRAME_COUNT);

    resetToCenterAzimuthAngleMotionGenerator = MotionGenerator(azimuthAngleOffset, 0.0, resetToCenterAzimuthAngleEasing);
    resetToCenterTiltAngleMotionGenerator = MotionGenerator(tiltAngleOffset, 0.0, resetToCenterTiltAngleEasing);
  };

  var disableResetToCenterAnimation = function() {
    resetToCenterAzimuthAngleMotionGenerator = undefined;
    resetToCenterTiltAngleMotionGenerator = undefined;
  };

  return {
    positionX: function() { return vehicleController.positionX(); },
    positionY: function() { return vehicleController.positionY(); },
    positionZ: function() { return vehicleController.positionZ(); },
    rotationX: function() { return vehicleController.rotationX() + tiltAngleOffset; },
    rotationY: function() { return vehicleController.rotationY() + azimuthAngleOffset; },
    azimuthAngleOffset: function() { return azimuthAngleOffset; },
    tiltAngleOffset: function() { return tiltAngleOffset; },
    setAzimuthAngleOffset: setAzimuthAngleOffset,
    setTiltAngleOffset: setTiltAngleOffset,
    tick: tick,
    enableResetToCenterAnimation: enableResetToCenterAnimation,
    disableResetToCenterAnimation: disableResetToCenterAnimation,
  };
};

export { VehicleView };

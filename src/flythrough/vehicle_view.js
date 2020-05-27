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

  var baseAzimuthAngle = undefined;
  var baseTiltAngle = undefined;
  var finalAzimuthAngle = undefined;
  var finalTiltAngle = undefined;
  var rotationX = vehicleController.rotationX();
  var rotationY = vehicleController.rotationY();

  var setBaseAngles = function() {
    baseAzimuthAngle = vehicleController.rotationY();
    baseTiltAngle = vehicleController.rotationX();
    azimuthAngleOffset = 0.0;
    tiltAngleOffset = 0.0;
  };

  var setAzimuthAngleOffset = function(newAzimuthAngleOffset) {
    azimuthAngleOffset = CityTourMath.clamp(newAzimuthAngleOffset, MIN_AZIMUTH_ANGLE_OFFSET, MAX_AZIMUTH_ANGLE_OFFSET);
  };

  var setTiltAngleOffset = function(newTiltAngleOffset) {
    tiltAngleOffset = CityTourMath.clamp(newTiltAngleOffset, MIN_TILTANGLE_OFFSET, MAX_TILTANGLE_OFFSET);
  };

  var tick = function() {
    if (resetToCenterAzimuthAngleMotionGenerator) {
      rotationY = CityTourMath.lerp(finalAzimuthAngle, vehicleController.rotationY(), resetToCenterAzimuthAngleMotionGenerator.next());
      if (resetToCenterAzimuthAngleMotionGenerator.finished()) {
        finalAzimuthAngle = undefined;
        resetToCenterAzimuthAngleMotionGenerator = undefined;
      }
    }
    else if (baseAzimuthAngle === undefined) {
      rotationY = vehicleController.rotationY();
    }
    else {
      rotationY = baseAzimuthAngle + azimuthAngleOffset;
    }

    if (resetToCenterTiltAngleMotionGenerator) {
      rotationX = CityTourMath.lerp(finalTiltAngle, vehicleController.rotationX(), resetToCenterTiltAngleMotionGenerator.next());
      if (resetToCenterTiltAngleMotionGenerator.finished()) {
        finalTiltAngle = undefined;
        resetToCenterTiltAngleMotionGenerator = undefined;
      }
    }
    else if (baseTiltAngle === undefined) {
      rotationX = vehicleController.rotationX();
    }
    else {
      rotationX = baseTiltAngle + tiltAngleOffset;
    }
  };

  var enableResetToCenterAnimation = function() {
    var resetToCenterAzimuthAngleEasing = SmoothStepEasing(RESET_TO_CENTER_ANIMATION_FRAME_COUNT);
    var resetToCenterTiltAngleEasing = SmoothStepEasing(RESET_TO_CENTER_ANIMATION_FRAME_COUNT);

    finalAzimuthAngle = baseAzimuthAngle + azimuthAngleOffset;
    finalTiltAngle = baseTiltAngle + tiltAngleOffset;
    baseAzimuthAngle = undefined;
    baseTiltAngle = undefined;

    resetToCenterAzimuthAngleMotionGenerator = MotionGenerator(0.0, 1.0, resetToCenterAzimuthAngleEasing);
    resetToCenterTiltAngleMotionGenerator = MotionGenerator(0.0, 1.0, resetToCenterTiltAngleEasing);
  };

  var disableResetToCenterAnimation = function() {
    resetToCenterAzimuthAngleMotionGenerator = undefined;
    resetToCenterTiltAngleMotionGenerator = undefined;
  };

  return {
    positionX: function() { return vehicleController.positionX(); },
    positionY: function() { return vehicleController.positionY(); },
    positionZ: function() { return vehicleController.positionZ(); },
    rotationX: function() { return rotationX; },
    rotationY: function() { return rotationY; },
    azimuthAngleOffset: function() { return azimuthAngleOffset; },
    tiltAngleOffset: function() { return tiltAngleOffset; },
    setBaseAngles: setBaseAngles,
    setAzimuthAngleOffset: setAzimuthAngleOffset,
    setTiltAngleOffset: setTiltAngleOffset,
    tick: tick,
    enableResetToCenterAnimation: enableResetToCenterAnimation,
    disableResetToCenterAnimation: disableResetToCenterAnimation,
  };
};

export { VehicleView };

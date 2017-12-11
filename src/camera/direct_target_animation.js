"use strict";

var CityTour = CityTour || {};

CityTour.DirectTargetAnimation = function(initial, target) {
  var ANIMATION_DURATION_IN_FRAMES = 3.0;
  var MOTION_DELTA = 1.0 / ANIMATION_DURATION_IN_FRAMES;

  var xPosition = initial.positionX;
  var yPosition = initial.positionY;
  var zPosition = initial.positionZ;
  var xRotation = initial.rotationX;
  var yRotation = initial.rotationY;

  // Prevent turns more than 180 degrees
  if ((yRotation - target.rotationY) > Math.PI) {
    yRotation -= Math.PI * 2;
  }
  else if ((yRotation - target.rotationY) < -Math.PI) {
    yRotation += Math.PI * 2;
  }

  var xPositionMotionGenerator = new CityTour.ClampedLinearMotionGenerator(xPosition, target.positionX, MOTION_DELTA);
  var yPositionMotionGenerator = new CityTour.ClampedLinearMotionGenerator(yPosition, target.positionY, MOTION_DELTA);
  var zPositionMotionGenerator = new CityTour.ClampedLinearMotionGenerator(zPosition, target.positionZ, MOTION_DELTA);
  var xRotationMotionGenerator = new CityTour.ClampedLinearMotionGenerator(xRotation, target.rotationX, MOTION_DELTA);
  var yRotationMotionGenerator = new CityTour.ClampedLinearMotionGenerator(yRotation, target.rotationY, MOTION_DELTA);

  var tick = function() {
    xPosition = xPositionMotionGenerator.next();
    yPosition = yPositionMotionGenerator.next();
    zPosition = zPositionMotionGenerator.next();
    xRotation = xRotationMotionGenerator.next();
    yRotation = yRotationMotionGenerator.next();
  };

  var isFinished = function() {
    return xPositionMotionGenerator.finished() &&
           yPositionMotionGenerator.finished() &&
           zPositionMotionGenerator.finished() &&
           xRotationMotionGenerator.finished() &&
           yRotationMotionGenerator.finished();
  };


  return {
    tick: tick,
    xPosition: function() { return xPosition; },
    yPosition: function() { return yPosition; },
    zPosition: function() { return zPosition; },
    xRotation: function() { return xRotation; },
    yRotation: function() { return yRotation; },
    isFinished: isFinished,
  };
};


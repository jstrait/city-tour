"use strict";

var CityTour = CityTour || {};

CityTour.DebugAnimation = function(initial, target, up) {
  var ANIMATION_DURATION_IN_FRAMES = 50.0;
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

  if (up) {
    var xPositionMotionGenerator = new CityTour.SineMotionGenerator(xPosition, target.positionX, MOTION_DELTA, 'forward');
    var yPositionMotionGenerator = new CityTour.SineMotionGenerator(yPosition, target.positionY, MOTION_DELTA, 'backward');
    var zPositionMotionGenerator = new CityTour.SineMotionGenerator(zPosition, target.positionZ, MOTION_DELTA, 'forward');
    var xRotationMotionGenerator = new CityTour.SineMotionGenerator(xRotation, target.rotationX, MOTION_DELTA, 'forward');
    var yRotationMotionGenerator = new CityTour.SineMotionGenerator(yRotation, target.rotationY, MOTION_DELTA, 'forward');
  }
  else {
    var xPositionMotionGenerator = new CityTour.SineMotionGenerator(xPosition, target.positionX, MOTION_DELTA, 'forward');
    var yPositionMotionGenerator = new CityTour.SineMotionGenerator(yPosition, target.positionY, MOTION_DELTA, 'forward');
    var zPositionMotionGenerator = new CityTour.SineMotionGenerator(zPosition, target.positionZ, MOTION_DELTA, 'forward');
    var xRotationMotionGenerator = new CityTour.SineMotionGenerator(xRotation, target.rotationX, MOTION_DELTA, 'backward');
    var yRotationMotionGenerator = new CityTour.SineMotionGenerator(yRotation, target.rotationY, MOTION_DELTA, 'forward');
  }

  var debugAnimation = {};

  debugAnimation.setTargetXPosition = function(newTargetXPosition) {
    xPositionMotionGenerator.setTarget(newTargetXPosition);
  };

  debugAnimation.setTargetYPosition = function(newTargetYPosition) {
    yPositionMotionGenerator.setTarget(newTargetYPosition);
  };

  debugAnimation.setTargetZPosition = function(newTargetZPosition) {
    zPositionMotionGenerator.setTarget(newTargetZPosition);
  };

  debugAnimation.setTargetXRotation = function(newTargetXRotation) {
    xRotationMotionGenerator.setTarget(newTargetXRotation);
  };

  debugAnimation.setTargetYRotation = function(newTargetYRotation) {
    yRotationMotionGenerator.setTarget(newTargetYRotation);
  };

  debugAnimation.tick = function() {
    xPosition = xPositionMotionGenerator.next();
    yPosition = yPositionMotionGenerator.next();
    zPosition = zPositionMotionGenerator.next();
    xRotation = xRotationMotionGenerator.next();
    yRotation = yRotationMotionGenerator.next();
  };

  debugAnimation.xPosition = function() { return xPosition; };
  debugAnimation.yPosition = function() { return yPosition; };
  debugAnimation.zPosition = function() { return zPosition; };
  debugAnimation.xRotation = function() { return xRotation; };
  debugAnimation.yRotation = function() { return yRotation; };
  debugAnimation.finished = function() { return xPositionMotionGenerator.finished() &&
                                                yPositionMotionGenerator.finished() &&
                                                zPositionMotionGenerator.finished() &&
                                                xRotationMotionGenerator.finished() &&
                                                yRotationMotionGenerator.finished();
                                       };

  return debugAnimation;
};

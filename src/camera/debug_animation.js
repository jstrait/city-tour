"use strict";

var CityTour = CityTour || {};

CityTour.DebugAnimation = function(initial, target, up) {
  var ANIMATION_DURATION_IN_FRAMES = 50.0;
  var MOTION_DELTA = 1.0 / ANIMATION_DURATION_IN_FRAMES;

  var positionX = initial.positionX;
  var positionY = initial.positionY;
  var positionZ = initial.positionZ;
  var rotationX = initial.rotationX;
  var rotationY = initial.rotationY;

  // Prevent turns more than 180 degrees
  if ((rotationY - target.rotationY) > Math.PI) {
    rotationY -= Math.PI * 2;
  }
  else if ((rotationY - target.rotationY) < -Math.PI) {
    rotationY += Math.PI * 2;
  }

  if (up) {
    var positionXMotionGenerator = new CityTour.SineMotionGenerator(positionX, target.positionX, MOTION_DELTA, 'forward');
    var positionYMotionGenerator = new CityTour.SineMotionGenerator(positionY, target.positionY, MOTION_DELTA, 'backward');
    var positionZMotionGenerator = new CityTour.SineMotionGenerator(positionZ, target.positionZ, MOTION_DELTA, 'forward');
    var rotationXMotionGenerator = new CityTour.SineMotionGenerator(rotationX, target.rotationX, MOTION_DELTA, 'forward');
    var rotationYMotionGenerator = new CityTour.SineMotionGenerator(rotationY, target.rotationY, MOTION_DELTA, 'forward');
  }
  else {
    var positionXMotionGenerator = new CityTour.SineMotionGenerator(positionX, target.positionX, MOTION_DELTA, 'forward');
    var positionYMotionGenerator = new CityTour.SineMotionGenerator(positionY, target.positionY, MOTION_DELTA, 'forward');
    var positionZMotionGenerator = new CityTour.SineMotionGenerator(positionZ, target.positionZ, MOTION_DELTA, 'forward');
    var rotationXMotionGenerator = new CityTour.SineMotionGenerator(rotationX, target.rotationX, MOTION_DELTA, 'backward');
    var rotationYMotionGenerator = new CityTour.SineMotionGenerator(rotationY, target.rotationY, MOTION_DELTA, 'forward');
  }

  var debugAnimation = {};

  debugAnimation.setTargetXPosition = function(newTargetXPosition) {
    positionXMotionGenerator.setTarget(newTargetXPosition);
  };

  debugAnimation.setTargetYPosition = function(newTargetYPosition) {
    positionYMotionGenerator.setTarget(newTargetYPosition);
  };

  debugAnimation.setTargetZPosition = function(newTargetZPosition) {
    positionZMotionGenerator.setTarget(newTargetZPosition);
  };

  debugAnimation.setTargetXRotation = function(newTargetXRotation) {
    rotationXMotionGenerator.setTarget(newTargetXRotation);
  };

  debugAnimation.setTargetYRotation = function(newTargetYRotation) {
    rotationYMotionGenerator.setTarget(newTargetYRotation);
  };

  debugAnimation.tick = function() {
    positionX = positionXMotionGenerator.next();
    positionY = positionYMotionGenerator.next();
    positionZ = positionZMotionGenerator.next();
    rotationX = rotationXMotionGenerator.next();
    rotationY = rotationYMotionGenerator.next();
  };

  debugAnimation.positionX = function() { return positionX; };
  debugAnimation.positionY = function() { return positionY; };
  debugAnimation.positionZ = function() { return positionZ; };
  debugAnimation.rotationX = function() { return rotationX; };
  debugAnimation.rotationY = function() { return rotationY; };
  debugAnimation.finished = function() { return positionXMotionGenerator.finished() &&
                                                positionYMotionGenerator.finished() &&
                                                positionZMotionGenerator.finished() &&
                                                rotationXMotionGenerator.finished() &&
                                                rotationYMotionGenerator.finished();
                                       };

  return debugAnimation;
};

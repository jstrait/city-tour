"use strict";

var CityTour = CityTour || {};

CityTour.DirectTargetAnimation = function(initial, target) {
  var ANIMATION_DURATION_IN_FRAMES = 3.0;
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

  var positionXMotionGenerator = new CityTour.ClampedLinearMotionGenerator(positionX, target.positionX, MOTION_DELTA);
  var positionYMotionGenerator = new CityTour.ClampedLinearMotionGenerator(positionY, target.positionY, MOTION_DELTA);
  var positionZMotionGenerator = new CityTour.ClampedLinearMotionGenerator(positionZ, target.positionZ, MOTION_DELTA);
  var rotationXMotionGenerator = new CityTour.ClampedLinearMotionGenerator(rotationX, target.rotationX, MOTION_DELTA);
  var rotationYMotionGenerator = new CityTour.ClampedLinearMotionGenerator(rotationY, target.rotationY, MOTION_DELTA);

  var tick = function() {
    positionX = positionXMotionGenerator.next();
    positionY = positionYMotionGenerator.next();
    positionZ = positionZMotionGenerator.next();
    rotationX = rotationXMotionGenerator.next();
    rotationY = rotationYMotionGenerator.next();
  };

  var isFinished = function() {
    return positionXMotionGenerator.finished() &&
           positionYMotionGenerator.finished() &&
           positionZMotionGenerator.finished() &&
           rotationXMotionGenerator.finished() &&
           rotationYMotionGenerator.finished();
  };


  return {
    tick: tick,
    positionX: function() { return positionX; },
    positionY: function() { return positionY; },
    positionZ: function() { return positionZ; },
    rotationX: function() { return rotationX; },
    rotationY: function() { return rotationY; },
    isFinished: isFinished,
  };
};


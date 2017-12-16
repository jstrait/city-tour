"use strict";

var CityTour = CityTour || {};

CityTour.DirectTargetAnimation = function(initial, target) {
  var HALF_PI = Math.PI / 2;
  var ANIMATION_DURATION_IN_FRAMES = 10;

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

  var positionXMotionGenerator = new CityTour.MotionGenerator(positionX, target.positionX, new CityTour.SineEasing(ANIMATION_DURATION_IN_FRAMES, 0, HALF_PI));
  var positionYMotionGenerator = new CityTour.MotionGenerator(positionY, target.positionY, new CityTour.SineEasing(ANIMATION_DURATION_IN_FRAMES, 0, HALF_PI));
  var positionZMotionGenerator = new CityTour.MotionGenerator(positionZ, target.positionZ, new CityTour.SineEasing(ANIMATION_DURATION_IN_FRAMES, 0, HALF_PI));
  var rotationXMotionGenerator = new CityTour.MotionGenerator(rotationX, target.rotationX, new CityTour.SineEasing(ANIMATION_DURATION_IN_FRAMES, 0, HALF_PI));
  var rotationYMotionGenerator = new CityTour.MotionGenerator(rotationY, target.rotationY, new CityTour.SineEasing(ANIMATION_DURATION_IN_FRAMES, 0, HALF_PI));

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

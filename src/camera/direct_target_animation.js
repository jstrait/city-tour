"use strict";

var CityTour = CityTour || {};

CityTour.DirectTargetAnimation = function(initial, target) {
  var ANIMATION_DURATION_IN_FRAMES = 10;
  var MOTION_PER_FRAME_PERCENTAGE = 1.0 / ANIMATION_DURATION_IN_FRAMES;

  var tickCount = 0;

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

  var positionXDelta = Math.abs((target.positionX - positionX) * MOTION_PER_FRAME_PERCENTAGE);
  var positionYDelta = Math.abs((target.positionY - positionY) * MOTION_PER_FRAME_PERCENTAGE);
  var positionZDelta = Math.abs((target.positionZ - positionZ) * MOTION_PER_FRAME_PERCENTAGE);
  var rotationXDelta = Math.abs((target.rotationX - rotationX) * MOTION_PER_FRAME_PERCENTAGE);
  var rotationYDelta = Math.abs((target.rotationY - rotationY) * MOTION_PER_FRAME_PERCENTAGE);

  var positionXMotionGenerator = new CityTour.ClampedLinearMotionGenerator(positionX, target.positionX, positionXDelta);
  var positionYMotionGenerator = new CityTour.ClampedLinearMotionGenerator(positionY, target.positionY, positionYDelta);
  var positionZMotionGenerator = new CityTour.ClampedLinearMotionGenerator(positionZ, target.positionZ, positionZDelta);
  var rotationXMotionGenerator = new CityTour.ClampedLinearMotionGenerator(rotationX, target.rotationX, rotationXDelta);
  var rotationYMotionGenerator = new CityTour.ClampedLinearMotionGenerator(rotationY, target.rotationY, rotationYDelta);

  var tick = function() {
    positionX = positionXMotionGenerator.next();
    positionY = positionYMotionGenerator.next();
    positionZ = positionZMotionGenerator.next();
    rotationX = rotationXMotionGenerator.next();
    rotationY = rotationYMotionGenerator.next();

    tickCount += 1;
  };

  var isFinished = function() {
    return tickCount >= ANIMATION_DURATION_IN_FRAMES;
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

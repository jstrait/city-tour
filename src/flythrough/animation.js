"use strict";

var Animation = function(positionXMotionGenerator, positionYMotionGenerator, positionZMotionGenerator, rotationXMotionGenerator, rotationYMotionGenerator) {
  var positionX;
  var positionY;
  var positionZ;
  var rotationX;
  var rotationY;

  var tick = function() {
    positionX = positionXMotionGenerator.next();
    positionY = positionYMotionGenerator.next();
    positionZ = positionZMotionGenerator.next();
    rotationX = rotationXMotionGenerator.next();
    rotationY = rotationYMotionGenerator.next();
  };

  var finished = function() {
    return positionXMotionGenerator.finished() &&
           positionYMotionGenerator.finished() &&
           positionZMotionGenerator.finished() &&
           rotationXMotionGenerator.finished() &&
           rotationYMotionGenerator.finished();
  };


  return {
    finished: finished,
    tick: tick,
    positionX: function() { return positionX; },
    positionY: function() { return positionY; },
    positionZ: function() { return positionZ; },
    rotationX: function() { return rotationX; },
    rotationY: function() { return rotationY; },
  };
};

export { Animation };

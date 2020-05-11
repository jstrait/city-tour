"use strict";

var BaseEasing = function(frameCount, easingFunc, minX, maxX) {
  var frame = 0;
  var deltaPerFrame;

  var finished = function() {
    return frame === frameCount;
  };

  var next = function() {
    if (frame < frameCount) {
      frame += 1;
    }

    return easingFunc(minX + (frame * deltaPerFrame));
  };


  if (frameCount === 0) {
    frameCount = 1;
  }
  deltaPerFrame = (maxX - minX) / frameCount;

  return {
    next: next,
    finished: finished,
  };
};


var LinearEasing = function(frameCount) {
  var easingFunc = function(x) {
    return x;
  };

  return BaseEasing(frameCount, easingFunc, 0.0, 1.0);
};

var SineEasing = function(frameCount, minX, maxX) {
  var easingFunc = function(x) {
    return Math.sin(x);
  };

  return BaseEasing(frameCount, easingFunc, minX, maxX);
};

var CosineEasing = function(frameCount, minX, maxX) {
  var easingFunc = function(x) {
    return Math.cos(x);
  };

  return BaseEasing(frameCount, easingFunc, minX, maxX);
};

var SmoothStepEasing = function(frameCount) {
  var easingFunc = function(x) {
    return x * x * (3 - (2 * x));
  };

  return BaseEasing(frameCount, easingFunc, 0.0, 1.0);
};

var SteepEasing = function(frameCount, minX, maxX) {
  var easingFunc = function(x) {
    return Math.pow(Math.min(Math.cos(Math.PI * x / 2.0), 1.0 - Math.abs(x)), 3.5);
  };

  return BaseEasing(frameCount, easingFunc, minX, maxX);
};

export { LinearEasing, SineEasing, CosineEasing, SmoothStepEasing, SteepEasing };

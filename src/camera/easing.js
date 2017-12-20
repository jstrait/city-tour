"use strict";

var CityTour = CityTour || {};

CityTour.BaseEasing = function(frameCount, easingFunc, minX, maxX) {
  var frame = 0;
  var deltaPerFrame;

  var finished = function() {
    return frame === frameCount;
  };

  var next = function() {
    if (frame < frameCount) {
      frame += 1;
    }

    return easingFunc(frame * deltaPerFrame);
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


CityTour.LinearEasing = function(frameCount) {
  var easingFunc = function(x) {
    return x;
  };

  return CityTour.BaseEasing(frameCount, easingFunc, 0.0, 1.0);
};

CityTour.SineEasing = function(frameCount, minX, maxX) {
  var easingFunc = function(x) {
    return Math.sin(x)
  };

  return CityTour.BaseEasing(frameCount, easingFunc, minX, maxX);
};

CityTour.CosineEasing = function(frameCount, minX, maxX) {
  var easingFunc = function(x) {
    return Math.cos(x)
  };

  return CityTour.BaseEasing(frameCount, easingFunc, minX, maxX);
};

CityTour.SmoothStepEasing = function(frameCount) {
  var easingFunc = function(x) {
    return x * x * (3 - (2 * x));
  };

  return CityTour.BaseEasing(frameCount, easingFunc, 0.0, 1.0);
};

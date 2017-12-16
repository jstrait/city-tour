"use strict";

var CityTour = CityTour || {};


CityTour.LinearEasing = function(frameCount) {
  var deltaPerFrame;
  var frame;

  var finished = function() {
    return frame === frameCount;
  };

  var next = function() {
    if (frame < frameCount) {
      frame += 1;
    }

    return frame * deltaPerFrame;
  };


  if (frameCount === 0) {
    frameCount = 1;
  }

  frame = 0;
  deltaPerFrame = 1 / frameCount;


  return {
    next: next,
    finished: finished,
  };
};

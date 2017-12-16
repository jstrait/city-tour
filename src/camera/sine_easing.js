"use strict";

var CityTour = CityTour || {};


CityTour.SineEasing = function(frameCount, minX, maxX) {
  var deltaPerFrame;
  var frame;

  var finished = function() {
    return frame === frameCount;
  };

  var next = function() {
    if (frame < frameCount) {
      frame += 1;
    }

    return Math.sin(minX + (deltaPerFrame * frame));
  };


  if (frameCount === 0) {
    frameCount = 1;
  }

  frame = 0;
  deltaPerFrame = (maxX - minX) / frameCount;


  return {
    next: next,
    finished: finished,
  };
};


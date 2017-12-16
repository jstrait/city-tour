"use strict";

var CityTour = CityTour || {};


CityTour.MotionGenerator = function(start, target, easingFunction) {
  var next = function() {
    var percentage = easingFunction.next();

    return CityTour.Math.lerp(start, target, percentage);
  };

  var finished = function() {
    return easingFunction.finished();
  };


  return {
    finished: finished,
    next: next,
  };
};

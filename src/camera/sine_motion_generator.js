"use strict";

var CityTour = CityTour || {};

CityTour.SineMotionGenerator = function(start, target, delta, direction) {
  var HALF_PI = Math.PI / 2;

  var current = start;
  var totalDistance = target - start;

  if (direction === undefined) {
    direction = 'forward';
  }

  var x, xTarget, distancePercentage;
  if (direction === 'forward') {
    x = 0.0;
    xTarget = HALF_PI;
  }
  else {
    x = HALF_PI;
    xTarget = Math.PI;
  }

  var sineMotionGenerator = {};

  sineMotionGenerator.next = function() {
    if (x < xTarget) {
      if (direction === 'forward') {
        distancePercentage = Math.sin(x);
      }
      else {
        distancePercentage = 1.0 - Math.sin(x);
      }

      current = start + (totalDistance * distancePercentage);
      x += delta;
    }

    return current;
  };

  sineMotionGenerator.setTarget = function(newTarget) {
    target = newTarget;
    totalDistance = target - start;
  };

  sineMotionGenerator.finished = function() { return x >= xTarget; };

  return sineMotionGenerator;
};

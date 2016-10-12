"use strict";

var CityTour = CityTour || {};

CityTour.ClampedLinearMotionGenerator = function(start, target, delta) {
  var current = start;

  var clampedLinearMotionGenerator = {};

  clampedLinearMotionGenerator.next = function() {
    if (current !== target) {
      if (current > target) {
        if ((current - target) < delta) {
          current = target;
        }
        else {
          current -= delta;
        }
      }
      else if (current < target) {
        if ((target - current) < delta) {
          current = target;
        }
        else {
          current += delta;
        }
      }
    }

    return current;
  };

  clampedLinearMotionGenerator.finished = function() { return current === target; };

  return clampedLinearMotionGenerator;
};

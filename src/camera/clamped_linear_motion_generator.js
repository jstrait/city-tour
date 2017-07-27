"use strict";

var CityTour = CityTour || {};

// Delta should always be positive, regardless of whether the target
// is larger or smaller than the starting point. If the delta is
// negative, then motion will occur _away_ from the target, and the
// target will never be reached.
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

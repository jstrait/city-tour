"use strict";

import { CityTourMath } from "./../math";

var MotionGenerator = function(start, target, easingFunction) {
  var next = function() {
    var percentage = easingFunction.next();

    return CityTourMath.lerp(start, target, percentage);
  };

  var finished = function() {
    return easingFunction.finished();
  };


  return {
    finished: finished,
    next: next,
  };
};

var StaticMotionGenerator = function(target) {
  return {
    finished: function() { return true; },
    next: function() { return target; },
  };
};

export { MotionGenerator, StaticMotionGenerator };

"use strict";

var CityTour = CityTour || {};

CityTour.Math = (function() {
  var math = {};

  math.distanceBetweenPoints = function(x1, y1, x2, y2) {
    var xDistance = x2 - x1;
    var yDistance = y2 - y1;
    return Math.sqrt((xDistance * xDistance) + (yDistance * yDistance));
  };

  // Linearly interpolate between min and max
  math.lerp = function(min, max, percentage) {
    return min + ((max - min) * percentage);
  };

  return math;
})();

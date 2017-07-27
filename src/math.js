"use strict";

var CityTour = CityTour || {};

CityTour.Math = (function() {
  var math = {};

  math.distanceBetweenPoints = function(x1, y1, x2, y2) {
    var xDistance = x2 - x1;
    var yDistance = y2 - y1;
    return Math.sqrt((xDistance * xDistance) + (yDistance * yDistance));
  };

  math.distanceBetweenPoints3D = function(x1, y1, z1, x2, y2, z2) {
    var xDistance = x2 - x1;
    var yDistance = y2 - y1;
    var zDistance = z2 - z1;
    return Math.sqrt((xDistance * xDistance) + (yDistance * yDistance) + (zDistance * zDistance));
  };

  // Linearly interpolate between min and max
  math.lerp = function(min, max, percentage) {
    return min + ((max - min) * percentage);
  };

  return math;
})();

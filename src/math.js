"use strict";

var CityTour = CityTour || {};

CityTour.Math = (function() {
  var distanceBetweenPoints = function(x1, y1, x2, y2) {
    var xDistance = x2 - x1;
    var yDistance = y2 - y1;
    return Math.sqrt((xDistance * xDistance) + (yDistance * yDistance));
  };

  var distanceBetweenPoints3D = function(x1, y1, z1, x2, y2, z2) {
    var xDistance = x2 - x1;
    var yDistance = y2 - y1;
    var zDistance = z2 - z1;
    return Math.sqrt((xDistance * xDistance) + (yDistance * yDistance) + (zDistance * zDistance));
  };

  var randomInRange = function(min, max) {
    return (Math.random() * (max - min)) + min;
  };

  var randomInteger = function(min, max) {
    return THREE.Math.randInt(min, max);
  };

  // Linearly interpolate between min and max
  var lerp = function(min, max, percentage) {
    return min + ((max - min) * percentage);
  };

  var clamp = function(value, min, max) {
    return Math.max(min, Math.min(max, value));
  };

  return {
    distanceBetweenPoints: distanceBetweenPoints,
    distanceBetweenPoints3D: distanceBetweenPoints3D,
    randomInRange: randomInRange,
    randomInteger: randomInteger,
    lerp: lerp,
    clamp: clamp,
  };
})();

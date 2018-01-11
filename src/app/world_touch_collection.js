"use strict";

var CityTour = CityTour || {};

CityTour.WorldTouchCollection = function(el, camera, screenTouches) {
  var worldTouches = [];
  var distance;
  var midpoint;
  var angleBetweenTouches;
  var i;

  for (i = 0; i < screenTouches.length; i++) {
    worldTouches.push(CityTour.WorldTouch(el, camera, screenTouches[i].x, screenTouches[i].z));
  }

  if (worldTouches.length === 1) {
    distance = 0.0;
    midpoint = new THREE.Vector3(worldTouches[0].worldX(), 0.0, worldTouches[0].worldZ());
    angleBetweenTouches = 0.0;
  }
  else {
    distance = CityTour.Math.distanceBetweenPoints(worldTouches[0].screenPixelX(), worldTouches[0].screenPixelY(), worldTouches[1].screenPixelX(), worldTouches[1].screenPixelY());
    midpoint = new THREE.Vector3((worldTouches[0].worldX() + worldTouches[1].worldX()) / 2,
                                 0.0,
                                 (worldTouches[0].worldZ() + worldTouches[1].worldZ()) / 2);
    angleBetweenTouches = Math.atan2(-(screenTouches[1].x - screenTouches[0].x), -(screenTouches[1].z - screenTouches[0].z));
  }

  return {
    touches: function() { return worldTouches; },
    distance: function() { return distance; },
    midpoint: function() { return midpoint; },
    angleBetweenTouches: function() { return angleBetweenTouches; },
    count: function() { return worldTouches.length; },
  };
};

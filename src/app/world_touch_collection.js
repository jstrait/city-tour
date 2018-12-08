"use strict";

var CityTour = CityTour || {};

/*
  A collection of simultaneous mouse/touch locations, with helper functions useful for
  implementing interactive gestures, such as calculating the distance between the touches,
  angle between the touches, etc.
*/
CityTour.WorldTouchCollection = function(el, camera, screenTouches, terrain) {
  var worldTouches = [];
  var distanceInScreenPixels;
  var phantomMidpointTouch;
  var worldMidpoint, worldMidpointX, worldMidpointY, worldMidpointZ;
  var normalizedScreenMidpoint;
  var angleBetweenTouches;
  var i;

  for (i = 0; i < screenTouches.length; i++) {
    worldTouches.push(CityTour.WorldTouch(el, camera, screenTouches[i].x, screenTouches[i].y, terrain));
  }

  if (worldTouches.length === 1) {
    distanceInScreenPixels = 0.0;
    worldMidpoint = new THREE.Vector3(worldTouches[0].worldX(), worldTouches[0].worldY(), worldTouches[0].worldZ());

    normalizedScreenMidpoint = new THREE.Vector2(worldTouches[0].normalizedScreenX(),
                                                 worldTouches[0].normalizedScreenY());
    angleBetweenTouches = 0.0;
  }
  else {
    distanceInScreenPixels = CityTour.Math.distanceBetweenPoints(worldTouches[0].screenPixelX(),
                                                                 worldTouches[0].screenPixelY(),
                                                                 worldTouches[1].screenPixelX(),
                                                                 worldTouches[1].screenPixelY());

    // Simulate a touch in the middle of the actual touchpoints, so that we can determine the
    // terrain-aware world position in that spot. This will be the target point that actions
    // such as zooming or rotating are based around.
    phantomMidpointTouch = CityTour.WorldTouch(el, camera, (screenTouches[0].x + screenTouches[1].x) / 2, (screenTouches[0].y + screenTouches[1].y) / 2, terrain);
    worldMidpoint = new THREE.Vector3(phantomMidpointTouch.worldX(), phantomMidpointTouch.worldY(), phantomMidpointTouch.worldZ());

    normalizedScreenMidpoint = new THREE.Vector2((worldTouches[0].normalizedScreenX() + worldTouches[1].normalizedScreenX()) / 2,
                                                 (worldTouches[0].normalizedScreenY() + worldTouches[1].normalizedScreenY()) / 2);

    angleBetweenTouches = Math.atan2(-(screenTouches[1].x - screenTouches[0].x),
                                     -(screenTouches[1].y - screenTouches[0].y));
  }

  return {
    touches: function() { return worldTouches; },
    distanceInScreenPixels: function() { return distanceInScreenPixels; },
    worldMidpoint: function() { return worldMidpoint; },
    normalizedScreenMidpoint: function() { return normalizedScreenMidpoint; },
    angleBetweenTouches: function() { return angleBetweenTouches; },
    count: function() { return worldTouches.length; },
  };
};

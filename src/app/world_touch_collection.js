"use strict";

var CityTour = CityTour || {};

CityTour.WorldTouchCollection = function(el, camera, screenTouches, terrain) {
  var worldTouches = [];
  var distanceInScreenPixels;
  var worldMidpoint, worldMidpointX, worldMidpointZ;
  var normalizedScreenMidpoint;
  var angleBetweenTouches;
  var i;

  for (i = 0; i < screenTouches.length; i++) {
    worldTouches.push(CityTour.WorldTouch(el, camera, screenTouches[i].x, screenTouches[i].y, terrain));
  }

  if (worldTouches.length === 1) {
    distanceInScreenPixels = 0.0;
    worldMidpoint = new THREE.Vector3(worldTouches[0].worldX(), 0.0, worldTouches[0].worldZ());
    normalizedScreenMidpoint = new THREE.Vector2(worldTouches[0].normalizedScreenX(), worldTouches[0].normalizedScreenY());
    angleBetweenTouches = 0.0;
  }
  else {
    distanceInScreenPixels = CityTour.Math.distanceBetweenPoints(worldTouches[0].screenPixelX(), worldTouches[0].screenPixelY(), worldTouches[1].screenPixelX(), worldTouches[1].screenPixelY());

    worldMidpointX = (worldTouches[0].worldX() + worldTouches[1].worldX()) / 2;
    worldMidpointZ = (worldTouches[0].worldZ() + worldTouches[1].worldZ()) / 2;
    worldMidpoint = new THREE.Vector3(worldMidpointX,
                                 terrain.heightAtCoordinates(CityTour.Coordinates.sceneXToMapX(worldMidpointX), CityTour.Coordinates.sceneZToMapZ(worldMidpointZ)),
                                 worldMidpointZ);
    normalizedScreenMidpoint = new THREE.Vector2((worldTouches[0].normalizedScreenX() + worldTouches[1].normalizedScreenX()) / 2, (worldTouches[0].normalizedScreenY() + worldTouches[1].normalizedScreenY()) / 2);
    angleBetweenTouches = Math.atan2(-(screenTouches[1].x - screenTouches[0].x), -(screenTouches[1].y - screenTouches[0].y));
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

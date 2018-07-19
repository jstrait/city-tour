"use strict";

var CityTour = CityTour || {};

CityTour.WorldTouchCollection = function(el, camera, screenTouches, terrain) {
  var worldTouches = [];
  var distance;
  var midpoint, midpointX, midpointZ;
  var screenMidpoint;
  var angleBetweenTouches;
  var i;

  for (i = 0; i < screenTouches.length; i++) {
    worldTouches.push(CityTour.WorldTouch(el, camera, screenTouches[i].x, screenTouches[i].z, terrain));
  }

  if (worldTouches.length === 1) {
    distance = 0.0;
    midpoint = new THREE.Vector3(worldTouches[0].worldX(), 0.0, worldTouches[0].worldZ());
    screenMidpoint = new THREE.Vector2(worldTouches[0].screenX(), worldTouches[0].screenY());
    angleBetweenTouches = 0.0;
  }
  else {
    distance = CityTour.Math.distanceBetweenPoints(worldTouches[0].screenPixelX(), worldTouches[0].screenPixelY(), worldTouches[1].screenPixelX(), worldTouches[1].screenPixelY());

    midpointX = (worldTouches[0].worldX() + worldTouches[1].worldX()) / 2;
    midpointZ = (worldTouches[0].worldZ() + worldTouches[1].worldZ()) / 2;
    midpoint = new THREE.Vector3(midpointX,
                                 terrain.heightAtCoordinates(CityTour.Coordinates.sceneXToMapX(midpointX), CityTour.Coordinates.sceneZToMapZ(midpointZ)),
                                 midpointZ);
    screenMidpoint = new THREE.Vector2((worldTouches[0].screenX() + worldTouches[1].screenX()) / 2, (worldTouches[0].screenY() + worldTouches[1].screenY()) / 2);
    angleBetweenTouches = Math.atan2(-(screenTouches[1].x - screenTouches[0].x), -(screenTouches[1].z - screenTouches[0].z));
  }

  return {
    touches: function() { return worldTouches; },
    distance: function() { return distance; },
    midpoint: function() { return midpoint; },
    screenMidpoint: function() { return screenMidpoint; },
    angleBetweenTouches: function() { return angleBetweenTouches; },
    count: function() { return worldTouches.length; },
  };
};

"use strict";

import * as THREE from "three";

import { CityTourMath } from "./../math";
import { WorldTouch } from "./world_touch";

/*
  A collection of simultaneous mouse/touch locations, with helper functions useful for
  implementing interactive gestures, such as calculating the distance between the touches,
  angle between the touches, etc.
*/
var WorldTouchCollection = function(el, camera, screenTouches, terrain) {
  var worldTouches = [];
  var normalizedScreenVector;
  var distanceInScreenPixels;
  var worldMidpointTouch;
  var worldMidpoint;
  var normalizedScreenMidpoint;
  var angleBetweenTouches;
  var i;

  for (i = 0; i < screenTouches.length; i++) {
    normalizedScreenVector = new THREE.Vector3(((screenTouches[i].x / (el.width / window.devicePixelRatio)) * 2) - 1,
                                               (-(screenTouches[i].y / (el.height / window.devicePixelRatio)) * 2) + 1,
                                               0.5);
    worldTouches.push(WorldTouch(camera, normalizedScreenVector, terrain));
  }

  if (worldTouches.length === 1) {
    distanceInScreenPixels = 0.0;
    worldMidpoint = worldTouches[0].worldPosition();

    normalizedScreenMidpoint = new THREE.Vector3(worldTouches[0].normalizedScreenX(),
                                                 worldTouches[0].normalizedScreenY(),
                                                 0.0);
    angleBetweenTouches = 0.0;
  }
  else {
    distanceInScreenPixels = CityTourMath.distanceBetweenPoints(screenTouches[0].x, screenTouches[0].y,
                                                                screenTouches[1].x, screenTouches[1].y);

    normalizedScreenMidpoint = new THREE.Vector3((worldTouches[0].normalizedScreenX() + worldTouches[1].normalizedScreenX()) / 2,
                                                 (worldTouches[0].normalizedScreenY() + worldTouches[1].normalizedScreenY()) / 2,
                                                 0.0);

    worldMidpointTouch = WorldTouch(camera, normalizedScreenMidpoint, terrain);
    worldMidpoint = worldMidpointTouch.worldPosition();

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

export { WorldTouchCollection };

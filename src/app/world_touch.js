"use strict";

import { Config } from "./../config";

/*
  Converts a normalized screen vector to a 3D point in the world, based on the current camera position.
  The calculated point takes the terrain into account. That is, you can use this to calculate where on the
  terrain the mouse pointer/finger is touching.
*/
var WorldTouch = function(camera, normalizedScreenVector, terrain) {
  normalizedScreenVector = normalizedScreenVector.clone();

  // Adapted from https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z#13091694
  var screenCoordinateToWorldPosition = function(camera) {
    var MAX_ITERATIONS = 1000;

    var direction, worldPosition;
    var ray, movementTowardXZPlaneAmount;
    var loopCount;

    normalizedScreenVector.unproject(camera);
    direction = normalizedScreenVector.sub(camera.position).normalize();
    ray = camera.position.clone();
    movementTowardXZPlaneAmount = direction.clone().multiplyScalar(0.3333333333333333);

    loopCount = 0;
    while (ray.y > Config.SIDEWALL_BOTTOM && worldPosition === undefined && loopCount < MAX_ITERATIONS) {
      ray = ray.add(movementTowardXZPlaneAmount);

      if (terrain.isPointInBounds(ray.x, ray.z) && ray.y <= terrain.heightAt(ray.x, ray.z)) {
        worldPosition = ray;
      }

      loopCount += 1;
    }

    // Ray doesn't intersect the terrain
    if (worldPosition === undefined) {
      worldPosition = ray;
    }

    return worldPosition;
  };

  var normalizedScreenX = normalizedScreenVector.x;
  var normalizedScreenY = normalizedScreenVector.y;
  var worldPosition = screenCoordinateToWorldPosition(camera);

  return {
    normalizedScreenX: function() { return normalizedScreenX; },
    normalizedScreenY: function() { return normalizedScreenY; },
    worldPosition: function() { return worldPosition; },
  };
};

export { WorldTouch };

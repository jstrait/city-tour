"use strict";

var CityTour = CityTour || {};

/*
  Converts an X/Y screen pixel coordinate to a 3D point in the world, based on the current camera position.
  The calculated point takes the terrain into account. That is, you can use this to calculate where on the
  terrain the mouse pointer/finger is touching.
*/
CityTour.WorldTouch = function(el, camera, screenPixelX, screenPixelY, terrain) {
  // Adapted from https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z#13091694
  var screenCoordinateToWorldPosition = function(camera) {
    var MAX_ITERATIONS = 1000;

    var direction, worldPosition;
    var ray, movementTowardXZPlaneAmount;
    var mapX, mapZ;
    var loopCount;

    normalizedScreenVector.unproject(camera);
    direction = normalizedScreenVector.sub(camera.position).normalize();
    ray = camera.position.clone();
    movementTowardXZPlaneAmount = direction.clone().multiplyScalar(0.3333333333333333);

    loopCount = 0;
    while (ray.y > 0.0 && worldPosition === undefined && loopCount < MAX_ITERATIONS) {
      ray = ray.add(movementTowardXZPlaneAmount);

      if (ray.x >= terrain.minMapX() &&
          ray.x <= terrain.maxMapX() &&
          ray.z >= terrain.minMapZ() &&
          ray.z <= terrain.maxMapZ()) {
        if (ray.y <= terrain.heightAtCoordinates(ray.x, ray.z)) {
          worldPosition = ray;
        }
      }

      loopCount += 1;
    }

    // Ray doesn't intersect the terrain
    if (worldPosition === undefined) {
      worldPosition = ray;
    }

    return worldPosition;
  };

  var normalizedScreenVector = new THREE.Vector3(((screenPixelX / (el.width / window.devicePixelRatio)) * 2) - 1,
                                                 (-(screenPixelY / (el.height / window.devicePixelRatio)) * 2) + 1,
                                                 0.5);
  var normalizedScreenX = normalizedScreenVector.x;
  var normalizedScreenY = normalizedScreenVector.y;

  var worldPosition = screenCoordinateToWorldPosition(camera);
  var worldX = worldPosition.x;
  var worldY = worldPosition.y;
  var worldZ = worldPosition.z;

  return {
    screenPixelX: function() { return screenPixelX; },
    screenPixelY: function() { return screenPixelY; },
    normalizedScreenX: function() { return normalizedScreenX; },
    normalizedScreenY: function() { return normalizedScreenY; },
    worldX: function() { return worldX; },
    worldY: function() { return worldY; },
    worldZ: function() { return worldZ; },
  };
};

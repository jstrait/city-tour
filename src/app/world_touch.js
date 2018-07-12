"use strict";

var CityTour = CityTour || {};

CityTour.WorldTouch = function(el, camera, screenPixelX, screenPixelY, terrain) {
  var normalizedScreenVector;

  // Adapted from https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z#13091694
  var screenCoordinateToWorldPosition = function(camera, screenX, screenY) {
    var direction, worldPosition;
    var ray, movementTowardYPlaneAmount;
    var mapX, mapZ;

    normalizedScreenVector.unproject(camera);
    direction = normalizedScreenVector.sub(camera.position).normalize();
    ray = camera.position.clone();
    movementTowardYPlaneAmount = direction.clone().multiplyScalar(10.0);

    while (ray.y > 0.0 && worldPosition === undefined) {
      ray = ray.add(movementTowardYPlaneAmount);
      mapX = CityTour.Coordinates.sceneXToMapX(ray.x);
      mapZ = CityTour.Coordinates.sceneZToMapZ(ray.z);

      if (mapX >= -CityTour.Config.BLOCK_COLUMNS && mapX <= CityTour.Config.BLOCK_COLUMNS && mapZ >= -CityTour.Config.BLOCK_ROWS && mapZ <= CityTour.Config.BLOCK_ROWS) {
        if (ray.y <= terrain.heightAtCoordinates(mapX, mapZ)) {
          worldPosition = ray;
        }
      }
    }

    // Ray doesn't intersect the terrain
    if (worldPosition === undefined) {
      worldPosition = ray;
    }

    return worldPosition;
  };

  normalizedScreenVector = new THREE.Vector3(((screenPixelX / (el.width / window.devicePixelRatio)) * 2) - 1,
                                             (-(screenPixelY / (el.height / window.devicePixelRatio)) * 2) + 1,
                                             0.5);
  var screenX = normalizedScreenVector.x;
  var screenY = normalizedScreenVector.y;

  var worldPosition = screenCoordinateToWorldPosition(camera, screenX, screenY);
  var worldX = worldPosition.x;
  var worldY = worldPosition.y;
  var worldZ = worldPosition.z;

  return {
    screenPixelX: function() { return screenPixelX; },
    screenPixelY: function() { return screenPixelY; },
    screenX: function() { return screenX; },
    screenY: function() { return screenY; },
    worldX: function() { return worldX; },
    worldY: function() { return worldY; },
    worldZ: function() { return worldZ; },
  };
};

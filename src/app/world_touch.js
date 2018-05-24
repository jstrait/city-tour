"use strict";

var CityTour = CityTour || {};

CityTour.WorldTouch = function(el, camera, screenPixelX, screenPixelY, terrainMesh) {
  var normalizedScreenVector;
  var raycaster = new THREE.Raycaster();

  // Adapted from https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z#13091694
  var screenCoordinateToWorldPosition = function(camera, screenX, screenY) {
    var intersectingObjects;
    var direction, distanceToYPlane, worldPosition;

    raycaster.setFromCamera(new THREE.Vector2(screenX, screenY), camera);
    intersectingObjects = raycaster.intersectObjects([terrainMesh], true);
    if (intersectingObjects.length === 1) {
      worldPosition = intersectingObjects[0].point;
    }
    else {
      normalizedScreenVector.unproject(camera);

      direction = normalizedScreenVector.sub(camera.position).normalize();
      distanceToYPlane = -(camera.position.y / direction.y);
      worldPosition = camera.position.clone().add(direction.multiplyScalar(distanceToYPlane));
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

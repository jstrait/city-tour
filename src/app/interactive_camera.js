"use strict";

var CityTour = CityTour || {};

CityTour.InteractiveCamera = function(messageBroker) {
  var TWO_PI = Math.PI * 2;

  var MIN_CENTER_X = -1000.0;
  var MAX_CENTER_X = 1000.0;

  var MIN_CENTER_Z = -1000.0;
  var MAX_CENTER_Z = 1000.0;

  var MIN_TILT_ANGLE = -Math.PI / 2;
  var MAX_TILT_ANGLE = -0.1;

  var MIN_ZOOM_DISTANCE = 20.0;
  var MAX_ZOOM_DISTANCE = 1000.0;

  var MINIMUM_HEIGHT_OFF_GROUND = 5.0;

  var VELOCITY_DECAY = 0.85;

  var centerX = 0.0;
  var centerZ = 0.0;
  var zoomPercentage = 0.0;
  var tiltPercentage = 0.2;
  var rotationAngle = 0.0;

  var isVelocityEnabled = false;
  var centerXVelocity = 0.0;
  var centerZVelocity = 0.0;

  var terrain;

  var setTerrain = function(newTerrain) { terrain = newTerrain; };

  var setCenterCoordinates = function(newCenterX, newCenterZ) {
    centerXVelocity = newCenterX - centerX;
    centerZVelocity = newCenterZ - centerZ;

    centerX = CityTour.Math.clamp(newCenterX, MIN_CENTER_X, MAX_CENTER_X);
    centerZ = CityTour.Math.clamp(newCenterZ, MIN_CENTER_Z, MAX_CENTER_Z);

    messageBroker.publish("camera.updated", {});
  };

  var setZoomPercentage = function(newZoomPercentage) {
    zoomPercentage = CityTour.Math.clamp(newZoomPercentage, 0.0, 1.0);
    messageBroker.publish("camera.updated", {});
  };

  var setTiltPercentage = function(newTiltPercentage) {
    tiltPercentage = CityTour.Math.clamp(newTiltPercentage, 0.0, 1.0);
    messageBroker.publish("camera.updated", {});
  };

  var setRotationAngle = function(newRotationAngle) {
    rotationAngle = newRotationAngle;

    if (rotationAngle < -Math.PI) {
      rotationAngle += TWO_PI;
    }
    else if (rotationAngle > Math.PI) {
      rotationAngle -= TWO_PI;
    }

    messageBroker.publish("camera.updated", {});
  };


  var tickVelocity = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      centerXVelocity *= VELOCITY_DECAY;
      centerZVelocity *= VELOCITY_DECAY;

      centerX += centerXVelocity;
      centerZ += centerZVelocity;
    }
  };


  /*    C
       /|
      / |
     /  |
    X----

  X == Map center point
  C == Camera position
  rotationX == angle X == angle between camera and center point
  Hypotenuse == Zoom == Distance of camera from center point
  Opposite == Height of camera off the ground
  Adjacent == X/Z distance of camera from center point
  rotationY == rotation of this triangle around y-axis of center point
  */
  var syncToCamera = function(camera) {
    var tiltAngle = CityTour.Math.lerp(MIN_TILT_ANGLE, MAX_TILT_ANGLE, 1.0 - tiltPercentage);
    var zoomDistance = CityTour.Math.lerp(MIN_ZOOM_DISTANCE, MAX_ZOOM_DISTANCE, 1.0 - zoomPercentage);

    var hypotenuse = zoomDistance;
    var adjacent = Math.cos(tiltAngle) * hypotenuse;

    var cameraX = centerX + (adjacent * Math.sin(rotationAngle));
    var cameraZ = centerZ + (adjacent * Math.cos(-rotationAngle));
    var terrainHeight = Number.NEGATIVE_INFINITY;
    if (terrain !== undefined) {
      terrainHeight = terrain.heightAtCoordinates(CityTour.Coordinates.sceneXToMapX(cameraX), CityTour.Coordinates.sceneZToMapZ(cameraZ));
      if (terrainHeight === undefined) {
        terrainHeight = Number.NEGATIVE_INFINITY;
      }
    }

    var opposite = Math.max(terrainHeight + MINIMUM_HEIGHT_OFF_GROUND, -(Math.sin(tiltAngle) * hypotenuse));

    camera.position.x = cameraX;
    camera.position.y = opposite;
    camera.position.z = cameraZ;
    camera.rotation.x = tiltAngle;
    camera.rotation.y = rotationAngle;
  };

  var syncFromCamera = function(camera) {
    rotationAngle = camera.rotation.y;
    var tiltAngle = Math.min(MAX_TILT_ANGLE, camera.rotation.x);
    tiltPercentage = (tiltAngle - MAX_TILT_ANGLE) / (MIN_TILT_ANGLE - MAX_TILT_ANGLE);

    var opposite = camera.position.y;
    var hypotenuse = Math.max(MIN_ZOOM_DISTANCE, (1 / Math.sin(-tiltAngle)) * opposite);
    var adjacent = Math.sqrt((hypotenuse * hypotenuse) - (opposite * opposite));

    centerX = camera.position.x - (adjacent * Math.sin(rotationAngle));
    centerZ = camera.position.z - (adjacent * Math.cos(rotationAngle));
    zoomPercentage = 1.0 - ((hypotenuse - MIN_ZOOM_DISTANCE) / (MAX_ZOOM_DISTANCE - MIN_ZOOM_DISTANCE));

    messageBroker.publish("camera.updated", {});
  };


  return {
    setTerrain: setTerrain,
    centerX: function() { return centerX; },
    centerZ: function() { return centerZ; },
    setCenterCoordinates: setCenterCoordinates,
    zoomPercentage: function() { return zoomPercentage; },
    setZoomPercentage: setZoomPercentage,
    tiltPercentage: function() { return tiltPercentage; },
    setTiltPercentage: setTiltPercentage,
    rotationAngle: function() { return rotationAngle; },
    setRotationAngle: setRotationAngle,
    isVelocityEnabled: function() { return isVelocityEnabled; },
    setIsVelocityEnabled: function(newIsVelocityEnabled) { isVelocityEnabled = newIsVelocityEnabled; },
    tickVelocity: tickVelocity,
    syncToCamera: syncToCamera,
    syncFromCamera: syncFromCamera,
  };
};

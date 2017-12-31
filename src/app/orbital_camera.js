"use strict";

var CityTour = CityTour || {};

CityTour.OrbitalCamera = function(messageBroker) {
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

  var POSITION_VELOCITY_DECAY = 0.875;
  var ZOOM_VELOCITY_DECAY = 0.85;
  var TILT_VELOCITY_DECAY = 0.85;
  var ROTATION_VELOCITY_DECAY = 0.85;

  var centerX = 0.0;
  var centerZ = 0.0;
  var zoomDistance;
  var zoomPercentage;
  var tiltAngle;
  var tiltPercentage;
  var rotationAngle = 0.0;

  var isVelocityEnabled = false;
  var centerXVelocity = 0.0;
  var centerZVelocity = 0.0;
  var zoomDistanceVelocity = 0.0;
  var tiltVelocity = 0.0;
  var rotationVelocity = 0.0;

  var terrain;

  var setTerrain = function(newTerrain) { terrain = newTerrain; };

  var setCenterCoordinates = function(newCenterX, newCenterZ) {
    centerXVelocity = newCenterX - centerX;
    centerZVelocity = newCenterZ - centerZ;

    centerX = CityTour.Math.clamp(newCenterX, MIN_CENTER_X, MAX_CENTER_X);
    centerZ = CityTour.Math.clamp(newCenterZ, MIN_CENTER_Z, MAX_CENTER_Z);

    messageBroker.publish("camera.updated", {});
  };

  var setZoomDistance = function(newZoomDistance) {
    newZoomDistance = CityTour.Math.clamp(newZoomDistance, MIN_ZOOM_DISTANCE, MAX_ZOOM_DISTANCE);
    zoomDistanceVelocity = newZoomDistance - zoomDistance;
    zoomDistance = newZoomDistance;
    zoomPercentage = 1.0 - ((zoomDistance - MIN_ZOOM_DISTANCE) / (MAX_ZOOM_DISTANCE - MIN_ZOOM_DISTANCE));

    messageBroker.publish("camera.updated", {});
  };

  var setZoomPercentage = function(newZoomPercentage) {
    var newZoomDistance;

    zoomPercentage = CityTour.Math.clamp(newZoomPercentage, 0.0, 1.0);
    newZoomDistance = CityTour.Math.lerp(MIN_ZOOM_DISTANCE, MAX_ZOOM_DISTANCE, 1.0 - zoomPercentage);

    if (zoomDistance !== undefined) {
      zoomDistanceVelocity = newZoomDistance - zoomDistance;
    }
    zoomDistance = newZoomDistance;

    messageBroker.publish("camera.updated", {});
  };

  var setTiltAngle = function(newTiltAngle) {
    newTiltAngle = CityTour.Math.clamp(newTiltAngle, MIN_TILT_ANGLE, MAX_TILT_ANGLE);
    tiltVelocity = newTiltAngle - tiltAngle;
    tiltAngle = newTiltAngle;
    tiltPercentage = (tiltAngle - MAX_TILT_ANGLE) / (MIN_TILT_ANGLE - MAX_TILT_ANGLE);

    messageBroker.publish("camera.updated", {});
  };

  var setTiltPercentage = function(newTiltPercentage) {
    var newTiltAngle;

    tiltPercentage = CityTour.Math.clamp(newTiltPercentage, 0.0, 1.0);
    newTiltAngle = CityTour.Math.lerp(MIN_TILT_ANGLE, MAX_TILT_ANGLE, 1.0 - tiltPercentage);

    if (tiltAngle !== undefined) {
      tiltVelocity = newTiltAngle - tiltAngle;
    }
    tiltAngle = newTiltAngle;

    messageBroker.publish("camera.updated", {});
  };

  var setRotationAngle = function(newRotationAngle) {
    rotationVelocity = newRotationAngle - rotationAngle;
    rotationAngle = newRotationAngle;

    if (rotationAngle < -Math.PI) {
      rotationAngle += TWO_PI;
    }
    else if (rotationAngle > Math.PI) {
      rotationAngle -= TWO_PI;
    }

    messageBroker.publish("camera.updated", {});
  };


  var setIsVelocityEnabled = function(newIsVelocityEnabled) {
    isVelocityEnabled = newIsVelocityEnabled;

    if (newIsVelocityEnabled === false) {
      centerXVelocity = 0.0;
      centerZVelocity = 0.0;
      zoomDistanceVelocity = 0.0;
      tiltVelocity = 0.0;
      rotationVelocity = 0.0;
    }
  };

  var tickVelocity = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      centerXVelocity *= POSITION_VELOCITY_DECAY;
      centerZVelocity *= POSITION_VELOCITY_DECAY;
      zoomDistanceVelocity *= ZOOM_VELOCITY_DECAY;
      tiltVelocity *= TILT_VELOCITY_DECAY;
      rotationVelocity *= ROTATION_VELOCITY_DECAY;

      setCenterCoordinates(centerX + centerXVelocity, centerZ + centerZVelocity);
      setZoomDistance(zoomDistance + zoomDistanceVelocity);
      setTiltAngle(tiltAngle + tiltVelocity);
      setRotationAngle(rotationAngle + rotationVelocity);
    }
  };

  var minimumCameraHeightAtCoordinates = function(sceneX, sceneZ) {
    var terrainHeight = Number.NEGATIVE_INFINITY;

    if (terrain !== undefined) {
      terrainHeight = terrain.heightAtCoordinates(CityTour.Coordinates.sceneXToMapX(sceneX), CityTour.Coordinates.sceneZToMapZ(sceneZ));
      if (terrainHeight === undefined) {
        terrainHeight = Number.NEGATIVE_INFINITY;
      }
    }

    return terrainHeight + MINIMUM_HEIGHT_OFF_GROUND;
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
    var hypotenuse = zoomDistance;
    var adjacent = Math.cos(tiltAngle) * hypotenuse;
    var opposite = -Math.sin(tiltAngle) * hypotenuse;

    var cameraX = centerX + (adjacent * Math.sin(rotationAngle));
    var cameraZ = centerZ + (adjacent * Math.cos(-rotationAngle));

    camera.position.x = cameraX;
    camera.position.y = Math.max(minimumCameraHeightAtCoordinates(cameraX, cameraZ), opposite);
    camera.position.z = cameraZ;
    camera.rotation.x = tiltAngle;
    camera.rotation.y = rotationAngle;
  };

  var syncFromCamera = function(camera) {
    rotationAngle = camera.rotation.y;
    tiltAngle = Math.min(MAX_TILT_ANGLE, camera.rotation.x);
    tiltPercentage = (tiltAngle - MAX_TILT_ANGLE) / (MIN_TILT_ANGLE - MAX_TILT_ANGLE);

    var opposite = camera.position.y;
    var hypotenuse = Math.max(MIN_ZOOM_DISTANCE, (1 / Math.sin(-tiltAngle)) * opposite);
    var adjacent = Math.sqrt((hypotenuse * hypotenuse) - (opposite * opposite));

    centerX = camera.position.x - (adjacent * Math.sin(rotationAngle));
    centerZ = camera.position.z - (adjacent * Math.cos(rotationAngle));
    zoomDistance = hypotenuse;
    zoomPercentage = 1.0 - ((zoomDistance - MIN_ZOOM_DISTANCE) / (MAX_ZOOM_DISTANCE - MIN_ZOOM_DISTANCE));

    messageBroker.publish("camera.updated", {});
  };


  setZoomPercentage(0.0);
  setTiltPercentage(0.2);


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
    setIsVelocityEnabled: setIsVelocityEnabled,
    tickVelocity: tickVelocity,
    syncToCamera: syncToCamera,
    syncFromCamera: syncFromCamera,
  };
};

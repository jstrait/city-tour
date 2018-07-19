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

  var MINIMUM_VELOCITY = 0.00001;

  var centerX = 0.0;
  var centerZ = 0.0;
  var zoomDistance = MAX_ZOOM_DISTANCE;
  var tiltAngle = (MIN_TILT_ANGLE - MAX_TILT_ANGLE) * 0.2;
  var azimuthAngle = 0.0;

  var isVelocityEnabled = false;
  var centerXVelocity = 0.0;
  var centerZVelocity = 0.0;
  var zoomDistanceVelocity = 0.0;
  var tiltVelocity = 0.0;
  var rotationVelocity = 0.0;

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

    messageBroker.publish("camera.updated", {});
  };

  var setTiltAngle = function(newTiltAngle) {
    newTiltAngle = CityTour.Math.clamp(newTiltAngle, MIN_TILT_ANGLE, MAX_TILT_ANGLE);
    tiltVelocity = newTiltAngle - tiltAngle;
    tiltAngle = newTiltAngle;

    messageBroker.publish("camera.updated", {});
  };

  var setAzimuthAngle = function(newAzimuthAngle) {
    rotationVelocity = newAzimuthAngle - azimuthAngle;
    azimuthAngle = newAzimuthAngle;

    if (azimuthAngle < -Math.PI) {
      azimuthAngle += TWO_PI;
    }
    else if (azimuthAngle > Math.PI) {
      azimuthAngle -= TWO_PI;
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
      setAzimuthAngle(azimuthAngle + rotationVelocity);
    }

    if (Math.abs(centerXVelocity) < MINIMUM_VELOCITY) {
      centerXVelocity = 0.0;
    }
    if (Math.abs(centerZVelocity) < MINIMUM_VELOCITY) {
      centerZVelocity = 0.0;
    }
    if (Math.abs(zoomDistanceVelocity) < MINIMUM_VELOCITY) {
      zoomDistanceVelocity = 0.0;
    }
    if (Math.abs(tiltVelocity) < MINIMUM_VELOCITY) {
      tiltVelocity = 0.0;
    }
    if (Math.abs(rotationVelocity) < MINIMUM_VELOCITY) {
      rotationVelocity = 0.0;
    }

    if (centerXVelocity === 0.0 &&
        centerZVelocity === 0.0 &&
        zoomDistanceVelocity === 0.0 &&
        tiltVelocity === 0.0 &&
        rotationVelocity === 0.0) {
      isVelocityEnabled = false;
    }
  };

  var minimumCameraHeightAtCoordinates = function(terrain, sceneX, sceneZ) {
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
  var syncToCamera = function(camera, terrain) {
    var hypotenuse = zoomDistance;
    var adjacent = Math.cos(tiltAngle) * hypotenuse;
    var opposite = -Math.sin(tiltAngle) * hypotenuse;

    var cameraX = centerX + (adjacent * Math.sin(azimuthAngle));
    var cameraZ = centerZ + (adjacent * Math.cos(-azimuthAngle));

    camera.position.x = cameraX;
    camera.position.y = Math.max(minimumCameraHeightAtCoordinates(terrain, cameraX, cameraZ), opposite);
    camera.position.z = cameraZ;
    camera.rotation.x = tiltAngle;
    camera.rotation.y = azimuthAngle;
  };

  var syncFromCamera = function(camera) {
    azimuthAngle = camera.rotation.y;
    tiltAngle = Math.min(MAX_TILT_ANGLE, camera.rotation.x);

    var opposite = camera.position.y;
    var hypotenuse = Math.max(MIN_ZOOM_DISTANCE, (1 / Math.sin(-tiltAngle)) * opposite);
    var adjacent = Math.sqrt((hypotenuse * hypotenuse) - (opposite * opposite));

    centerX = camera.position.x - (adjacent * Math.sin(azimuthAngle));
    centerZ = camera.position.z - (adjacent * Math.cos(azimuthAngle));
    zoomDistance = hypotenuse;

    messageBroker.publish("camera.updated", {});
  };


  return {
    centerX: function() { return centerX; },
    centerZ: function() { return centerZ; },
    setCenterCoordinates: setCenterCoordinates,
    minZoomDistance: function() { return MIN_ZOOM_DISTANCE; },
    maxZoomDistance: function() { return MAX_ZOOM_DISTANCE; },
    zoomDistance: function() { return zoomDistance; },
    setZoomDistance: setZoomDistance,
    minTiltAngle: function() { return MIN_TILT_ANGLE; },
    maxTiltAngle: function() { return MAX_TILT_ANGLE; },
    tiltAngle: function() { return tiltAngle; },
    setTiltAngle: setTiltAngle,
    azimuthAngle: function() { return azimuthAngle; },
    setAzimuthAngle: setAzimuthAngle,
    isVelocityEnabled: function() { return isVelocityEnabled; },
    setIsVelocityEnabled: setIsVelocityEnabled,
    tickVelocity: tickVelocity,
    syncToCamera: syncToCamera,
    syncFromCamera: syncFromCamera,
  };
};

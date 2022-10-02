"use strict";

import * as THREE from "three";

import { CityTourMath } from "./../math";

const HALF_PI = Math.PI * 0.5;
const TWO_PI = Math.PI * 2;

var MapCamera = function(sceneView, terrain, messageBroker) {
  var PAN_VELOCITY_DECAY = 0.875;
  var ZOOM_VELOCITY_DECAY = 0.85;
  var TILT_ROTATION_VELOCITY_DECAY = 0.85;
  var AZIMUTH_ROTATION_VELOCITY_DECAY = 0.85;
  var MINIMUM_VELOCITY = 0.00001;
  var MINIMUM_HEIGHT_OFF_GROUND = 0.416666666666667;

  var MIN_TILT_ANGLE = -HALF_PI;
  var MAX_TILT_ANGLE = -0.1;

  var MAX_DISTANCE_FROM_CITY_CENTER = 200.0;

  var centerOfAction;
  var centerOfTilt;
  var zoomCameraToCenterOfActionVector;
  var camera = sceneView.camera();

  var isVelocityEnabled;
  var panVelocityX;
  var panVelocityZ;
  var zoomVelocity;
  var azimuthRotationVelocity;
  var tiltRotationVelocity;

  var reset = function() {
    camera.position.x = -60;
    camera.position.y = 30;
    camera.position.z = 60;
    camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

    centerOfAction = undefined;
    centerOfTilt = undefined;
    zoomCameraToCenterOfActionVector = undefined;

    setIsVelocityEnabled(false);

    messageBroker.publish("camera.updated", {});
  };

  var setCenterOfAction = function(newCenterOfAction) {
    centerOfAction = newCenterOfAction;
    centerOfTilt = undefined;
    zoomCameraToCenterOfActionVector = undefined;

    if (newCenterOfAction === undefined) {
      sceneView.centerOfActionMarkerMesh().position.set(0.0, -100000.0, 0.0);
    }
    else {
      sceneView.centerOfActionMarkerMesh().position.set(centerOfAction.x, centerOfAction.y, centerOfAction.z);
    }
  };

  var setCenterOfTilt = function(newCenterOfTilt) {
    centerOfTilt = newCenterOfTilt;
  };

  var minimumCameraHeightAtCoordinates = function(terrain, cameraX, cameraZ) {
    var terrainHeight = Number.NEGATIVE_INFINITY;

    if (terrain !== undefined) {
      terrainHeight = terrain.heightAt(cameraX, cameraZ);
      if (terrainHeight === undefined) {
        terrainHeight = Number.NEGATIVE_INFINITY;
      }
    }

    return terrainHeight + MINIMUM_HEIGHT_OFF_GROUND;
  };

  var pan = function(distanceX, distanceZ) {
    camera.position.x -= distanceX;
    camera.position.z -= distanceZ;
    camera.position.y = Math.max(minimumCameraHeightAtCoordinates(terrain, camera.position.x, camera.position.z), camera.position.y);

    resetVelocities();
    panVelocityX = distanceX;
    panVelocityZ = distanceZ;

    camera.updateMatrixWorld();
  };

  var zoomTowardCenterOfAction = function(zoomDistancePercentage) {
    if (zoomCameraToCenterOfActionVector === undefined) {
      zoomCameraToCenterOfActionVector = new THREE.Vector3((camera.position.x - centerOfAction.x),
                                                           (camera.position.y - centerOfAction.y),
                                                           (camera.position.z - centerOfAction.z));
    }

    var distanceToCenterOfAction = CityTourMath.distanceBetweenPoints3D(camera.position.x, camera.position.y, camera.position.z,
                                                                        centerOfAction.x, centerOfAction.y, centerOfAction.z);
    var distanceToCenterOfCity = CityTourMath.distanceBetweenPoints3D(camera.position.x, camera.position.y, camera.position.z, 0.0, 0.0, 0.0);

    if (distanceToCenterOfAction <= 2.0 && zoomDistancePercentage > 0.0) {
      return;
    }
    if (distanceToCenterOfCity >= MAX_DISTANCE_FROM_CITY_CENTER && zoomDistancePercentage < 0.0) {
      return;
    }

    var clonedCameraToCenterOfActionVector = zoomCameraToCenterOfActionVector.clone();
    clonedCameraToCenterOfActionVector.multiplyScalar(zoomDistancePercentage);

    camera.position.x -= clonedCameraToCenterOfActionVector.x;
    camera.position.y -= clonedCameraToCenterOfActionVector.y;
    camera.position.z -= clonedCameraToCenterOfActionVector.z;
    camera.position.y = Math.max(minimumCameraHeightAtCoordinates(terrain, camera.position.x, camera.position.z), camera.position.y);
    zoomCameraToCenterOfActionVector.multiplyScalar(1.0 - zoomDistancePercentage);

    resetVelocities();
    zoomVelocity = zoomDistancePercentage;

    camera.updateMatrixWorld();
  };

  var rotateAzimuthAroundCenterOfAction = function(azimuthAngleDelta) {
    var distanceCameraToCenterOfAction = CityTourMath.distanceBetweenPoints(camera.position.x, camera.position.z, centerOfAction.x, centerOfAction.z);
    var originalAngleCameraToCenterOfAction = Math.atan2(-(camera.position.z - centerOfAction.z), camera.position.x - centerOfAction.x);
    var newAngleCameraToCenterOfAction = originalAngleCameraToCenterOfAction + azimuthAngleDelta;

    zoomCameraToCenterOfActionVector = undefined;

    camera.position.x = (distanceCameraToCenterOfAction * Math.cos(newAngleCameraToCenterOfAction)) + centerOfAction.x;
    camera.position.z = -(distanceCameraToCenterOfAction * Math.sin(newAngleCameraToCenterOfAction)) + centerOfAction.z;
    camera.rotation.y += azimuthAngleDelta;
    if (camera.rotation.y > Math.PI) {
      camera.rotation.y -= TWO_PI;
    }
    else if (camera.rotation.y < -Math.PI) {
      camera.rotation.y += TWO_PI;
    }

    var minimumCameraY = minimumCameraHeightAtCoordinates(terrain, camera.position.x, camera.position.z);
    if (camera.position.y < minimumCameraY) {
      camera.position.y = minimumCameraY;
      centerOfAction.y = minimumCameraY;
      setCenterOfAction(centerOfAction);
    }

    resetVelocities();
    azimuthRotationVelocity = azimuthAngleDelta;

    camera.updateMatrixWorld();

    messageBroker.publish("camera.updated", {});
  };

  var tiltCamera = function(tiltAngleDelta) {
    var distanceCameraToCenterOfAction = CityTourMath.distanceBetweenPoints3D(camera.position.x, camera.position.y, camera.position.z,
                                                                              centerOfTilt.x, centerOfTilt.y, centerOfTilt.z);
    var newTiltAngle = CityTourMath.clamp(camera.rotation.x + tiltAngleDelta, MIN_TILT_ANGLE, MAX_TILT_ANGLE);

    zoomCameraToCenterOfActionVector = undefined;

    if (tiltAngleDelta < 0.0 || camera.position.y > minimumCameraHeightAtCoordinates(terrain, camera.position.x, camera.position.z)) {
      camera.position.setFromSphericalCoords(distanceCameraToCenterOfAction, newTiltAngle + HALF_PI, camera.rotation.y);
      camera.position.x += centerOfTilt.x;
      camera.position.y += centerOfTilt.y;
      camera.position.z += centerOfTilt.z;

      camera.position.y = Math.max(camera.position.y, minimumCameraHeightAtCoordinates(terrain, camera.position.x, camera.position.z));
    }
    else {
      return;
    }
    camera.rotation.x = newTiltAngle;

    resetVelocities();
    tiltRotationVelocity = tiltAngleDelta;

    camera.updateMatrixWorld();

    messageBroker.publish("camera.updated", {});
  };

  var tickVelocity = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      panVelocityX *= PAN_VELOCITY_DECAY;
      panVelocityZ *= PAN_VELOCITY_DECAY;
      zoomVelocity *= ZOOM_VELOCITY_DECAY;
      azimuthRotationVelocity *= AZIMUTH_ROTATION_VELOCITY_DECAY;
      tiltRotationVelocity *= TILT_ROTATION_VELOCITY_DECAY;

      if (Math.abs(panVelocityX) > 0.0 || Math.abs(panVelocityZ) > 0.0) {
        pan(panVelocityX, panVelocityZ);
      }

      if (Math.abs(zoomVelocity) > 0.0) {
        zoomTowardCenterOfAction(zoomVelocity);
      }

      if (Math.abs(azimuthRotationVelocity) > 0.0) {
        rotateAzimuthAroundCenterOfAction(azimuthRotationVelocity);
      }

      if (Math.abs(tiltRotationVelocity) > 0.0) {
        tiltCamera(tiltRotationVelocity);
      }
    }

    if (Math.abs(panVelocityX) < MINIMUM_VELOCITY) {
      panVelocityX = 0.0;
    }
    if (Math.abs(panVelocityZ) < MINIMUM_VELOCITY) {
      panVelocityZ = 0.0;
    }
    if (Math.abs(zoomVelocity) < MINIMUM_VELOCITY) {
      zoomVelocity = 0.0;
    }
    if (Math.abs(azimuthRotationVelocity) < MINIMUM_VELOCITY) {
      azimuthRotationVelocity = 0.0;
    }
    if (Math.abs(tiltRotationVelocity) < MINIMUM_VELOCITY) {
      tiltRotationVelocity = 0.0;
    }

    if (panVelocityX === 0.0 &&
        panVelocityZ === 0.0 &&
        zoomVelocity === 0.0 &&
        azimuthRotationVelocity === 0.0 &&
        tiltRotationVelocity === 0.0) {
      isVelocityEnabled = false;
    }
  };

  var resetVelocities = function() {
    panVelocityX = 0.0;
    panVelocityZ = 0.0;
    zoomVelocity = 0.0;
    azimuthRotationVelocity = 0.0;
    tiltRotationVelocity = 0.0;
  };

  var setIsVelocityEnabled = function(newIsVelocityEnabled) {
    isVelocityEnabled = newIsVelocityEnabled;

    if (newIsVelocityEnabled === false) {
      resetVelocities();
    }
  };

  reset();


  return {
    reset: reset,
    centerOfAction: function() { return centerOfAction; },
    setCenterOfAction: setCenterOfAction,
    centerOfTilt: function() { return centerOfTilt; },
    setCenterOfTilt: setCenterOfTilt,
    pan: pan,
    rotateAzimuthAroundCenterOfAction: rotateAzimuthAroundCenterOfAction,
    zoomTowardCenterOfAction: zoomTowardCenterOfAction,
    tiltCamera: tiltCamera,
    isVelocityEnabled: function() { return isVelocityEnabled; },
    setIsVelocityEnabled: setIsVelocityEnabled,
    tickVelocity: tickVelocity,
    positionX: function() { return camera.position.x; },
    positionY: function() { return camera.position.y; },
    positionZ: function() { return camera.position.z; },
    azimuthAngle: function() { return camera.rotation.y; },
    tiltAngle: function() { return camera.rotation.x; },
    minTiltAngle: function() { return MIN_TILT_ANGLE; },
    maxTiltAngle: function() { return MAX_TILT_ANGLE; },
    setTerrain: function(newTerrain) { terrain = newTerrain; },
  };
};

export { MapCamera };

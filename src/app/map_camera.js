"use strict";

var CityTour = CityTour || {};

CityTour.MapCamera = function(sceneView, orbitalCamera) {
  var PAN_VELOCITY_DECAY = 0.875;
  var ZOOM_VELOCITY_DECAY = 0.85;
  var TILT_ROTATION_VELOCITY_DECAY = 0.85;
  var AZIMUTH_ROTATION_VELOCITY_DECAY = 0.85;
  var MINIMUM_VELOCITY = 0.00001;

  var centerOfAction;
  var zoomProperties;
  var camera = sceneView.camera();

  var isVelocityEnabled = false;
  var panVelocityX = 0.0;
  var panVelocityZ = 0.0;
  var zoomVelocity = 0.0;
  var azimuthRotationVelocity = 0.0;
  var tiltRotationVelocity = 0.0;

  var setCenterOfAction = function(newCenterOfAction) {
    centerOfAction = newCenterOfAction;
    zoomProperties = undefined;

    sceneView.centerOfActionMarkerMesh().position.set(centerOfAction.x, centerOfAction.y, centerOfAction.z);
  };

  var resetCenterOfAction = function() {
    setCenterOfAction(new THREE.Vector3(orbitalCamera.centerX(), 0.0, orbitalCamera.centerZ()));
  };

  var pan = function(distanceX, distanceZ) {
    orbitalCamera.setCenterCoordinates(orbitalCamera.centerX() - distanceX, orbitalCamera.centerZ() - distanceZ);

    panVelocityX = distanceX;
    panVelocityZ = distanceZ;
  };

  var calculateZoomProperties = function() {
    var cameraToCenterOfActionVector, centerOfActionPercentageOfFullHeight, zoomEndPoint;
    var newCenterOfOrbitX, newCenterOfOrbitZ;
    var centerXToZoomEndDistance, centerZToZoomEndDistance;
    var centerPointMovementPerOneZoomUnitX, centerPointMovementPerOneZoomUnitZ;
    var minZoomDistance;

    // Vector of camera to intersection with terrain
    cameraToCenterOfActionVector = new THREE.Vector3((camera.position.x - centerOfAction.x),
                                                     (camera.position.y - centerOfAction.y),
                                                     (camera.position.z - centerOfAction.z));
    centerOfActionPercentageOfFullHeight = (camera.position.y - centerOfAction.y) / camera.position.y;

    cameraToCenterOfActionVector.multiplyScalar(1 / centerOfActionPercentageOfFullHeight);

    // Point where camera would intersect the XZ plane if allowed to zoom indefinately
    zoomEndPoint = new THREE.Vector3(camera.position.x - cameraToCenterOfActionVector.x,
                                     camera.position.y - cameraToCenterOfActionVector.y,
                                     camera.position.z - cameraToCenterOfActionVector.z);

    sceneView.targetOfActionMarkerMesh().position.set(zoomEndPoint.x, zoomEndPoint.y, zoomEndPoint.z);

    // Calculate X/Z amount orbital camera center point needs to move per 1 unit of zoom
    // in order for center point to be same as expected camera intersection point with XZ plane
    // if zoom distance reaches 0.
    centerXToZoomEndDistance = orbitalCamera.centerX() - zoomEndPoint.x;
    centerZToZoomEndDistance = orbitalCamera.centerZ() - zoomEndPoint.z;
    centerPointMovementPerOneZoomUnitX = centerXToZoomEndDistance / orbitalCamera.zoomDistance();
    centerPointMovementPerOneZoomUnitZ = centerZToZoomEndDistance / orbitalCamera.zoomDistance();

    // Calculate the zoom distance at the point the camera would hit the terrain
    minZoomDistance = orbitalCamera.zoomDistance() * (1.0 - centerOfActionPercentageOfFullHeight);

    zoomProperties = {
      centerPointMovementPerOneZoomUnitX: centerPointMovementPerOneZoomUnitX,
      centerPointMovementPerOneZoomUnitZ: centerPointMovementPerOneZoomUnitZ,
      minZoomDistance: minZoomDistance,
    };
  };

  var zoomTowardCenterOfAction = function(zoomDistanceDelta) {
    var newZoomDistance = orbitalCamera.zoomDistance() + zoomDistanceDelta;
    var newCenterOfOrbitX, newCenterOfOrbitZ;

    if (zoomProperties === undefined) {
      calculateZoomProperties();
    }

    if (newZoomDistance < zoomProperties.minZoomDistance) {
      newZoomDistance = zoomProperties.minZoomDistance;
      zoomDistanceDelta = orbitalCamera.zoomDistance() - zoomProperties.minZoomDistance;
    }
    else if (newZoomDistance > orbitalCamera.maxZoomDistance()) {
      newZoomDistance = orbitalCamera.maxZoomDistance();
      zoomDistanceDelta = orbitalCamera.maxZoomDistance() - orbitalCamera.zoomDistance();
    }

    newCenterOfOrbitX = orbitalCamera.centerX() + (zoomDistanceDelta * zoomProperties.centerPointMovementPerOneZoomUnitX);
    newCenterOfOrbitZ = orbitalCamera.centerZ() + (zoomDistanceDelta * zoomProperties.centerPointMovementPerOneZoomUnitZ);

    orbitalCamera.setCenterCoordinates(newCenterOfOrbitX, newCenterOfOrbitZ);
    orbitalCamera.setZoomDistance(newZoomDistance);

    zoomVelocity = zoomDistanceDelta;
  };

  var rotateAzimuthAroundCenterOfAction = function(azimuthAngleDelta) {
    var newCenterX, newCenterZ;
    var distanceX = orbitalCamera.centerX() - centerOfAction.x;
    var distanceZ = orbitalCamera.centerZ() - centerOfAction.z;

    zoomProperties = undefined;

    newCenterX = (distanceX * Math.cos(-azimuthAngleDelta)) - (distanceZ * Math.sin(-azimuthAngleDelta)) + centerOfAction.x;
    newCenterZ = (distanceX * Math.sin(-azimuthAngleDelta)) + (distanceZ * Math.cos(-azimuthAngleDelta)) + centerOfAction.z;

    orbitalCamera.setCenterCoordinates(newCenterX, newCenterZ);
    orbitalCamera.setAzimuthAngle(orbitalCamera.azimuthAngle() + azimuthAngleDelta);

    azimuthRotationVelocity = azimuthAngleDelta;
  };

  var tiltCamera = function(tiltAngleDelta) {
    orbitalCamera.setTiltAngle(orbitalCamera.tiltAngle() + tiltAngleDelta);
    tiltRotationVelocity = tiltAngleDelta;
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

  var setIsVelocityEnabled = function(newIsVelocityEnabled) {
    isVelocityEnabled = newIsVelocityEnabled;

    if (newIsVelocityEnabled === false) {
      panVelocityX = 0.0;
      panVelocityZ = 0.0;
      zoomVelocity = 0.0;
      azimuthRotationVelocity = 0.0;
      tiltRotationVelocity = 0.0;
    }
  };

  var syncToCamera = function(camera, terrain) {
    orbitalCamera.syncToCamera(camera, terrain);
  };

  var syncFromCamera = function(camera) {
    orbitalCamera.syncFromCamera(camera);
  };


  resetCenterOfAction();


  return {
    centerOfAction: function() { return centerOfAction; },
    setCenterOfAction: setCenterOfAction,
    resetCenterOfAction: resetCenterOfAction,
    pan: pan,
    rotateAzimuthAroundCenterOfAction: rotateAzimuthAroundCenterOfAction,
    zoomTowardCenterOfAction: zoomTowardCenterOfAction,
    tiltCamera: tiltCamera,
    isVelocityEnabled: function() { return isVelocityEnabled; },
    setIsVelocityEnabled: setIsVelocityEnabled,
    tickVelocity: tickVelocity,
    syncToCamera: syncToCamera,
    syncFromCamera: syncFromCamera,
    centerX: function() { return orbitalCamera.centerX(); },
    centerZ: function() { return orbitalCamera.centerZ(); },
    azimuthAngle: function() { return orbitalCamera.azimuthAngle(); },
    tiltAngle: function() { return orbitalCamera.tiltAngle(); },
    minTiltAngle: function() { return orbitalCamera.minTiltAngle(); },
    maxTiltAngle: function() { return orbitalCamera.maxTiltAngle(); },
    zoomDistance: function() { return orbitalCamera.zoomDistance(); },
    minZoomDistance: function() { return orbitalCamera.minZoomDistance(); },
    maxZoomDistance: function() { return orbitalCamera.maxZoomDistance(); },
  };
};

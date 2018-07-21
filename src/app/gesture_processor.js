"use strict";

var CityTour = CityTour || {};

CityTour.GestureProcessor = function(sceneView, mapCamera) {
  var PAN = 1;
  var TILT = 2;
  var ROTATE = 3;
  var PINCH_ZOOM = 4;

  var MIN_ROTATION_ANGLE =  0.01745329;  // 1 degree
  var MIN_ZOOM_DELTA = 2.0;
  var ALLOWABLE_DELTA_FOR_TILT_GESTURE = Math.PI / 16;
  var MIN_TILT_GESTURE_START_ANGLE = (Math.PI / 2) - ALLOWABLE_DELTA_FOR_TILT_GESTURE;
  var MAX_TILT_GESTURE_START_ANGLE = (Math.PI / 2) + ALLOWABLE_DELTA_FOR_TILT_GESTURE;

  var orbitalCamera = mapCamera.orbitalCamera();

  var currentGesture;
  var previousTouches;

  var panCamera = function(currentTouches) {
    var normalizedScreenDragDistance = new THREE.Vector3(currentTouches.screenMidpoint().x - previousTouches.screenMidpoint().x,
                                                         currentTouches.screenMidpoint().y - previousTouches.screenMidpoint().y,
                                                         0.0);
    mapCamera.pan(normalizedScreenDragDistance);
  };

  var determineMultiTouchGesture = function(currentTouches) {
    var screenAngleBetweenTouches = Math.abs(currentTouches.angleBetweenTouches());
    var touchPointsAreHorizontal = screenAngleBetweenTouches >= MIN_TILT_GESTURE_START_ANGLE &&
                                   screenAngleBetweenTouches <= MAX_TILT_GESTURE_START_ANGLE;
    var azimuthAngleDelta;
    var distanceBetweenTouches;

    if (previousTouches.count() !== 2) {
      return undefined;
    }

    if (currentGesture === TILT) {
      return TILT;
    }
    else if (currentGesture === undefined && touchPointsAreHorizontal) {
      return TILT;
    }
    else {
      azimuthAngleDelta = previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches();
      distanceBetweenTouches = currentTouches.distance() - previousTouches.distance();

      if (Math.abs(azimuthAngleDelta) >= MIN_ROTATION_ANGLE) {
        return ROTATE;
      }
      else if (Math.abs(distanceBetweenTouches) >= MIN_ZOOM_DELTA) {
        return PINCH_ZOOM;
      }
      else {
        return PAN;
      }
    }
  };

  var processMultiTouchGestures = function(currentTouches) {
    var yDistanceDelta, tiltAngleDelta;
    var distanceBetweenTouches, zoomDistanceDelta;

    currentGesture = determineMultiTouchGesture(currentTouches);

    if (currentGesture === undefined) {
      return;
    }

    if (currentGesture === TILT) {
      mapCamera.setCenterOfAction(undefined);
      yDistanceDelta = currentTouches.touches()[0].screenPixelY() - previousTouches.touches()[0].screenPixelY();
      tiltAngleDelta = (yDistanceDelta / 100) * (orbitalCamera.minTiltAngle() - orbitalCamera.maxTiltAngle());
      mapCamera.tiltCamera(tiltAngleDelta);
    }
    else if (currentGesture === ROTATE) {
      mapCamera.rotateAzimuthAroundCenterOfAction(previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches());
    }
    else if (currentGesture === PINCH_ZOOM) {
      distanceBetweenTouches = currentTouches.distance() - previousTouches.distance();
      zoomDistanceDelta = (distanceBetweenTouches > 0) ? -20 : 20;
      mapCamera.zoomTowardCenterOfAction(zoomDistanceDelta);
    }
  };

  var processGesture = function(currentTouches) {
    if (currentTouches === undefined) {
      currentGesture = undefined;
      mapCamera.setCenterOfAction(undefined);
      mapCamera.setIsVelocityEnabled(true);
      sceneView.touchPoint1MarkerMesh().position.set(0.0, 0.0, 0.0);
      sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
    }
    else if (previousTouches === undefined) {
      mapCamera.setIsVelocityEnabled(false);
    }
    else {
      if (mapCamera.centerOfAction() === undefined) {
        mapCamera.setCenterOfAction(currentTouches.midpoint());
      }

      if (currentTouches.count() === 1) {
        currentGesture = PAN;
        panCamera(currentTouches);

        sceneView.touchPoint1MarkerMesh().position.set(currentTouches.touches()[0].worldX(),
                                                       currentTouches.touches()[0].worldY(),
                                                       currentTouches.touches()[0].worldZ());
        sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
      }
      else if (currentTouches.count() === 2) {
        sceneView.touchPoint1MarkerMesh().position.set(currentTouches.touches()[0].worldX(),
                                                       currentTouches.touches()[0].worldY(),
                                                       currentTouches.touches()[0].worldZ());
        sceneView.touchPoint2MarkerMesh().position.set(currentTouches.touches()[1].worldX(),
                                                       currentTouches.touches()[1].worldY(),
                                                       currentTouches.touches()[1].worldZ());

        processMultiTouchGestures(currentTouches);
      }
    }

    previousTouches = currentTouches;
  };

  return {
    processGesture: processGesture,
    previousTouches: function() { return previousTouches; },
  };
};

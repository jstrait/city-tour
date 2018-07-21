"use strict";

var CityTour = CityTour || {};

CityTour.GestureProcessor = function(sceneView, mapCamera) {
  var PAN = "pan";
  var TILT = "tilt";
  var ROTATE = "rotate";
  var PINCH_ZOOM = "pinch zoom";

  var MIN_ROTATION_ANGLE =  0.01745329;  // 1 degree
  var MIN_ZOOM_DELTA = 2.0;
  var ALLOWABLE_DELTA_FOR_TILT_GESTURE = Math.PI / 16;
  var MIN_TILT_GESTURE_START_ANGLE = (Math.PI / 2) - ALLOWABLE_DELTA_FOR_TILT_GESTURE;
  var MAX_TILT_GESTURE_START_ANGLE = (Math.PI / 2) + ALLOWABLE_DELTA_FOR_TILT_GESTURE;

  var currentGesture;
  var previousTouches;

  var panCamera = function(currentTouches) {
    var normalizedScreenDragDistance = new THREE.Vector3(currentTouches.screenMidpoint().x - previousTouches.screenMidpoint().x,
                                                         currentTouches.screenMidpoint().y - previousTouches.screenMidpoint().y,
                                                         0.0);
    mapCamera.pan(normalizedScreenDragDistance);
    mapCamera.resetCenterOfAction();
  };

  var determineMultiTouchGesture = function(currentTouches) {
    var screenAngleBetweenTouches = Math.abs(currentTouches.angleBetweenTouches());
    var touchPointsAreHorizontal = screenAngleBetweenTouches >= MIN_TILT_GESTURE_START_ANGLE &&
                                   screenAngleBetweenTouches <= MAX_TILT_GESTURE_START_ANGLE;
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
    else if (Math.abs(previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches()) >= MIN_ROTATION_ANGLE) {
      return ROTATE;
    }
    else if (Math.abs(currentTouches.distance() - previousTouches.distance()) >= MIN_ZOOM_DELTA) {
      return PINCH_ZOOM;
    }
    else {
      return currentGesture;
    }
  };

  var processMultiTouchGestures = function(currentTouches) {
    var yDistanceDelta, tiltAngleDelta;
    var distanceBetweenTouches, zoomDistanceDelta;

    var previousGesture = currentGesture;
    currentGesture = determineMultiTouchGesture(currentTouches);

    if (currentGesture === undefined) {
      return;
    }

    if (currentGesture === TILT) {
      yDistanceDelta = currentTouches.touches()[0].screenPixelY() - previousTouches.touches()[0].screenPixelY();
      tiltAngleDelta = (yDistanceDelta / 100) * (mapCamera.minTiltAngle() - mapCamera.maxTiltAngle());
      mapCamera.tiltCamera(tiltAngleDelta);
    }
    else if (currentGesture === ROTATE) {
      if (previousGesture !== PINCH_ZOOM && previousGesture !== ROTATE) {
        mapCamera.setCenterOfAction(currentTouches.midpoint());
      }

      mapCamera.rotateAzimuthAroundCenterOfAction(previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches());
    }
    else if (currentGesture === PINCH_ZOOM) {
      if (previousGesture !== PINCH_ZOOM && previousGesture !== ROTATE) {
        mapCamera.setCenterOfAction(currentTouches.midpoint());
      }

      distanceBetweenTouches = currentTouches.distance() - previousTouches.distance();
      zoomDistanceDelta = (distanceBetweenTouches > 0) ? -20 : 20;
      mapCamera.zoomTowardCenterOfAction(zoomDistanceDelta);
    }
  };

  var processGesture = function(currentTouches) {
    if (currentTouches === undefined) {
      currentGesture = undefined;
      mapCamera.resetCenterOfAction();
      mapCamera.setIsVelocityEnabled(true);
      sceneView.touchPoint1MarkerMesh().position.set(0.0, 0.0, 0.0);
      sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
    }
    else if (previousTouches === undefined) {
      mapCamera.setIsVelocityEnabled(false);
    }
    else if (currentTouches.count() === 1) {
      if (previousTouches.count() === 1) {
        currentGesture = PAN;
        panCamera(currentTouches);

        sceneView.touchPoint1MarkerMesh().position.set(currentTouches.touches()[0].worldX(),
                                                       currentTouches.touches()[0].worldY(),
                                                       currentTouches.touches()[0].worldZ());
        sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
      }
      else {
        mapCamera.setIsVelocityEnabled(false);
      }
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

    previousTouches = currentTouches;
  };

  return {
    processGesture: processGesture,
    previousTouches: function() { return previousTouches; },
  };
};

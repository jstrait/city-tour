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

  // Adapted from https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z#13091694
  //
  // Instead of using the camera's current position to unproject from the screen coordinate to the world coordinate,
  // this always uses the equivalent of a camera looking straight down on the center of orbit, from the zoom distance away.
  //
  // The reason for doing this is so that the rate of movement is uniform regardless of the camera's tilt angle.
  // I.e., at the same zoom level, moving your mouse/finger 10 pixels on the screen will result in the same amount
  // of world movement if the camera is looking straight down, or straight forward. It also means that the location on
  // the screen (i.e. top-left vs. center vs. bottom-right) won't affect the amount of world movement when the camera is
  // tilted at an angle other than straight down.
  var screenCoordinateToWorldCoordinateStraightDown = function(normalizedScreenVector) {
    var straightDownEuler, straightDownPosition, straightDownQuaternion, straightDownScale, straightDownMatrix;
    var matrix;
    var direction, distanceToXZPlane, worldPosition;
    var camera = sceneView.camera();

    // Similar camera world matrix from a "looking straight down on center of orbit" position/rotation
    straightDownEuler = new THREE.Euler(-Math.PI / 2, camera.rotation.y, 0.0, 'YXZ');
    straightDownPosition = new THREE.Vector3(mapCamera.positionX(), mapCamera.positionY(), mapCamera.positionZ());
    straightDownQuaternion = new THREE.Quaternion();
    straightDownQuaternion.setFromEuler(straightDownEuler);
    straightDownScale = camera.scale.clone();
    straightDownMatrix = new THREE.Matrix4().compose(straightDownPosition, straightDownQuaternion, straightDownScale);

    // Unproject from the simulated camera position
    matrix = new THREE.Matrix4();
    matrix.multiplyMatrices(straightDownMatrix, matrix.getInverse(camera.projectionMatrix));
    normalizedScreenVector.applyMatrix4(matrix);

    direction = normalizedScreenVector.sub(straightDownPosition).normalize();
    distanceToXZPlane = -(straightDownPosition.y / direction.y);
    worldPosition = straightDownPosition.clone().add(direction.multiplyScalar(distanceToXZPlane));

    return worldPosition;
  };

  var panCamera = function(currentTouches) {
    var normalizedScreenDragDistance = new THREE.Vector3(currentTouches.normalizedScreenMidpoint().x - previousTouches.normalizedScreenMidpoint().x,
                                                         currentTouches.normalizedScreenMidpoint().y - previousTouches.normalizedScreenMidpoint().y,
                                                         0.0);

    var worldDragStart = new THREE.Vector3(mapCamera.positionX(), 0.0, mapCamera.positionZ());
    var worldDragEnd = screenCoordinateToWorldCoordinateStraightDown(normalizedScreenDragDistance);
    var worldDragDistance = new THREE.Vector3(worldDragEnd.x - worldDragStart.x,
                                              worldDragEnd.y - worldDragStart.y,
                                              worldDragEnd.z - worldDragStart.z);

    mapCamera.pan(worldDragDistance.x, worldDragDistance.z);
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
    else if (Math.abs(currentTouches.distanceInScreenPixels() - previousTouches.distanceInScreenPixels()) >= MIN_ZOOM_DELTA) {
      return PINCH_ZOOM;
    }
    else {
      return currentGesture;
    }
  };

  var processMultiTouchGestures = function(currentTouches) {
    var yDistanceDelta, tiltAngleDelta;
    var distanceBetweenTouchesDelta, baseZoomDistanceDelta, zoomDistanceDelta;

    var previousGesture = currentGesture;
    currentGesture = determineMultiTouchGesture(currentTouches);

    if (currentGesture === undefined) {
      return;
    }

    if (currentGesture === TILT) {
      if (previousGesture !== PINCH_ZOOM && previousGesture !== ROTATE && previousGesture !== TILT) {
        mapCamera.setCenterOfAction(currentTouches.worldMidpoint());
      }

      yDistanceDelta = currentTouches.touches()[0].screenPixelY() - previousTouches.touches()[0].screenPixelY();
      tiltAngleDelta = (yDistanceDelta / 100) * (mapCamera.minTiltAngle() - mapCamera.maxTiltAngle());
      mapCamera.tiltCamera(tiltAngleDelta);
    }
    else if (currentGesture === ROTATE) {
      if (previousGesture !== PINCH_ZOOM && previousGesture !== ROTATE && previousGesture !== TILT) {
        mapCamera.setCenterOfAction(currentTouches.worldMidpoint());
      }

      mapCamera.rotateAzimuthAroundCenterOfAction(previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches());
    }
    else if (currentGesture === PINCH_ZOOM) {
      if (previousGesture !== PINCH_ZOOM && previousGesture !== ROTATE && previousGesture !== TILT) {
        mapCamera.setCenterOfAction(currentTouches.worldMidpoint());
      }

      distanceBetweenTouchesDelta = currentTouches.distanceInScreenPixels() - previousTouches.distanceInScreenPixels();

      baseZoomDistanceDelta = 0.025;
      zoomDistanceDelta = (distanceBetweenTouchesDelta > 0) ? baseZoomDistanceDelta : -baseZoomDistanceDelta;

      mapCamera.zoomTowardCenterOfAction(zoomDistanceDelta);
    }
  };

  var processGesture = function(currentTouches, isShiftKey, isAltKey) {
    if (currentTouches === undefined) {
      currentGesture = undefined;
      mapCamera.setIsVelocityEnabled(true);
      sceneView.touchPoint1MarkerMesh().position.set(0.0, 0.0, 0.0);
      sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
    }
    else if (previousTouches === undefined) {
      mapCamera.setIsVelocityEnabled(false);
    }
    else if (currentTouches.count() === 1) {
      if (previousTouches.count() === 1) {
        if (isAltKey) {
          var previousGesture = currentGesture;
          currentGesture = ROTATE;

          if (previousGesture !== ROTATE) {
            mapCamera.setCenterOfAction(currentTouches.worldMidpoint());
          }

          var azimuthAngleDelta = CityTour.Math.lerp(0, Math.PI, (currentTouches.normalizedScreenMidpoint().x - previousTouches.normalizedScreenMidpoint().x));
          var newAzimuthAngle = mapCamera.azimuthAngle() + azimuthAngleDelta;
          mapCamera.rotateAzimuthAroundCenterOfAction(newAzimuthAngle - mapCamera.azimuthAngle());
        }
        else if (isShiftKey) {
          var previousGesture = currentGesture;
          currentGesture = PINCH_ZOOM;

          if (previousGesture !== PINCH_ZOOM) {
            mapCamera.setCenterOfAction(currentTouches.worldMidpoint());
          }

          var distanceBetweenTouchesDelta = currentTouches.normalizedScreenMidpoint().y - previousTouches.normalizedScreenMidpoint().y;
          var baseZoomDistanceDelta = 0.025;
          var zoomDistanceDelta;
          if (distanceBetweenTouchesDelta > 0) {
            zoomDistanceDelta = -baseZoomDistanceDelta;
          }
          else if (distanceBetweenTouchesDelta < 0) {
            zoomDistanceDelta = baseZoomDistanceDelta;
          }
          else {
            zoomDistanceDelta = 0.0;
          }

          if (zoomDistanceDelta !== 0.0) {
            mapCamera.zoomTowardCenterOfAction(zoomDistanceDelta);
          }
        }
        else {
          currentGesture = PAN;
          panCamera(currentTouches);

          sceneView.touchPoint1MarkerMesh().position.set(currentTouches.touches()[0].worldX(),
                                                         currentTouches.touches()[0].worldY(),
                                                         currentTouches.touches()[0].worldZ());
          sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
        }

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

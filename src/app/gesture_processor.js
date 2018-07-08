"use strict";

var CityTour = CityTour || {};

CityTour.GestureProcessor = function(sceneView, orbitalCamera) {
  var PAN = 1;
  var TILT = 2;
  var ROTATE = 3;
  var PINCH_ZOOM = 4;

  var MIN_ROTATION_ANGLE =  0.01745329;  // 1 degree
  var MIN_ZOOM_DELTA = 0.5;
  var ALLOWABLE_DELTA_FOR_TILT_GESTURE = Math.PI / 16;
  var MIN_TILT_GESTURE_START_ANGLE = (Math.PI / 2) - ALLOWABLE_DELTA_FOR_TILT_GESTURE;
  var MAX_TILT_GESTURE_START_ANGLE = (Math.PI / 2) + ALLOWABLE_DELTA_FOR_TILT_GESTURE;

  var camera = sceneView.camera();
  var currentGesture;
  var previousTouches;
  var centerOfAction;
  var zoomProperties;

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
    var direction, distanceToYPlane, worldPosition;

    // Similar camera world matrix from a "looking straight down on center of orbit" position/rotation
    straightDownEuler = new THREE.Euler(-Math.PI / 2, camera.rotation.y, 0.0, 'YXZ');
    straightDownPosition = new THREE.Vector3(orbitalCamera.centerX(), orbitalCamera.zoomDistance(), orbitalCamera.centerZ());
    straightDownQuaternion = new THREE.Quaternion();
    straightDownQuaternion.setFromEuler(straightDownEuler);
    straightDownScale = camera.scale.clone();
    straightDownMatrix = new THREE.Matrix4().compose(straightDownPosition, straightDownQuaternion, straightDownScale);

    // Unproject from the simulated camera position
    matrix = new THREE.Matrix4();
    matrix.multiplyMatrices(straightDownMatrix, matrix.getInverse(camera.projectionMatrix));
    normalizedScreenVector.applyMatrix4(matrix);

    direction = normalizedScreenVector.sub(straightDownPosition).normalize();
    distanceToYPlane = -(straightDownPosition.y / direction.y);
    worldPosition = straightDownPosition.clone().add(direction.multiplyScalar(distanceToYPlane));

    return worldPosition;
  };


  var panCamera = function(currentTouches) {
    var normalizedScreenDragDistance = new THREE.Vector3(currentTouches.touches()[0].screenX() - previousTouches.touches()[0].screenX(),
                                                         currentTouches.touches()[0].screenY() - previousTouches.touches()[0].screenY(),
                                                         0.0);

    var worldDragStart = new THREE.Vector3(orbitalCamera.centerX(), 0.0, orbitalCamera.centerZ());
    var worldDragEnd = screenCoordinateToWorldCoordinateStraightDown(normalizedScreenDragDistance);
    var worldDragDistance = new THREE.Vector3(worldDragEnd.x - worldDragStart.x,
                                              worldDragEnd.y - worldDragStart.y,
                                              worldDragEnd.z - worldDragStart.z);

    orbitalCamera.setCenterCoordinates(orbitalCamera.centerX() - worldDragDistance.x, orbitalCamera.centerZ() - worldDragDistance.z);
  };

  var processZoom = function(currentTouches, distanceBetweenTouches) {
    var newCenterOfOrbitX, newCenterOfOrbitZ;
    var interpolationXZTowardCenterOfZoomPecentage;

    var zoomDeltaPercentage = (distanceBetweenTouches / CityTour.Math.lerp(100, 1200, orbitalCamera.zoomPercentage()));

    if (centerOfAction === undefined) {
      centerOfAction = currentTouches.midpoint();
      sceneView.centerOfActionMarkerMesh().position.set(centerOfAction.x, centerOfAction.y, centerOfAction.z);
    }

    if (zoomProperties === undefined) {
      zoomProperties = {
        zoomStartX: orbitalCamera.centerX(),
        zoomStartZ: orbitalCamera.centerZ(),
        zoomStartDistancePercentage: orbitalCamera.zoomPercentage(),
      };
    }

    if (zoomProperties.zoomStartDistancePercentage === 1.0) {
      interpolationXZTowardCenterOfZoomPecentage = orbitalCamera.zoomPercentage();
    }
    else {
      interpolationXZTowardCenterOfZoomPecentage = (orbitalCamera.zoomPercentage() - zoomProperties.zoomStartDistancePercentage) / (1.0 - zoomProperties.zoomStartDistancePercentage);
    }

    if (orbitalCamera.zoomPercentage() < 1.0) {
      newCenterOfOrbitX = CityTour.Math.lerp(zoomProperties.zoomStartX, centerOfAction.x, interpolationXZTowardCenterOfZoomPecentage);
      newCenterOfOrbitZ = CityTour.Math.lerp(zoomProperties.zoomStartZ, centerOfAction.z, interpolationXZTowardCenterOfZoomPecentage);
    }
    else {
      newCenterOfOrbitX = centerOfAction.x;
      newCenterOfOrbitZ = centerOfAction.z;
    }

    orbitalCamera.setCenterCoordinates(newCenterOfOrbitX, newCenterOfOrbitZ);
    orbitalCamera.setZoomPercentage(orbitalCamera.zoomPercentage() + zoomDeltaPercentage);
  };

  var processAzimuthRotation = function(currentTouches, azimuthAngleDelta) {
    var newCenterX, newCenterZ;

    if (centerOfAction === undefined) {
      centerOfAction = currentTouches.midpoint();
      sceneView.centerOfActionMarkerMesh().position.set(centerOfAction.x, centerOfAction.y, centerOfAction.z);
    }

    newCenterX = ((orbitalCamera.centerX() - centerOfAction.x) * Math.cos(-azimuthAngleDelta)) - ((orbitalCamera.centerZ() - centerOfAction.z) * Math.sin(-azimuthAngleDelta)) + centerOfAction.x;
    newCenterZ = ((orbitalCamera.centerX() - centerOfAction.x) * Math.sin(-azimuthAngleDelta)) + ((orbitalCamera.centerZ() - centerOfAction.z) * Math.cos(-azimuthAngleDelta)) + centerOfAction.z;

    orbitalCamera.setCenterCoordinates(newCenterX, newCenterZ);
    orbitalCamera.setAzimuthAngle(orbitalCamera.azimuthAngle() + azimuthAngleDelta);
  };

  var determineMultiTouchGesture = function(currentTouches) {
    var screenAngleBetweenTouches = Math.abs(currentTouches.angleBetweenTouches());
    var touchPointsAreHorizontal = screenAngleBetweenTouches >= MIN_TILT_GESTURE_START_ANGLE &&
                                   screenAngleBetweenTouches <= MAX_TILT_GESTURE_START_ANGLE;
    var azimuthAngleDelta;

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

      if (Math.abs(azimuthAngleDelta) >= MIN_ROTATION_ANGLE) {
        return ROTATE;
      }
      else {
        return PINCH_ZOOM;
      }
    }
  };


  var processMultiTouchGestures = function(currentTouches) {
    var yDistanceDelta;
    var azimuthAngleDelta;
    var distanceBetweenTouches;

    currentGesture = determineMultiTouchGesture(currentTouches);

    if (currentGesture === undefined) {
      return;
    }

    if (currentGesture === TILT) {
      sceneView.centerOfActionMarkerMesh().position.set(0.0, 0.0, 0.0);
      centerOfAction = undefined;
      zoomProperties = undefined;
      yDistanceDelta = currentTouches.touches()[0].screenPixelY() - previousTouches.touches()[0].screenPixelY();
      orbitalCamera.setTiltPercentage(orbitalCamera.tiltPercentage() + (yDistanceDelta / 100));
    }
    else if (currentGesture === ROTATE) {
      zoomProperties = undefined;
      processAzimuthRotation(currentTouches, previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches());
    }
    else {
      distanceBetweenTouches = currentTouches.distance() - previousTouches.distance();
      if (Math.abs(distanceBetweenTouches) >= MIN_ZOOM_DELTA) {
        processZoom(currentTouches, distanceBetweenTouches);
      }
    }
  };

  var processGesture = function(currentTouches) {
    if (currentTouches === undefined) {
      currentGesture = undefined;
      centerOfAction = undefined;
      zoomProperties = undefined;
      orbitalCamera.setIsVelocityEnabled(true);
      sceneView.centerOfActionMarkerMesh().position.set(0.0, 0.0, 0.0);
      sceneView.touchPoint1MarkerMesh().position.set(0.0, 0.0, 0.0);
      sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
    }
    else if (previousTouches !== undefined) {
      orbitalCamera.setIsVelocityEnabled(false);

      if (currentTouches.count() === 1) {
        currentGesture = PAN;
        centerOfAction = undefined;
        zoomProperties = undefined;
        panCamera(currentTouches);

        sceneView.centerOfActionMarkerMesh().position.set(0.0, 0.0, 0.0);
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

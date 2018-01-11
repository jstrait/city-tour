"use strict";

var CityTour = CityTour || {};

CityTour.GestureProcessor = function(orbitalCamera, camera) {
  var PAN = 1;
  var TILT = 2;
  var ROTATE = 3;
  var PINCH_ZOOM = 4;

  var MIN_ROTATION_ANGLE =  0.01745329;  // 1 degree
  var MIN_ZOOM_DELTA = 0.5;

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

  var touchPointsAreHorizontal = function(angleBetweenTouchPoints) {
    var ALLOWABLE_DELTA_FOR_X_ROTATION = Math.PI / 16;
    var HALF_PI = Math.PI / 2;

    return Math.abs(angleBetweenTouchPoints) >= (HALF_PI - ALLOWABLE_DELTA_FOR_X_ROTATION) &&
           Math.abs(angleBetweenTouchPoints) <= (HALF_PI + ALLOWABLE_DELTA_FOR_X_ROTATION);
  };

  var rotationYActive = function(rotationYDelta) {
    return Math.abs(rotationYDelta) >= MIN_ROTATION_ANGLE;
  };

  var processZoom = function(currentTouches, distanceBetweenTouches) {
    var newCenterOfOrbitX, newCenterOfOrbitZ;
    var interpolationXZTowardCenterOfZoomPecentage;

    var zoomDeltaPercentage = (distanceBetweenTouches / CityTour.Math.lerp(100, 1200, orbitalCamera.zoomPercentage()));

    if (centerOfAction === undefined) {
      centerOfAction = currentTouches.midpoint();
    }

    if (zoomProperties === undefined) {
      zoomProperties = {
        zoomStartX: orbitalCamera.centerX(),
        zoomStartZ: orbitalCamera.centerZ(),
        zoomStartDistancePercentage: orbitalCamera.zoomPercentage(),
      };
    }

    interpolationXZTowardCenterOfZoomPecentage = (orbitalCamera.zoomPercentage() - zoomProperties.zoomStartDistancePercentage) / (1.0 - zoomProperties.zoomStartDistancePercentage);

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

  var processRotationY = function(currentTouches, rotationAngleDelta) {
    var newCenterX, newCenterZ;

    if (centerOfAction === undefined) {
      centerOfAction = currentTouches.midpoint();
    }

    newCenterX = ((orbitalCamera.centerX() - centerOfAction.x) * Math.cos(-rotationAngleDelta)) - ((orbitalCamera.centerZ() - centerOfAction.z) * Math.sin(-rotationAngleDelta)) + centerOfAction.x;
    newCenterZ = ((orbitalCamera.centerX() - centerOfAction.x) * Math.sin(-rotationAngleDelta)) + ((orbitalCamera.centerZ() - centerOfAction.z) * Math.cos(-rotationAngleDelta)) + centerOfAction.z;

    orbitalCamera.setCenterCoordinates(newCenterX, newCenterZ);
    orbitalCamera.setRotationAngle(orbitalCamera.rotationAngle() + rotationAngleDelta);
  };

  var processMultiTouchGestures = function(currentTouches) {
    var yDistanceDelta;
    var rotationAngleDelta;
    var distanceBetweenTouches;

    if (previousTouches.count() !== 2) {
      return;
    }

    if (currentGesture === undefined && touchPointsAreHorizontal(currentTouches.angleBetweenTouches())) {
      currentGesture = TILT;
    }

    if (currentGesture === TILT) {
      centerOfAction = undefined;
      zoomProperties = undefined;
      yDistanceDelta = currentTouches.touches()[0].screenPixelY() - previousTouches.touches()[0].screenPixelY();
      orbitalCamera.setTiltPercentage(orbitalCamera.tiltPercentage() + (yDistanceDelta / 100));
    }
    else {
      rotationAngleDelta = previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches();

      if (rotationYActive(rotationAngleDelta)) {
        zoomProperties = undefined;
        currentGesture = ROTATE;
        processRotationY(currentTouches, rotationAngleDelta);
      }
      else {
        currentGesture = PINCH_ZOOM;
        distanceBetweenTouches = currentTouches.distance() - previousTouches.distance();
        if (Math.abs(distanceBetweenTouches) >= MIN_ZOOM_DELTA) {
          processZoom(currentTouches, distanceBetweenTouches);
        }
      }
    }
  };

  var processGesture = function(currentTouches) {
    if (currentTouches !== undefined && previousTouches !== undefined && currentTouches.count() === 1) {
      currentGesture = PAN;
      centerOfAction = undefined;
      zoomProperties = undefined;
      panCamera(currentTouches);
    }
    else if (currentTouches !== undefined && previousTouches !== undefined && currentTouches.count() === 2) {
      processMultiTouchGestures(currentTouches);
    }

    previousTouches = currentTouches;
    if (currentTouches === undefined) {
      currentGesture = undefined;
      centerOfAction = undefined;
      zoomProperties = undefined;
    }
  };

  return {
    processGesture: processGesture,
    previousTouches: function() { return previousTouches; },
  };
};

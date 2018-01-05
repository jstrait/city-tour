"use strict";

var CityTour = CityTour || {};

CityTour.NavigationTouchController = function(el, orbitalCamera, camera, messageBroker) {
  var PAN = 1;
  var TILT = 2;
  var ROTATE = 3;
  var PINCH_ZOOM = 4;

  var MIN_ROTATION_ANGLE =  0.01745329;  // 1 degree
  var MIN_ZOOM_DELTA = 0.5;

  var currentGesture;
  var previousTouchPoints;

  var onMouseDown = function(e) {
    el.classList.add("cursor-grabbing");
    previousTouchPoints = [{x: e.clientX, z: e.clientY}];
    orbitalCamera.setIsVelocityEnabled(false);
  };

  var onTouchStart = function(e) {
    var i, touch;

    previousTouchPoints = [];
    for (i = 0; i < e.touches.length; i++) {
      touch = e.touches.item(i);
      previousTouchPoints.push({x: touch.clientX, z: touch.clientY});
    }

    e.preventDefault();
    orbitalCamera.setIsVelocityEnabled(false);
  };

  var onTouchStartStub = function(e) {
    e.preventDefault();
  };

  var onMouseMove = function(e) {
    if (previousTouchPoints < 1) {
      return;
    }

    processGesture([{x: e.clientX, z: e.clientY}]);
  };

  var onTouchMove = function(e) {
    var i, touch;
    var currentTouchPoints;

    currentTouchPoints = [];
    for (i = 0; i < e.touches.length; i++) {
      touch = e.touches.item(i);
      currentTouchPoints.push({x: touch.clientX, z: touch.clientY});
    }

    processGesture(currentTouchPoints);
  };

  var onMouseUp = function(e) {
    el.classList.remove("cursor-grabbing");
    currentGesture = undefined;

    if (previousTouchPoints !== undefined) {
      orbitalCamera.setIsVelocityEnabled(true);
    }

    previousTouchPoints = [];
  };

  var onTouchEnd = function(e) {
    currentGesture = undefined;

    if (previousTouchPoints !== undefined) {
      orbitalCamera.setIsVelocityEnabled(true);
    }

    previousTouchPoints = [];
  };

  var onMouseOver = function(e) {
    // Safari, as of v11, doesn't support buttons, but it does support the non-standard `which`
    if ((e.buttons !== undefined && e.buttons === 0) ||
        (e.which !== undefined && e.which === 0)) {
      el.classList.remove("cursor-grabbing");
      currentGesture = undefined;
      previousTouchPoints = [];
    }
  };

  var normalizedScreenVector = function(screenX, screenY) {
    return new THREE.Vector3(((screenX / (el.width / window.devicePixelRatio)) * 2) - 1,
                             (-(screenY / (el.height / window.devicePixelRatio)) * 2) + 1,
                             0.5);
  };

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


  var panCamera = function(currentTouchPoints) {
    var previousTouchNormalized = normalizedScreenVector(previousTouchPoints[0].x, previousTouchPoints[0].z);
    var currentTouchNormalized = normalizedScreenVector(currentTouchPoints[0].x, currentTouchPoints[0].z);

    var normalizedScreenDragDistance = new THREE.Vector3(currentTouchNormalized.x - previousTouchNormalized.x,
                                                         currentTouchNormalized.y - previousTouchNormalized.y,
                                                         currentTouchNormalized.z - previousTouchNormalized.z);

    var worldDragStart = new THREE.Vector3(orbitalCamera.centerX(), 0.0, orbitalCamera.centerZ());
    var worldDragEnd = screenCoordinateToWorldCoordinateStraightDown(normalizedScreenDragDistance);
    var worldDragDistance = new THREE.Vector3(worldDragEnd.x - worldDragStart.x,
                                              worldDragEnd.y - worldDragStart.y,
                                              worldDragEnd.z - worldDragStart.z);

    orbitalCamera.setCenterCoordinates(orbitalCamera.centerX() - worldDragDistance.x, orbitalCamera.centerZ() - worldDragDistance.z);
  };


  var calculateZoomDelta = function(previousTouchPoints, currentTouchPoints) {
    var previousDistanceBetweenTouches = CityTour.Math.distanceBetweenPoints(previousTouchPoints[0].x, previousTouchPoints[0].z, previousTouchPoints[1].x, previousTouchPoints[1].z);
    var currentDistanceBetweenTouches = CityTour.Math.distanceBetweenPoints(currentTouchPoints[0].x, currentTouchPoints[0].z, currentTouchPoints[1].x, currentTouchPoints[1].z);
    return currentDistanceBetweenTouches - previousDistanceBetweenTouches;
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

  var processMultiTouchGestures = function(currentTouchPoints) {
    var previousAngleBetweenTouches, currentAngleBetweenTouches;
    var yDistanceDelta;
    var rotationAngleDelta;
    var distanceBetweenTouches;

    if (previousTouchPoints.length !== 2) {
      return;
    }

    currentAngleBetweenTouches = Math.atan2(-(currentTouchPoints[1].x - currentTouchPoints[0].x), -(currentTouchPoints[1].z - currentTouchPoints[0].z));

    if (currentGesture === undefined && touchPointsAreHorizontal(currentAngleBetweenTouches)) {
      currentGesture = TILT;
    }

    if (currentGesture === TILT) {
      yDistanceDelta = currentTouchPoints[0].z - previousTouchPoints[0].z;
      orbitalCamera.setTiltPercentage(orbitalCamera.tiltPercentage() + (yDistanceDelta / 100));
    }
    else {
      previousAngleBetweenTouches = Math.atan2(-(previousTouchPoints[1].x - previousTouchPoints[0].x), -(previousTouchPoints[1].z - previousTouchPoints[0].z));
      rotationAngleDelta = previousAngleBetweenTouches - currentAngleBetweenTouches;

      if (rotationYActive(rotationAngleDelta)) {
        currentGesture = ROTATE;
        orbitalCamera.setRotationAngle(orbitalCamera.rotationAngle() + rotationAngleDelta);
      }
      else {
        currentGesture = PINCH_ZOOM;
        distanceBetweenTouches = calculateZoomDelta(previousTouchPoints, currentTouchPoints);
        if (Math.abs(distanceBetweenTouches) >= MIN_ZOOM_DELTA) {
          orbitalCamera.setZoomPercentage(orbitalCamera.zoomPercentage() + (distanceBetweenTouches / CityTour.Math.lerp(100, 1200, orbitalCamera.zoomPercentage())));
        }
      }
    }
  };

  var processGesture = function(currentTouchPoints) {
    if (currentTouchPoints.length === 1) {
      currentGesture = PAN;
      panCamera(currentTouchPoints);
    }
    else if (currentTouchPoints.length === 2) {
      processMultiTouchGestures(currentTouchPoints);
    }

    previousTouchPoints = currentTouchPoints;
  };

  var enableEventHandlers = function() {
    el.addEventListener('mousedown', onMouseDown, false);
    el.addEventListener('touchstart', onTouchStart, false);
    el.addEventListener('mousemove', onMouseMove, false);
    el.addEventListener('touchmove', onTouchMove, false);
    el.addEventListener('mouseup', onMouseUp, false);
    el.addEventListener('touchend', onTouchEnd, false);
    el.addEventListener('mouseover', onMouseOver, false);

    el.removeEventListener('touchstart', onTouchStartStub, false);
  };

  var disableEventHandlers = function() {
    el.removeEventListener('mousedown', onMouseDown, false);
    el.removeEventListener('touchstart', onTouchStart, false);
    el.removeEventListener('mousemove', onMouseMove, false);
    el.removeEventListener('touchmove', onTouchMove, false);
    el.removeEventListener('mouseup', onMouseUp, false);
    el.removeEventListener('touchend', onTouchEnd, false);
    el.removeEventListener('mouseover', onMouseOver, false);

    el.addEventListener('touchstart', onTouchStartStub, false);
  };


  var id1 = messageBroker.addSubscriber("flythrough.started", disableEventHandlers);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", enableEventHandlers);

  onMouseUp();
  enableEventHandlers();


  return {};
};

"use strict";

var CityTour = CityTour || {};

CityTour.NavigationTouchController = function(el, interactiveCamera, messageBroker) {
  var PAN = 1;
  var TILT = 2;
  var ROTATE = 3;
  var PINCH_ZOOM = 4;

  var currentGesture;
  var previousTouchPoints;

  var onMouseDown = function(e) {
    el.classList.add("cursor-grabbing");
    previousTouchPoints = [{x: e.clientX, z: e.clientY}];
  };

  var onTouchStart = function(e) {
    var i, touch;

    previousTouchPoints = [];
    for (i = 0; i < e.touches.length; i++) {
      touch = e.touches.item(i);
      previousTouchPoints.push({x: touch.clientX, z: touch.clientY});
    }

    e.preventDefault();
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
    previousTouchPoints = [];
  };

  var onTouchEnd = function(e) {
    currentGesture = undefined;
    previousTouchPoints = [];
  };

  var onMouseOver = function(e) {
    // Safari, as of v11, doesn't support buttons, but it does support the non-standard `which`
    if ((e.buttons !== undefined && e.buttons === 0) ||
        (e.which !== undefined && e.which === 0)) {
      el.classList.remove("cursor-grabbing");
      currentGesture = undefined;
      previousTouchPoints = []
    }
  };

  var panCamera = function(currentTouchPoints) {
    var rotationY = interactiveCamera.rotationAngle();
    var dragXDistanceInPixels = currentTouchPoints[0].x - previousTouchPoints[0].x;
    var dragZDistanceInPixels = currentTouchPoints[0].z - previousTouchPoints[0].z;
    var dragAngle = Math.atan2(-dragZDistanceInPixels, -dragXDistanceInPixels);

    // Scale the drag distance based on the camera zoom. If zoomed in, dragging should
    // move the camera less than if the camera is zoomed out.
    var zoomMultiplier = (((1 - interactiveCamera.zoomPercentage()) * 0.92)) + 0.08;
    var totalDragDistanceInPixels = Math.sqrt((dragXDistanceInPixels * dragXDistanceInPixels) + (dragZDistanceInPixels * dragZDistanceInPixels));
    var scaledDragDistanceInPixels = totalDragDistanceInPixels * zoomMultiplier;

    var rotatedDragXDistance = scaledDragDistanceInPixels * Math.cos(dragAngle - rotationY);
    var rotatedDragZDistance = scaledDragDistanceInPixels * Math.sin(dragAngle - rotationY);
    interactiveCamera.setCenterCoordinates(interactiveCamera.centerX() + rotatedDragXDistance, interactiveCamera.centerZ() + rotatedDragZDistance);
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
    return Math.abs(rotationYDelta) >= 0.01;
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
      interactiveCamera.setTiltPercentage(interactiveCamera.tiltPercentage() + (yDistanceDelta / 100));
    }
    else {
      previousAngleBetweenTouches = Math.atan2(-(previousTouchPoints[1].x - previousTouchPoints[0].x), -(previousTouchPoints[1].z - previousTouchPoints[0].z));
      rotationAngleDelta = previousAngleBetweenTouches - currentAngleBetweenTouches;

      if (rotationYActive(rotationAngleDelta)) {
        currentGesture = ROTATE;
        interactiveCamera.setRotationAngle(interactiveCamera.rotationAngle() + rotationAngleDelta);
      }
      else {
        currentGesture = PINCH_ZOOM;
        distanceBetweenTouches = calculateZoomDelta(previousTouchPoints, currentTouchPoints);
        interactiveCamera.setZoomPercentage(interactiveCamera.zoomPercentage() + (distanceBetweenTouches / 200));
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

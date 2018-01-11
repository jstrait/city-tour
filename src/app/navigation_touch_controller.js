"use strict";

var CityTour = CityTour || {};

CityTour.NavigationTouchController = function(el, orbitalCamera, camera, messageBroker) {
  var gestureProcessor = CityTour.GestureProcessor(orbitalCamera, camera);

  var onMouseDown = function(e) {
    el.classList.add("cursor-grabbing");
    gestureProcessor.setPreviousTouches(CityTour.WorldTouchCollection(el, camera, [{x: e.clientX, z: e.clientY}]));
    orbitalCamera.setIsVelocityEnabled(false);
  };

  var onTouchStart = function(e) {
    var i, touch;

    var previousTouchPoints = [];
    for (i = 0; i < e.touches.length; i++) {
      touch = e.touches.item(i);
      previousTouchPoints.push({x: touch.clientX, z: touch.clientY});
    }
    gestureProcessor.setPreviousTouches(CityTour.WorldTouchCollection(el, camera, previousTouchPoints));

    e.preventDefault();
    orbitalCamera.setIsVelocityEnabled(false);
  };

  var onTouchStartStub = function(e) {
    e.preventDefault();
  };

  var onMouseMove = function(e) {
    if (gestureProcessor.previousTouches() === undefined || gestureProcessor.previousTouches().count() < 1) {
      return;
    }

    var currentTouches = CityTour.WorldTouchCollection(el, camera, [{x: e.clientX, z: e.clientY}]);

    gestureProcessor.processGesture(currentTouches);
  };

  var onTouchMove = function(e) {
    var i, touch;
    var currentTouchPoints;

    var currentTouchPoints = [];
    for (i = 0; i < e.touches.length; i++) {
      touch = e.touches.item(i);
      currentTouchPoints.push({x: touch.clientX, z: touch.clientY});
    }
    var currentTouches = CityTour.WorldTouchCollection(el, camera, currentTouchPoints);

    gestureProcessor.processGesture(currentTouches);
  };

  var onMouseUp = function(e) {
    el.classList.remove("cursor-grabbing");

    if (gestureProcessor.previousTouches() !== undefined) {
      orbitalCamera.setIsVelocityEnabled(true);
    }

    gestureProcessor.setPreviousTouches(undefined);
  };

  var onTouchEnd = function(e) {
    if (gestureProcessor.previousTouches() !== undefined) {
      orbitalCamera.setIsVelocityEnabled(true);
    }

    gestureProcessor.setPreviousTouches(undefined);
  };

  var onMouseOver = function(e) {
    // Safari, as of v11, doesn't support buttons, but it does support the non-standard `which`
    if ((e.buttons !== undefined && e.buttons === 0) ||
        (e.which !== undefined && e.which === 0)) {
      el.classList.remove("cursor-grabbing");
      gestureProcessor.setPreviousTouches(undefined);
    }
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

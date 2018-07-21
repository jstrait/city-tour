"use strict";

var CityTour = CityTour || {};

CityTour.NavigationTouchController = function(sceneView, mapCamera, initialTerrain, messageBroker) {
  var el = sceneView.domElement();
  var camera = sceneView.camera();
  var gestureProcessor = CityTour.GestureProcessor(sceneView, mapCamera);
  var terrain = initialTerrain;

  var onMouseDown = function(e) {
    el.classList.add("cursor-grabbing");
    gestureProcessor.processGesture(CityTour.WorldTouchCollection(el, camera, [{x: e.clientX, y: e.clientY}], terrain));
  };

  var onTouchStart = function(e) {
    gestureProcessor.processGesture(extractWorldTouchCollection(e.touches));
    e.preventDefault();
  };

  var onTouchStartStub = function(e) {
    e.preventDefault();
  };

  var onMouseMove = function(e) {
    if (gestureProcessor.previousTouches() === undefined || gestureProcessor.previousTouches().count() < 1) {
      return;
    }

    gestureProcessor.processGesture(CityTour.WorldTouchCollection(el, camera, [{x: e.clientX, y: e.clientY}], terrain));
  };

  var onTouchMove = function(e) {
    gestureProcessor.processGesture(extractWorldTouchCollection(e.touches));
  };

  var onMouseUp = function(e) {
    el.classList.remove("cursor-grabbing");
    gestureProcessor.processGesture(undefined);
  };

  var onTouchEnd = function(e) {
    gestureProcessor.processGesture(undefined);
  };

  var onMouseOver = function(e) {
    // Safari, as of v11, doesn't support buttons, but it does support the non-standard `which`
    if ((e.buttons !== undefined && e.buttons === 0) ||
        (e.which !== undefined && e.which === 0)) {
      el.classList.remove("cursor-grabbing");
      gestureProcessor.processGesture(undefined);
    }
  };

  var extractWorldTouchCollection = function(touches) {
    var i, touch;
    var touchPoints = [];

    if (touches.length === 0) {
      return undefined;
    }

    for (i = 0; i < touches.length; i++) {
      touch = touches.item(i);
      touchPoints.push({x: touch.clientX, y: touch.clientY});
    }

    return CityTour.WorldTouchCollection(el, camera, touchPoints, terrain);
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

  enableEventHandlers();


  return {
    setTerrain: function(newTerrain) { terrain = newTerrain; },
  };
};

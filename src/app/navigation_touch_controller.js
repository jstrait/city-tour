"use strict";

import { FlythroughGestureProcessor } from "./flythrough_gesture_processor";
import { GestureProcessor } from "./gesture_processor";
import { WorldTouchCollection } from "./world_touch_collection";

var NavigationTouchController = function(sceneView, mapCamera, initialTerrain, messageBroker) {
  var el = sceneView.domElement();
  var camera = sceneView.camera();
  var mapGestureProcessor = GestureProcessor(sceneView, mapCamera);
  var flythroughGestureProcessor = FlythroughGestureProcessor();
  var currentGestureProcessor = mapGestureProcessor;
  var terrain = initialTerrain;

  var onMouseDown = function(e) {
    el.classList.add("cursor-grabbing");
    currentGestureProcessor.processGesture(WorldTouchCollection(el, camera, [{x: e.clientX, y: e.clientY}], terrain), e.shiftKey, e.altKey);
  };

  var onTouchStart = function(e) {
    currentGestureProcessor.processGesture(extractWorldTouchCollection(e.touches), e.shiftKey, e.altKey);
    e.preventDefault();
  };

  var onTouchStartStub = function(e) {
    e.preventDefault();
  };

  var onMouseMove = function(e) {
    if (currentGestureProcessor.previousTouches() === undefined || currentGestureProcessor.previousTouches().count() < 1) {
      return;
    }

    currentGestureProcessor.processGesture(WorldTouchCollection(el, camera, [{x: e.clientX, y: e.clientY}], terrain), e.shiftKey, e.altKey);
  };

  var onTouchMove = function(e) {
    currentGestureProcessor.processGesture(extractWorldTouchCollection(e.touches), e.shiftKey, e.altKey);
  };

  var onMouseUp = function(e) {
    el.classList.remove("cursor-grabbing");
    currentGestureProcessor.processGesture(undefined, e.shiftKey, e.altKey);
  };

  var onTouchEnd = function(e) {
    currentGestureProcessor.processGesture(extractWorldTouchCollection(e.touches), e.shiftKey, e.altKey);
  };

  var onMouseOver = function(e) {
    window.removeEventListener("mouseup", onMouseUp, false);
    window.removeEventListener("mousemove", onMouseMove, false);
  };

  var onMouseOut = function(e) {
    // Safari, as of v11, doesn't support buttons, but it does support the non-standard `which`
    if ((e.buttons !== undefined && e.buttons === 1) ||
        (e.which !== undefined && e.which === 1)) {
      // Allow mouse events to continue to occur while the mouse is outside the main canvas
      // element. This is not enabled while the mouse is over the main canvas element to avoid
      // duplicate events.
      window.addEventListener("mouseup", onMouseUp, false);
      window.addEventListener("mousemove", onMouseMove, false);
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

    return WorldTouchCollection(el, camera, touchPoints, terrain);
  };

  var enableEventHandlers = function() {
    el.addEventListener('mousedown', onMouseDown, false);
    el.addEventListener('touchstart', onTouchStart, false);
    el.addEventListener('mousemove', onMouseMove, false);
    el.addEventListener('touchmove', onTouchMove, false);
    el.addEventListener('mouseup', onMouseUp, false);
    el.addEventListener('touchend', onTouchEnd, false);
    el.addEventListener('mouseover', onMouseOver, false);
    el.addEventListener('mouseout', onMouseOut, false);

    el.removeEventListener('touchstart', onTouchStartStub, false);
  };

  var onFlythroughStarted = function(data) {
    flythroughGestureProcessor.setVehicleView(data.vehicleView);
    currentGestureProcessor = flythroughGestureProcessor;
  };

  var onFlythroughStopped = function(data) {
    currentGestureProcessor = mapGestureProcessor;
  };


  var id1 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);

  enableEventHandlers();


  return {
    setTerrain: function(newTerrain) { terrain = newTerrain; },
  };
};

export { NavigationTouchController };

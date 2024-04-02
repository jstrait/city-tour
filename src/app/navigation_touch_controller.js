"use strict";

import { FlythroughGestureProcessor } from "./flythrough_gesture_processor";
import { GestureProcessor } from "./gesture_processor";
import { WorldTouchCollection } from "./world_touch_collection";

var NavigationTouchController = function(sceneView, mapCamera, terrain, messageBroker) {
  var el = sceneView.domElement();
  var camera = sceneView.camera();
  var mapGestureProcessor = GestureProcessor(sceneView, mapCamera, terrain);
  var flythroughGestureProcessor = FlythroughGestureProcessor();
  var currentGestureProcessor = mapGestureProcessor;

  var onMouseDown = function(e) {
    if (e.button !== 0) {
      return;
    }

    el.classList.add("cursor-grabbing");
    currentGestureProcessor.processGesture(WorldTouchCollection(el, camera, [{x: e.clientX, y: e.clientY}], terrain), e.shiftKey, e.altKey);

    // Adding these event listeners on `window` allows detecting these events
    // even if the mouse is not on `el`, or not even inside the window at all.
    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("mouseup", onMouseUpOrContextMenu, false);
    window.addEventListener("contextmenu", onMouseUpOrContextMenu, false);

    messageBroker.publish("touch.focus", {});
  };

  var onMouseMove = function(e) {
    currentGestureProcessor.processGesture(WorldTouchCollection(el, camera, [{x: e.clientX, y: e.clientY}], terrain), e.shiftKey, e.altKey);
  };

  var onMouseUpOrContextMenu = function(e) {
    // Since gestures should only be triggered by the main mouse button,
    // `mouseup` events for other buttons are ignored. However, `contextmenu`
    // events should be handled regardless of how they are triggered, so the
    // `button` property is not checked for those events.
    if (e.type === "mouseup" && e.button !== 0) {
      return;
    }

    el.classList.remove("cursor-grabbing");
    currentGestureProcessor.processGesture(undefined, e.shiftKey, e.altKey);

    window.removeEventListener("mousemove", onMouseMove, false);
    window.removeEventListener("mouseup", onMouseUpOrContextMenu, false);
    window.removeEventListener("contextmenu", onMouseUpOrContextMenu, false);
  };

  var onTouchStart = function(e) {
    currentGestureProcessor.processGesture(extractWorldTouchCollection(e.touches), e.shiftKey, e.altKey);

    // This is here to prevent the renderer from being frozen and not being updated
    // in response to touch events when a tab loses and then regains focus in iOS.
    // `TimerLoop` responds to this message by restarting the timer if it is stopped.
    //
    // When the browser tab loses focus, the main app timer is paused, and it is
    // restarted again when the tab regains focus. (This is implemented in `TimerLoop`
    // via listeners for "focus" on "blur" events on the `window` object). However, on
    // iOS Safari the "focus" event does not fire immediately when the tab is shown - it
    // requires the user to interact with it first. However, touch events on the main
    // <canvas> element do _not_ seem to cause the "focus" event to fire for some reason,
    // unlike interactions with other elements. I suspect the real issue is that touch
    // events in general do not cause the "focus" event to be fired.
    //
    // The end result is that without the fix below, when coming back to a tab, the canvas
    // will not be re-rendered in response to touch events, and the page will appear to be
    // frozen. However, this is only a rendering problem, and behind the scenes the camera
    // will be updated. When the user then interacts with another page element, the app
    // timer will be reactivated and the main canvas will be re-rendered, with the camera
    // possibly suddenly making a big jump.
    messageBroker.publish("touch.focus", {});

    e.preventDefault();
  };

  var onTouchMove = function(e) {
    currentGestureProcessor.processGesture(extractWorldTouchCollection(e.touches), e.shiftKey, e.altKey);
  };

  var onTouchEndOrCancel = function(e) {
    currentGestureProcessor.processGesture(extractWorldTouchCollection(e.touches), e.shiftKey, e.altKey);
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
    el.addEventListener("mousedown", onMouseDown, false);
    el.addEventListener("touchstart", onTouchStart, false);
    el.addEventListener("touchmove", onTouchMove, false);
    el.addEventListener("touchend", onTouchEndOrCancel, false);
    el.addEventListener("touchcancel", onTouchEndOrCancel, false);
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
    setTerrain: function(newTerrain) {
      terrain = newTerrain;
      mapGestureProcessor.setTerrain(newTerrain);
    },
  };
};

export { NavigationTouchController };

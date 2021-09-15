"use strict";

import * as THREE from "three";

import { CityTourMath } from "./../math";
import { WorldTouch } from "./world_touch";

var NavigationController = function(sceneView, mapCamera, terrain, timerLoop, messageBroker) {
  var DOWN_ARROW = "&#9660;";
  var UP_ARROW = "&#9650;";
  var START_TOUR_MESSAGE = "Take a Tour";
  var STOP_TOUR_MESSAGE = "Stop Tour";

  var ZOOM_DELTA_PERCENTAGE = 0.01;
  var WINDOW_CENTER = new THREE.Vector3(0.0, 0.0, 0.0);

  var containerToggle = document.getElementById("navigation-controls-toggle");
  var container = document.getElementById("navigation-controls-inner-container");
  var azimuthAngleControl = document.getElementById("azimuth-angle");
  var tiltAngleControl = document.getElementById("tilt-angle-percentage");
  var zoomInButton = document.getElementById("zoom-in");
  var zoomOutButton = document.getElementById("zoom-out");
  var flythroughToggle = document.getElementById("flythrough-toggle");

  var isNavigationControlsVisible;

  var isTouchDevice = function() {
    // https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
    return "ontouchstart" in window        // works on most browsers
        || navigator.maxTouchPoints;       // works on IE10/11 and Surface
  };

  var render = function(data) {
    azimuthAngleControl.value = mapCamera.azimuthAngle() * (180 / Math.PI);
    tiltAngleControl.value = (mapCamera.tiltAngle() - mapCamera.maxTiltAngle()) / (mapCamera.minTiltAngle() - mapCamera.maxTiltAngle());

    if (isNavigationControlsVisible === true) {
      containerToggle.innerHTML = DOWN_ARROW;
      container.classList.remove("display-none");
    }
    else {
      containerToggle.innerHTML = UP_ARROW;
      container.classList.add("display-none");
    }
  };

  var setTargetOfAction = function(e) {
    var centerOfScreenWorldTouch = WorldTouch(sceneView.camera(), WINDOW_CENTER, terrain);

    mapCamera.setCenterOfAction(centerOfScreenWorldTouch.worldPosition());
  };

  var setCenterOfTilt = function(e) {
    var centerOfScreenWorldTouch = WorldTouch(sceneView.camera(), WINDOW_CENTER, terrain);

    mapCamera.setCenterOfTilt(centerOfScreenWorldTouch.worldPosition());
  };

  var setAzimuthAngle = function(e) {
    // The slider uses degrees instead of radians to avoid Firefox thinking that float values are invalid,
    // seemingly due to precision issues.
    var newAzimuthAngleInDegrees = parseInt(azimuthAngleControl.value, 10);
    var newAzimuthAngleInRadians = newAzimuthAngleInDegrees * (Math.PI / 180);

    mapCamera.rotateAzimuthAroundCenterOfAction(newAzimuthAngleInRadians - mapCamera.azimuthAngle());
    mapCamera.setIsVelocityEnabled(false);
  };

  var setTiltAngle = function(e) {
    var tiltPercentage = parseFloat(tiltAngleControl.value);
    var newTiltAngle = CityTourMath.lerp(mapCamera.minTiltAngle(), mapCamera.maxTiltAngle(), 1.0 - tiltPercentage);

    mapCamera.tiltCamera(newTiltAngle - mapCamera.tiltAngle());
    mapCamera.setIsVelocityEnabled(false);
  };

  var startZoomIn = function(e) {
    setTargetOfAction(e);
    timerLoop.setZoomAmount(ZOOM_DELTA_PERCENTAGE);
    mapCamera.setIsVelocityEnabled(false);
  };

  var startZoomInTouch = function(e) {
    startZoomIn(e);

    // Prevent text in adjacent elements from being selected
    // due to a long press gesture.
    e.preventDefault();
  };

  var startZoomOut = function(e) {
    setTargetOfAction(e);
    timerLoop.setZoomAmount(-ZOOM_DELTA_PERCENTAGE);
    mapCamera.setIsVelocityEnabled(false);
  };

  var startZoomOutTouch = function(e) {
    startZoomOut(e);

    // Prevent text in adjacent elements from being selected
    // due to a long press gesture.
    e.preventDefault();
  };

  var stopZoom = function(e) {
    timerLoop.setZoomAmount(0.0);
    mapCamera.setIsVelocityEnabled(false);
  };

  var toggleFlythrough = function(e) {
    timerLoop.toggleFlythrough();
  };

  var onFlythroughStarted = function(e) {
    containerToggle.classList.add("display-none");
    container.classList.add("display-none");
    flythroughToggle.innerText = STOP_TOUR_MESSAGE;
  };

  var onFlythroughStopped = function(e) {
    containerToggle.classList.remove("display-none");
    flythroughToggle.innerText = START_TOUR_MESSAGE;
    render({});
  };

  var toggleNavigationControls = function(e) {
    isNavigationControlsVisible = !isNavigationControlsVisible;
    render({});
  };

  containerToggle.addEventListener("click", toggleNavigationControls, false);
  azimuthAngleControl.addEventListener("mousedown", setTargetOfAction, false);
  azimuthAngleControl.addEventListener("touchstart", setTargetOfAction, false);
  azimuthAngleControl.addEventListener("input", setAzimuthAngle, false);
  tiltAngleControl.addEventListener("mousedown", setCenterOfTilt, false);
  tiltAngleControl.addEventListener("touchstart", setCenterOfTilt, false);
  tiltAngleControl.addEventListener("input", setTiltAngle, false);
  zoomInButton.addEventListener("mousedown", startZoomIn, false);
  zoomInButton.addEventListener("mouseup", stopZoom, false);
  zoomInButton.addEventListener("mouseout", stopZoom, false);
  zoomInButton.addEventListener("touchstart", startZoomInTouch, false);
  zoomInButton.addEventListener("touchend", stopZoom, false);
  zoomOutButton.addEventListener("mousedown", startZoomOut, false);
  zoomOutButton.addEventListener("mouseup", stopZoom, false);
  zoomOutButton.addEventListener("mouseout", stopZoom, false);
  zoomOutButton.addEventListener("touchstart", startZoomOutTouch, false);
  zoomOutButton.addEventListener("touchend", stopZoom, false);
  flythroughToggle.addEventListener("click", toggleFlythrough, false);

  isNavigationControlsVisible = !isTouchDevice();
  render({});

  var id1 = messageBroker.addSubscriber("camera.updated", render);
  var id2 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id3 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);


  return {
    setTerrain: function(newTerrain) { terrain = newTerrain; },
  };
};

export { NavigationController };

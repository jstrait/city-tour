"use strict";

import { CityTourMath } from "./../math";
import { WorldTouch } from "./world_touch";

var NavigationController = function(sceneView, mapCamera, terrain, timerLoop, messageBroker) {
  var DOWN_ARROW = "&#9660;";
  var UP_ARROW = "&#9650;";
  var START_TOUR_MESSAGE = "Take a Tour";
  var STOP_TOUR_MESSAGE = "Stop Tour";

  var ZOOM_DELTA_PERCENTAGE = 0.01;
  var SCREEN_CENTER = new THREE.Vector3(0.0, 0.0, 0.0);

  var containerToggle = document.getElementById("navigation-controls-toggle");
  var container = document.getElementById("navigation-controls-inner-container");
  var azimuthAngleControl = document.getElementById("azimuth-angle");
  var tiltAngleControl = document.getElementById("tilt-angle-percentage");
  var zoomInButton = document.getElementById("zoom-in");
  var zoomOutButton = document.getElementById("zoom-out");
  var flythroughToggle = document.getElementById("flythrough-toggle");

  var navigationControlsEnabled;

  var isTouchDevice = function() {
    // https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
    return 'ontouchstart' in window        // works on most browsers
        || navigator.maxTouchPoints;       // works on IE10/11 and Surface
  };

  var render = function(data) {
    azimuthAngleControl.value = mapCamera.azimuthAngle() * (180 / Math.PI);
    tiltAngleControl.value = (mapCamera.tiltAngle() - mapCamera.maxTiltAngle()) / (mapCamera.minTiltAngle() - mapCamera.maxTiltAngle());

    if (navigationControlsEnabled) {
      containerToggle.innerHTML = DOWN_ARROW;
      container.classList.remove("display-none");
    }
    else {
      containerToggle.innerHTML = UP_ARROW;
      container.classList.add("display-none");
    }
  };

  var setTargetOfAction = function(e) {
    var centerOfScreenWorldTouch = WorldTouch(sceneView.camera(), SCREEN_CENTER, terrain);

    mapCamera.setCenterOfAction(new THREE.Vector3(centerOfScreenWorldTouch.worldX(), centerOfScreenWorldTouch.worldY(), centerOfScreenWorldTouch.worldZ()));
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

  var startZoomOut = function(e) {
    setTargetOfAction(e);
    timerLoop.setZoomAmount(-ZOOM_DELTA_PERCENTAGE);
    mapCamera.setIsVelocityEnabled(false);
  };

  var stopZoom = function(e) {
    timerLoop.setZoomAmount(0.0);
    mapCamera.setIsVelocityEnabled(false);
  };

  var toggleFlythrough = function(e) {
    flythroughToggle.innerText = (flythroughToggle.innerText === START_TOUR_MESSAGE) ? STOP_TOUR_MESSAGE : START_TOUR_MESSAGE;

    timerLoop.toggleFlythrough();
  };

  var onFlythroughStarted = function(e) {
    containerToggle.classList.add("display-none");
    container.classList.add("display-none");
  };

  var onFlythroughStopped = function(e) {
    containerToggle.classList.remove("display-none");
    render({});
  };

  var toggleNavigationControls = function(e) {
    navigationControlsEnabled = !navigationControlsEnabled;
    render({});
  };

  containerToggle.addEventListener('click', toggleNavigationControls, false);
  azimuthAngleControl.addEventListener('mousedown', setTargetOfAction, false);
  azimuthAngleControl.addEventListener('touchstart', setTargetOfAction, false);
  azimuthAngleControl.addEventListener('input', setAzimuthAngle, false);
  tiltAngleControl.addEventListener('mousedown', setTargetOfAction, false);
  tiltAngleControl.addEventListener('touchstart', setTargetOfAction, false);
  tiltAngleControl.addEventListener('input', setTiltAngle, false);
  zoomInButton.addEventListener('mousedown', startZoomIn, false);
  zoomInButton.addEventListener('mouseup', stopZoom, false);
  zoomInButton.addEventListener('mouseout', stopZoom, false);
  zoomInButton.addEventListener('touchstart', startZoomIn, false);
  zoomInButton.addEventListener('touchend', stopZoom, false);
  zoomOutButton.addEventListener('mousedown', startZoomOut, false);
  zoomOutButton.addEventListener('mouseup', stopZoom, false);
  zoomOutButton.addEventListener('mouseout', stopZoom, false);
  zoomOutButton.addEventListener('touchstart', startZoomOut, false);
  zoomOutButton.addEventListener('touchend', stopZoom, false);
  flythroughToggle.addEventListener('click', toggleFlythrough, false);

  navigationControlsEnabled = !isTouchDevice();
  render({});

  var id1 = messageBroker.addSubscriber("camera.updated", render);
  var id2 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id3 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);


  return {
    setTerrain: function(newTerrain) { terrain = newTerrain; },
  };
};

export { NavigationController };

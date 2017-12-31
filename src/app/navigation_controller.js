"use strict";

var CityTour = CityTour || {};

CityTour.NavigationController = function(orbitalCamera, timerLoop, messageBroker) {
  var DOWN_ARROW = "&#9660;";
  var UP_ARROW = "&#9650;";
  var START_TOUR_MESSAGE = "Take a Tour";
  var STOP_TOUR_MESSAGE = "Stop Tour";

  var containerToggle = document.getElementById("navigation-controls-toggle");
  var container = document.getElementById("navigation-controls-inner-container");
  var rotationYControl = document.getElementById("rotationY");
  var rotationXControl = document.getElementById("rotationX");
  var zoomControl = document.getElementById("zoom");
  var flythroughToggle = document.getElementById("flythrough-toggle");

  var navigationControlsEnabled;

  var isTouchDevice = function() {
    // https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
    return 'ontouchstart' in window        // works on most browsers
        || navigator.maxTouchPoints;       // works on IE10/11 and Surface
  };

  var render = function(data) {
    rotationYControl.value = orbitalCamera.rotationAngle() * (180 / Math.PI);
    rotationXControl.value = orbitalCamera.tiltPercentage();
    zoomControl.value = orbitalCamera.zoomPercentage();

    if (navigationControlsEnabled) {
      containerToggle.innerHTML = DOWN_ARROW;
      container.classList.remove("display-none");
    }
    else {
      containerToggle.innerHTML = UP_ARROW;
      container.classList.add("display-none");
    }
  };

  var setRotationAngle = function(e) {
    // The slider uses degrees instead of radians to avoid Firefox thinking that float values are invalid,
    // seemingly due to precision issues.
    var degrees = parseInt(rotationYControl.value, 10);
    var radians = degrees * (Math.PI / 180);

    orbitalCamera.setRotationAngle(radians);
    orbitalCamera.setIsVelocityEnabled(false);
  };

  var setTiltAngle = function(e) {
    orbitalCamera.setTiltPercentage(parseFloat(rotationXControl.value));
    orbitalCamera.setIsVelocityEnabled(false);
  };

  var setZoomPercentage = function(e) {
    orbitalCamera.setZoomPercentage(parseFloat(zoomControl.value));
    orbitalCamera.setIsVelocityEnabled(false);
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
  rotationYControl.addEventListener('input', setRotationAngle, false);
  rotationXControl.addEventListener('input', setTiltAngle, false);
  zoomControl.addEventListener('input', setZoomPercentage, false);
  flythroughToggle.addEventListener('click', toggleFlythrough, false);

  navigationControlsEnabled = !isTouchDevice();
  render({});

  var id1 = messageBroker.addSubscriber("camera.updated", render);
  var id2 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id3 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);


  return {};
};

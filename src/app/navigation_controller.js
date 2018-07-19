"use strict";

var CityTour = CityTour || {};

CityTour.NavigationController = function(orbitalCamera, timerLoop, messageBroker) {
  var DOWN_ARROW = "&#9660;";
  var UP_ARROW = "&#9650;";
  var START_TOUR_MESSAGE = "Take a Tour";
  var STOP_TOUR_MESSAGE = "Stop Tour";

  var ZOOM_DELTA = (orbitalCamera.maxZoomDistance() - orbitalCamera.minZoomDistance()) * 0.05;

  var containerToggle = document.getElementById("navigation-controls-toggle");
  var container = document.getElementById("navigation-controls-inner-container");
  var azimuthAngleControl = document.getElementById("azimuth-angle");
  var tiltAngleControl = document.getElementById("tilt-angle-percentage");
  var zoomControl = document.getElementById("zoom");
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
    azimuthAngleControl.value = orbitalCamera.azimuthAngle() * (180 / Math.PI);
    tiltAngleControl.value = (orbitalCamera.tiltAngle() - orbitalCamera.maxTiltAngle()) / (orbitalCamera.minTiltAngle() - orbitalCamera.maxTiltAngle());
    zoomControl.value = 1.0 - ((orbitalCamera.zoomDistance() - orbitalCamera.minZoomDistance()) / (orbitalCamera.maxZoomDistance() - orbitalCamera.minZoomDistance()));

    zoomInButton.disabled = orbitalCamera.zoomDistance() <= orbitalCamera.minZoomDistance();
    zoomOutButton.disabled = orbitalCamera.zoomDistance() >= orbitalCamera.maxZoomDistance();

    if (navigationControlsEnabled) {
      containerToggle.innerHTML = DOWN_ARROW;
      container.classList.remove("display-none");
    }
    else {
      containerToggle.innerHTML = UP_ARROW;
      container.classList.add("display-none");
    }
  };

  var setAzimuthAngle = function(e) {
    // The slider uses degrees instead of radians to avoid Firefox thinking that float values are invalid,
    // seemingly due to precision issues.
    var degrees = parseInt(azimuthAngleControl.value, 10);
    var radians = degrees * (Math.PI / 180);

    orbitalCamera.setAzimuthAngle(radians);
    orbitalCamera.setIsVelocityEnabled(false);
  };

  var setTiltAngle = function(e) {
    var tiltPercentage = parseFloat(tiltAngleControl.value);
    var newTiltAngle = CityTour.Math.lerp(orbitalCamera.minTiltAngle(), orbitalCamera.maxTiltAngle(), 1.0 - tiltPercentage);

    orbitalCamera.setTiltAngle(newTiltAngle);
    orbitalCamera.setIsVelocityEnabled(false);
  };

  var setZoomDistance = function(e) {
    var zoomPercentage = parseFloat(zoomControl.value);
    orbitalCamera.setZoomDistance(CityTour.Math.lerp(orbitalCamera.minZoomDistance(), orbitalCamera.maxZoomDistance(), 1.0 - zoomPercentage));
    orbitalCamera.setIsVelocityEnabled(false);
  };

  var zoomIn = function(e) {
    orbitalCamera.setZoomDistance(orbitalCamera.zoomDistance() - ZOOM_DELTA);
    orbitalCamera.setIsVelocityEnabled(false);
  };

  var zoomOut = function(e) {
    orbitalCamera.setZoomDistance(orbitalCamera.zoomDistance() + ZOOM_DELTA);
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
  azimuthAngleControl.addEventListener('input', setAzimuthAngle, false);
  tiltAngleControl.addEventListener('input', setTiltAngle, false);
  zoomControl.addEventListener('input', setZoomDistance, false);
  zoomInButton.addEventListener('click', zoomIn, false);
  zoomOutButton.addEventListener('click', zoomOut, false);
  flythroughToggle.addEventListener('click', toggleFlythrough, false);

  navigationControlsEnabled = !isTouchDevice();
  render({});

  var id1 = messageBroker.addSubscriber("camera.updated", render);
  var id2 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id3 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);


  return {};
};

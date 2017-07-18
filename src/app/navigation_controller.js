"use strict";

var CityTour = CityTour || {};

CityTour.NavigationController = function(interactiveCamera, sceneView, messageBroker) {
  var container = document.getElementById("navigation-controls-container");
  var centerXControl = document.getElementById("centerX");
  var centerZControl = document.getElementById("centerZ");
  var rotationYControl = document.getElementById("rotationY");
  var rotationXControl = document.getElementById("rotationX");
  var zoomControl = document.getElementById("zoom");
  var flythroughToggle = document.getElementById("flythrough-toggle");

  var render = function(data) {
    centerXControl.value = interactiveCamera.centerX();
    centerZControl.value = interactiveCamera.centerZ();
    rotationYControl.value = interactiveCamera.rotationAngle();
    rotationXControl.value = interactiveCamera.tiltPercentage();
    zoomControl.value = interactiveCamera.zoomPercentage();
  };

  var setCenterCoordinates = function(e) {
    interactiveCamera.setCenterCoordinates(parseFloat(centerXControl.value), parseFloat(centerZControl.value));
  };
  var setRotationAngle = function(e) {
    interactiveCamera.setRotationAngle(parseFloat(rotationYControl.value));
  };
  var setTiltAngle = function(e) {
    interactiveCamera.setTiltPercentage(parseFloat(rotationXControl.value));
  };
  var setZoomPercentage = function(e) {
    interactiveCamera.setZoomPercentage(parseFloat(zoomControl.value));
  };

  var toggleFlythrough = function(e) {
    flythroughToggle.innerText = (flythroughToggle.innerText === "Take a Tour") ? "Stop Tour" : "Take a Tour";

    sceneView.toggleFlythrough();
  };

  var onFlythroughStarted = function(e) {
    container.classList.add("display-none");
  };

  var onFlythroughStopped = function(e) {
    container.classList.remove("display-none");
  };

  centerXControl.addEventListener('input', setCenterCoordinates, false);
  centerZControl.addEventListener('input', setCenterCoordinates, false);
  rotationYControl.addEventListener('input', setRotationAngle, false);
  rotationXControl.addEventListener('input', setTiltAngle, false);
  zoomControl.addEventListener('input', setZoomPercentage, false);
  flythroughToggle.addEventListener('click', toggleFlythrough, false);

  render({});

  var id1 = messageBroker.addSubscriber("camera.updated", render);
  var id2 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id3 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);
};

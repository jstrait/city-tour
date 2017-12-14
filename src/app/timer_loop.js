"use strict";

var CityTour = CityTour || {};


CityTour.TimerLoop = function(initialWorldData, sceneView, interactiveCamera, messageBroker) {
  var INTERACTIVE = 1;
  var FLYTHROUGH = 2;

  var worldData;
  var timer;
  var animationManager;
  var poleCamera = sceneView.poleCamera();
  var mode = INTERACTIVE;

  var syncInteractiveCameraToPoleCamera = function(data) {
    interactiveCamera.syncCamera(poleCamera);
  };

  var startFlythrough = function() {
    var initialCoordinates = {
      positionX: poleCamera.positionX(),
      positionY: poleCamera.positionY(),
      positionZ: poleCamera.positionZ(),
      rotationX: poleCamera.rotationX(),
      rotationY: poleCamera.rotationY(),
    };

    var targetSceneX = CityTour.Coordinates.mapXToSceneX(worldData.centerX);
    var targetSceneZ = CityTour.Coordinates.mapZToSceneZ(worldData.centerZ);

    animationManager.init(initialCoordinates, targetSceneX, targetSceneZ);
    mode = FLYTHROUGH;
    messageBroker.publish("flythrough.started", {});
  };

  var requestStopFlythrough = function() {
    interactiveCamera.syncFromPoleCamera(poleCamera);
    interactiveCamera.syncCamera(poleCamera);

    var target = {
      positionX: poleCamera.positionX(),
      positionY: poleCamera.positionY(),
      positionZ: poleCamera.positionZ(),
      rotationX: poleCamera.rotationX(),
      rotationY: poleCamera.rotationY(),
    };

    animationManager.requestStop(target);
  };

  var stopFlythrough = function() {
    interactiveCamera.syncFromPoleCamera(poleCamera);
    syncInteractiveCameraToPoleCamera();
    mode = INTERACTIVE;
  };

  var toggleFlythrough = function() {
    if (mode === INTERACTIVE) {
      startFlythrough();
    }
    else {
      requestStopFlythrough();
    }
  };

  var reset = function(newWorldData) {
    worldData = newWorldData;
    animationManager = new CityTour.AnimationManager(worldData.terrain, worldData.roadNetwork, poleCamera, messageBroker);
    interactiveCamera.setTerrain(worldData.terrain);
    syncInteractiveCameraToPoleCamera();
  };

  var id1 = messageBroker.addSubscriber("camera.updated", syncInteractiveCameraToPoleCamera);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", stopFlythrough);

  reset(initialWorldData);

  timer = new CityTour.Timer();
  timer.onTick = function(frameCount) {
    animationManager.tick(frameCount);
    sceneView.render();
  };
  timer.start();


  return {
    reset: reset,
    toggleFlythrough: toggleFlythrough,
  };
};

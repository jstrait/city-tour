"use strict";

var CityTour = CityTour || {};


CityTour.TimerLoop = function(initialWorldData, sceneView, interactiveCamera, messageBroker) {
  var INTERACTIVE = 1;
  var FLYTHROUGH = 2;
  var FLYTHROUGH_STOP = 3;

  var worldData;
  var timer;
  var vehicleController;
  var directTargetAnimation;
  var poleCamera = sceneView.poleCamera();
  var mode = INTERACTIVE;

  var syncToPoleCamera = function() {
    if (mode === INTERACTIVE) {
      interactiveCamera.syncCamera(poleCamera);
    }
    else if (mode === FLYTHROUGH) {
      poleCamera.setPositionX(vehicleController.positionX());
      poleCamera.setPositionY(vehicleController.positionY());
      poleCamera.setPositionZ(vehicleController.positionZ());
      poleCamera.setRotationX(vehicleController.rotationX());
      poleCamera.setRotationY(vehicleController.rotationY());
    }
    else if (mode === FLYTHROUGH_STOP) {
      poleCamera.setPositionX(directTargetAnimation.positionX());
      poleCamera.setPositionY(directTargetAnimation.positionY());
      poleCamera.setPositionZ(directTargetAnimation.positionZ());
      poleCamera.setRotationX(directTargetAnimation.rotationX());
      poleCamera.setRotationY(directTargetAnimation.rotationY());
    }
  };

  var syncInteractiveCameraToPoleCamera = function(data) {
    syncToPoleCamera();
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

    vehicleController = new CityTour.VehicleController(worldData.terrain, worldData.roadNetwork, initialCoordinates, targetSceneX, targetSceneZ);
    mode = FLYTHROUGH;
    messageBroker.publish("flythrough.started", {});
  };

  var requestStopFlythrough = function() {
    interactiveCamera.syncFromPoleCamera(poleCamera);
    interactiveCamera.syncCamera(poleCamera);

    var initial = {
      positionX: vehicleController.positionX(),
      positionY: vehicleController.positionY(),
      positionZ: vehicleController.positionZ(),
      rotationX: vehicleController.rotationX(),
      rotationY: vehicleController.rotationY(),
    };

    var target = {
      positionX: poleCamera.positionX(),
      positionY: poleCamera.positionY(),
      positionZ: poleCamera.positionZ(),
      rotationX: poleCamera.rotationX(),
      rotationY: poleCamera.rotationY(),
    };

    directTargetAnimation = new CityTour.DirectTargetAnimation(initial, target);

    mode = FLYTHROUGH_STOP;
  };

  var stopFlythrough = function() {
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
    interactiveCamera.setTerrain(worldData.terrain);
    syncInteractiveCameraToPoleCamera();
  };

  var id1 = messageBroker.addSubscriber("camera.updated", syncInteractiveCameraToPoleCamera);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", stopFlythrough);

  reset(initialWorldData);

  timer = new CityTour.Timer();
  timer.onTick = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      if (vehicleController) {
        vehicleController.tick();
      }

      if (directTargetAnimation) {
        directTargetAnimation.tick();
        if (directTargetAnimation.isFinished()) {
          vehicleController = undefined;
          directTargetAnimation = undefined;
          messageBroker.publish("flythrough.stopped", {});
        }
      }
    }

    syncToPoleCamera();
    sceneView.render();
  };
  timer.onTick(1);
  timer.start();


  return {
    reset: reset,
    toggleFlythrough: toggleFlythrough,
  };
};

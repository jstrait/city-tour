"use strict";

var CityTour = CityTour || {};


CityTour.TimerLoop = function(initialWorldData, sceneView, orbitalCamera, messageBroker) {
  var INTERACTIVE = 1;
  var FLYTHROUGH = 2;
  var FLYTHROUGH_STOP = 3;

  var END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT = 10;

  var worldData;
  var timer;
  var vehicleController;
  var vehicleToInteractiveAnimation;
  var camera = sceneView.camera();
  var mode = INTERACTIVE;

  var syncToCamera = function() {
    if (mode === INTERACTIVE) {
      orbitalCamera.syncToCamera(camera, worldData.terrain);
    }
    else if (mode === FLYTHROUGH) {
      camera.position.x = vehicleController.positionX();
      camera.position.y = vehicleController.positionY();
      camera.position.z = vehicleController.positionZ();
      camera.rotation.x = vehicleController.rotationX();
      camera.rotation.y = vehicleController.rotationY();
    }
    else if (mode === FLYTHROUGH_STOP) {
      camera.position.x = vehicleToInteractiveAnimation.positionX();
      camera.position.y = vehicleToInteractiveAnimation.positionY();
      camera.position.z = vehicleToInteractiveAnimation.positionZ();
      camera.rotation.x = vehicleToInteractiveAnimation.rotationX();
      camera.rotation.y = vehicleToInteractiveAnimation.rotationY();
    }
  };

  var startFlythrough = function() {
    var initialCoordinates = {
      positionX: camera.position.x,
      positionY: camera.position.y,
      positionZ: camera.position.z,
      rotationX: camera.rotation.x,
      rotationY: camera.rotation.y,
    };

    var targetSceneX = CityTour.Coordinates.mapXToSceneX(worldData.centerX);
    var targetSceneZ = CityTour.Coordinates.mapZToSceneZ(worldData.centerZ);

    orbitalCamera.setIsVelocityEnabled(false);

    vehicleController = new CityTour.VehicleController(worldData.terrain, worldData.roadNetwork, initialCoordinates, targetSceneX, targetSceneZ);
    mode = FLYTHROUGH;
    messageBroker.publish("flythrough.started", {});
  };

  var requestStopFlythrough = function() {
    orbitalCamera.syncFromCamera(camera);
    orbitalCamera.syncToCamera(camera, worldData.terrain);

    vehicleToInteractiveAnimation = new CityTour.Animation(
      new CityTour.MotionGenerator(vehicleController.positionX(), camera.position.x, new CityTour.SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, Math.PI / 2)),
      new CityTour.MotionGenerator(vehicleController.positionY(), camera.position.y, new CityTour.SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, Math.PI / 2)),
      new CityTour.MotionGenerator(vehicleController.positionZ(), camera.position.z, new CityTour.SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, Math.PI / 2)),
      new CityTour.MotionGenerator(vehicleController.rotationX(), camera.rotation.x, new CityTour.SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, Math.PI / 2)),
      new CityTour.MotionGenerator(vehicleController.rotationY(), camera.rotation.y, new CityTour.SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, Math.PI / 2))
    );

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
    syncToCamera();
  };

  var id1 = messageBroker.addSubscriber("flythrough.stopped", stopFlythrough);

  reset(initialWorldData);

  timer = new CityTour.Timer();
  timer.onTick = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      if (vehicleController) {
        vehicleController.tick();
      }

      if (vehicleToInteractiveAnimation) {
        vehicleToInteractiveAnimation.tick();
        if (vehicleToInteractiveAnimation.finished()) {
          vehicleController = undefined;
          vehicleToInteractiveAnimation = undefined;
          messageBroker.publish("flythrough.stopped", {});
        }
      }
    }

    if (orbitalCamera.isVelocityEnabled()) {
      orbitalCamera.tickVelocity(frameCount);
    }

    syncToCamera();
    sceneView.render();
  };
  timer.onTick(1);
  timer.start();

  window.addEventListener("blur", function(e) {
    timer.pause();
  });

  window.addEventListener("focus", function(e) {
    if (timer.isPaused()) {
      timer.start();
    }
  });


  return {
    reset: reset,
    toggleFlythrough: toggleFlythrough,
  };
};

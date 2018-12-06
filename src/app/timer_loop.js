"use strict";

var CityTour = CityTour || {};


CityTour.TimerLoop = function(initialWorldData, sceneView, mapCamera, messageBroker) {
  var INTERACTIVE = 1;
  var FLYTHROUGH = 2;
  var FLYTHROUGH_STOP = 3;

  var END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT = 10;

  var worldData;
  var timer;
  var vehicleController;
  var vehicleView;
  var vehicleToInteractiveAnimation;
  var camera = sceneView.camera();
  var mode = INTERACTIVE;

  var syncToCamera = function() {
    if (mode === FLYTHROUGH) {
      camera.position.x = vehicleView.positionX();
      camera.position.y = vehicleView.positionY();
      camera.position.z = vehicleView.positionZ();
      camera.rotation.x = vehicleView.rotationX();
      camera.rotation.y = vehicleView.rotationY();
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

    mapCamera.setIsVelocityEnabled(false);

    vehicleController = new CityTour.VehicleController(worldData.terrain, worldData.roadNetwork, initialCoordinates, worldData.centerX, worldData.centerZ);
    vehicleView = new CityTour.VehicleView(vehicleController);
    mode = FLYTHROUGH;
    messageBroker.publish("flythrough.started", { vehicleView: vehicleView });
  };

  var requestStopFlythrough = function() {
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
        vehicleView.tick();
      }

      if (vehicleToInteractiveAnimation) {
        vehicleToInteractiveAnimation.tick();
        if (vehicleToInteractiveAnimation.finished()) {
          vehicleController = undefined;
          vehicleView = undefined;
          vehicleToInteractiveAnimation = undefined;
          messageBroker.publish("flythrough.stopped", {});
        }
      }
    }

    if (mapCamera.isVelocityEnabled()) {
      mapCamera.tickVelocity(frameCount);
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

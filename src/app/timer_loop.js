"use strict";

import { Timer } from "./../timer";
import { Animation } from "./../flythrough/animation";
import { SineEasing } from "./../flythrough/easing";
import { MotionGenerator } from "./../flythrough/motion_generator";
import { VehicleController } from "./../flythrough/vehicle_controller";
import { VehicleView } from "./../flythrough/vehicle_view";

const HALF_PI = Math.PI * 0.5;

var TimerLoop = function(initialWorldData, sceneView, mapCamera, messageBroker) {
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
  var zoomAmount = 0.0;

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

    zoomAmount = 0.0;
    mapCamera.setIsVelocityEnabled(false);

    vehicleController = new VehicleController(worldData.terrain, worldData.roadNetwork, initialCoordinates, worldData.centerX, worldData.centerZ);
    vehicleView = new VehicleView(vehicleController);
    mode = FLYTHROUGH;
    messageBroker.publish("flythrough.started", { vehicleView: vehicleView });
  };

  var requestStopFlythrough = function() {
    vehicleToInteractiveAnimation = new Animation(
      new MotionGenerator(vehicleController.positionX(), camera.position.x, new SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, HALF_PI)),
      new MotionGenerator(vehicleController.positionY(), camera.position.y, new SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, HALF_PI)),
      new MotionGenerator(vehicleController.positionZ(), camera.position.z, new SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, HALF_PI)),
      new MotionGenerator(vehicleController.rotationX(), camera.rotation.x, new SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, HALF_PI)),
      new MotionGenerator(vehicleController.rotationY(), camera.rotation.y, new SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, HALF_PI))
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

  var restartTimer = function() {
    if (timer.isPaused()) {
      timer.start();
    }
  };

  var id1 = messageBroker.addSubscriber("flythrough.stopped", stopFlythrough);
  var id2 = messageBroker.addSubscriber("touch.focus", function(data) { restartTimer(); });

  reset(initialWorldData);

  timer = new Timer();
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
    if (mode === INTERACTIVE && zoomAmount !== 0.0) {
      mapCamera.zoomTowardCenterOfAction(zoomAmount);
    }

    syncToCamera();
    sceneView.render();
  };
  timer.onTick(1);
  timer.start();

  window.addEventListener("blur", function(e) {
    timer.pause();
  }, false);

  window.addEventListener("focus", function(e) { restartTimer(); }, false);


  return {
    reset: reset,
    setZoomAmount: function(newZoomAmount) { zoomAmount = newZoomAmount; },
    toggleFlythrough: toggleFlythrough,
  };
};

export { TimerLoop };

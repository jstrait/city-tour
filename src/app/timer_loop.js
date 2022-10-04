"use strict";

import * as THREE from "three";

import { Timer } from "./../timer";
import { WorldTouch } from "./world_touch";
import { Animation } from "./../flythrough/animation";
import { SineEasing } from "./../flythrough/easing";
import { MotionGenerator } from "./../flythrough/motion_generator";
import { StaticMotionGenerator } from "./../flythrough/motion_generator";
import { VehicleController } from "./../flythrough/vehicle_controller";
import { VehicleView } from "./../flythrough/vehicle_view";

const HALF_PI = Math.PI * 0.5;

var TimerLoop = function(worldData, sceneView, mapCamera, messageBroker) {
  var MANUAL = 1;
  var FLYTHROUGH = 2;
  var FLYTHROUGH_STOP = 3;

  var END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT = 10;

  var timer;
  var vehicleController;
  var vehicleView;
  var flythroughToManualModeAnimation;
  var camera = sceneView.camera();
  var mode = MANUAL;
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
      camera.position.x = flythroughToManualModeAnimation.positionX();
      camera.position.y = flythroughToManualModeAnimation.positionY();
      camera.position.z = flythroughToManualModeAnimation.positionZ();
      camera.rotation.x = flythroughToManualModeAnimation.rotationX();
      camera.rotation.y = flythroughToManualModeAnimation.rotationY();
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

    vehicleController = new VehicleController(worldData.terrain, worldData.roadNetwork, worldData.neighborhoods, initialCoordinates);
    vehicleView = new VehicleView(vehicleController);
    mode = FLYTHROUGH;
    messageBroker.publish("flythrough.started", { vehicleView: vehicleView });
  };

  var requestStopFlythrough = function() {
    const centerOfTiltDistance = 3;
    var rotationY = camera.rotation.y + HALF_PI;
    var targetPosition;

    if (camera.rotation.x > mapCamera.maxTiltAngle()) {
      targetPosition = new THREE.Vector3(0.0, 0.0, 0.0).setFromSphericalCoords(centerOfTiltDistance, mapCamera.maxTiltAngle() + HALF_PI, camera.rotation.y);
      targetPosition.x += vehicleController.positionX() + (centerOfTiltDistance * Math.cos(rotationY));
      targetPosition.y += vehicleController.positionY();
      targetPosition.z += vehicleController.positionZ() + (centerOfTiltDistance * -Math.sin(rotationY));

      flythroughToManualModeAnimation = new Animation(
        new MotionGenerator(vehicleController.positionX(), targetPosition.x, new SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, HALF_PI)),
        new MotionGenerator(vehicleController.positionY(), targetPosition.y, new SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, HALF_PI)),
        new MotionGenerator(vehicleController.positionZ(), targetPosition.z, new SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, HALF_PI)),
        new MotionGenerator(camera.rotation.x, mapCamera.maxTiltAngle(), new SineEasing(END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT, 0, HALF_PI)),
        new StaticMotionGenerator(camera.rotation.y),
      );
    }
    else {
      flythroughToManualModeAnimation = new Animation(
        new StaticMotionGenerator(camera.position.x),
        new StaticMotionGenerator(camera.position.y),
        new StaticMotionGenerator(camera.position.z),
        new StaticMotionGenerator(camera.rotation.x),
        new StaticMotionGenerator(camera.rotation.y),
      );
    }

    vehicleController = undefined;
    vehicleView = undefined;
    mode = FLYTHROUGH_STOP;
  };

  var stopFlythrough = function() {
    flythroughToManualModeAnimation = undefined;
    mode = MANUAL;

    messageBroker.publish("flythrough.stopped", {});
  };

  var toggleFlythrough = function() {
    if (mode === MANUAL) {
      startFlythrough();
    }
    else if (mode === FLYTHROUGH) {
      requestStopFlythrough();
    }
  };

  var reset = function(newWorldData) {
    worldData = newWorldData;
  };

  var restartTimer = function() {
    if (timer.isPaused()) {
      timer.start();
    }
  };

  var id1 = messageBroker.addSubscriber("touch.focus", function(data) { restartTimer(); });

  timer = new Timer();
  timer.onTick = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      if (mode === MANUAL) {
        if (zoomAmount !== 0.0) {
          mapCamera.zoomTowardCenterOfAction(zoomAmount);
        }
      }
      else if (mode === FLYTHROUGH) {
        vehicleController.tick();
        vehicleView.tick();
      }
      else if (mode === FLYTHROUGH_STOP) {
        flythroughToManualModeAnimation.tick();
        if (flythroughToManualModeAnimation.finished()) {
          stopFlythrough();
        }
      }
    }

    if (mapCamera.isVelocityEnabled()) {
      mapCamera.tickVelocity(frameCount);
    }

    syncToCamera();
    sceneView.render();
  };
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

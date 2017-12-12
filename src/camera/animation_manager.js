"use strict";

var CityTour = CityTour || {};

CityTour.AnimationManager = function(terrain, roadNetwork, poleCamera, messageBroker) {
  var DEBUG_UP_TO_BIRDS_EYE = 1;
  var DEBUG_DOWN_TO_VEHICLE = 2;

  var debugDirection;
  var scheduleDebugChange = false;

  var vehicleController, debugAnimationController, directTargetAnimation;
  var currentController;

  var syncCamera = function() {
    poleCamera.setPositionX(currentController.positionX());
    poleCamera.setPositionY(currentController.positionY());
    poleCamera.setPositionZ(currentController.positionZ());
    poleCamera.setRotationX(currentController.rotationX());
    poleCamera.setRotationY(currentController.rotationY());
  };

  var init = function(initialCoordinates, targetSceneX, targetSceneZ) {
    vehicleController = new CityTour.VehicleController(terrain, roadNetwork, initialCoordinates, targetSceneX, targetSceneZ);
    currentController = vehicleController;

    syncCamera();
  };

  var requestStop = function(target) {
    var initial = {
      positionX: vehicleController.positionX(),
      positionY: vehicleController.positionY(),
      positionZ: vehicleController.positionZ(),
      rotationX: vehicleController.rotationX(),
      rotationY: vehicleController.rotationY(),
    };

    directTargetAnimation = new CityTour.DirectTargetAnimation(initial, target);

    currentController = directTargetAnimation;
  };

  var tick = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      vehicleController.tick();

      if (directTargetAnimation) {
        directTargetAnimation.tick();
        if (directTargetAnimation.isFinished()) {
          directTargetAnimation = undefined;
          messageBroker.publish("flythrough.stopped", {});
          return;
        }
      }

      if (debugAnimationController) {
        if (debugDirection === DEBUG_DOWN_TO_VEHICLE) {
          debugAnimationController.setTargetXPosition(vehicleController.positionX());
          debugAnimationController.setTargetYPosition(vehicleController.positionY());
          debugAnimationController.setTargetZPosition(vehicleController.positionZ());
          debugAnimationController.setTargetXRotation(vehicleController.rotationX());
          debugAnimationController.setTargetYRotation(vehicleController.rotationY());
        }

        debugAnimationController.tick();
      }
    }

    if (scheduleDebugChange) {
      scheduleDebugChange = false;

      if (debugDirection === undefined) {
        debugDirection = DEBUG_UP_TO_BIRDS_EYE;
        debugAnimationController =
          new CityTour.DebugAnimation({positionX: poleCamera.positionX(),
                                       positionY: poleCamera.positionY(),
                                       positionZ: poleCamera.positionZ(),
                                       rotationX: poleCamera.rotationX(),
                                       rotationY: poleCamera.rotationY()},
                                      {positionX: 0.0, positionY: 900, positionZ: 0.0, rotationX: -(Math.PI / 2), rotationY: 0.0},
                                      true);
      }
      else {
        debugDirection = DEBUG_DOWN_TO_VEHICLE;
        debugAnimationController =
          new CityTour.DebugAnimation({positionX: poleCamera.positionX(),
                                       positionY: poleCamera.positionY(),
                                       positionZ: poleCamera.positionZ(),
                                       rotationX: poleCamera.rotationX(),
                                       rotationY: poleCamera.rotationY()},
                                      {positionX: vehicleController.positionX(),
                                       positionY: vehicleController.positionY(),
                                       positionZ: vehicleController.positionZ(),
                                       rotationX: vehicleController.rotationX(),
                                       rotationY: vehicleController.rotationY()},
                                      false);
      }

      currentController = debugAnimationController;
    }

    syncCamera();

    if (debugDirection === DEBUG_DOWN_TO_VEHICLE && debugAnimationController && debugAnimationController.finished()) {
      debugDirection = undefined;
      debugAnimationController = null;
      currentController = vehicleController;
    }
  };

  var toggleDebug = function() {
    scheduleDebugChange = true;
  };


  return {
    init: init,
    requestStop: requestStop,
    tick: tick,
    toggleDebug: toggleDebug,
  };
};

"use strict";

var CityTour = CityTour || {};

CityTour.AnimationManager = function(terrain, roadNetwork, poleCamera, messageBroker) {
  var enabled = false;

  var vehicleController, directTargetAnimation;
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
    enabled = true;

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

    if (!enabled) {
      return;
    }

    for (i = 0; i < frameCount; i++) {
      vehicleController.tick();

      if (directTargetAnimation) {
        directTargetAnimation.tick();
        if (directTargetAnimation.isFinished()) {
          directTargetAnimation = undefined;
          enabled = false;
          messageBroker.publish("flythrough.stopped", {});
          return;
        }
      }
    }

    syncCamera();
  };


  return {
    init: init,
    requestStop: requestStop,
    tick: tick,
  };
};

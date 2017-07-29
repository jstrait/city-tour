"use strict";

var CityTour = CityTour || {};


CityTour.AnimationManager = function(terrain, roadNetwork, poleCamera) {
  var animationManager = {};

  var debug = false;
  var scheduleDebugChange = false;

  var vehicleController, debugAnimationController;
  var currentController;

  var syncCamera = function() {
    poleCamera.setPositionX(currentController.xPosition());
    poleCamera.setPositionY(currentController.yPosition());
    poleCamera.setPositionZ(currentController.zPosition());
    poleCamera.setRotationX(currentController.xRotation());
    poleCamera.setRotationY(currentController.yRotation());
  };

  animationManager.init = function(targetMapX, targetMapZ, initialXPosition, initialYPosition, initialZPosition, initialXRotation, initialYRotation) {
    vehicleController = new CityTour.VehicleController(terrain,
                                                       roadNetwork,
                                                       {
                                                         positionX: initialXPosition,
                                                         positionY: initialYPosition,
                                                         positionZ: initialZPosition,
                                                         rotationX: initialXRotation,
                                                         rotationY: initialYRotation,
                                                       },
                                                       {
                                                         positionX: CityTour.Coordinates.mapXToSceneX(targetMapX),
                                                         positionY: Number.NEGATIVE_INFINITY,
                                                         positionZ: CityTour.Coordinates.mapZToSceneZ(targetMapZ),
                                                         rotationX: 0.0,
                                                         rotationY: initialYRotation,
                                                       });

    currentController = vehicleController;

    syncCamera();
  };

  animationManager.tick = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      vehicleController.tick();

      if (debugAnimationController) {
        if (!debug) {
          debugAnimationController.setTargetXPosition(vehicleController.xPosition());
          debugAnimationController.setTargetYPosition(vehicleController.yPosition());
          debugAnimationController.setTargetZPosition(vehicleController.zPosition());
          debugAnimationController.setTargetXRotation(vehicleController.xRotation());
          debugAnimationController.setTargetYRotation(vehicleController.yRotation());
        }

        debugAnimationController.tick();
      }
    }

    if (scheduleDebugChange) {
      debug = !debug;
      scheduleDebugChange = false;

      if (debug) {
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
        debugAnimationController =
          new CityTour.DebugAnimation({positionX: poleCamera.positionX(),
                                       positionY: poleCamera.positionY(),
                                       positionZ: poleCamera.positionZ(),
                                       rotationX: poleCamera.rotationX(),
                                       rotationY: poleCamera.rotationY()},
                                      {positionX: vehicleController.xPosition(),
                                       positionY: vehicleController.yPosition(),
                                       positionZ: vehicleController.zPosition(),
                                       rotationX: vehicleController.xRotation(),
                                       rotationY: vehicleController.yRotation()},
                                      false);
      }

      currentController = debugAnimationController;
    }

    syncCamera();

    if (!debug && debugAnimationController && debugAnimationController.finished()) {
      debugAnimationController = null;
      currentController = vehicleController;
    }
  };

  animationManager.toggleDebug = function() {
    scheduleDebugChange = true;
  };

  return animationManager;
};


CityTour.VehicleController = function(terrain, roadNetwork, initial, target) {
  var HALF_PI = Math.PI / 2.0;
  var TWO_PI = Math.PI * 2.0;

  var DRIVING_MODE = 'driving';
  var HOVERING_MODE = 'hovering';
  var BIRDSEYE_MODE = 'birdseye';

  var HORIZONTAL_MOTION_DELTA = 0.2;
  var Y_ROTATION_DELTA = 0.03;
  var BIRDSEYE_X_ROTATION_DELTA = 0.0155140377955;

  var MINIMUM_HEIGHT_OFF_GROUND = 0.5;

  var xPosition = initial.positionX;
  var yPosition = initial.positionY;
  var zPosition = initial.positionZ;
  var xRotation = initial.rotationX;
  var yRotation = initial.rotationY;

  var targetSceneX = target.positionX;
  var targetYPosition = target.positionY;
  var targetSceneZ = target.positionZ;
  var targetXRotation = target.rotationX;
  var targetYRotation = target.rotationY;

  var terrainHeightAtTouchdown = terrain.heightAtCoordinates(CityTour.Coordinates.sceneXToMapX(targetSceneX),
                                                             CityTour.Coordinates.sceneZToMapZ(targetSceneZ));
  var distanceToTarget = CityTour.Math.distanceBetweenPoints3D(xPosition, yPosition, zPosition, targetSceneX, terrainHeightAtTouchdown + MINIMUM_HEIGHT_OFF_GROUND, targetSceneZ);
  var framesUntilCityEdge = Math.abs(distanceToTarget / HORIZONTAL_MOTION_DELTA);

  var xPositionDelta = Math.abs(targetSceneX - xPosition) / framesUntilCityEdge;
  var zPositionDelta = Math.abs(zPosition - targetSceneZ) / framesUntilCityEdge;
  var yPositionDelta = (yPosition - terrainHeightAtTouchdown) / framesUntilCityEdge;
  var xRotationDelta = Math.abs(initial.rotationX - target.rotationX) / framesUntilCityEdge;

  var framesInCurrentVerticalMode = 0;
  var VERTICAL_MODE_DURATION_IN_FRAMES = 2000;
  var verticalMode = DRIVING_MODE;

  var pathFinder = new CityTour.PathFinder(roadNetwork);
  var navigator = new CityTour.RoadNavigator(roadNetwork, pathFinder, CityTour.Coordinates.sceneXToMapX(targetSceneX), CityTour.Coordinates.sceneZToMapZ(targetSceneZ));

  var determineNextTargetPoint = function() {
    var oldTargetSceneX = targetSceneX;
    var oldTargetSceneZ = targetSceneZ;

    navigator.nextTarget();
    targetSceneX = CityTour.Coordinates.mapXToSceneX(navigator.targetMapX());
    targetSceneZ = CityTour.Coordinates.mapZToSceneZ(navigator.targetMapZ());

    determinePositionDelta(oldTargetSceneX, oldTargetSceneZ, targetSceneX, targetSceneZ);
    determineRotationAngle(oldTargetSceneX, oldTargetSceneZ, targetSceneX, targetSceneZ);
  };

  var determinePositionDelta = function(oldTargetSceneX, oldTargetSceneZ, targetSceneX, targetSceneZ) {
    var angleBetweenStartAndTarget = Math.atan2(oldTargetSceneZ - targetSceneZ, targetSceneX - oldTargetSceneX);

    xPositionDelta = Math.abs(HORIZONTAL_MOTION_DELTA * Math.cos(angleBetweenStartAndTarget));
    zPositionDelta = Math.abs(HORIZONTAL_MOTION_DELTA * Math.sin(angleBetweenStartAndTarget));
  };

  var determineRotationAngle = function(oldTargetSceneX, oldTargetSceneZ, targetSceneX, targetSceneZ) {
    var oldTargetYRotation = targetYRotation;

    var x = targetSceneX - oldTargetSceneX;
    var z = -(targetSceneZ - oldTargetSceneZ);
    var angle = Math.atan2(z, x);
    if (angle < HALF_PI) {
      angle += TWO_PI;
    }
    var rightHandedAngle = angle - HALF_PI;

    targetYRotation = rightHandedAngle;

    // Prevent turns wider than 180 degrees
    if ((oldTargetYRotation - targetYRotation) > Math.PI) {
      yRotation -= TWO_PI;
    }
    else if ((oldTargetYRotation - targetYRotation) < -Math.PI) {
      yRotation += TWO_PI;
    }
  };

  var isAtTargetPoint = function() {
    return yRotation === targetYRotation &&
           xPosition === targetSceneX &&
           zPosition === targetSceneZ;
  };

  var calculateRoadHeight = function() {
    var mapX = CityTour.Coordinates.sceneXToMapX(xPosition);
    var mapZ = CityTour.Coordinates.sceneZToMapZ(zPosition);
    var roadHeight = roadNetwork.getRoadHeight(mapX, mapZ);

    if (roadHeight === undefined) {
      roadHeight = terrain.heightAtCoordinates(mapX, mapZ) || 0.0;
    }

    return roadHeight;
  };

  determineRotationAngle(xPosition, zPosition, targetSceneX, targetSceneZ);

  var xMotionGenerator = new CityTour.ClampedLinearMotionGenerator(xPosition, targetSceneX, xPositionDelta);
  var yMotionGenerator = new CityTour.ClampedLinearMotionGenerator(yPosition, targetYPosition, yPositionDelta);
  var zMotionGenerator = new CityTour.ClampedLinearMotionGenerator(zPosition, targetSceneZ, zPositionDelta);
  var xRotationGenerator = new CityTour.ClampedLinearMotionGenerator(xRotation, targetXRotation, xRotationDelta);
  var yRotationGenerator = new CityTour.ClampedLinearMotionGenerator(yRotation, targetYRotation, Y_ROTATION_DELTA);

  var tick = function() {
    if (isAtTargetPoint()) {
      if (framesInCurrentVerticalMode >= VERTICAL_MODE_DURATION_IN_FRAMES) {
        if (verticalMode === DRIVING_MODE) {
          verticalMode = BIRDSEYE_MODE;
          targetYPosition = 150;
          yPositionDelta = 2;
          targetXRotation = -(Math.PI / 3);
          navigator = new CityTour.AerialNavigator(roadNetwork, CityTour.Coordinates.sceneXToMapX(targetSceneX), CityTour.Coordinates.sceneZToMapZ(targetSceneZ));
        }
        else if (verticalMode === HOVERING_MODE) {
          verticalMode = DRIVING_MODE;
          targetYPosition = Number.NEGATIVE_INFINITY;
          yPositionDelta = 0.05;
          targetXRotation = 0.0;
          navigator = new CityTour.RoadNavigator(roadNetwork, pathFinder, CityTour.Coordinates.sceneXToMapX(targetSceneX), CityTour.Coordinates.sceneZToMapZ(targetSceneZ));
        }
        else if (verticalMode === BIRDSEYE_MODE) {
          verticalMode = HOVERING_MODE;
          targetYPosition = 15;
          yPositionDelta = 2;
          targetXRotation = 0.0;
        }

        yMotionGenerator = new CityTour.ClampedLinearMotionGenerator(yPosition, targetYPosition, yPositionDelta);
        xRotationGenerator = new CityTour.ClampedLinearMotionGenerator(xRotation, targetXRotation, BIRDSEYE_X_ROTATION_DELTA);

        framesInCurrentVerticalMode = 0;
      }

      determineNextTargetPoint();

      yRotationGenerator = new CityTour.ClampedLinearMotionGenerator(yRotation, targetYRotation, Y_ROTATION_DELTA);
      xMotionGenerator = new CityTour.ClampedLinearMotionGenerator(xPosition, targetSceneX, xPositionDelta);
      zMotionGenerator = new CityTour.ClampedLinearMotionGenerator(zPosition, targetSceneZ, zPositionDelta);
    }

    if (yRotation != targetYRotation) {
      yRotation = yRotationGenerator.next();
    }
    else {
      xPosition = xMotionGenerator.next();
      zPosition = zMotionGenerator.next();
    }

    yPosition = Math.max(yMotionGenerator.next(), calculateRoadHeight() + MINIMUM_HEIGHT_OFF_GROUND);
    xRotation = xRotationGenerator.next();

    framesInCurrentVerticalMode += 1;
  };


  return {
    xPosition: function() { return xPosition; },
    yPosition: function() { return yPosition; },
    zPosition: function() { return zPosition; },
    yRotation: function() { return yRotation; },
    xRotation: function() { return xRotation; },
    tick: tick,
  };
};


CityTour.DebugAnimation = function(initial, target, up) {
  var ANIMATION_DURATION_IN_FRAMES = 50.0;
  var MOTION_DELTA = 1.0 / ANIMATION_DURATION_IN_FRAMES;

  var xPosition = initial.positionX;
  var yPosition = initial.positionY;
  var zPosition = initial.positionZ;
  var xRotation = initial.rotationX;
  var yRotation = initial.rotationY;

  // Prevent turns more than 180 degrees
  if ((yRotation - target.rotationY) > Math.PI) {
    yRotation -= Math.PI * 2;
  }
  else if ((yRotation - target.rotationY) < -Math.PI) {
    yRotation += Math.PI * 2;
  }

  if (up) {
    var xPositionMotionGenerator = new CityTour.SineMotionGenerator(xPosition, target.positionX, MOTION_DELTA, 'forward');
    var yPositionMotionGenerator = new CityTour.SineMotionGenerator(yPosition, target.positionY, MOTION_DELTA, 'backward');
    var zPositionMotionGenerator = new CityTour.SineMotionGenerator(zPosition, target.positionZ, MOTION_DELTA, 'forward');
    var xRotationMotionGenerator = new CityTour.SineMotionGenerator(xRotation, target.rotationX, MOTION_DELTA, 'forward');
    var yRotationMotionGenerator = new CityTour.SineMotionGenerator(yRotation, target.rotationY, MOTION_DELTA, 'forward');
  }
  else {
    var xPositionMotionGenerator = new CityTour.SineMotionGenerator(xPosition, target.positionX, MOTION_DELTA, 'forward');
    var yPositionMotionGenerator = new CityTour.SineMotionGenerator(yPosition, target.positionY, MOTION_DELTA, 'forward');
    var zPositionMotionGenerator = new CityTour.SineMotionGenerator(zPosition, target.positionZ, MOTION_DELTA, 'forward');
    var xRotationMotionGenerator = new CityTour.SineMotionGenerator(xRotation, target.rotationX, MOTION_DELTA, 'backward');
    var yRotationMotionGenerator = new CityTour.SineMotionGenerator(yRotation, target.rotationY, MOTION_DELTA, 'forward');
  }

  var debugAnimation = {};

  debugAnimation.setTargetXPosition = function(newTargetXPosition) {
    xPositionMotionGenerator.setTarget(newTargetXPosition);
  };

  debugAnimation.setTargetYPosition = function(newTargetYPosition) {
    yPositionMotionGenerator.setTarget(newTargetYPosition);
  };

  debugAnimation.setTargetZPosition = function(newTargetZPosition) {
    zPositionMotionGenerator.setTarget(newTargetZPosition);
  };

  debugAnimation.setTargetXRotation = function(newTargetXRotation) {
    xRotationMotionGenerator.setTarget(newTargetXRotation);
  };

  debugAnimation.setTargetYRotation = function(newTargetYRotation) {
    yRotationMotionGenerator.setTarget(newTargetYRotation);
  };

  debugAnimation.tick = function() {
    xPosition = xPositionMotionGenerator.next();
    yPosition = yPositionMotionGenerator.next();
    zPosition = zPositionMotionGenerator.next();
    xRotation = xRotationMotionGenerator.next();
    yRotation = yRotationMotionGenerator.next();
  };

  debugAnimation.xPosition = function() { return xPosition; };
  debugAnimation.yPosition = function() { return yPosition; };
  debugAnimation.zPosition = function() { return zPosition; };
  debugAnimation.xRotation = function() { return xRotation; };
  debugAnimation.yRotation = function() { return yRotation; };
  debugAnimation.finished = function() { return xPositionMotionGenerator.finished() &&
                                                yPositionMotionGenerator.finished() &&
                                                zPositionMotionGenerator.finished() &&
                                                xRotationMotionGenerator.finished() &&
                                                yRotationMotionGenerator.finished();
                                       };

  return debugAnimation;
};

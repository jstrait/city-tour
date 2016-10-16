"use strict";

var CityTour = CityTour || {};

CityTour.AnimationManager = function(terrain, roadNetwork, cameraPole, camera) {
  var animationManager = {};

  var debug = false;
  var scheduleDebugChange = false;

  var vehicleController, debugAnimationController;

  var syncCamera = function() {
    if (debugAnimationController) {
      debugAnimationController.animate();

      cameraPole.position.x = debugAnimationController.xPosition();
      cameraPole.position.y = debugAnimationController.yPosition();
      cameraPole.position.z = debugAnimationController.zPosition();
      cameraPole.rotation.y = debugAnimationController.yRotation();
      camera.rotation.x = debugAnimationController.xRotation();

      if (!debug && debugAnimationController.finished()) {
        debugAnimationController = null;
      }
    }
    else {
      cameraPole.position.x = vehicleController.xPosition();
      cameraPole.position.y = vehicleController.yPosition();
      cameraPole.position.z = vehicleController.zPosition();
      cameraPole.rotation.y = vehicleController.yRotation();
      camera.rotation.x = vehicleController.xRotation();
    }
  }

  animationManager.init = function(centerX, centerZ) {
    var INITIAL_X_POSITION = centerX * CityTour.Config.BLOCK_AND_STREET_WIDTH;
    var INITIAL_Y_POSITION = 40;
    var INITIAL_X_ROTATION = 0.0;
    var INITIAL_Y_ROTATION = 0.0;
    var SWOOP_DISTANCE_IN_BLOCKS = 20;
    var DISTANCE_TO_CITY_EDGE = SWOOP_DISTANCE_IN_BLOCKS * CityTour.Config.BLOCK_AND_STREET_DEPTH;

    var furthestOutIntersection = centerZ + CityTour.Config.HALF_BLOCK_ROWS;
    while (!roadNetwork.hasIntersection(centerX, furthestOutIntersection)) {
      furthestOutIntersection -= 1;
    }
    var initialTargetZPosition = CityTour.Coordinates.mapZToSceneZ(furthestOutIntersection);
    var initialZPosition = (furthestOutIntersection + SWOOP_DISTANCE_IN_BLOCKS) * CityTour.Config.BLOCK_AND_STREET_DEPTH;
    var framesUntilCityEdge = Math.abs(DISTANCE_TO_CITY_EDGE / 0.2);
    var terrainHeightAtTouchdown = terrain.heightAtCoordinates(centerX, furthestOutIntersection);
    var swoopDescentDelta = (INITIAL_Y_POSITION - terrainHeightAtTouchdown) / framesUntilCityEdge;

    vehicleController = new CityTour.VehicleController(terrain,
                                                       roadNetwork,
                                                       INITIAL_X_POSITION,
                                                       initialZPosition,
                                                       initialTargetZPosition,
                                                       INITIAL_Y_ROTATION,
                                                       INITIAL_Y_POSITION,
                                                       INITIAL_X_ROTATION,
                                                       swoopDescentDelta,
                                                       CityTour.Coordinates.mapXToSceneX(centerX));

    syncCamera();
  };

  animationManager.animate = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      vehicleController.animate();
    }

    if (!debug && debugAnimationController) {
      debugAnimationController.setTargetXPosition(vehicleController.xPosition());
      debugAnimationController.setTargetYPosition(vehicleController.yPosition());
      debugAnimationController.setTargetZPosition(vehicleController.zPosition());
      debugAnimationController.setTargetXRotation(vehicleController.xRotation());
      debugAnimationController.setTargetYRotation(vehicleController.yRotation());
    }

    if (scheduleDebugChange) {
      debug = !debug;
      scheduleDebugChange = false;

      if (debug) {
        debugAnimationController = new CityTour.DebugAnimation(cameraPole, camera, 0.0, 900, 0.0, -(Math.PI / 2), 0.0, true);
      }
      else {
        debugAnimationController = new CityTour.DebugAnimation(cameraPole,
                                                               camera,
                                                               vehicleController.xPosition(),
                                                               vehicleController.yPosition(),
                                                               vehicleController.zPosition(),
                                                               vehicleController.xRotation(),
                                                               vehicleController.yRotation(),
                                                               false);
      }
    }

    syncCamera();
  };

  animationManager.toggleDebug = function() {
    scheduleDebugChange = true;
  };

  return animationManager;
};


CityTour.VehicleController = function(terrain, roadNetwork, initialXPosition, initialZPosition, initialTargetZPosition, initialYRotation, initialYPosition, initialXRotation, initialYPositionDelta, initialTargetXPosition) {
  var HALF_PI = Math.PI / 2.0;
  var TWO_PI = Math.PI * 2.0;

  var DRIVING_MODE = 'driving';
  var HOVERING_MODE = 'hovering';
  var BIRDSEYE_MODE = 'birdseye';

  var HORIZONTAL_MOTION_DELTA = 0.2;
  var Y_ROTATION_DELTA = 0.03;

  var MINIMUM_HEIGHT_OFF_GROUND = 0.5;

  var xPosition = initialXPosition;
  var yPosition = initialYPosition;
  var zPosition = initialZPosition;
  var xRotation = initialXRotation;
  var yRotation = initialYRotation;

  var targetSceneX = initialTargetXPosition;
  var targetSceneZ = initialTargetZPosition;
  var xPositionDelta = 0.0;
  var zPositionDelta = HORIZONTAL_MOTION_DELTA;
  var targetYRotation = 0.0;

  var targetYPosition = Number.NEGATIVE_INFINITY;
  var yPositionDelta = initialYPositionDelta;
  var targetXRotation = 0.0;
  var xRotationDelta = 0.0155140377955;

  var framesInCurrentVerticalMode = 0;
  var VERTICAL_MODE_DURATION_IN_FRAMES = 2000;
  var verticalMode = DRIVING_MODE;

  var pathFinder = new CityTour.PathFinder(roadNetwork);
  var navigator = new CityTour.RoadNavigator(roadNetwork, pathFinder, CityTour.Coordinates.sceneXToMapX(initialTargetXPosition), CityTour.Coordinates.sceneZToMapZ(initialTargetZPosition));

  var determineNextTargetPoint = function() {
    var oldTargetSceneX = targetSceneX;
    var oldTargetSceneZ = targetSceneZ;
    var targetMapX, targetMapZ;

    navigator.nextTarget();
    targetMapX = navigator.targetMapX();
    targetMapZ = navigator.targetMapZ();
    targetSceneX = CityTour.Coordinates.mapXToSceneX(targetMapX);
    targetSceneZ = CityTour.Coordinates.mapZToSceneZ(targetMapZ);

    xPositionDelta = (oldTargetSceneX === targetSceneX) ? 0.0 : HORIZONTAL_MOTION_DELTA;
    zPositionDelta = (oldTargetSceneZ === targetSceneZ) ? 0.0 : HORIZONTAL_MOTION_DELTA;

    determineRotationAngle(oldTargetSceneX, oldTargetSceneZ, targetSceneX, targetSceneZ);
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

  var xMotionGenerator = new CityTour.ClampedLinearMotionGenerator(xPosition, 0.0, xPositionDelta);
  var yMotionGenerator = new CityTour.ClampedLinearMotionGenerator(yPosition, targetYPosition, yPositionDelta);
  var zMotionGenerator = new CityTour.ClampedLinearMotionGenerator(zPosition, initialTargetZPosition, zPositionDelta);
  var xRotationGenerator = new CityTour.ClampedLinearMotionGenerator(xRotation, targetXRotation, xRotationDelta);
  var yRotationGenerator = new CityTour.ClampedLinearMotionGenerator(yRotation, 0.0, Y_ROTATION_DELTA);

  var vehicleController = {};

  vehicleController.xPosition = function() { return xPosition; };
  vehicleController.yPosition = function() { return yPosition; };
  vehicleController.zPosition = function() { return zPosition; };
  vehicleController.yRotation = function() { return yRotation; };
  vehicleController.xRotation = function() { return xRotation; };

  vehicleController.animate = function() {
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
        xRotationGenerator = new CityTour.ClampedLinearMotionGenerator(xRotation, targetXRotation, xRotationDelta);

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

    var terrainHeight = terrain.heightAtCoordinates(CityTour.Coordinates.sceneXToMapX(xPosition), CityTour.Coordinates.sceneZToMapZ(zPosition));
    yPosition = Math.max(yMotionGenerator.next(), terrainHeight + MINIMUM_HEIGHT_OFF_GROUND);

    xRotation = xRotationGenerator.next();

    framesInCurrentVerticalMode += 1;
  };

  return vehicleController;
};


CityTour.DebugAnimation = function(cameraPole, camera, targetXPosition, targetYPosition, targetZPosition, targetXRotation, targetYRotation, up) {
  var ANIMATION_DURATION_IN_FRAMES = 50.0;
  var MOTION_DELTA = 1.0 / ANIMATION_DURATION_IN_FRAMES;

  var xPosition = cameraPole.position.x;
  var yPosition = cameraPole.position.y;
  var zPosition = cameraPole.position.z;
  var xRotation = camera.rotation.x;
  var yRotation = cameraPole.rotation.y;

  // Prevent turns more than 180 degrees
  if ((yRotation - targetYRotation) > Math.PI) {
    yRotation -= Math.PI * 2;
  }
  else if ((yRotation - targetYRotation) < -Math.PI) {
    yRotation += Math.PI * 2;
  }

  if (up) {
    var xPositionMotionGenerator = new CityTour.SineMotionGenerator(xPosition, targetXPosition, MOTION_DELTA, 'forward');
    var yPositionMotionGenerator = new CityTour.SineMotionGenerator(yPosition, targetYPosition, MOTION_DELTA, 'backward');
    var zPositionMotionGenerator = new CityTour.SineMotionGenerator(zPosition, targetZPosition, MOTION_DELTA, 'forward');
    var xRotationMotionGenerator = new CityTour.SineMotionGenerator(xRotation, targetXRotation, MOTION_DELTA, 'forward');
    var yRotationMotionGenerator = new CityTour.SineMotionGenerator(yRotation, targetYRotation, MOTION_DELTA, 'forward');
  }
  else {
    var xPositionMotionGenerator = new CityTour.SineMotionGenerator(xPosition, targetXPosition, MOTION_DELTA, 'forward');
    var yPositionMotionGenerator = new CityTour.SineMotionGenerator(yPosition, targetYPosition, MOTION_DELTA, 'forward');
    var zPositionMotionGenerator = new CityTour.SineMotionGenerator(zPosition, targetZPosition, MOTION_DELTA, 'forward');
    var xRotationMotionGenerator = new CityTour.SineMotionGenerator(xRotation, targetXRotation, MOTION_DELTA, 'backward');
    var yRotationMotionGenerator = new CityTour.SineMotionGenerator(yRotation, targetYRotation, MOTION_DELTA, 'forward');
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

  debugAnimation.animate = function() {
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
                                                yRotationMotionGenerator.finished()
                                       };

  return debugAnimation;
};

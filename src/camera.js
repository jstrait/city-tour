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

    var mapX = CityTour.Coordinates.sceneXToMapX(cameraPole.position.x);
    var mapZ = CityTour.Coordinates.sceneZToMapZ(cameraPole.position.z);

    var y = terrain.heightAtCoordinates(mapX, mapZ);
    cameraPole.position.y = Math.max(cameraPole.position.y, y + 0.5);
  }

  animationManager.init = function() {
    var INITIAL_X_POSITION = 0;
    var INITIAL_Y_POSITION = 40;
    var INITIAL_X_ROTATION = 0.0;
    var INITIAL_Y_ROTATION = 0.0;
    var SWOOP_DISTANCE_IN_BLOCKS = 20;
    var DISTANCE_TO_CITY_EDGE = SWOOP_DISTANCE_IN_BLOCKS * CityTour.Config.BLOCK_AND_STREET_DEPTH;

    var furthestOutIntersection = CityTour.Config.HALF_BLOCK_ROWS;
    while (!roadNetwork.hasIntersection(0, furthestOutIntersection)) {
      furthestOutIntersection -= 1;
    }

    var initialTargetZPosition = CityTour.Coordinates.mapZToSceneZ(furthestOutIntersection);
    var initialZPosition = (furthestOutIntersection + SWOOP_DISTANCE_IN_BLOCKS) * CityTour.Config.BLOCK_AND_STREET_DEPTH;
    var framesUntilCityEdge = Math.abs(DISTANCE_TO_CITY_EDGE / 0.2);
    var terrainHeightAtTouchdown = terrain.heightAtCoordinates(0.0, furthestOutIntersection);
    var swoopDescentDelta = (INITIAL_Y_POSITION - terrainHeightAtTouchdown) / framesUntilCityEdge;

    vehicleController = new CityTour.VehicleController(roadNetwork,
                                                       INITIAL_X_POSITION,
                                                       initialZPosition,
                                                       initialTargetZPosition,
                                                       INITIAL_Y_ROTATION,
                                                       INITIAL_Y_POSITION,
                                                       INITIAL_X_ROTATION,
                                                       terrainHeightAtTouchdown + 0.5,
                                                       swoopDescentDelta);

    syncCamera();
  };

  animationManager.animate = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      vehicleController.animate();
    }

    if (scheduleDebugChange) {
      debug = !debug;
      scheduleDebugChange = false;

      if (debug) {
        debugAnimationController = new CityTour.DebugAnimation(cameraPole, camera, 0.0, 900, 0.0, -(Math.PI / 2), 0.0);
      }
      else {
        debugAnimationController = new CityTour.DebugAnimation(cameraPole,
                                                               camera,
                                                               vehicleController.xPosition(),
                                                               vehicleController.yPosition(),
                                                               vehicleController.zPosition(),
                                                               vehicleController.xRotation(),
                                                               vehicleController.yRotation());
      }
    }

    syncCamera();
  };

  animationManager.toggleDebug = function() {
    scheduleDebugChange = true;
  };

  return animationManager;
};


CityTour.ClampedMotionGenerator = function(start, target, delta) {
  var current = start;

  var clampedMotionGenerator = {};

  clampedMotionGenerator.next = function() {
    if (current === target) {
      return current;
    }
    else {
      if (current > target) {
        if ((current - target) < delta) {
          current = target;
        }
        else {
          current -= delta;
        }
      }
      else if (current < target) {
        if ((target - current) < delta) {
          current = target;
        }
        else {
          current += delta;
        }
      }
    }

    return current;
  };

  clampedMotionGenerator.finished = function() { return current === target; };

  return clampedMotionGenerator;
};


CityTour.VehicleController = function(roadNetwork, initialXPosition, initialZPosition, initialTargetZPosition, initialYRotation, initialYPosition, initialXRotation, initialTargetYPosition, initialYPositionDelta) {
  var HALF_PI = Math.PI / 2.0;
  var THREE_PI_OVER_TWO = (3.0 * Math.PI) / 2.0;
  var TWO_PI = Math.PI * 2.0;

  var HORIZONTAL_MOTION_DELTA = 0.2;
  var Y_ROTATION_DELTA = 0.03;

  var xPosition = initialXPosition;
  var yPosition = initialYPosition;
  var zPosition = initialZPosition;
  var xRotation = initialXRotation;
  var yRotation = initialYRotation;

  var targetSceneX = 0.0;
  var targetSceneZ = initialTargetZPosition;
  var xPositionDelta = 0.0;
  var zPositionDelta = HORIZONTAL_MOTION_DELTA;
  var targetYRotation = 0.0;

  var targetYPosition = initialTargetYPosition;
  var yPositionDelta = initialYPositionDelta;
  var targetXRotation = 0.0;
  var xRotationDelta = 0.0155140377955;

  var framesInCurrentVerticalMode = 0;
  var VERTICAL_MODE_DURATION_IN_FRAMES = 1500;
  var verticalMode = 'initial_swoop';

  var pathFinder = new CityTour.DijktrasPathFinder(roadNetwork, 0, CityTour.Coordinates.sceneZToMapZ(initialTargetZPosition));

  var determineNextTargetPoint = function() {
    var oldTargetSceneX = targetSceneX;
    var oldTargetSceneZ = targetSceneZ;
    var targetMapX, targetMapZ;

    pathFinder.nextTarget();
    targetMapX = pathFinder.targetMapX();
    targetMapZ = pathFinder.targetMapZ();
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

    // Prevent an extra long turn (i.e. 270deg instead of 90deg)
    if (oldTargetYRotation === 0.0 && targetYRotation === THREE_PI_OVER_TWO) {
      yRotation = TWO_PI;
    }
    else if (oldTargetYRotation === THREE_PI_OVER_TWO && targetYRotation === 0.0) {
      yRotation = -HALF_PI;
    }
  };


  var xMotionGenerator = new CityTour.ClampedMotionGenerator(xPosition, 0.0, xPositionDelta);
  var yMotionGenerator = new CityTour.ClampedMotionGenerator(yPosition, targetYPosition, yPositionDelta);
  var zMotionGenerator = new CityTour.ClampedMotionGenerator(zPosition, initialTargetZPosition, zPositionDelta);
  var xRotationGenerator = new CityTour.ClampedMotionGenerator(xRotation, targetXRotation, xRotationDelta);
  var yRotationGenerator = new CityTour.ClampedMotionGenerator(yRotation, 0.0, Y_ROTATION_DELTA);

  var vehicleController = {};

  vehicleController.deltaZ = function() { return zPositionDelta; };
  vehicleController.xPosition = function() { return xPosition; };
  vehicleController.yPosition = function() { return yPosition; };
  vehicleController.zPosition = function() { return zPosition; };
  vehicleController.yRotation = function() { return yRotation; };
  vehicleController.xRotation = function() { return xRotation; };

  vehicleController.animate = function() {
    if (yRotation === targetYRotation &&
        xPosition === targetSceneX &&
        zPosition === targetSceneZ) {
      determineNextTargetPoint();

      yRotationGenerator = new CityTour.ClampedMotionGenerator(yRotation, targetYRotation, Y_ROTATION_DELTA);
      xMotionGenerator = new CityTour.ClampedMotionGenerator(xPosition, targetSceneX, xPositionDelta);
      zMotionGenerator = new CityTour.ClampedMotionGenerator(zPosition, targetSceneZ, zPositionDelta);
    }

    if (yRotation != targetYRotation) {
      yRotation = yRotationGenerator.next();
    }
    else {
      xPosition = xMotionGenerator.next();
      zPosition = zMotionGenerator.next();
    }

    framesInCurrentVerticalMode += 1;

    yPosition = yMotionGenerator.next();
    xRotation = xRotationGenerator.next();

    if (framesInCurrentVerticalMode >= VERTICAL_MODE_DURATION_IN_FRAMES) {
      if (verticalMode === 'driving') {
        verticalMode = 'birdseye';
        targetYPosition = 150;
        yPositionDelta = 2;
        targetXRotation = -(Math.PI / 3);
        pathFinder = new CityTour.AerialPathFinder(roadNetwork, CityTour.Coordinates.sceneXToMapX(targetSceneX), CityTour.Coordinates.sceneZToMapZ(targetSceneZ));
      }
      else if (verticalMode === 'hovering' || verticalMode === 'initial_swoop') {
        verticalMode = 'driving';
        targetYPosition = -100000;
        yPositionDelta = 0.05;
        targetXRotation = 0.0;
        pathFinder = new CityTour.DijktrasPathFinder(roadNetwork, CityTour.Coordinates.sceneXToMapX(targetSceneX), CityTour.Coordinates.sceneZToMapZ(targetSceneZ));
      }
      else if (verticalMode === 'birdseye') {
        verticalMode = 'hovering';
        targetYPosition = 15;
        yPositionDelta = 2;
        targetXRotation = 0.0;
      }

      yMotionGenerator = new CityTour.ClampedMotionGenerator(yPosition, targetYPosition, yPositionDelta);
      xRotationGenerator = new CityTour.ClampedMotionGenerator(xRotation, targetXRotation, xRotationDelta);

      framesInCurrentVerticalMode = 0;
    }
  };

  return vehicleController;
};


CityTour.DebugAnimation = function(cameraPole, camera, targetXPosition, targetYPosition, targetZPosition, targetXRotation, targetYRotation) {
  var ANIMATION_DURATION_IN_FRAMES = 50.0;

  var xPosition = cameraPole.position.x;
  var yPosition = cameraPole.position.y;
  var zPosition = cameraPole.position.z;
  var xRotation = camera.rotation.x;
  var yRotation = cameraPole.rotation.y;

  var xPositionDelta = Math.abs((targetXPosition - xPosition) / ANIMATION_DURATION_IN_FRAMES);
  var yPositionDelta = Math.abs((targetYPosition - yPosition) / ANIMATION_DURATION_IN_FRAMES);
  var zPositionDelta = Math.abs((targetZPosition - zPosition) / ANIMATION_DURATION_IN_FRAMES);
  var xRotationDelta = Math.abs((targetXRotation - xRotation) / ANIMATION_DURATION_IN_FRAMES);
  var yRotationDelta = Math.abs((targetYRotation - yRotation) / ANIMATION_DURATION_IN_FRAMES);

  var xMotionGenerator = new CityTour.ClampedMotionGenerator(xPosition, targetXPosition, xPositionDelta);
  var yMotionGenerator = new CityTour.ClampedMotionGenerator(yPosition, targetYPosition, yPositionDelta);
  var zMotionGenerator = new CityTour.ClampedMotionGenerator(zPosition, targetZPosition, zPositionDelta);
  var xAngleMotionGenerator = new CityTour.ClampedMotionGenerator(xRotation, targetXRotation, xRotationDelta);
  var yAngleMotionGenerator = new CityTour.ClampedMotionGenerator(yRotation, targetYRotation, yRotationDelta);

  var debugAnimation = {};

  debugAnimation.animate = function() {
    xPosition = xMotionGenerator.next();
    yPosition = yMotionGenerator.next();
    zPosition = zMotionGenerator.next();
    xRotation = xAngleMotionGenerator.next();
    yRotation = yAngleMotionGenerator.next();
  };

  debugAnimation.xPosition = function() { return xPosition; };
  debugAnimation.yPosition = function() { return yPosition; };
  debugAnimation.zPosition = function() { return zPosition; };
  debugAnimation.xRotation = function() { return xRotation; };
  debugAnimation.yRotation = function() { return yRotation; };
  debugAnimation.finished = function() { return xMotionGenerator.finished() &&
                                                yMotionGenerator.finished() &&
                                                zMotionGenerator.finished() &&
                                                xAngleMotionGenerator.finished() &&
                                                yAngleMotionGenerator.finished()
                                       };

  return debugAnimation;
};

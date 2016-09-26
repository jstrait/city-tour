"use strict";

var CityTour = CityTour || {};

CityTour.AnimationManager = function(terrain, roadNetwork, cameraPole, camera) {
  var animationManager = {};

  var debug = false;
  var scheduleDebugChange = false;

  var horizontalMotionController, verticalMotionController, debugAnimationController;
  var pathFinder = new CityTour.DijktrasPathFinder(roadNetwork);

  animationManager.init = function() {
    var START_X = 0;
    var START_Y = 40;
    var SWOOP_DISTANCE_IN_BLOCKS = 20;

    var furthestOutIntersection = CityTour.Config.HALF_BLOCK_ROWS;
    while (!roadNetwork.hasIntersection(0, furthestOutIntersection)) {
      furthestOutIntersection -= 1;
    }

    var startZ = furthestOutIntersection + SWOOP_DISTANCE_IN_BLOCKS;
    var distanceToCityEdge = SWOOP_DISTANCE_IN_BLOCKS * CityTour.Config.BLOCK_AND_STREET_DEPTH;

    cameraPole.position.x = START_X;
    cameraPole.position.y = START_Y;
    cameraPole.position.z = startZ * CityTour.Config.BLOCK_AND_STREET_DEPTH;

    horizontalMotionController = new CityTour.HorizontalAnimationController(cameraPole.position.x,
                                                                            cameraPole.position.z,
                                                                            cameraPole.rotation.y,
                                                                            pathFinder);

    var framesUntilCityEdge = Math.abs(distanceToCityEdge / horizontalMotionController.deltaZ());
    var terrainHeightAtTouchdown = terrain.heightAtCoordinates(0.0, furthestOutIntersection) + 0.5;
    var swoopDescentDelta = (START_Y - terrainHeightAtTouchdown) / framesUntilCityEdge;

    verticalMotionController = new CityTour.VerticalAnimation(cameraPole.position.y, camera.rotation.x, terrainHeightAtTouchdown + 0.5, swoopDescentDelta);
  };

  animationManager.animate = function(frameCount) {
    var i;

    for (i = 0; i < frameCount; i++) {
      horizontalMotionController.animate();
      verticalMotionController.animate();
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
                                                               horizontalMotionController.xPosition(),
                                                               verticalMotionController.yPosition(),
                                                               horizontalMotionController.zPosition(),
                                                               verticalMotionController.xRotation(),
                                                               horizontalMotionController.yRotation());
      }
    }

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
      cameraPole.position.x = horizontalMotionController.xPosition();
      cameraPole.position.y = verticalMotionController.yPosition();
      cameraPole.position.z = horizontalMotionController.zPosition();
      cameraPole.rotation.y = horizontalMotionController.yRotation();
      camera.rotation.x = verticalMotionController.xRotation();
    }

    var mapX = CityTour.Coordinates.sceneXToMapX(cameraPole.position.x);
    var mapZ = CityTour.Coordinates.sceneZToMapZ(cameraPole.position.z);

    var y = terrain.heightAtCoordinates(mapX, mapZ);
    cameraPole.position.y = Math.max(cameraPole.position.y, y + 0.5);
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


CityTour.HorizontalAnimationController = function(initialXPosition, initialZPosition, initialYRotation, pathFinder) {
  var FORWARD_MOTION_DELTA = 0.2;
  var ROTATION_DELTA = 0.03;
  var HALF_PI = Math.PI / 2.0;
  var THREE_PI_OVER_TWO = (3.0 * Math.PI) / 2.0;
  var TWO_PI = Math.PI * 2.0;

  var xPosition = initialXPosition;
  var zPosition = initialZPosition;
  var yRotation = initialYRotation;

  var targetMapX = 0.0;
  var targetSceneX = 0.0;
  var targetMapZ = 0.0;
  var targetSceneZ = 0.0;
  var xPositionDelta = 0.0;
  var zPositionDelta = FORWARD_MOTION_DELTA;
  var targetYRotation = 0.0;

  var determineNextTargetPoint = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;

    pathFinder.nextTarget();
    targetMapX = pathFinder.targetMapX();
    targetMapZ = pathFinder.targetMapZ();
    targetSceneX = CityTour.Coordinates.mapXToSceneX(targetMapX);
    targetSceneZ = CityTour.Coordinates.mapZToSceneZ(targetMapZ);

    xPositionDelta = (oldTargetMapX === targetMapX) ? 0.0 : FORWARD_MOTION_DELTA;
    zPositionDelta = (oldTargetMapZ === targetMapZ) ? 0.0 : FORWARD_MOTION_DELTA;

    determineRotationAngle(oldTargetMapX, oldTargetMapZ, targetMapX, targetMapZ);
  };

  var determineRotationAngle = function(oldTargetMapX, oldTargetMapZ, targetMapX, targetMapZ) {
    var oldTargetYRotation = targetYRotation;

    var x = targetMapX - oldTargetMapX;
    var z = -(targetMapZ - oldTargetMapZ);
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


  var angleMotionGenerator = new CityTour.ClampedMotionGenerator(yRotation, 0.0, ROTATION_DELTA);
  var xMotionGenerator = new CityTour.ClampedMotionGenerator(xPosition, 0.0, xPositionDelta);
  var zMotionGenerator = new CityTour.ClampedMotionGenerator(zPosition, 0.0, zPositionDelta);

  var horizontalAnimationController = {};

  horizontalAnimationController.deltaZ = function() { return zPositionDelta; };
  horizontalAnimationController.xPosition = function() { return xPosition; };
  horizontalAnimationController.zPosition = function() { return zPosition; };
  horizontalAnimationController.yRotation = function() { return yRotation; };

  horizontalAnimationController.animate = function() {
    if (yRotation === targetYRotation &&
        xPosition === targetSceneX &&
        zPosition === targetSceneZ) {
      determineNextTargetPoint();

      angleMotionGenerator = new CityTour.ClampedMotionGenerator(yRotation, targetYRotation, ROTATION_DELTA);
      xMotionGenerator = new CityTour.ClampedMotionGenerator(xPosition, targetSceneX, xPositionDelta);
      zMotionGenerator = new CityTour.ClampedMotionGenerator(zPosition, targetSceneZ, zPositionDelta);
    }

    if (yRotation != targetYRotation) {
      yRotation = angleMotionGenerator.next();
    }
    else {
      xPosition = xMotionGenerator.next();
      zPosition = zMotionGenerator.next();
    }
  };

  return horizontalAnimationController;
};


CityTour.VerticalAnimation = function(initialYPosition, initialXRotation, initialTargetYPosition, initialYPositionDelta) {
  var yPosition = initialYPosition;
  var xRotation = initialXRotation;

  var targetYPosition = initialTargetYPosition;
  var yPositionDelta = initialYPositionDelta;
  var targetXRotation = 0.0;
  var xRotationDelta = 0.0155140377955;

  var framesInCurrentMode = 0;
  var framesUntilTarget = 1500;
  var mode = 'initial_swoop';

  var yMotionGenerator = new CityTour.ClampedMotionGenerator(yPosition, targetYPosition, yPositionDelta);
  var xRotationGenerator = new CityTour.ClampedMotionGenerator(xRotation, targetXRotation, xRotationDelta);

  var animate = function() {
    framesInCurrentMode += 1;

    yPosition = yMotionGenerator.next();
    xRotation = xRotationGenerator.next();

    if (framesInCurrentMode >= framesUntilTarget) {
      if (mode === 'driving') {
        mode = 'birdseye';
        targetYPosition = 150;
        yPositionDelta = 2;
        targetXRotation = -(Math.PI / 3);
      }
      else if (mode === 'hovering' || mode === 'initial_swoop') {
        mode = 'driving';
        targetYPosition = -100000;
        yPositionDelta = 0.05;
        targetXRotation = 0.0;
      }
      else if (mode === 'birdseye') {
        mode = 'hovering';
        targetYPosition = 15;
        yPositionDelta = 2;
        targetXRotation = 0.0;
      }

      yMotionGenerator = new CityTour.ClampedMotionGenerator(yPosition, targetYPosition, yPositionDelta);
      xRotationGenerator = new CityTour.ClampedMotionGenerator(xRotation, targetXRotation, xRotationDelta);

      framesInCurrentMode = 0;
    }
  };

  var verticalAnimation = {};
  verticalAnimation.yPosition = function() { return yPosition; };
  verticalAnimation.xRotation = function() { return xRotation; };
  verticalAnimation.animate = animate;

  return verticalAnimation;
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

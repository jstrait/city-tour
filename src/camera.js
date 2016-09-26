"use strict";

var CityTour = CityTour || {};

CityTour.AnimationManager = function(terrain, roadNetwork, cameraPole, camera) {
  var animationManager = {};

  var horizontalMotionController, verticalMotionController;
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

    cameraPole.position.x = horizontalMotionController.xPosition();
    cameraPole.position.y = verticalMotionController.yPosition();
    cameraPole.position.z = horizontalMotionController.zPosition();
    cameraPole.rotation.y = horizontalMotionController.yRotation();
    camera.rotation.x = verticalMotionController.xRotation();

    var mapX = CityTour.Coordinates.sceneXToMapX(cameraPole.position.x);
    var mapZ = CityTour.Coordinates.sceneZToMapZ(cameraPole.position.z);

    var y = terrain.heightAtCoordinates(mapX, mapZ);
    cameraPole.position.y = Math.max(cameraPole.position.y, y + 0.5);
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
  var deltaX = 0.0;
  var deltaZ = FORWARD_MOTION_DELTA;
  var targetAngle = 0.0;

  var determineNextTargetPoint = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;

    pathFinder.nextTarget();
    targetMapX = pathFinder.targetMapX();
    targetMapZ = pathFinder.targetMapZ();
    targetSceneX = CityTour.Coordinates.mapXToSceneX(targetMapX);
    targetSceneZ = CityTour.Coordinates.mapZToSceneZ(targetMapZ);

    deltaX = (oldTargetMapX === targetMapX) ? 0.0 : FORWARD_MOTION_DELTA;
    deltaZ = (oldTargetMapZ === targetMapZ) ? 0.0 : FORWARD_MOTION_DELTA;

    determineRotationAngle(oldTargetMapX, oldTargetMapZ, targetMapX, targetMapZ);
  };

  var determineRotationAngle = function(oldTargetMapX, oldTargetMapZ, targetMapX, targetMapZ) {
    var oldTargetAngle = targetAngle;

    var x = targetMapX - oldTargetMapX;
    var z = -(targetMapZ - oldTargetMapZ);
    var angle = Math.atan2(z, x);
    if (angle < HALF_PI) {
      angle += TWO_PI;
    }
    var rightHandedAngle = angle - HALF_PI;

    targetAngle = rightHandedAngle;

    // Prevent an extra long turn (i.e. 270deg instead of 90deg)
    if (oldTargetAngle === 0.0 && targetAngle === THREE_PI_OVER_TWO) {
      yRotation = TWO_PI;
    }
    else if (oldTargetAngle === THREE_PI_OVER_TWO && targetAngle === 0.0) {
      yRotation = -HALF_PI;
    }
  };


  var angleMotionGenerator = new CityTour.ClampedMotionGenerator(yRotation, 0.0, ROTATION_DELTA);
  var xMotionGenerator = new CityTour.ClampedMotionGenerator(xPosition, 0.0, deltaX);
  var zMotionGenerator = new CityTour.ClampedMotionGenerator(zPosition, 0.0, deltaZ);

  var horizontalAnimationController = {};

  horizontalAnimationController.deltaZ = function() { return deltaZ; };
  horizontalAnimationController.xPosition = function() { return xPosition; };
  horizontalAnimationController.zPosition = function() { return zPosition; };
  horizontalAnimationController.yRotation = function() { return yRotation; };

  horizontalAnimationController.animate = function() {
    if (yRotation === targetAngle &&
        xPosition === targetSceneX &&
        zPosition === targetSceneZ) {
      determineNextTargetPoint();

      angleMotionGenerator = new CityTour.ClampedMotionGenerator(yRotation, targetAngle, ROTATION_DELTA);
      xMotionGenerator = new CityTour.ClampedMotionGenerator(xPosition, targetSceneX, deltaX);
      zMotionGenerator = new CityTour.ClampedMotionGenerator(zPosition, targetSceneZ, deltaZ);
    }

    if (yRotation != targetAngle) {
      yRotation = angleMotionGenerator.next();
    }
    else {
      xPosition = xMotionGenerator.next();
      zPosition = zMotionGenerator.next();
    }
  };

  return horizontalAnimationController;
};


CityTour.VerticalAnimation = function(initialYPosition, initialXRotation, initialTargetY, initialYDelta) {
  var yPosition = initialYPosition;
  var xRotation = initialXRotation;
  var targetY = initialTargetY;
  var yDelta = initialYDelta;
  var targetAngle = 0.0;
  var angleDelta = 0.0155140377955;
  var framesInCurrentMode = 0;
  var framesUntilTarget = 1500;
  var mode = 'initial_swoop';

  var yMotionGenerator = new CityTour.ClampedMotionGenerator(yPosition, targetY, yDelta);
  var xRotationGenerator = new CityTour.ClampedMotionGenerator(xRotation, targetAngle, angleDelta);

  var animate = function() {
    framesInCurrentMode += 1;

    yPosition = yMotionGenerator.next();
    xRotation = xRotationGenerator.next();

    if (framesInCurrentMode >= framesUntilTarget) {
      if (mode === 'driving') {
        mode = 'birdseye';
        targetY = 150;
        yDelta = 2;
        targetAngle = -(Math.PI / 3);
      }
      else if (mode === 'hovering' || mode === 'initial_swoop') {
        mode = 'driving';
        targetY = -100000;
        yDelta = 0.05;
        targetAngle = 0.0;
      }
      else if (mode === 'birdseye') {
        mode = 'hovering';
        targetY = 15;
        yDelta = 2;
        targetAngle = 0.0;
      }

      yMotionGenerator = new CityTour.ClampedMotionGenerator(yPosition, targetY, yDelta);
      xRotationGenerator = new CityTour.ClampedMotionGenerator(xRotation, targetAngle, angleDelta);

      framesInCurrentMode = 0;
    }
  };

  var verticalAnimation = {};
  verticalAnimation.yPosition = function() { return yPosition; };
  verticalAnimation.xRotation = function() { return xRotation; };
  verticalAnimation.animate = animate;

  return verticalAnimation;
};


CityTour.DebugBirdsEyeAnimation = function(camera) {
  var debugBirdsEyeAnimation = {};

  debugBirdsEyeAnimation.animate = function() {
    camera.position.x = 0;
    camera.position.y = 900;
    camera.position.z = 0;
    camera.rotation.x = -(Math.PI / 2);
  };

  return debugBirdsEyeAnimation;
};

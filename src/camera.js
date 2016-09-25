"use strict";

var CityTour = CityTour || {};

CityTour.AnimationManager = function(terrain, roadNetwork, cameraPole, camera) {
  var animationManager = {};
  var animators = [];

  var pathFinder = new CityTour.DijktrasPathFinder(roadNetwork);
  var horizontalAnimationController  = new CityTour.HorizontalAnimationController(cameraPole, pathFinder);

  var init = function() {
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

    var framesUntilCityEdge = Math.abs(distanceToCityEdge / horizontalAnimationController.deltaZ());
    var terrainHeightAtTouchdown = terrain.heightAtCoordinates(0.0, furthestOutIntersection) + 0.5;
    var swoopDescentDelta = (START_Y - terrainHeightAtTouchdown) / framesUntilCityEdge;

    var vertical = new CityTour.VerticalAnimation(cameraPole, camera, terrainHeightAtTouchdown + 0.5, swoopDescentDelta);
    var horizontal = horizontalAnimationController;
    var debugBirdseye = new CityTour.DebugBirdsEyeAnimation(cameraPole, camera);
    animators = [vertical, horizontal];
    //animators = [debugBirdseye];
  };

  animationManager.animate = function(frameCount) {
    if (animators.length === 0) {
      init();
    }

    for (var i = 0; i < frameCount; i++) {
      animators.forEach(function (animator) {
        animator.animate();
      });
    }

    var mapX = CityTour.Coordinates.sceneXToMapX(cameraPole.position.x);
    var mapZ = CityTour.Coordinates.sceneZToMapZ(cameraPole.position.z);

    var y = terrain.heightAtCoordinates(mapX, mapZ);
    cameraPole.position.y = Math.max(cameraPole.position.y, y + 0.5);
  };

  return animationManager;
};


CityTour.HorizontalAnimationController = function(cameraPole, pathFinder) {
  var FORWARD_MOTION_DELTA = 0.2;
  var ROTATION_DELTA = 0.03;
  var HALF_PI = Math.PI / 2.0;
  var THREE_PI_OVER_TWO = (3.0 * Math.PI) / 2.0;
  var TWO_PI = Math.PI * 2.0;

  var targetMapX = 0.0;
  var targetSceneX = 0.0;
  var targetMapZ = 0.0;
  var targetSceneZ = 0.0;
  var deltaX = 0.0;
  var deltaZ = -FORWARD_MOTION_DELTA;
  var targetAngle = 0.0;
  var deltaAngle;

  var determineNextTargetPoint = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;
    
    pathFinder.nextTarget();
    targetMapX = pathFinder.targetMapX();
    targetMapZ = pathFinder.targetMapZ();
    targetSceneX = CityTour.Coordinates.mapXToSceneX(targetMapX);
    targetSceneZ = CityTour.Coordinates.mapZToSceneZ(targetMapZ);

    deltaX = 0.0;
    deltaZ = 0.0;
    if (oldTargetMapX > targetMapX) {
      deltaX = -FORWARD_MOTION_DELTA;
    }
    else if (oldTargetMapX < targetMapX) {
      deltaX = FORWARD_MOTION_DELTA;
    }
    else if (oldTargetMapZ > targetMapZ) {
      deltaZ = -FORWARD_MOTION_DELTA;
    }
    else if (oldTargetMapZ < targetMapZ) {
      deltaZ = FORWARD_MOTION_DELTA;
    }
    
    determineRotationAngle2(oldTargetMapX, oldTargetMapZ, targetMapX, targetMapZ);
  };

  var determineRotationAngle = function() {
    var oldTargetAngle = targetAngle;

    if (deltaX < 0) {
      targetAngle = HALF_PI;
    }
    else if (deltaX > 0) {
      targetAngle = THREE_PI_OVER_TWO;
    }
    else if (deltaZ > 0) {
      targetAngle = Math.PI;
    }
    else if (deltaZ < 0) {
      targetAngle = 0;
    }

    // Prevent an extra long turn (i.e. 270deg instead of 90deg)
    if (oldTargetAngle === 0.0 && targetAngle === THREE_PI_OVER_TWO) {
      oldTargetAngle = TWO_PI;
      cameraPole.rotation.y = TWO_PI;
    }
    else if (oldTargetAngle === THREE_PI_OVER_TWO && targetAngle === 0.0) {
      oldTargetAngle = -HALF_PI;
      cameraPole.rotation.y = -HALF_PI;
    }

    deltaAngle = ROTATION_DELTA;
    deltaAngle *= (targetAngle > oldTargetAngle) ? 1 : -1;
  };

  var determineRotationAngle2 = function(oldTargetMapX, oldTargetMapZ, targetMapX, targetMapZ) {
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
      oldTargetAngle = TWO_PI;
      cameraPole.rotation.y = TWO_PI;
    }
    else if (oldTargetAngle === THREE_PI_OVER_TWO && targetAngle === 0.0) {
      oldTargetAngle = -HALF_PI;
      cameraPole.rotation.y = -HALF_PI;
    }

    deltaAngle = ROTATION_DELTA;
    deltaAngle *= (targetAngle > oldTargetAngle) ? 1 : -1;
  };

  var nextTarget = function() {
    determineNextTargetPoint();
    //determineRotationAngle();
  };

  var forwardAnimator = new CityTour.ForwardAnimation(cameraPole, targetSceneX, deltaX, targetSceneZ, deltaZ);
  var rotationAnimator = null;


  var horizontalAnimationController = {};

  horizontalAnimationController.deltaZ = function() { return deltaZ; };

  horizontalAnimationController.animate = function() {
    if (forwardAnimator != null) {
      forwardAnimator.animate();
    
      if (forwardAnimator.finished()) {
        forwardAnimator = null;
        nextTarget();
        rotationAnimator = new CityTour.RotationAnimation(cameraPole, targetAngle, deltaAngle);
      }
    }
    else if (rotationAnimator != null) {
      rotationAnimator.animate();

      if (rotationAnimator.finished()) {
        rotationAnimator = null;
        forwardAnimator = new CityTour.ForwardAnimation(cameraPole, targetSceneX, deltaX, targetSceneZ, deltaZ);
      }
    }
  };

  return horizontalAnimationController;
};


CityTour.VerticalAnimation = function(cameraPole, camera, targetY, yDelta) {
  var targetAngle = 0.0;
  var angleDelta = 0.0155140377955;
  var framesInCurrentMode = 0;
  var framesUntilTarget = 1500;
  var mode = 'initial_swoop';
  var finished = false;

  var step = function(current, target, delta) {
    if (current === target) {
      return target;
    }
    else {
      if (current > target) {
        if ((current - target) < delta) {
          return target;
        }
        else {
          return current - delta;
        }
      }
      else if (current < target) {
        if ((target - current) < delta) {
          return target;
        }
        else {
          return current + delta;
        }
      }
    }
  };

  var animate = function() {
    framesInCurrentMode += 1;

    cameraPole.position.y = step(cameraPole.position.y, targetY, yDelta);
    camera.rotation.x = step(camera.rotation.x, targetAngle, angleDelta);

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

      framesInCurrentMode = 0;
    }
  };

  var verticalAnimation = {};
  verticalAnimation.animate = animate;
  verticalAnimation.finished = function() { return finished; };

  return verticalAnimation;
};


CityTour.ForwardAnimation = function(cameraPole, targetX, deltaX, targetZ, deltaZ) {
  var finished = false;

  var animate = function() {
    cameraPole.position.x += deltaX;
    cameraPole.position.z += deltaZ;

    if ((deltaX < 0 && cameraPole.position.x < targetX) || (deltaX > 0 && cameraPole.position.x > targetX) ||
        (deltaZ < 0 && cameraPole.position.z < targetZ) || (deltaZ > 0 && cameraPole.position.z > targetZ)) {
      cameraPole.position.x = targetX;
      cameraPole.position.z = targetZ;

      finished = true;
    }
  };

  var forwardAnimation = {};
  forwardAnimation.animate = animate;
  forwardAnimation.finished = function() { return finished; };

  return forwardAnimation;
};


CityTour.RotationAnimation = function(cameraPole, targetAngle, deltaAngle) {
  var finished = false;

  var animate = function() {
    cameraPole.rotation.y += deltaAngle;
    
    if ((deltaAngle < 0 && cameraPole.rotation.y <= targetAngle) || (deltaAngle > 0 && cameraPole.rotation.y >= targetAngle)) {
      if (targetAngle >= Math.PI * 2 || targetAngle <= Math.PI * -2) {
        targetAngle = 0;
      }

      cameraPole.rotation.y = targetAngle;
      finished = true;
    }
  };

  var rotationAnimation = {};
  rotationAnimation.animate = animate;
  rotationAnimation.finished = function() { return finished; };

  return rotationAnimation;
};


CityTour.DebugBirdsEyeAnimation = function(camera) {
  var finished = false;

  var debugBirdsEyeAnimation = {};

  debugBirdsEyeAnimation.animate = function() {
    camera.position.x = 0;
    camera.position.y = 900;
    camera.position.z = 0;
    camera.rotation.x = -(Math.PI / 2);
  };
  debugBirdsEyeAnimation.finished = function() { return finished; };

  return debugBirdsEyeAnimation;
};

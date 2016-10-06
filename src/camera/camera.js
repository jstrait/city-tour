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

    vehicleController = new CityTour.VehicleController(terrain,
                                                       roadNetwork,
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


CityTour.ClampedLinearMotionGenerator = function(start, target, delta) {
  var current = start;

  var clampedLinearMotionGenerator = {};

  clampedLinearMotionGenerator.next = function() {
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

  clampedLinearMotionGenerator.finished = function() { return current === target; };

  return clampedLinearMotionGenerator;
};


CityTour.SineMotionGenerator = function(start, target, delta, direction) {
  var HALF_PI = Math.PI / 2;

  var current = start;
  var totalDistance = target - start;

  if (direction === undefined) {
    direction = 'forward';
  }
  
  var x, xTarget;
  if (direction === 'forward') {
    x = 0.0;
    xTarget = HALF_PI;
  }
  else {
    x = HALF_PI;
    xTarget = Math.PI;
  }

  var sineMotionGenerator = {};

  sineMotionGenerator.next = function() {
    if (x >= xTarget) {
      return current;
    }
    else {
      if (direction === 'forward') {
        current = start + (totalDistance * Math.sin(x));
      }
      else {
        current = start + (totalDistance * (1.0 - Math.sin(x)));
      }
      x += delta;
    }

    return current;
  };

  sineMotionGenerator.setTarget = function(newTarget) {
    target = newTarget;
    totalDistance = target - start;
  };

  sineMotionGenerator.finished = function() { return x >= xTarget; };

  return sineMotionGenerator;
};


CityTour.VehicleController = function(terrain, roadNetwork, initialXPosition, initialZPosition, initialTargetZPosition, initialYRotation, initialYPosition, initialXRotation, initialTargetYPosition, initialYPositionDelta) {
  var HALF_PI = Math.PI / 2.0;
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
  var verticalMode = 'driving';

  var pathFinder = new CityTour.PathFinder(roadNetwork);
  var navigator = new CityTour.RoadNavigator(roadNetwork, pathFinder, 0, CityTour.Coordinates.sceneZToMapZ(initialTargetZPosition));

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
    if (yRotation === targetYRotation &&
        xPosition === targetSceneX &&
        zPosition === targetSceneZ) {
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

    framesInCurrentVerticalMode += 1;

    var terrainHeight = terrain.heightAtCoordinates(CityTour.Coordinates.sceneXToMapX(xPosition), CityTour.Coordinates.sceneZToMapZ(zPosition));
    yPosition = Math.max(yMotionGenerator.next(), terrainHeight + 0.5);

    xRotation = xRotationGenerator.next();

    if (framesInCurrentVerticalMode >= VERTICAL_MODE_DURATION_IN_FRAMES) {
      if (verticalMode === 'driving') {
        verticalMode = 'birdseye';
        targetYPosition = 150;
        yPositionDelta = 2;
        targetXRotation = -(Math.PI / 3);
        navigator = new CityTour.AerialNavigator(roadNetwork, CityTour.Coordinates.sceneXToMapX(targetSceneX), CityTour.Coordinates.sceneZToMapZ(targetSceneZ));
      }
      else if (verticalMode === 'hovering') {
        verticalMode = 'driving';
        targetYPosition = Number.NEGATIVE_INFINITY;
        yPositionDelta = 0.05;
        targetXRotation = 0.0;
        navigator = new CityTour.RoadNavigator(roadNetwork, pathFinder, CityTour.Coordinates.sceneXToMapX(targetSceneX), CityTour.Coordinates.sceneZToMapZ(targetSceneZ));
      }
      else if (verticalMode === 'birdseye') {
        verticalMode = 'hovering';
        targetYPosition = 15;
        yPositionDelta = 2;
        targetXRotation = 0.0;
      }

      yMotionGenerator = new CityTour.ClampedLinearMotionGenerator(yPosition, targetYPosition, yPositionDelta);
      xRotationGenerator = new CityTour.ClampedLinearMotionGenerator(xRotation, targetXRotation, xRotationDelta);

      framesInCurrentVerticalMode = 0;
    }
  };

  return vehicleController;
};


CityTour.DebugAnimation = function(cameraPole, camera, targetXPosition, targetYPosition, targetZPosition, targetXRotation, targetYRotation, up) {
  var ANIMATION_DURATION_IN_FRAMES = 50.0;

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

  var xPositionDelta = 1.0 / ANIMATION_DURATION_IN_FRAMES;
  var yPositionDelta = 1.0 / ANIMATION_DURATION_IN_FRAMES;
  var zPositionDelta = 1.0 / ANIMATION_DURATION_IN_FRAMES;
  var xRotationDelta = 1.0 / ANIMATION_DURATION_IN_FRAMES;
  var yRotationDelta = 1.0 / ANIMATION_DURATION_IN_FRAMES;

  if (up) {
    var xPositionMotionGenerator = new CityTour.SineMotionGenerator(xPosition, targetXPosition, xPositionDelta, 'forward');
    var yPositionMotionGenerator = new CityTour.SineMotionGenerator(yPosition, targetYPosition, yPositionDelta, 'backward');
    var zPositionMotionGenerator = new CityTour.SineMotionGenerator(zPosition, targetZPosition, zPositionDelta, 'forward');
    var xRotationMotionGenerator = new CityTour.SineMotionGenerator(xRotation, targetXRotation, xRotationDelta, 'forward');
    var yRotationMotionGenerator = new CityTour.SineMotionGenerator(yRotation, targetYRotation, yRotationDelta, 'forward');
  }
  else {
    var xPositionMotionGenerator = new CityTour.SineMotionGenerator(xPosition, targetXPosition, xPositionDelta, 'forward');
    var yPositionMotionGenerator = new CityTour.SineMotionGenerator(yPosition, targetYPosition, yPositionDelta, 'forward');
    var zPositionMotionGenerator = new CityTour.SineMotionGenerator(zPosition, targetZPosition, zPositionDelta, 'forward');
    var xRotationMotionGenerator = new CityTour.SineMotionGenerator(xRotation, targetXRotation, xRotationDelta, 'backward');
    var yRotationMotionGenerator = new CityTour.SineMotionGenerator(yRotation, targetYRotation, yRotationDelta, 'forward');
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

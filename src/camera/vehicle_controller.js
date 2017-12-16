"use strict";

var CityTour = CityTour || {};

CityTour.VehicleController = function(terrain, roadNetwork, initial, initialTargetSceneX, initialTargetSceneZ) {
  var HALF_PI = Math.PI / 2.0;
  var TWO_PI = Math.PI * 2.0;

  var INITIAL_DESCENT = 'initial_descent';
  var DRIVING_MODE = 'driving';
  var HOVERING_MODE = 'hovering';
  var BIRDSEYE_MODE = 'birdseye';

  var HORIZONTAL_MOTION_DELTA = 0.2;
  var Y_ROTATION_DELTA = 0.03;
  var BIRDSEYE_Y = 150;
  var HOVERING_Y = 15;
  var POSITION_Y_DELTA = 2;
  var HOVER_TO_DRIVING_POSITION_Y_DELTA = 0.05;
  var BIRDSEYE_X_ROTATION = -(Math.PI / 3);
  var BIRDSEYE_X_ROTATION_DELTA = 0.0155140377955;


  var MINIMUM_HEIGHT_OFF_GROUND = 0.5;

  var positionX = initial.positionX;
  var positionY = initial.positionY;
  var positionZ = initial.positionZ;
  var rotationX = initial.rotationX;
  var rotationY = initial.rotationY;

  var positionXGenerator;
  var positionYGenerator;
  var positionZGenerator;
  var rotationXGenerator;
  var rotationYGenerator;

  var VERTICAL_MODE_DURATION_IN_FRAMES = 2000;
  var framesInCurrentVerticalMode = VERTICAL_MODE_DURATION_IN_FRAMES + 1;
  var verticalMode = INITIAL_DESCENT;

  var InitialDescentNavigator = function() {
    return {
      targetMapX: function() { return CityTour.Coordinates.sceneXToMapX(initialTargetSceneX); },
      targetMapZ: function() { return CityTour.Coordinates.sceneZToMapZ(initialTargetSceneZ); },
      nextTarget: function() { },  //no-op
    };
  };

  var navigator = new InitialDescentNavigator();
  var pathFinder = new CityTour.PathFinder(roadNetwork);


  var determineNextTargetPoint = function() {
    var targetPositionX, targetYPosition, targetPositionZ, targetXRotation, targetYRotation;
    var xPositionFrameCount, yPositionFrameCount, zPositionFrameCount, xRotationFrameCount, yRotationFrameCount;

    navigator.nextTarget();
    targetPositionX = CityTour.Coordinates.mapXToSceneX(navigator.targetMapX());
    targetPositionZ = CityTour.Coordinates.mapZToSceneZ(navigator.targetMapZ());

    xPositionFrameCount = Math.ceil(CityTour.Math.distanceBetweenPoints(positionX, positionZ, targetPositionX, targetPositionZ) / HORIZONTAL_MOTION_DELTA);
    zPositionFrameCount = xPositionFrameCount;

    targetYRotation = determineRotationAngle(positionX, positionZ, targetPositionX, targetPositionZ);
    yRotationFrameCount = Math.ceil(Math.abs(targetYRotation - rotationY) / Y_ROTATION_DELTA);

    if (verticalMode === INITIAL_DESCENT) {
      targetYPosition = BIRDSEYE_Y;
      targetXRotation = BIRDSEYE_X_ROTATION;

      yPositionFrameCount = xPositionFrameCount;
      xRotationFrameCount = xPositionFrameCount;
    }
    else if (verticalMode === BIRDSEYE_MODE) {
      targetYPosition = BIRDSEYE_Y;
      targetXRotation = BIRDSEYE_X_ROTATION;

      yPositionFrameCount = Math.ceil(Math.abs(targetYPosition - positionY) / POSITION_Y_DELTA);
      xRotationFrameCount = Math.ceil(Math.abs(targetXRotation - rotationX) / BIRDSEYE_X_ROTATION_DELTA);
      navigator = new CityTour.AerialNavigator(roadNetwork, CityTour.Coordinates.sceneXToMapX(targetPositionX), CityTour.Coordinates.sceneZToMapZ(targetPositionZ));
    }
    else if (verticalMode === DRIVING_MODE) {
      targetYPosition = positionY - (HOVER_TO_DRIVING_POSITION_Y_DELTA * xPositionFrameCount);
      targetXRotation = 0.0;

      yPositionFrameCount = Math.ceil(Math.abs(targetYPosition - positionY) / HOVER_TO_DRIVING_POSITION_Y_DELTA);
      xRotationFrameCount = Math.ceil(Math.abs(targetXRotation - rotationX) / BIRDSEYE_X_ROTATION_DELTA);
      navigator = new CityTour.RoadNavigator(roadNetwork, pathFinder, CityTour.Coordinates.sceneXToMapX(targetPositionX), CityTour.Coordinates.sceneZToMapZ(targetPositionZ));
    }
    else if (verticalMode === HOVERING_MODE) {
      targetYPosition = HOVERING_Y;
      targetXRotation = 0.0;

      yPositionFrameCount = Math.ceil(Math.abs(targetYPosition - positionY) / POSITION_Y_DELTA);
      xRotationFrameCount = Math.ceil(Math.abs(targetXRotation - rotationX) / BIRDSEYE_X_ROTATION_DELTA);
    }

    positionXGenerator = new CityTour.MotionGenerator(positionX, targetPositionX, new CityTour.LinearEasing(xPositionFrameCount));
    positionYGenerator = new CityTour.MotionGenerator(positionY, targetYPosition, new CityTour.LinearEasing(yPositionFrameCount));
    positionZGenerator = new CityTour.MotionGenerator(positionZ, targetPositionZ, new CityTour.LinearEasing(zPositionFrameCount));
    rotationXGenerator = new CityTour.MotionGenerator(rotationX, targetXRotation, new CityTour.LinearEasing(xRotationFrameCount));
    rotationYGenerator = new CityTour.MotionGenerator(rotationY, targetYRotation, new CityTour.LinearEasing(yRotationFrameCount));
  };

  var determineRotationAngle = function(oldTargetPositionX, oldTargetPositionZ, targetPositionX, targetPositionZ) {
    var oldYRotation = rotationY;
    var newTargetYRotation;

    var x = targetPositionX - oldTargetPositionX;
    var z = -(targetPositionZ - oldTargetPositionZ);
    var angle = Math.atan2(z, x);
    if (angle < HALF_PI) {
      angle += TWO_PI;
    }
    var rightHandedAngle = angle - HALF_PI;

    newTargetYRotation = rightHandedAngle;

    // Prevent turns wider than 180 degrees
    if ((oldYRotation - newTargetYRotation) > Math.PI) {
      rotationY -= TWO_PI;
    }
    else if ((oldYRotation - newTargetYRotation) < -Math.PI) {
      rotationY += TWO_PI;
    }

    return newTargetYRotation;
  };

  var isAtTargetPoint = function() {
    return positionXGenerator.finished() &&
           positionYGenerator.finished() &&
           positionZGenerator.finished() &&
           rotationXGenerator.finished() &&
           rotationYGenerator.finished();
  };

  var roadHeightAtCurrentPosition = function() {
    var mapX = CityTour.Coordinates.sceneXToMapX(positionX);
    var mapZ = CityTour.Coordinates.sceneZToMapZ(positionZ);
    var roadHeight = roadNetwork.getRoadHeight(mapX, mapZ);

    if (roadHeight === undefined) {
      roadHeight = terrain.heightAtCoordinates(mapX, mapZ) || 0.0;
    }

    return roadHeight;
  };

  var tick = function() {
    if (isAtTargetPoint()) {
      if (framesInCurrentVerticalMode >= VERTICAL_MODE_DURATION_IN_FRAMES) {
        if (verticalMode === DRIVING_MODE || verticalMode === INITIAL_DESCENT) {
          verticalMode = BIRDSEYE_MODE;
        }
        else if (verticalMode === HOVERING_MODE) {
          verticalMode = DRIVING_MODE;
        }
        else if (verticalMode === BIRDSEYE_MODE) {
          verticalMode = HOVERING_MODE;
        }

        framesInCurrentVerticalMode = 0;
      }

      determineNextTargetPoint();
    }

    if (!rotationYGenerator.finished()) {
      rotationY = rotationYGenerator.next();
    }
    else {
      positionX = positionXGenerator.next();
      positionZ = positionZGenerator.next();
      rotationX = rotationXGenerator.next();
      positionY = Math.max(positionYGenerator.next(), roadHeightAtCurrentPosition() + MINIMUM_HEIGHT_OFF_GROUND);
    }

    framesInCurrentVerticalMode += 1;
  };


  determineNextTargetPoint();

  return {
    positionX: function() { return positionX; },
    positionY: function() { return positionY; },
    positionZ: function() { return positionZ; },
    rotationX: function() { return rotationX; },
    rotationY: function() { return rotationY; },
    tick: tick,
  };
};

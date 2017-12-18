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
  var BIRDSEYE_Y = 150;
  var HOVERING_Y = 15;
  var POSITION_Y_DELTA = 2;
  var HOVER_TO_DRIVING_POSITION_Y_DELTA = 0.05;
  var BIRDSEYE_X_ROTATION = -(Math.PI / 3);
  var BIRDSEYE_X_ROTATION_DELTA = 0.0155140377955;
  var ROTATION_Y_DELTA = 0.03;

  var MODE_TRANSITIONS = {}
  MODE_TRANSITIONS[INITIAL_DESCENT] = BIRDSEYE_MODE;
  MODE_TRANSITIONS[BIRDSEYE_MODE] = HOVERING_MODE;
  MODE_TRANSITIONS[HOVERING_MODE] = DRIVING_MODE;
  MODE_TRANSITIONS[DRIVING_MODE] = BIRDSEYE_MODE;

  var MINIMUM_HEIGHT_OFF_GROUND = 0.5;

  var positionX = initial.positionX;
  var positionY = initial.positionY;
  var positionZ = initial.positionZ;
  var rotationX = initial.rotationX;
  var rotationY = initial.rotationY;

  var animations;

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
  var aerialNavigator;
  var pathFinder = new CityTour.PathFinder(roadNetwork);


  var frameCount = function(start, target, delta) {
    if (delta < 0) {
      console.warn("Animation delta (" + delta + ") less than zero, will never complete!");
    }

    return Math.ceil(Math.abs(target - start) / delta);
  };

  var buildIntroAnimations = function() {
    var CIRCLE_AROUND_CITY_CENTER_RADIUS = 10 * CityTour.Config.BLOCK_AND_STREET_WIDTH;
    var CIRCLE_ANIMATION_FRAME_COUNT = 6 * 60;

    var targetPositionX, targetPositionY, targetPositionZ, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var distanceToTarget;
    var newAnimations = [];

    var cityCenterX = CityTour.Coordinates.mapXToSceneX(navigator.targetMapX());
    var cityCenterZ = CityTour.Coordinates.mapZToSceneZ(navigator.targetMapZ());
    var horizontalDistanceToCityCenter = CityTour.Math.distanceBetweenPoints(positionX, positionZ, cityCenterX, cityCenterZ);
    var horizontalDistanceToCircle = horizontalDistanceToCityCenter - CIRCLE_AROUND_CITY_CENTER_RADIUS;

    targetRotationY = determineRotationAngle(positionX, positionZ, cityCenterX, cityCenterZ);
    targetPositionX = positionX - (Math.sin(targetRotationY) * horizontalDistanceToCircle);
    targetPositionY = 40;
    targetPositionZ = positionZ - (Math.cos(targetRotationY) * horizontalDistanceToCircle);
    targetRotationX = 0.0;

    distanceToTarget = CityTour.Math.distanceBetweenPoints3D(positionX, positionY, positionZ, targetPositionX, targetPositionY, targetPositionZ);

    frameCountPositionX = Math.ceil(distanceToTarget / HORIZONTAL_MOTION_DELTA);
    frameCountPositionX = Math.max(60, Math.min(3 * 60, frameCountPositionX));
    frameCountPositionY = frameCountPositionX;
    frameCountPositionZ = frameCountPositionX;
    frameCountRotationX = frameCountPositionX;
    frameCountRotationY = Math.min(frameCountPositionX, frameCount(rotationY, targetRotationY, 0.008));

    // Move to a point on the edge of a circle around the city center, facing the city center
    positionXGenerator = new CityTour.MotionGenerator(positionX, targetPositionX, new CityTour.LinearEasing(frameCountPositionX));
    positionYGenerator = new CityTour.MotionGenerator(positionY, targetPositionY, new CityTour.LinearEasing(frameCountPositionY));
    positionZGenerator = new CityTour.MotionGenerator(positionZ, targetPositionZ, new CityTour.LinearEasing(frameCountPositionZ));
    rotationXGenerator = new CityTour.MotionGenerator(rotationX, targetRotationX, new CityTour.LinearEasing(frameCountRotationX));
    rotationYGenerator = new CityTour.MotionGenerator(rotationY, targetRotationY, new CityTour.SineEasing(frameCountRotationY, 0, HALF_PI));
    newAnimations.push(new CityTour.Animation(positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator));

    // Rotate around the city in one full circle
    positionXGenerator = new CityTour.MotionGenerator(cityCenterX, cityCenterX + CIRCLE_AROUND_CITY_CENTER_RADIUS, new CityTour.SineEasing(CIRCLE_ANIMATION_FRAME_COUNT, targetRotationY, targetRotationY - TWO_PI));
    positionYGenerator = new CityTour.MotionGenerator(targetPositionY, BIRDSEYE_Y, new CityTour.LinearEasing(CIRCLE_ANIMATION_FRAME_COUNT));
    positionZGenerator = new CityTour.MotionGenerator(cityCenterZ, cityCenterZ + CIRCLE_AROUND_CITY_CENTER_RADIUS, new CityTour.CosineEasing(CIRCLE_ANIMATION_FRAME_COUNT, targetRotationY, targetRotationY - TWO_PI));
    rotationXGenerator = new CityTour.MotionGenerator(targetRotationX, BIRDSEYE_X_ROTATION, new CityTour.LinearEasing(CIRCLE_ANIMATION_FRAME_COUNT));
    rotationYGenerator = new CityTour.MotionGenerator(targetRotationY, targetRotationY - TWO_PI, new CityTour.LinearEasing(CIRCLE_ANIMATION_FRAME_COUNT));
    newAnimations.push(new CityTour.Animation(positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator));

    return newAnimations;
  };

  var buildNextAnimations = function() {
    var targetPositionX, targetPositionY, targetPositionZ, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXStationaryGenerator, positionYStationaryGenerator, positionZStationaryGenerator, rotationXStationaryGenerator, rotationYStationaryGenerator;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var newAnimations = [];

    if (verticalMode === INITIAL_DESCENT) {
      return buildIntroAnimations();
    }

    navigator.nextTarget();
    targetPositionX = CityTour.Coordinates.mapXToSceneX(navigator.targetMapX());
    targetPositionZ = CityTour.Coordinates.mapZToSceneZ(navigator.targetMapZ());

    frameCountPositionX = Math.ceil(CityTour.Math.distanceBetweenPoints(positionX, positionZ, targetPositionX, targetPositionZ) / HORIZONTAL_MOTION_DELTA);
    frameCountPositionZ = frameCountPositionX;

    targetRotationY = determineRotationAngle(positionX, positionZ, targetPositionX, targetPositionZ);
    frameCountRotationY = frameCount(rotationY, targetRotationY, ROTATION_Y_DELTA);

    if (verticalMode === BIRDSEYE_MODE) {
      targetPositionY = BIRDSEYE_Y;
      targetRotationX = BIRDSEYE_X_ROTATION;

      frameCountPositionY = frameCount(positionY, targetPositionY, POSITION_Y_DELTA);
      frameCountRotationX = frameCount(rotationX, targetRotationX, BIRDSEYE_X_ROTATION_DELTA);
      if (aerialNavigator === undefined) {
        navigator = new CityTour.AerialNavigator(roadNetwork, CityTour.Coordinates.sceneXToMapX(targetPositionX), CityTour.Coordinates.sceneZToMapZ(targetPositionZ));
        aerialNavigator = navigator;
      }
    }
    else if (verticalMode === DRIVING_MODE) {
      targetPositionY = positionY - (HOVER_TO_DRIVING_POSITION_Y_DELTA * frameCountPositionX);
      targetRotationX = 0.0;

      frameCountPositionY = frameCount(positionY, targetPositionY, HOVER_TO_DRIVING_POSITION_Y_DELTA);
      frameCountRotationX = frameCount(rotationX, targetRotationX, BIRDSEYE_X_ROTATION_DELTA);
      aerialNavigator = undefined;
      navigator = new CityTour.RoadNavigator(roadNetwork, pathFinder, CityTour.Coordinates.sceneXToMapX(targetPositionX), CityTour.Coordinates.sceneZToMapZ(targetPositionZ));
    }
    else if (verticalMode === HOVERING_MODE) {
      targetPositionY = HOVERING_Y;
      targetRotationX = 0.0;

      frameCountPositionY = frameCount(positionY, targetPositionY, POSITION_Y_DELTA);
      frameCountRotationX = frameCount(rotationX, targetRotationX, BIRDSEYE_X_ROTATION_DELTA);
    }

    positionXStationaryGenerator = new CityTour.MotionGenerator(positionX, positionX, new CityTour.LinearEasing(0));
    positionYStationaryGenerator = new CityTour.MotionGenerator(positionY, positionY, new CityTour.LinearEasing(0));
    positionZStationaryGenerator = new CityTour.MotionGenerator(positionZ, positionZ, new CityTour.LinearEasing(0));
    rotationXStationaryGenerator = new CityTour.MotionGenerator(rotationX, rotationX, new CityTour.LinearEasing(0));
    rotationYStationaryGenerator = new CityTour.MotionGenerator(targetRotationY, targetRotationY, new CityTour.LinearEasing(0));

    positionXGenerator = new CityTour.MotionGenerator(positionX, targetPositionX, new CityTour.LinearEasing(frameCountPositionX));
    positionYGenerator = new CityTour.MotionGenerator(positionY, targetPositionY, new CityTour.LinearEasing(frameCountPositionY));
    positionZGenerator = new CityTour.MotionGenerator(positionZ, targetPositionZ, new CityTour.LinearEasing(frameCountPositionZ));
    rotationXGenerator = new CityTour.MotionGenerator(rotationX, targetRotationX, new CityTour.LinearEasing(frameCountRotationX));
    rotationYGenerator = new CityTour.MotionGenerator(rotationY, targetRotationY, new CityTour.LinearEasing(frameCountRotationY));

    // Y rotation
    newAnimations.push(new CityTour.Animation(positionXStationaryGenerator,
                                              positionYStationaryGenerator,
                                              positionZStationaryGenerator,
                                              rotationXStationaryGenerator,
                                              rotationYGenerator));

    // Rest of the movement
    newAnimations.push(new CityTour.Animation(positionXGenerator,
                                              positionYGenerator,
                                              positionZGenerator,
                                              rotationXGenerator,
                                              rotationYStationaryGenerator));

    return newAnimations;
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
    if (animations[0].finished()) {
      animations.splice(0, 1);

      if (animations.length === 0) {
        if (framesInCurrentVerticalMode >= VERTICAL_MODE_DURATION_IN_FRAMES) {
          verticalMode = MODE_TRANSITIONS[verticalMode];
          framesInCurrentVerticalMode = 0;
        }

        animations = buildNextAnimations();
      }
    }

    animations[0].tick();
    positionX = animations[0].positionX();
    positionY = Math.max(animations[0].positionY(), roadHeightAtCurrentPosition() + MINIMUM_HEIGHT_OFF_GROUND);
    positionZ = animations[0].positionZ();
    rotationX = animations[0].rotationX();
    rotationY = animations[0].rotationY();

    framesInCurrentVerticalMode += 1;
  };


  animations = buildNextAnimations();

  return {
    positionX: function() { return positionX; },
    positionY: function() { return positionY; },
    positionZ: function() { return positionZ; },
    rotationX: function() { return rotationX; },
    rotationY: function() { return rotationY; },
    tick: tick,
  };
};

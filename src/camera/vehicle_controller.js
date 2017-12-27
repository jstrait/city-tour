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

  var atan2AngleToViewAngle = function(atan2Angle) {
    if (atan2Angle >= 0) {
      return atan2Angle - HALF_PI;
    }
    else if (atan2Angle < 0) {
      return atan2Angle + TWO_PI;
    }
  };

  var buildIntroAnimations = function(initial) {
    var targetPositionX, targetPositionY, targetPositionZ, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var distanceToTarget;
    var birdsEyeTargetMapX, birdsEyeTargetMapZ;
    var newAnimations = [];

    var cityCenterX = CityTour.Coordinates.mapXToSceneX(navigator.targetMapX());
    var cityCenterZ = CityTour.Coordinates.mapZToSceneZ(navigator.targetMapZ());
    var birdsEyeTargetMapX, birdsEyeTargetMapZ;

    var angleOfPositionToCityCenter = Math.atan2(-(initial.positionZ - cityCenterZ), initial.positionX - cityCenterX) + Math.PI;
    var viewAngleToCityCenter = atan2AngleToViewAngle(angleOfPositionToCityCenter);

    // Prevent turns wider than 180 degrees
    if ((initial.rotationY - viewAngleToCityCenter) > Math.PI) {
      viewAngleToCityCenter += TWO_PI;
    }
    else if ((initial.rotationY - viewAngleToCityCenter) < -Math.PI) {
      viewAngleToCityCenter -= TWO_PI;
    }

    var positiveViewAngleToCityCenter = viewAngleToCityCenter;
    if (positiveViewAngleToCityCenter < 0) {
      positiveViewAngleToCityCenter += TWO_PI;
    }

    if (positiveViewAngleToCityCenter >= ((7 * Math.PI) / 4) || positiveViewAngleToCityCenter < (Math.PI / 4)) {  // Moving north-ish
      birdsEyeTargetMapX = 0;
      birdsEyeTargetMapZ = -5;
    }
    else if (positiveViewAngleToCityCenter >= (Math.PI / 4) && positiveViewAngleToCityCenter < ((3 * Math.PI) / 4)) {  // Moving west-ish
      birdsEyeTargetMapX = -5;
      birdsEyeTargetMapZ = 0;
    }
    else if (positiveViewAngleToCityCenter >= ((3 * Math.PI) / 4) && positiveViewAngleToCityCenter < ((5 * Math.PI) / 4)) { // Moving south-ish
      birdsEyeTargetMapX = 0;
      birdsEyeTargetMapZ = 5;
    }
    else if (positiveViewAngleToCityCenter >= ((5 * Math.PI) / 4) && positiveViewAngleToCityCenter < ((7 * Math.PI) / 4)) { // Moving east-ish
      birdsEyeTargetMapX = 5;
      birdsEyeTargetMapZ = 0;
    }

    targetPositionX = cityCenterX;
    targetPositionY = BIRDSEYE_Y;
    targetPositionZ = cityCenterZ;
    targetRotationX = BIRDSEYE_X_ROTATION;
    targetRotationY = viewAngleToCityCenter;

    distanceToTarget = CityTour.Math.distanceBetweenPoints3D(initial.positionX, initial.positionY, initial.positionZ, targetPositionX, targetPositionY, targetPositionZ);

    frameCountPositionX = Math.ceil(distanceToTarget / HORIZONTAL_MOTION_DELTA);
    frameCountPositionX = Math.max(60, Math.min(3 * 60, frameCountPositionX));
    frameCountPositionY = frameCountPositionX;
    frameCountPositionZ = frameCountPositionX;
    frameCountRotationX = frameCountPositionX;
    frameCountRotationY = Math.min(frameCountPositionX, frameCount(initial.rotationY, targetRotationY, 0.008));

    // Move to center of the city
    positionXGenerator = new CityTour.MotionGenerator(initial.positionX, targetPositionX, new CityTour.LinearEasing(frameCountPositionX));
    positionYGenerator = new CityTour.MotionGenerator(initial.positionY, targetPositionY, new CityTour.SmoothStepEasing(frameCountPositionY));
    positionZGenerator = new CityTour.MotionGenerator(initial.positionZ, targetPositionZ, new CityTour.LinearEasing(frameCountPositionZ));
    rotationXGenerator = new CityTour.MotionGenerator(initial.rotationX, targetRotationX, new CityTour.SmoothStepEasing(frameCountRotationX));
    rotationYGenerator = new CityTour.MotionGenerator(initial.rotationY, targetRotationY, new CityTour.SineEasing(frameCountRotationY, 0, HALF_PI));
    newAnimations.push(new CityTour.Animation(positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator));

    // Bird's eye animation to a point where the "real" bird's eye animation will begin
    var birdsEyeAnimations = buildBirdsEyeAnimations({ positionX: targetPositionX,
                                                       positionY: targetPositionY,
                                                       positionZ: targetPositionZ,
                                                       rotationX: targetRotationX,
                                                       rotationY: targetRotationY },
                                                     CityTour.Coordinates.mapXToSceneX(birdsEyeTargetMapX),
                                                     CityTour.Coordinates.mapZToSceneZ(birdsEyeTargetMapZ));

    return newAnimations.concat(birdsEyeAnimations);
  };

  var buildBirdsEyeAnimations = function(initial, targetPositionX, targetPositionZ) {
    var targetPositionX, targetPositionY, targetPositionZ, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXStationaryGenerator, positionYStationaryGenerator, positionZStationaryGenerator, rotationXStationaryGenerator, rotationYStationaryGenerator;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var newAnimations = [];

    frameCountPositionX = Math.ceil(CityTour.Math.distanceBetweenPoints(initial.positionX, initial.positionZ, targetPositionX, targetPositionZ) / HORIZONTAL_MOTION_DELTA);
    frameCountPositionZ = frameCountPositionX;

    targetRotationY = determineRotationAngle(initial.positionX, initial.positionZ, initial.rotationY, targetPositionX, targetPositionZ);
    frameCountRotationY = frameCount(initial.rotationY, targetRotationY, ROTATION_Y_DELTA);

    targetPositionY = BIRDSEYE_Y;
    targetRotationX = BIRDSEYE_X_ROTATION;

    frameCountPositionY = frameCount(initial.positionY, targetPositionY, POSITION_Y_DELTA);
    frameCountRotationX = frameCount(initial.rotationX, targetRotationX, BIRDSEYE_X_ROTATION_DELTA);

    positionXStationaryGenerator = new CityTour.MotionGenerator(initial.positionX, initial.positionX, new CityTour.LinearEasing(0));
    positionYStationaryGenerator = new CityTour.MotionGenerator(initial.positionY, initial.positionY, new CityTour.LinearEasing(0));
    positionZStationaryGenerator = new CityTour.MotionGenerator(initial.positionZ, initial.positionZ, new CityTour.LinearEasing(0));
    rotationXStationaryGenerator = new CityTour.MotionGenerator(initial.rotationX, initial.rotationX, new CityTour.LinearEasing(0));
    rotationYStationaryGenerator = new CityTour.MotionGenerator(targetRotationY, targetRotationY, new CityTour.LinearEasing(0));

    positionXGenerator = new CityTour.MotionGenerator(initial.positionX, targetPositionX, new CityTour.LinearEasing(frameCountPositionX));
    positionYGenerator = new CityTour.MotionGenerator(initial.positionY, targetPositionY, new CityTour.LinearEasing(frameCountPositionY));
    positionZGenerator = new CityTour.MotionGenerator(initial.positionZ, targetPositionZ, new CityTour.LinearEasing(frameCountPositionZ));
    rotationXGenerator = new CityTour.MotionGenerator(targetRotationX, initial.rotationX, new CityTour.SteepEasing(frameCountRotationX, 0.0, 1.0));
    rotationYGenerator = new CityTour.MotionGenerator(initial.rotationY, targetRotationY, new CityTour.LinearEasing(frameCountRotationY));

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

  var buildHoveringAnimations = function(initial, targetPositionX, targetPositionZ) {
    var targetPositionX, targetPositionY, targetPositionZ, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXStationaryGenerator, positionYStationaryGenerator, positionZStationaryGenerator, rotationXStationaryGenerator, rotationYStationaryGenerator;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var newAnimations = [];

    frameCountPositionX = Math.ceil(CityTour.Math.distanceBetweenPoints(positionX, positionZ, targetPositionX, targetPositionZ) / HORIZONTAL_MOTION_DELTA);
    frameCountPositionZ = frameCountPositionX;

    targetRotationY = determineRotationAngle(positionX, positionZ, rotationY, targetPositionX, targetPositionZ);
    frameCountRotationY = frameCount(rotationY, targetRotationY, ROTATION_Y_DELTA);

    targetPositionY = HOVERING_Y;
    targetRotationX = 0.0;

    frameCountPositionY = frameCount(positionY, targetPositionY, POSITION_Y_DELTA);
    frameCountRotationX = frameCount(rotationX, targetRotationX, BIRDSEYE_X_ROTATION_DELTA);

    positionXStationaryGenerator = new CityTour.MotionGenerator(positionX, positionX, new CityTour.LinearEasing(0));
    positionYStationaryGenerator = new CityTour.MotionGenerator(positionY, positionY, new CityTour.LinearEasing(0));
    positionZStationaryGenerator = new CityTour.MotionGenerator(positionZ, positionZ, new CityTour.LinearEasing(0));
    rotationXStationaryGenerator = new CityTour.MotionGenerator(rotationX, rotationX, new CityTour.LinearEasing(0));
    rotationYStationaryGenerator = new CityTour.MotionGenerator(targetRotationY, targetRotationY, new CityTour.LinearEasing(0));

    positionXGenerator = new CityTour.MotionGenerator(positionX, targetPositionX, new CityTour.LinearEasing(frameCountPositionX));
    positionYGenerator = new CityTour.MotionGenerator(positionY, targetPositionY, new CityTour.LinearEasing(frameCountPositionY));
    positionZGenerator = new CityTour.MotionGenerator(positionZ, targetPositionZ, new CityTour.LinearEasing(frameCountPositionZ));
    rotationXGenerator = new CityTour.MotionGenerator(rotationX, targetRotationX, new CityTour.SteepEasing(frameCountRotationX, -1.0, 0));
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

  var buildDrivingAnimations = function(initial, targetPositionX, targetPositionZ) {
    var targetPositionX, targetPositionY, targetPositionZ, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXStationaryGenerator, positionYStationaryGenerator, positionZStationaryGenerator, rotationXStationaryGenerator, rotationYStationaryGenerator;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var newAnimations = [];

    frameCountPositionX = Math.ceil(CityTour.Math.distanceBetweenPoints(positionX, positionZ, targetPositionX, targetPositionZ) / HORIZONTAL_MOTION_DELTA);
    frameCountPositionZ = frameCountPositionX;

    targetRotationY = determineRotationAngle(positionX, positionZ, rotationY, targetPositionX, targetPositionZ);
    frameCountRotationY = frameCount(rotationY, targetRotationY, ROTATION_Y_DELTA);

    if (verticalMode === DRIVING_MODE) {
      targetPositionY = positionY - (HOVER_TO_DRIVING_POSITION_Y_DELTA * frameCountPositionX);
      targetRotationX = 0.0;

      frameCountPositionY = frameCount(positionY, targetPositionY, HOVER_TO_DRIVING_POSITION_Y_DELTA);
      frameCountRotationX = frameCount(rotationX, targetRotationX, BIRDSEYE_X_ROTATION_DELTA);
      aerialNavigator = undefined;
      navigator = new CityTour.RoadNavigator(roadNetwork, pathFinder, CityTour.Coordinates.sceneXToMapX(targetPositionX), CityTour.Coordinates.sceneZToMapZ(targetPositionZ));
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

  var buildNextAnimations = function() {
    var targetPositionX, targetPositionZ;
    var initial;

    initial = { positionX: positionX,
                positionY: positionY,
                positionZ: positionZ,
                rotationX: rotationX,
                rotationY: rotationY };

    if (verticalMode === INITIAL_DESCENT) {
      return buildIntroAnimations(initial);
    }

    navigator.nextTarget();
    targetPositionX = CityTour.Coordinates.mapXToSceneX(navigator.targetMapX());
    targetPositionZ = CityTour.Coordinates.mapZToSceneZ(navigator.targetMapZ());

    if (verticalMode === BIRDSEYE_MODE) {
      if (aerialNavigator === undefined) {
        navigator = new CityTour.AerialNavigator(roadNetwork, CityTour.Coordinates.sceneXToMapX(targetPositionX), CityTour.Coordinates.sceneZToMapZ(targetPositionZ));
        aerialNavigator = navigator;
      }

      return buildBirdsEyeAnimations(initial, targetPositionX, targetPositionZ);
    }
    else if (verticalMode === HOVERING_MODE) {
      return buildHoveringAnimations(initial, targetPositionX, targetPositionZ);
    }
    else if (verticalMode === DRIVING_MODE) {
      return buildDrivingAnimations(initial, targetPositionX, targetPositionZ);
    }

    return [];
  };

  var determineRotationAngle = function(oldTargetPositionX, oldTargetPositionZ, oldRotationY, targetPositionX, targetPositionZ) {
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
    if ((oldRotationY - newTargetYRotation) > Math.PI) {
      newTargetYRotation += TWO_PI;
    }
    else if ((oldRotationY - newTargetYRotation) < -Math.PI) {
      newTargetYRotation -= TWO_PI;
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

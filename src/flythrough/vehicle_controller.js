"use strict";

import { CityTourMath } from "./../math";
import { PathFinder } from "./../path_finder";
import { AerialNavigator } from "./aerial_navigator";
import { Animation } from "./animation";
import { CurveAnimation } from "./curve_animation";
import { DrivingCurveBuilder } from "./driving_curve_builder";
import { LinearEasing } from "./easing";
import { SineEasing } from "./easing";
import { SmoothStepEasing } from "./easing";
import { SteepEasing } from "./easing";
import { MotionGenerator } from "./motion_generator";
import { StaticMotionGenerator } from "./motion_generator";
import { RoadNavigator } from "./road_navigator";

const HALF_PI = Math.PI * 0.5;
const TWO_PI = Math.PI * 2.0;

var VehicleController = function(terrain, roadNetwork, initial, initialTargetX, initialTargetZ) {
  var INITIAL_DESCENT = "initial_descent";
  var DRIVING_MODE = "driving";
  var HOVERING_MODE = "hovering";
  var BIRDSEYE_MODE = "birdseye";

  var DRIVING_HORIZONTAL_MOTION_DELTA = 0.016666666666667;
  var FLYING_HORIZONTAL_MOTION_DELTA = 0.025;
  var BIRDSEYE_Y = 12.5;
  var HOVERING_Y = 1.25;
  var POSITION_Y_DELTA = 0.166666666666667;
  var HOVER_TO_DRIVING_POSITION_Y_DELTA = 0.004166666666667;
  var BIRDSEYE_X_ROTATION = -(Math.PI / 3);
  var BIRDSEYE_X_ROTATION_DELTA = 0.0155140377955;
  var ROTATION_Y_DELTA = 0.03;

  var MODE_TRANSITIONS = {};
  MODE_TRANSITIONS[INITIAL_DESCENT] = DRIVING_MODE;
  MODE_TRANSITIONS[BIRDSEYE_MODE] = HOVERING_MODE;
  MODE_TRANSITIONS[HOVERING_MODE] = DRIVING_MODE;
  MODE_TRANSITIONS[DRIVING_MODE] = BIRDSEYE_MODE;

  var MINIMUM_HEIGHT_OFF_GROUND = 0.041666666666667;

  var positionX = initial.positionX;
  var positionY = initial.positionY;
  var positionZ = initial.positionZ;
  var rotationX = initial.rotationX;
  var rotationY = initial.rotationY;

  var animations;

  var MODE_DURATION_IN_FRAMES = 2000;
  var framesInCurrentMode = MODE_DURATION_IN_FRAMES + 1;
  var mode = INITIAL_DESCENT;

  var navigator;
  var aerialNavigator;
  var pathFinder = new PathFinder(roadNetwork);


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

  var buildIntroAnimations = function(initial, targetPositionX, targetPositionZ) {
    var targetPositionY, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var distanceToTarget;
    var directionX;
    var directionZ;
    var descentTargetX, descentTargetZ;
    var descentTargetPositionX, descentTargetPositionY, descentTargetPositionZ;
    var drivingTargetX, drivingTargetZ;
    var drivingTargetPositionX, drivingTargetPositionZ, drivingTargetRotationY;
    var diveFrameCount;
    var newAnimations = [];
    var drivingAnimations;
    var i;

    var angleOfPositionToCityCenter = Math.atan2(-(initial.positionZ - targetPositionZ), initial.positionX - targetPositionX) + Math.PI;
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
      directionX = 0;
      directionZ = -1;
    }
    else if (positiveViewAngleToCityCenter >= (Math.PI / 4) && positiveViewAngleToCityCenter < ((3 * Math.PI) / 4)) {  // Moving west-ish
      directionX = -1;
      directionZ = 0;
    }
    else if (positiveViewAngleToCityCenter >= ((3 * Math.PI) / 4) && positiveViewAngleToCityCenter < ((5 * Math.PI) / 4)) { // Moving south-ish
      directionX = 0;
      directionZ = 1;
    }
    else if (positiveViewAngleToCityCenter >= ((5 * Math.PI) / 4) && positiveViewAngleToCityCenter < ((7 * Math.PI) / 4)) { // Moving east-ish
      directionX = 1;
      directionZ = 0;
    }

    descentTargetX = targetPositionX + (directionX * 3);
    descentTargetZ = targetPositionZ + (directionZ * 3);

    // Prevent attempting to navigate to non-existent road intersection, which will cause things to blow up
    if (!roadNetwork.hasIntersection(descentTargetX, descentTargetZ)) {
      descentTargetX = targetPositionX;
      descentTargetZ = targetPositionZ;
      drivingTargetX = targetPositionX;
      drivingTargetZ = targetPositionZ;
    }
    else {
      drivingTargetX = descentTargetX;
      drivingTargetZ = descentTargetZ;

      i = 0;
      while (i < 3 &&
             roadNetwork.edgeBetween(drivingTargetX, drivingTargetZ, drivingTargetX + directionX, drivingTargetZ + directionZ) !== undefined) {
        drivingTargetX += directionX;
        drivingTargetZ += directionZ;
        i += 1;
      }
    }

    targetPositionY = BIRDSEYE_Y + roadNetwork.getRoadHeight(targetPositionX, targetPositionZ);
    targetRotationX = -HALF_PI;
    targetRotationY = viewAngleToCityCenter;

    distanceToTarget = CityTourMath.distanceBetweenPoints3D(initial.positionX, initial.positionY, initial.positionZ, targetPositionX, targetPositionY, targetPositionZ);

    frameCountPositionX = Math.ceil(distanceToTarget / DRIVING_HORIZONTAL_MOTION_DELTA);
    frameCountPositionX = CityTourMath.clamp(frameCountPositionX, 60, 3 * 60);
    frameCountPositionY = frameCountPositionX;
    frameCountPositionZ = frameCountPositionX;
    frameCountRotationX = frameCountPositionX;
    frameCountRotationY = CityTourMath.clamp(frameCount(initial.rotationY, targetRotationY, 0.008), 60, frameCountPositionX);

    // Move to point above center of the city, looking straight down
    positionXGenerator = new MotionGenerator(initial.positionX, targetPositionX, new LinearEasing(frameCountPositionX));
    positionYGenerator = new MotionGenerator(initial.positionY, targetPositionY, new SmoothStepEasing(frameCountPositionY));
    positionZGenerator = new MotionGenerator(initial.positionZ, targetPositionZ, new LinearEasing(frameCountPositionZ));
    rotationXGenerator = new MotionGenerator(initial.rotationX, targetRotationX, new SmoothStepEasing(frameCountRotationX, -1.0, 0.0));
    rotationYGenerator = new MotionGenerator(initial.rotationY, targetRotationY, new SineEasing(frameCountRotationY, 0, HALF_PI));
    newAnimations.push(new Animation(positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator));

    descentTargetPositionX = descentTargetX;
    descentTargetPositionZ = descentTargetZ;
    descentTargetPositionY = roadNetwork.getRoadHeight(descentTargetPositionX, descentTargetPositionZ);

    drivingTargetPositionX = drivingTargetX;
    drivingTargetPositionZ = drivingTargetZ;
    drivingTargetRotationY = determineAzimuthAngle(targetPositionX, targetPositionZ, targetRotationY, drivingTargetPositionX, drivingTargetPositionZ);

    diveFrameCount = 105;

    // Dive to ground level, and rotate to initial driving X/Y rotation
    newAnimations.push(new Animation(new MotionGenerator(targetPositionX, descentTargetPositionX, new LinearEasing(diveFrameCount)),
                                     new MotionGenerator(descentTargetPositionY, targetPositionY, new SteepEasing(diveFrameCount, 0.0, 1.0)),
                                     new MotionGenerator(targetPositionZ, descentTargetPositionZ, new LinearEasing(diveFrameCount)),
                                     new MotionGenerator(targetRotationX, 0.0, new SineEasing(diveFrameCount, 0.0, HALF_PI)),
                                     new MotionGenerator(targetRotationY, drivingTargetRotationY, new SineEasing(diveFrameCount, 0.0, HALF_PI))));

    // Drive to target point
    drivingAnimations = buildDrivingAnimationsLegacy({ positionX: descentTargetPositionX,
                                                       positionY: descentTargetPositionY,
                                                       positionZ: descentTargetPositionZ,
                                                       rotationX: 0.0,
                                                       rotationY: drivingTargetRotationY, },
                                                     drivingTargetPositionX,
                                                     drivingTargetPositionZ);


    return newAnimations.concat(drivingAnimations);
  };

  var buildBirdsEyeAnimations = function(initial, targetPositionX, targetPositionZ) {
    var targetPositionY, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXStationaryGenerator, positionYStationaryGenerator, positionZStationaryGenerator, rotationXStationaryGenerator, rotationYStationaryGenerator;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var newAnimations = [];

    frameCountPositionX = Math.ceil(CityTourMath.distanceBetweenPoints(initial.positionX, initial.positionZ, targetPositionX, targetPositionZ) / FLYING_HORIZONTAL_MOTION_DELTA);
    frameCountPositionZ = frameCountPositionX;

    targetRotationY = determineAzimuthAngle(initial.positionX, initial.positionZ, initial.rotationY, targetPositionX, targetPositionZ);
    frameCountRotationY = frameCount(initial.rotationY, targetRotationY, ROTATION_Y_DELTA);

    targetPositionY = BIRDSEYE_Y;
    targetRotationX = BIRDSEYE_X_ROTATION;

    frameCountPositionY = frameCount(initial.positionY, targetPositionY, POSITION_Y_DELTA);
    frameCountRotationX = frameCount(initial.rotationX, targetRotationX, BIRDSEYE_X_ROTATION_DELTA);

    positionXStationaryGenerator = new StaticMotionGenerator(initial.positionX);
    positionYStationaryGenerator = new StaticMotionGenerator(initial.positionY);
    positionZStationaryGenerator = new StaticMotionGenerator(initial.positionZ);
    rotationXStationaryGenerator = new StaticMotionGenerator(initial.rotationX);
    rotationYStationaryGenerator = new StaticMotionGenerator(targetRotationY);

    positionXGenerator = new MotionGenerator(initial.positionX, targetPositionX, new LinearEasing(frameCountPositionX));
    positionYGenerator = new MotionGenerator(initial.positionY, targetPositionY, new LinearEasing(frameCountPositionY));
    positionZGenerator = new MotionGenerator(initial.positionZ, targetPositionZ, new LinearEasing(frameCountPositionZ));
    rotationXGenerator = new MotionGenerator(targetRotationX, initial.rotationX, new SteepEasing(frameCountRotationX, 0.0, 1.0));
    rotationYGenerator = new MotionGenerator(initial.rotationY, targetRotationY, new LinearEasing(frameCountRotationY));

    // Y rotation
    newAnimations.push(new Animation(positionXStationaryGenerator,
                                     positionYStationaryGenerator,
                                     positionZStationaryGenerator,
                                     rotationXStationaryGenerator,
                                     rotationYGenerator));

    // Rest of the movement
    newAnimations.push(new Animation(positionXGenerator,
                                     positionYGenerator,
                                     positionZGenerator,
                                     rotationXGenerator,
                                     rotationYStationaryGenerator));


    return newAnimations;
  };

  var buildHoveringAnimations = function(initial, targetPositionX, targetPositionZ) {
    var targetPositionY, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXStationaryGenerator, positionYStationaryGenerator, positionZStationaryGenerator, rotationXStationaryGenerator, rotationYStationaryGenerator;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var newAnimations = [];

    frameCountPositionX = Math.ceil(CityTourMath.distanceBetweenPoints(initial.positionX, initial.positionZ, targetPositionX, targetPositionZ) / FLYING_HORIZONTAL_MOTION_DELTA);
    frameCountPositionZ = frameCountPositionX;

    targetRotationY = determineAzimuthAngle(initial.positionX, initial.positionZ, initial.rotationY, targetPositionX, targetPositionZ);
    frameCountRotationY = frameCount(initial.rotationY, targetRotationY, ROTATION_Y_DELTA);

    targetPositionY = HOVERING_Y;
    targetRotationX = 0.0;

    frameCountPositionY = frameCount(initial.positionY, targetPositionY, POSITION_Y_DELTA);
    frameCountRotationX = frameCount(initial.rotationX, targetRotationX, BIRDSEYE_X_ROTATION_DELTA);

    positionXStationaryGenerator = new StaticMotionGenerator(initial.positionX);
    positionYStationaryGenerator = new StaticMotionGenerator(initial.positionY);
    positionZStationaryGenerator = new StaticMotionGenerator(initial.positionZ);
    rotationXStationaryGenerator = new StaticMotionGenerator(initial.rotationX);
    rotationYStationaryGenerator = new StaticMotionGenerator(targetRotationY);

    positionXGenerator = new MotionGenerator(initial.positionX, targetPositionX, new LinearEasing(frameCountPositionX));
    positionYGenerator = new MotionGenerator(initial.positionY, targetPositionY, new LinearEasing(frameCountPositionY));
    positionZGenerator = new MotionGenerator(initial.positionZ, targetPositionZ, new LinearEasing(frameCountPositionZ));
    rotationXGenerator = new MotionGenerator(initial.rotationX, targetRotationX, new SteepEasing(frameCountRotationX, -1.0, 0));
    rotationYGenerator = new MotionGenerator(initial.rotationY, targetRotationY, new LinearEasing(frameCountRotationY));

    // Y rotation
    newAnimations.push(new Animation(positionXStationaryGenerator,
                                     positionYStationaryGenerator,
                                     positionZStationaryGenerator,
                                     rotationXStationaryGenerator,
                                     rotationYGenerator));

    // Rest of the movement
    newAnimations.push(new Animation(positionXGenerator,
                                     positionYGenerator,
                                     positionZGenerator,
                                     rotationXGenerator,
                                     rotationYStationaryGenerator));

    return newAnimations;
  };

  var buildDrivingAnimationsLegacy = function(initial, targetPositionX, targetPositionZ) {
    var targetPositionY, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXStationaryGenerator, positionYStationaryGenerator, positionZStationaryGenerator, rotationXStationaryGenerator, rotationYStationaryGenerator;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var newAnimations = [];

    frameCountPositionX = Math.ceil(CityTourMath.distanceBetweenPoints(initial.positionX, initial.positionZ, targetPositionX, targetPositionZ) / DRIVING_HORIZONTAL_MOTION_DELTA);
    frameCountPositionZ = frameCountPositionX;

    targetRotationY = determineAzimuthAngle(initial.positionX, initial.positionZ, initial.rotationY, targetPositionX, targetPositionZ);
    frameCountRotationY = frameCount(initial.rotationY, targetRotationY, ROTATION_Y_DELTA);

    targetPositionY = initial.positionY - (HOVER_TO_DRIVING_POSITION_Y_DELTA * frameCountPositionX);
    targetRotationX = 0.0;

    frameCountPositionY = frameCount(initial.positionY, targetPositionY, HOVER_TO_DRIVING_POSITION_Y_DELTA);
    frameCountRotationX = frameCount(initial.rotationX, targetRotationX, BIRDSEYE_X_ROTATION_DELTA);

    positionXStationaryGenerator = new StaticMotionGenerator(initial.positionX);
    positionYStationaryGenerator = new StaticMotionGenerator(initial.positionY);
    positionZStationaryGenerator = new StaticMotionGenerator(initial.positionZ);
    rotationXStationaryGenerator = new StaticMotionGenerator(initial.rotationX);
    rotationYStationaryGenerator = new StaticMotionGenerator(targetRotationY);

    positionXGenerator = new MotionGenerator(initial.positionX, targetPositionX, new LinearEasing(frameCountPositionX));
    positionYGenerator = new MotionGenerator(initial.positionY, targetPositionY, new LinearEasing(frameCountPositionY));
    positionZGenerator = new MotionGenerator(initial.positionZ, targetPositionZ, new LinearEasing(frameCountPositionZ));
    rotationXGenerator = new MotionGenerator(initial.rotationX, targetRotationX, new LinearEasing(frameCountRotationX));
    rotationYGenerator = new MotionGenerator(initial.rotationY, targetRotationY, new LinearEasing(frameCountRotationY));

    // Y rotation
    newAnimations.push(new Animation(positionXStationaryGenerator,
                                     positionYStationaryGenerator,
                                     positionZStationaryGenerator,
                                     rotationXStationaryGenerator,
                                     rotationYGenerator));

    // Rest of the movement
    newAnimations.push(new Animation(positionXGenerator,
                                     positionYGenerator,
                                     positionZGenerator,
                                     rotationXGenerator,
                                     rotationYStationaryGenerator));

    return newAnimations;
  };

  var buildDrivingAnimations = function(initialPositionX, initialPositionZ, targetPositionX, targetPositionZ) {
    var totalPathLength = CityTourMath.distanceBetweenPoints(initialPositionX, initialPositionZ, targetPositionX, targetPositionZ);
    var minPathLength = DRIVING_HORIZONTAL_MOTION_DELTA * MODE_DURATION_IN_FRAMES;
    var path = [{x: initialPositionX, z: initialPositionZ}, {x: targetPositionX, z: targetPositionZ}];
    var currentX;
    var currentZ;
    var curvePath;
    var curvePaths;
    var i;
    var animations = [];
    var segment1;
    var segment2;
    var angle1;
    var angle2;
    var frameCountRotationY;
    var positionXStationaryGenerator;
    var positionYStationaryGenerator;
    var positionZStationaryGenerator;
    var rotationXStationaryGenerator;
    var rotationYGenerator;

    currentX = initialPositionX;
    currentZ = initialPositionZ;

    while (totalPathLength < minPathLength) {
      navigator.nextTarget();

      totalPathLength += CityTourMath.distanceBetweenPoints(currentX, currentZ, navigator.targetX(), navigator.targetZ());
      path.push({x: navigator.targetX(), z: navigator.targetZ()});

      currentX = navigator.targetX();
      currentZ = navigator.targetZ();
    }

    curvePaths = DrivingCurveBuilder.build(roadNetwork, path);

    for (i = 0; i < curvePaths.length - 1; i++) {
      animations.push(CurveAnimation(curvePaths[i], DRIVING_HORIZONTAL_MOTION_DELTA));

      segment1 = curvePaths[i].curves[curvePaths[i].curves.length - 1];
      segment2 = curvePaths[i + 1].curves[0];
      angle1 = Math.atan2(-(segment1.v2.z - segment1.v1.z), segment1.v2.x - segment1.v1.x);
      angle2 = Math.atan2(-(segment2.v2.z - segment2.v1.z), segment2.v2.x - segment2.v1.x);

      if (angle1 === 0.0) {
        angle1 = -HALF_PI;
      }
      else if (angle1 === HALF_PI) {
        angle1 = 0.0;
      }
      else if (angle1 === -Math.PI) {
        angle1 = HALF_PI;
      }
      else if (angle1 === -HALF_PI) {
        angle1 = Math.PI;
      }

      if (angle2 === 0.0) {
        angle2 = -HALF_PI;
      }
      else if (angle2 === HALF_PI) {
        angle2 = 0.0;
      }
      else if (angle2 === -Math.PI) {
        angle2 = HALF_PI;
      }
      else if (angle2 === -HALF_PI) {
        angle2 = Math.PI;
      }

      frameCountRotationY = frameCount(angle1, angle2, ROTATION_Y_DELTA);

      positionXStationaryGenerator = new StaticMotionGenerator(segment1.v2.x);
      positionYStationaryGenerator = new StaticMotionGenerator(segment1.v2.y);
      positionZStationaryGenerator = new StaticMotionGenerator(segment1.v2.z);
      rotationXStationaryGenerator = new StaticMotionGenerator(0.0);
      rotationYGenerator = new MotionGenerator(angle1, angle2, new LinearEasing(frameCountRotationY));

      animations.push(new Animation(positionXStationaryGenerator,
                                    positionYStationaryGenerator,
                                    positionZStationaryGenerator,
                                    rotationXStationaryGenerator,
                                    rotationYGenerator));
    };
    animations.push(CurveAnimation(curvePaths[curvePaths.length - 1], DRIVING_HORIZONTAL_MOTION_DELTA));

    return animations;
  };

  var buildNextAnimations = function(targetPositionX, targetPositionZ) {
    var initial;

    initial = { positionX: positionX,
                positionY: positionY,
                positionZ: positionZ,
                rotationX: rotationX,
                rotationY: rotationY };

    if (mode === INITIAL_DESCENT) {
      return buildIntroAnimations(initial, targetPositionX, targetPositionZ);
    }
    else if (mode === BIRDSEYE_MODE) {
      return buildBirdsEyeAnimations(initial, targetPositionX, targetPositionZ);
    }
    else if (mode === HOVERING_MODE) {
      return buildHoveringAnimations(initial, targetPositionX, targetPositionZ);
    }
    else if (mode === DRIVING_MODE) {
      return buildDrivingAnimations(initial.positionX, initial.positionZ, targetPositionX, targetPositionZ);
    }

    return [];
  };

  var determineAzimuthAngle = function(oldTargetPositionX, oldTargetPositionZ, oldRotationY, targetPositionX, targetPositionZ) {
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
    var roadHeight = roadNetwork.getRoadHeight(positionX, positionZ);

    if (roadHeight === undefined) {
      roadHeight = terrain.heightAt(positionX, positionZ) || 0.0;
    }

    return roadHeight;
  };

  var tick = function() {
    if (animations[0].finished()) {
      animations.splice(0, 1);

      if (animations.length === 0) {
        if (framesInCurrentMode >= MODE_DURATION_IN_FRAMES) {
          mode = MODE_TRANSITIONS[mode];
          framesInCurrentMode = 0;

          if (mode === BIRDSEYE_MODE || mode === HOVERING_MODE) {
            if (aerialNavigator === undefined) {
              navigator = new AerialNavigator(roadNetwork, positionX, positionZ);
              aerialNavigator = navigator;
            }
          }
          else if (mode === DRIVING_MODE) {
            aerialNavigator = undefined;
            navigator = new RoadNavigator(roadNetwork, pathFinder,positionX, positionZ);
          }
        }

        navigator.nextTarget();

        animations = buildNextAnimations(navigator.targetX(),
                                         navigator.targetZ());
      }
    }

    animations[0].tick();
    positionX = animations[0].positionX();
    positionY = Math.max(animations[0].positionY(), roadHeightAtCurrentPosition() + MINIMUM_HEIGHT_OFF_GROUND);
    positionZ = animations[0].positionZ();
    rotationX = animations[0].rotationX();
    rotationY = animations[0].rotationY();

    framesInCurrentMode += 1;
  };


  animations = buildNextAnimations(initialTargetX, initialTargetZ);

  return {
    positionX: function() { return positionX; },
    positionY: function() { return positionY; },
    positionZ: function() { return positionZ; },
    rotationX: function() { return rotationX; },
    rotationY: function() { return rotationY; },
    tick: tick,
  };
};

export { VehicleController };

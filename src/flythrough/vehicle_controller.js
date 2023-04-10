"use strict";

import * as THREE from "three";

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

const INTRO_MODE = "intro";
const DRIVING_MODE = "driving";
const AIRPLANE_MODE = "airplane";
const HELICOPTER_MODE = "helicopter";

const MODE_TRANSITIONS = {};
MODE_TRANSITIONS[INTRO_MODE] = AIRPLANE_MODE;
MODE_TRANSITIONS[DRIVING_MODE] = AIRPLANE_MODE;
MODE_TRANSITIONS[AIRPLANE_MODE] = HELICOPTER_MODE;
MODE_TRANSITIONS[HELICOPTER_MODE] = DRIVING_MODE;
Object.freeze(MODE_TRANSITIONS);

const MODE_DURATION_IN_FRAMES = 2000;

const DRIVING_HORIZONTAL_MOTION_DELTA = 0.016666666666667;
const FLYING_HORIZONTAL_MOTION_DELTA = 0.025;
const AIRPLANE_Y = 12.5;
const HELICOPTER_Y = 1.25;
const POSITION_Y_DELTA = 0.166666666666667;
const HELICOPTER_TO_DRIVING_POSITION_Y_DELTA = 0.004166666666667;
const AIRPLANE_X_ROTATION = -(Math.PI / 3);
const AIRPLANE_X_ROTATION_DELTA = 0.0155140377955;
const ROTATION_Y_DELTA = 0.03;

const MINIMUM_HEIGHT_OFF_GROUND = 0.041666666666667;

var VehicleController = function(terrain, roadNetwork, neighborhoods, sceneView, initial) {
  var positionX = initial.positionX;
  var positionY = initial.positionY;
  var positionZ = initial.positionZ;
  var rotationX = initial.rotationX;
  var rotationY = initial.rotationY;

  var animations;

  var framesInCurrentMode = MODE_DURATION_IN_FRAMES + 1;
  var mode = INTRO_MODE;

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
             roadNetwork.hasEdgeBetween(drivingTargetX, drivingTargetZ, drivingTargetX + directionX, drivingTargetZ + directionZ) === true) {
        drivingTargetX += directionX;
        drivingTargetZ += directionZ;
        i += 1;
      }
    }

    targetPositionY = AIRPLANE_Y + roadNetwork.getRoadHeight(targetPositionX, targetPositionZ);
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
    drivingTargetRotationY = determineTargetAzimuthAngle(targetPositionX, targetPositionZ, targetRotationY, drivingTargetPositionX, drivingTargetPositionZ);

    diveFrameCount = 105;

    // Dive to ground level, and rotate to initial driving X/Y rotation
    newAnimations.push(new Animation(new MotionGenerator(targetPositionX, descentTargetPositionX, new LinearEasing(diveFrameCount)),
                                     new MotionGenerator(descentTargetPositionY, targetPositionY, new SteepEasing(diveFrameCount, 0.0, 1.0)),
                                     new MotionGenerator(targetPositionZ, descentTargetPositionZ, new LinearEasing(diveFrameCount)),
                                     new MotionGenerator(targetRotationX, 0.0, new SineEasing(diveFrameCount, 0.0, HALF_PI)),
                                     new MotionGenerator(targetRotationY, drivingTargetRotationY, new SineEasing(diveFrameCount, 0.0, HALF_PI))));

    // Drive to target point
    navigator = new RoadNavigator(roadNetwork, pathFinder, drivingTargetPositionX, drivingTargetPositionZ);
    drivingAnimations = buildDrivingAnimations(descentTargetPositionX, descentTargetPositionZ, drivingTargetRotationY, drivingTargetPositionX, drivingTargetPositionZ);

    return newAnimations.concat(drivingAnimations);
  };

  var buildAirplaneAnimations = function(initial, targetPositionX, targetPositionZ) {
    var targetPositionY, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXStationaryGenerator, positionYStationaryGenerator, positionZStationaryGenerator, rotationXStationaryGenerator, rotationYStationaryGenerator;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var newAnimations = [];

    frameCountPositionX = Math.ceil(CityTourMath.distanceBetweenPoints(initial.positionX, initial.positionZ, targetPositionX, targetPositionZ) / FLYING_HORIZONTAL_MOTION_DELTA);
    frameCountPositionZ = frameCountPositionX;

    targetRotationY = determineTargetAzimuthAngle(initial.positionX, initial.positionZ, initial.rotationY, targetPositionX, targetPositionZ);
    frameCountRotationY = frameCount(initial.rotationY, targetRotationY, ROTATION_Y_DELTA);

    targetPositionY = AIRPLANE_Y;
    targetRotationX = AIRPLANE_X_ROTATION;

    frameCountPositionY = frameCount(initial.positionY, targetPositionY, POSITION_Y_DELTA);
    frameCountRotationX = frameCount(initial.rotationX, targetRotationX, AIRPLANE_X_ROTATION_DELTA);

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

  var buildAirplaneAnimationsExperimental = function(initial, targetPositionX, targetPositionZ) {
    var minPathLength = FLYING_HORIZONTAL_MOTION_DELTA * MODE_DURATION_IN_FRAMES;
    var neighborhood;
    var points = [new THREE.Vector3(initial.positionX, terrain.heightAt(initial.positionX, initial.positionZ) + AIRPLANE_Y, initial.positionZ)];
    var curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 1.0);

    while (curve.getLength() < minPathLength) {
      neighborhood = neighborhoods[CityTourMath.randomInteger(0, neighborhoods.length - 1)];
      points.push(new THREE.Vector3(neighborhood.centerX, terrain.heightAt(neighborhood.centerX, neighborhood.centerZ) + AIRPLANE_Y, neighborhood.centerZ));
      curve.updateArcLengths();
    }

    return [CurveAnimation(curve, FLYING_HORIZONTAL_MOTION_DELTA, AIRPLANE_X_ROTATION)];
  };

  var buildHelicopterAnimations = function(initial, targetPositionX, targetPositionZ) {
    var targetPositionY, targetRotationX, targetRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    var positionXStationaryGenerator, positionYStationaryGenerator, positionZStationaryGenerator, rotationXStationaryGenerator, rotationYStationaryGenerator;
    var positionXGenerator, positionYGenerator, positionZGenerator, rotationXGenerator, rotationYGenerator;
    var newAnimations = [];

    frameCountPositionX = Math.ceil(CityTourMath.distanceBetweenPoints(initial.positionX, initial.positionZ, targetPositionX, targetPositionZ) / FLYING_HORIZONTAL_MOTION_DELTA);
    frameCountPositionZ = frameCountPositionX;

    targetRotationY = determineTargetAzimuthAngle(initial.positionX, initial.positionZ, initial.rotationY, targetPositionX, targetPositionZ);
    frameCountRotationY = frameCount(initial.rotationY, targetRotationY, ROTATION_Y_DELTA);

    targetPositionY = HELICOPTER_Y;
    targetRotationX = 0.0;

    frameCountPositionY = frameCount(initial.positionY, targetPositionY, POSITION_Y_DELTA);
    frameCountRotationX = frameCount(initial.rotationX, targetRotationX, AIRPLANE_X_ROTATION_DELTA);

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

  var buildDrivingAnimations = function(initialPositionX, initialPositionZ, initialRotationY, targetPositionX, targetPositionZ) {
    var totalPathLength = CityTourMath.distanceBetweenPoints(initialPositionX, initialPositionZ, targetPositionX, targetPositionZ);
    var minPathLength = DRIVING_HORIZONTAL_MOTION_DELTA * MODE_DURATION_IN_FRAMES;
    var path = [{x: initialPositionX, z: initialPositionZ}];
    var currentX;
    var currentZ;
    var initialDirectionX;
    var initialDirectionZ;
    var curvePath;
    var curvePaths;
    var animations = [];
    var initialCurveSegment;
    var targetAngle;
    var frameCountRotationY;
    var positionXStationaryGenerator;
    var positionYStationaryGenerator;
    var positionZStationaryGenerator;
    var rotationXStationaryGenerator;
    var rotationYGenerator;
    var rotationY = initialRotationY;

    currentX = initialPositionX;
    currentZ = initialPositionZ;
    initialDirectionX = Math.sign(targetPositionX - initialPositionX);
    initialDirectionZ = Math.sign(targetPositionZ - initialPositionZ);

    while (currentX !== targetPositionX || currentZ !== targetPositionZ) {
      currentX += initialDirectionX;
      currentZ += initialDirectionZ;

      path.push({x: currentX, z: currentZ});
    }

    while (totalPathLength < minPathLength) {
      navigator.nextTarget();

      totalPathLength += CityTourMath.distanceBetweenPoints(currentX, currentZ, navigator.targetX(), navigator.targetZ());
      path.push({x: navigator.targetX(), z: navigator.targetZ()});

      currentX = navigator.targetX();
      currentZ = navigator.targetZ();
    }

    curvePaths = DrivingCurveBuilder.build(roadNetwork, path);

    for (curvePath of curvePaths) {
      initialCurveSegment = curvePath.curves[0];
      targetAngle = determineTargetAzimuthAngle(initialCurveSegment.v1.x, initialCurveSegment.v1.z, rotationY, initialCurveSegment.v2.x, initialCurveSegment.v2.z);

      frameCountRotationY = frameCount(rotationY, targetAngle, ROTATION_Y_DELTA);

      if (frameCountRotationY > 0) {
        positionXStationaryGenerator = new StaticMotionGenerator(initialCurveSegment.v1.x);
        positionYStationaryGenerator = new StaticMotionGenerator(initialCurveSegment.v1.y);
        positionZStationaryGenerator = new StaticMotionGenerator(initialCurveSegment.v1.z);
        rotationXStationaryGenerator = new StaticMotionGenerator(0.0);
        rotationYGenerator = new MotionGenerator(rotationY, targetAngle, new LinearEasing(frameCountRotationY));

        animations.push(new Animation(positionXStationaryGenerator,
                                      positionYStationaryGenerator,
                                      positionZStationaryGenerator,
                                      rotationXStationaryGenerator,
                                      rotationYGenerator));
      }

      animations.push(CurveAnimation(curvePath, DRIVING_HORIZONTAL_MOTION_DELTA, 0.0));

      rotationY = targetAngle;
    };

    sceneView.setRouteCurves(curvePaths);

    return animations;
  };

  var buildNextAnimations = function(targetPositionX, targetPositionZ) {
    var initial;

    initial = { positionX: positionX,
                positionY: positionY,
                positionZ: positionZ,
                rotationX: rotationX,
                rotationY: rotationY };

    if (mode === INTRO_MODE) {
      return buildIntroAnimations(initial, targetPositionX, targetPositionZ);
    }
    else if (mode === AIRPLANE_MODE) {
      return buildAirplaneAnimations(initial, targetPositionX, targetPositionZ);
    }
    else if (mode === HELICOPTER_MODE) {
      return buildHelicopterAnimations(initial, targetPositionX, targetPositionZ);
    }
    else if (mode === DRIVING_MODE) {
      return buildDrivingAnimations(initial.positionX, initial.positionZ, initial.rotationY, targetPositionX, targetPositionZ);
    }

    return [];
  };

  var determineTargetAzimuthAngle = function(initialPositionX, initialPositionZ, initialRotationY, targetPositionX, targetPositionZ) {
    var newTargetYRotation;

    var x = targetPositionX - initialPositionX;
    var z = -(targetPositionZ - initialPositionZ);
    var angle = Math.atan2(z, x);
    if (angle < HALF_PI) {
      angle += TWO_PI;
    }
    var rightHandedAngle = angle - HALF_PI;

    newTargetYRotation = rightHandedAngle;

    // Prevent turns wider than 180 degrees
    if ((initialRotationY - newTargetYRotation) > Math.PI) {
      newTargetYRotation += TWO_PI;
    }
    else if ((initialRotationY - newTargetYRotation) < -Math.PI) {
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

          if (mode === AIRPLANE_MODE || mode === HELICOPTER_MODE) {
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


  animations = buildNextAnimations(neighborhoods[0].centerX, neighborhoods[0].centerZ);

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

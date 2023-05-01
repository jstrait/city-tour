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

const QUARTER_PI = Math.PI * 0.25;
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

const INTRO_DIVE_FRAME_COUNT = 105;
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

  let isDrivingModeLanded = null;

  var frameCount = function(start, target, delta) {
    if (delta < 0) {
      console.warn("Animation delta (" + delta + ") less than zero, will never complete!");
    }

    return Math.ceil(Math.abs(target - start) / delta);
  };

  var buildIntroAnimations = function(initial, topOfDivePositionX, topOfDivePositionZ) {
    let topOfDivePositionY, topOfDiveRotationX, topOfDiveRotationY;
    var frameCountPositionX, frameCountPositionY, frameCountPositionZ, frameCountRotationX, frameCountRotationY;
    let distanceToTopOfDive;
    let diveDirectionX;
    let diveDirectionZ;
    let bottomOfDivePositionX, bottomOfDivePositionY, bottomOfDivePositionZ, bottomOfDiveRotationY;
    var drivingTargetPositionX, drivingTargetPositionZ;
    var newAnimations = [];
    var drivingAnimations;
    var i;

    let azimuthAngleToTopOfDive = azimuthAngleToPoint(initial.positionX, initial.positionZ, topOfDivePositionX, topOfDivePositionZ);
    topOfDiveRotationY = minimizeAngleDifference(azimuthAngleToTopOfDive, initial.rotationY);

    topOfDivePositionY = AIRPLANE_Y + roadNetwork.getRoadHeight(topOfDivePositionX, topOfDivePositionZ);
    topOfDiveRotationX = -HALF_PI;
    distanceToTopOfDive = CityTourMath.distanceBetweenPoints3D(initial.positionX, initial.positionY, initial.positionZ, topOfDivePositionX, topOfDivePositionY, topOfDivePositionZ);

    if (azimuthAngleToTopOfDive >= (7 * QUARTER_PI) || azimuthAngleToTopOfDive < QUARTER_PI) {  // Moving north-ish
      diveDirectionX = 0;
      diveDirectionZ = -1;
    }
    else if (azimuthAngleToTopOfDive >= QUARTER_PI && azimuthAngleToTopOfDive < (3 * QUARTER_PI)) {  // Moving west-ish
      diveDirectionX = -1;
      diveDirectionZ = 0;
    }
    else if (azimuthAngleToTopOfDive >= (3 * QUARTER_PI) && azimuthAngleToTopOfDive < (5 * QUARTER_PI)) { // Moving south-ish
      diveDirectionX = 0;
      diveDirectionZ = 1;
    }
    else if (azimuthAngleToTopOfDive >= (5 * QUARTER_PI) && azimuthAngleToTopOfDive < (7 * QUARTER_PI)) { // Moving east-ish
      diveDirectionX = 1;
      diveDirectionZ = 0;
    }

    bottomOfDivePositionX = topOfDivePositionX + (diveDirectionX * 3);
    bottomOfDivePositionZ = topOfDivePositionZ + (diveDirectionZ * 3);

    // Prevent attempting to navigate to non-existent road intersection, which will cause things to blow up
    if (!roadNetwork.hasIntersection(bottomOfDivePositionX, bottomOfDivePositionZ)) {
      bottomOfDivePositionX = topOfDivePositionX;
      bottomOfDivePositionZ = topOfDivePositionZ;
    }

    bottomOfDivePositionY = roadNetwork.getRoadHeight(bottomOfDivePositionX, bottomOfDivePositionZ);
    bottomOfDiveRotationY = determineTargetAzimuthAngle(0, 0, topOfDiveRotationY, diveDirectionX, diveDirectionZ);

    drivingTargetPositionX = bottomOfDivePositionX;
    drivingTargetPositionZ = bottomOfDivePositionZ;

    i = 0;
    while (i < 3 &&
           roadNetwork.hasEdgeBetween(drivingTargetPositionX, drivingTargetPositionZ, drivingTargetPositionX + diveDirectionX, drivingTargetPositionZ + diveDirectionZ) === true) {
      drivingTargetPositionX += diveDirectionX;
      drivingTargetPositionZ += diveDirectionZ;
      i += 1;
    }

    frameCountPositionX = Math.ceil(distanceToTopOfDive / DRIVING_HORIZONTAL_MOTION_DELTA);
    frameCountPositionX = CityTourMath.clamp(frameCountPositionX, 60, 3 * 60);
    frameCountPositionY = frameCountPositionX;
    frameCountPositionZ = frameCountPositionX;
    frameCountRotationX = frameCountPositionX;
    frameCountRotationY = CityTourMath.clamp(frameCount(initial.rotationY, topOfDiveRotationY, 0.008), 60, frameCountPositionX);

    // Move to point above the city, looking straight down
    newAnimations.push(new Animation(new MotionGenerator(initial.positionX, topOfDivePositionX, new LinearEasing(frameCountPositionX)),
                                     new MotionGenerator(initial.positionY, topOfDivePositionY, new SmoothStepEasing(frameCountPositionY)),
                                     new MotionGenerator(initial.positionZ, topOfDivePositionZ, new LinearEasing(frameCountPositionZ)),
                                     new MotionGenerator(initial.rotationX, topOfDiveRotationX, new SmoothStepEasing(frameCountRotationX, -1.0, 0.0)),
                                     new MotionGenerator(initial.rotationY, topOfDiveRotationY, new SineEasing(frameCountRotationY, 0, HALF_PI))));

    // Dive to ground level, and rotate to initial driving X/Y rotation
    newAnimations.push(new Animation(new MotionGenerator(topOfDivePositionX, bottomOfDivePositionX, new LinearEasing(INTRO_DIVE_FRAME_COUNT)),
                                     new MotionGenerator(bottomOfDivePositionY, topOfDivePositionY, new SteepEasing(INTRO_DIVE_FRAME_COUNT, 0.0, 1.0)),
                                     new MotionGenerator(topOfDivePositionZ, bottomOfDivePositionZ, new LinearEasing(INTRO_DIVE_FRAME_COUNT)),
                                     new MotionGenerator(topOfDiveRotationX, 0.0, new SineEasing(INTRO_DIVE_FRAME_COUNT, 0.0, HALF_PI)),
                                     new MotionGenerator(topOfDiveRotationY, bottomOfDiveRotationY, new SineEasing(INTRO_DIVE_FRAME_COUNT, 0.0, HALF_PI))));

    // Drive to target point
    navigator = new RoadNavigator(roadNetwork, pathFinder, drivingTargetPositionX, drivingTargetPositionZ);
    drivingAnimations = buildDrivingAnimations(bottomOfDivePositionX, bottomOfDivePositionZ, bottomOfDiveRotationY, drivingTargetPositionX, drivingTargetPositionZ);

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
    let finalCurveSegment;
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
      finalCurveSegment = curvePath.curves[curvePath.curves.length - 1];
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

      rotationY = azimuthAngleToPoint(finalCurveSegment.v1.x, finalCurveSegment.v1.z, finalCurveSegment.v2.x, finalCurveSegment.v2.z);
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
    let newTargetYRotation = azimuthAngleToPoint(initialPositionX, initialPositionZ, targetPositionX, targetPositionZ);

    newTargetYRotation = minimizeAngleDifference(newTargetYRotation, initialRotationY);

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
              isDrivingModeLanded = null;
            }
          }
          else if (mode === DRIVING_MODE) {
            aerialNavigator = undefined;
            navigator = new RoadNavigator(roadNetwork, pathFinder,positionX, positionZ);
            isDrivingModeLanded = false;
          }
        }

        navigator.nextTarget();

        animations = buildNextAnimations(navigator.targetX(),
                                         navigator.targetZ());
      }
    }

    animations[0].tick();
    positionX = animations[0].positionX();
    positionZ = animations[0].positionZ();
    tickPositionY();
    rotationX = animations[0].rotationX();
    rotationY = animations[0].rotationY();

    framesInCurrentMode += 1;
  };

  let tickPositionY = function() {
    if (mode === DRIVING_MODE && isDrivingModeLanded === false) {
      positionY -= HELICOPTER_TO_DRIVING_POSITION_Y_DELTA;

      if (positionY > animations[0].positionY()) {
        return;
      }

      isDrivingModeLanded = true;
    }

    positionY = Math.max(animations[0].positionY(), roadHeightAtCurrentPosition() + MINIMUM_HEIGHT_OFF_GROUND);
  };

  // Returns the azimuth angle when at {x1, z1} pointing toward {x2, z2}, with a
  // range of 0 to 2π. 0 is toward the negative Z-axis (north), π/2 is toward
  // the negative X-axis (west), π is toward the positive Z-axis (south), and
  // 3π/2 is toward the positive X-axis (east).
  let azimuthAngleToPoint = function(x1, z1, x2, z2) {
    // Get an angle where 0 points toward the negative Z-axis (i.e. north), π/2
    // points toward the negative X-axis (i.e. west), -π/2 points toward the
    // positive X-axis (i.e. east), and π points toward the positive Z-axis
    // (i.e. south). The swapped order of the X and Z arguments, and negation
    // of both arguments is intentional. (The negations happen by swapping the
    // order of the subtractions).
    let angle = Math.atan2(x1 - x2, z1 - z2);

    // Change the range from -π to π (with 0 pointing north and π pointing
    // south) to 0 to 2π, with 0 pointing north, π/2 pointing west, π pointing
    // south, and 3π/2 pointing east.
    if (angle < 0.0) {
      angle += TWO_PI;
    }

    return angle;
  };

  // Returns either `candidateAngle` or a 2π multiple of it,
  // such that difference between that angle and `referenceAngle`
  // is between 0 and π.
  let minimizeAngleDifference = function(candidateAngle, referenceAngle) {
    while ((referenceAngle - candidateAngle) > Math.PI) {
      candidateAngle += TWO_PI;
    }
    while ((referenceAngle - candidateAngle) < -Math.PI) {
      candidateAngle -= TWO_PI;
    }

    return candidateAngle;
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

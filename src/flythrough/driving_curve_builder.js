"use strict";

import { Config } from "./../config";

const MINIMUM_HEIGHT_OFF_GROUND = 0.041666666666667;

// The distance from the next intersection that a curved turn begins.
// This indirectly determines the turning curve radius.
const CURVE_START_DISTANCE = 0.5;

let DrivingCurveBuilder = (function() {
  let build = function(roadNetwork, path) {
    let curvePositionX;
    let curvePositionZ;
    let i;
    let isFinalPathSegment;
    let isStraightIntersectionSegmentRequired;
    let isCurvedIntersectionSegmentRequired;
    let curve;
    let startX;
    let startZ;
    let middleX;
    let middleZ;
    let endX;
    let endZ;
    let segment1DirectionX;
    let segment1DirectionZ;
    let segment2DirectionX;
    let segment2DirectionZ;
    let curvePath = new THREE.CurvePath();
    let lineStartVector;
    let controlPointVector;
    let lineEndVector;

    curvePositionX = path[0][0];
    curvePositionZ = path[0][1];
    for (i = 0; i < path.length - 1; i++) {
      isFinalPathSegment = (i === path.length - 2);
      startX = path[i][0];
      startZ = path[i][1];
      middleX = path[i + 1][0];
      middleZ = path[i + 1][1];

      if (isFinalPathSegment === true) {
        endX = path[i + 1][0];
        endZ = path[i + 1][1];
      }
      else {
        endX = path[i + 2][0];
        endZ = path[i + 2][1];
      }

      segment1DirectionX = Math.sign(middleX - startX);
      segment1DirectionZ = Math.sign(middleZ - startZ);
      segment2DirectionX = Math.sign(endX - middleX);
      segment2DirectionZ = Math.sign(endZ - middleZ);

      isCurvedIntersectionSegmentRequired = !isFinalPathSegment &&
                                            !((segment1DirectionX === 0.0 && segment2DirectionX === 0.0) ||
                                              (segment1DirectionZ === 0.0 && segment2DirectionZ === 0.0));

      isStraightIntersectionSegmentRequired = !isCurvedIntersectionSegmentRequired;


      // Main straight segment
      lineStartVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

      if (curvePositionZ > middleZ) {
        curvePositionX = middleX;
        curvePositionZ = (isCurvedIntersectionSegmentRequired ? (middleZ + CURVE_START_DISTANCE) : (middleZ + Config.HALF_STREET_DEPTH));
      }
      else if (curvePositionZ < middleZ) {
        curvePositionX = middleX;
        curvePositionZ = (isCurvedIntersectionSegmentRequired ? (middleZ - CURVE_START_DISTANCE) : (middleZ - Config.HALF_STREET_DEPTH));
      }
      else if (curvePositionX < middleX) {
        curvePositionX = (isCurvedIntersectionSegmentRequired ? (middleX - CURVE_START_DISTANCE) : (middleX - Config.HALF_STREET_WIDTH));
        curvePositionZ = middleZ;
      }
      else if (curvePositionX > middleX) {
        curvePositionX = (isCurvedIntersectionSegmentRequired ? (middleX + CURVE_START_DISTANCE) : (middleX + Config.HALF_STREET_WIDTH));
        curvePositionZ = middleZ;
      }

      lineEndVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

      curve = new THREE.LineCurve3(lineStartVector, lineEndVector);
      curvePath.curves.push(curve);


      // Straight segment through intersection
      if (isStraightIntersectionSegmentRequired === true) {
        lineStartVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

        if (curvePositionZ > middleZ) {
          curvePositionX = middleX;
          curvePositionZ = (isFinalPathSegment ? middleZ : (curvePositionZ - Config.STREET_DEPTH));
        }
        else if (curvePositionZ < middleZ) {
          curvePositionX = middleX;
          curvePositionZ = (isFinalPathSegment ? middleZ : (curvePositionZ + Config.STREET_DEPTH));
        }
        else if (curvePositionX < middleX) {
          curvePositionX = (isFinalPathSegment ? middleX : (curvePositionX + Config.STREET_WIDTH));
          curvePositionZ = middleZ;
        }
        else if (curvePositionX > middleX) {
          curvePositionX = (isFinalPathSegment ? middleX : (curvePositionX - Config.STREET_WIDTH));
          curvePositionZ = middleZ;
        }

        lineEndVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

        curve = new THREE.LineCurve3(lineStartVector, lineEndVector);
        curvePath.curves.push(curve);
      }


      // Curve to next straight segment
      if (isCurvedIntersectionSegmentRequired === true) {
        lineStartVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);
        controlPointVector = new THREE.Vector3(middleX, roadNetwork.getRoadHeight(middleX, middleZ) + MINIMUM_HEIGHT_OFF_GROUND, middleZ);

        if (startX < endX) {
          curvePositionX += CURVE_START_DISTANCE;
        }
        else if (startX > endX) {
          curvePositionX -= CURVE_START_DISTANCE;
        }

        if (startZ < endZ) {
          curvePositionZ += CURVE_START_DISTANCE;
        }
        else if (startZ > endZ) {
          curvePositionZ -= CURVE_START_DISTANCE;
        }

        lineEndVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

        curve = new THREE.QuadraticBezierCurve3(lineStartVector, controlPointVector, lineEndVector);
        curvePath.curves.push(curve);
      }
    }

    return curvePath;
  };

  return {
    build: build,
  };
})();

export { DrivingCurveBuilder };

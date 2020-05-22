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
    let distanceFromMiddleIntersectionX;
    let distanceFromMiddleIntersectionZ;
    let lineStartVector;
    let controlPointVector;
    let lineEndVector;

    curvePositionX = path[0].x;
    curvePositionZ = path[0].z;
    for (i = 0; i < path.length - 1; i++) {
      isFinalPathSegment = (i === path.length - 2);
      startX = path[i].x;
      startZ = path[i].z;
      middleX = path[i + 1].x;
      middleZ = path[i + 1].z;

      if (isFinalPathSegment === true) {
        endX = path[i + 1].x;
        endZ = path[i + 1].z;
      }
      else {
        endX = path[i + 2].x;
        endZ = path[i + 2].z;
      }

      segment1DirectionX = Math.sign(middleX - startX);
      segment1DirectionZ = Math.sign(middleZ - startZ);
      segment2DirectionX = Math.sign(endX - middleX);
      segment2DirectionZ = Math.sign(endZ - middleZ);

      isCurvedIntersectionSegmentRequired = !((segment1DirectionX === 0.0 && segment2DirectionX === 0.0) ||
                                              (segment1DirectionZ === 0.0 && segment2DirectionZ === 0.0));

      isStraightIntersectionSegmentRequired = !isCurvedIntersectionSegmentRequired;


      // Main straight segment
      lineStartVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

      distanceFromMiddleIntersectionX = (isCurvedIntersectionSegmentRequired === true) ? CURVE_START_DISTANCE : Config.HALF_STREET_WIDTH;
      distanceFromMiddleIntersectionZ = (isCurvedIntersectionSegmentRequired === true) ? CURVE_START_DISTANCE : Config.HALF_STREET_DEPTH;
      curvePositionX = middleX - (distanceFromMiddleIntersectionX * segment1DirectionX);
      curvePositionZ = middleZ - (distanceFromMiddleIntersectionZ * segment1DirectionZ);

      lineEndVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

      curve = new THREE.LineCurve3(lineStartVector, lineEndVector);
      curvePath.curves.push(curve);


      // Straight segment through intersection
      if (isStraightIntersectionSegmentRequired === true) {
        lineStartVector = lineEndVector;

        distanceFromMiddleIntersectionX = ((isFinalPathSegment === true) ? 0 : Config.HALF_STREET_WIDTH);
        distanceFromMiddleIntersectionZ = ((isFinalPathSegment === true) ? 0 : Config.HALF_STREET_DEPTH);
        curvePositionX = middleX + (distanceFromMiddleIntersectionX * segment1DirectionX);
        curvePositionZ = middleZ + (distanceFromMiddleIntersectionZ * segment1DirectionZ);

        lineEndVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

        curve = new THREE.LineCurve3(lineStartVector, lineEndVector);
        curvePath.curves.push(curve);
      }


      // Curve to next straight segment
      if (isCurvedIntersectionSegmentRequired === true) {
        lineStartVector = lineEndVector;
        controlPointVector = new THREE.Vector3(middleX, roadNetwork.getRoadHeight(middleX, middleZ) + MINIMUM_HEIGHT_OFF_GROUND, middleZ);

        curvePositionX += ((CURVE_START_DISTANCE * segment1DirectionX) + (CURVE_START_DISTANCE * segment2DirectionX));
        curvePositionZ += ((CURVE_START_DISTANCE * segment1DirectionZ) + (CURVE_START_DISTANCE * segment2DirectionZ));

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

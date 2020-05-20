"use strict";

import { Config } from "./../config";

const MINIMUM_HEIGHT_OFF_GROUND = 0.041666666666667;

let DrivingCurveBuilder = (function() {
  let build = function(roadNetwork, path) {
    let curvePositionX;
    let curvePositionZ;
    let i;
    let isFinalPathSegment;
    let isStraightIntersectionSegmentRequired;
    let isCurvedIntersectionSegmentRequired;
    let curve;
    let currentX;
    let currentZ;
    let nextX;
    let nextZ;
    let subsequentX;
    let subsequentZ;
    let curvePath = new THREE.CurvePath();
    let lineStartVector;
    let controlPointVector;
    let lineEndVector;

    curvePositionX = path[0][0];
    curvePositionZ = path[0][1];
    for (i = 0; i < path.length - 1; i++) {
      isFinalPathSegment = (i === path.length - 2);
      currentX = path[i][0];
      currentZ = path[i][1];
      nextX = path[i + 1][0];
      nextZ = path[i + 1][1];

      if (isFinalPathSegment === true) {
        subsequentX = path[i + 1][0];
        subsequentZ = path[i + 1][1];
      }
      else {
        subsequentX = path[i + 2][0];
        subsequentZ = path[i + 2][1];
      }

      isCurvedIntersectionSegmentRequired = !isFinalPathSegment &&
                                            !((Math.sign(nextX - currentX) === 0.0 && Math.sign(subsequentX - nextX) === 0.0) ||
                                              (Math.sign(nextZ - currentZ) === 0.0 && Math.sign(subsequentZ - nextZ) === 0.0));

      isStraightIntersectionSegmentRequired = !isCurvedIntersectionSegmentRequired;


      // Main straight segment
      lineStartVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

      if (curvePositionZ > nextZ) {
        curvePositionX = nextX;
        curvePositionZ = (isCurvedIntersectionSegmentRequired ? (nextZ + 0.5) : (nextZ + Config.HALF_STREET_DEPTH));
      }
      else if (curvePositionZ < nextZ) {
        curvePositionX = nextX;
        curvePositionZ = (isCurvedIntersectionSegmentRequired ? (nextZ - 0.5) : (nextZ - Config.HALF_STREET_DEPTH));
      }
      else if (curvePositionX < nextX) {
        curvePositionX = (isCurvedIntersectionSegmentRequired ? (nextX - 0.5) : (nextX - Config.HALF_STREET_WIDTH));
        curvePositionZ = nextZ;
      }
      else if (curvePositionX > nextX) {
        curvePositionX = (isCurvedIntersectionSegmentRequired ? (nextX + 0.5) : (nextX + Config.HALF_STREET_WIDTH));
        curvePositionZ = nextZ;
      }

      lineEndVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

      curve = new THREE.LineCurve3(lineStartVector, lineEndVector);
      curvePath.curves.push(curve);


      // Straight segment through intersection
      if (isStraightIntersectionSegmentRequired === true) {
        lineStartVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

        if (curvePositionZ > nextZ) {
          curvePositionX = nextX;
          curvePositionZ = (isFinalPathSegment ? nextZ : (curvePositionZ - Config.STREET_DEPTH));
        }
        else if (curvePositionZ < nextZ) {
          curvePositionX = nextX;
          curvePositionZ = (isFinalPathSegment ? nextZ : (curvePositionZ + Config.STREET_DEPTH));
        }
        else if (curvePositionX < nextX) {
          curvePositionX = (isFinalPathSegment ? nextX : (curvePositionX + Config.STREET_WIDTH));
          curvePositionZ = nextZ;
        }
        else if (curvePositionX > nextX) {
          curvePositionX = (isFinalPathSegment ? nextX : (curvePositionX - Config.STREET_WIDTH));
          curvePositionZ = nextZ;
        }

        lineEndVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);

        curve = new THREE.LineCurve3(lineStartVector, lineEndVector);
        curvePath.curves.push(curve);
      }


      // Curve to next straight segment
      if (isCurvedIntersectionSegmentRequired === true) {
        lineStartVector = new THREE.Vector3(curvePositionX, roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) + MINIMUM_HEIGHT_OFF_GROUND, curvePositionZ);
        controlPointVector = new THREE.Vector3(nextX, roadNetwork.getRoadHeight(nextX, nextZ) + MINIMUM_HEIGHT_OFF_GROUND, nextZ);

        if (currentX < subsequentX) {
          curvePositionX += 0.5;
        }
        else if (currentX > subsequentX) {
          curvePositionX -= 0.5;
        }

        if (currentZ < subsequentZ) {
          curvePositionZ += 0.5;
        }
        else if (currentZ > subsequentZ) {
          curvePositionZ -= 0.5;
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

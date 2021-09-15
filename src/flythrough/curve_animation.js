"use strict";

import * as THREE from "three";

const HALF_PI = Math.PI / 2;

let CurveAnimation = function(curve, distancePerTick, rotationX) {
  let positionX = 0.0;
  let positionY = 0.0;
  let positionZ = 0.0;
  let rotationY = 0.0;
  let isFinished = false;

  let u = 0.0;
  let curvePosition = new THREE.Vector3();
  let tangentVector;

  let totalLength = curve.getLength();
  let uTickDelta = distancePerTick / totalLength;

  let tick = function() {
    if (u === 1.0) {
      isFinished = true;
    }

    curvePosition = curve.getPointAt(u);
    positionX = curvePosition.x;
    positionY = curvePosition.y;
    positionZ = curvePosition.z;

    tangentVector = curve.getTangentAt(u);
    rotationY = Math.atan2(-tangentVector.z, tangentVector.x) - HALF_PI;

    u += uTickDelta;
    if (u > 1.0) {
      u = 1.0;
    }
  };

  let finished = function() {
    return isFinished;
  };

  return {
    finished: finished,
    tick: tick,
    positionX: function() { return positionX; },
    positionY: function() { return positionY; },
    positionZ: function() { return positionZ; },
    rotationX: function() { return rotationX; },
    rotationY: function() { return rotationY; },
  };
};

export { CurveAnimation };

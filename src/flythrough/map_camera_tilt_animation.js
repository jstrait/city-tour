"use strict";

var MapCameraTiltAnimation = function(mapCamera, targetTiltAngle, tiltAngleDelta) {
  var tick = function() {
    mapCamera.tiltCamera(tiltAngleDelta, false);

    if (mapCamera.tiltAngle() < mapCamera.maxTiltAngle()) {
      mapCamera.tiltCamera(mapCamera.maxTiltAngle() - mapCamera.tiltAngle(), true);
    }
  };

  var finished = function() {
    return mapCamera.tiltAngle() <= targetTiltAngle;
  };

  return {
    finished: finished,
    tick: tick,
    positionX: function() { return mapCamera.positionX(); },
    positionY: function() { return mapCamera.positionY(); },
    positionZ: function() { return mapCamera.positionZ(); },
    rotationX: function() { return mapCamera.tiltAngle(); },
    rotationY: function() { return mapCamera.azimuthAngle(); },
  };
};

export { MapCameraTiltAnimation };

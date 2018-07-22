"use strict";

var CityTour = CityTour || {};

CityTour.VehicleView = function(vehicleController) {
  var MIN_AZIMUTH_ANGLE_OFFSET = -Math.PI / 2;
  var MAX_AZIMUTH_ANGLE_OFFSET = Math.PI / 2;
  var MIN_TILTANGLE_OFFSET = -Math.PI / 6;
  var MAX_TILTANGLE_OFFSET = Math.PI / 4;

  var azimuthAngleOffset = 0.0;
  var tiltAngleOffset = 0.0;

  var setAzimuthAngleOffset = function(newAzimuthAngleOffset) {
    azimuthAngleOffset = CityTour.Math.clamp(newAzimuthAngleOffset, MIN_AZIMUTH_ANGLE_OFFSET, MAX_AZIMUTH_ANGLE_OFFSET);
  };

  var setTiltAngleOffset = function(newTiltAngleOffset) {
    tiltAngleOffset = CityTour.Math.clamp(newTiltAngleOffset, MIN_TILTANGLE_OFFSET, MAX_TILTANGLE_OFFSET);
  };

  return {
    positionX: function() { return vehicleController.positionX(); },
    positionY: function() { return vehicleController.positionY(); },
    positionZ: function() { return vehicleController.positionZ(); },
    rotationX: function() { return vehicleController.rotationX() + tiltAngleOffset; },
    rotationY: function() { return vehicleController.rotationY() + azimuthAngleOffset; },
    azimuthAngleOffset: function() { return azimuthAngleOffset; },
    tiltAngleOffset: function() { return tiltAngleOffset; },
    setAzimuthAngleOffset: setAzimuthAngleOffset,
    setTiltAngleOffset: setTiltAngleOffset,
  };
};

"use strict";

var CityTour = CityTour || {};

CityTour.PoleCamera = function(initialScenePosition) {
  var VIEW_ANGLE = 45, DEFAULT_ASPECT = 1.0, NEAR = 0.1, FAR = 10000;
  var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

  camera.lookAt(initialScenePosition);
  camera.rotation.order = "YXZ";

  var poleCamera = {};

  poleCamera.camera = function() { return camera; };

  poleCamera.positionX = function() { return camera.position.x; };
  poleCamera.positionY = function() { return camera.position.y; };
  poleCamera.positionZ = function() { return camera.position.z; };
  poleCamera.rotationX = function() { return camera.rotation.x; };
  poleCamera.rotationY = function() { return camera.rotation.y; };

  poleCamera.setPositionX = function(newPositionX) { camera.position.x = newPositionX; };
  poleCamera.setPositionY = function(newPositionY) { camera.position.y = newPositionY; };
  poleCamera.setPositionZ = function(newPositionZ) { camera.position.z = newPositionZ; };
  poleCamera.setRotationX = function(newRotationX) { camera.rotation.x = newRotationX; };
  poleCamera.setRotationY = function(newRotationY) { camera.rotation.y = newRotationY; };

  return poleCamera;
};

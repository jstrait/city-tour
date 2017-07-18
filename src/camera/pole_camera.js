"use strict";

var CityTour = CityTour || {};

CityTour.PoleCamera = function(initialScenePosition) {
  var cameraPoleGeometry = new THREE.BoxGeometry(1, 1, 1);
  var cameraPoleMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color(1.0, 0.0, 1.0), });
  var cameraPole = new THREE.Mesh(cameraPoleGeometry, cameraPoleMaterial);

  var VIEW_ANGLE = 45, DEFAULT_ASPECT = 1.0, NEAR = 0.1, FAR = 10000;
  var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);
  camera.lookAt(initialScenePosition);

  cameraPole.add(camera);


  var poleCamera = {};

  poleCamera.camera = function() { return camera; };
  poleCamera.pole = function() { return cameraPole; };

  poleCamera.positionX = function() { return cameraPole.position.x; };
  poleCamera.positionY = function() { return cameraPole.position.y; };
  poleCamera.positionZ = function() { return cameraPole.position.z; };
  poleCamera.rotationX = function() { return camera.rotation.x; };
  poleCamera.rotationY = function() { return cameraPole.rotation.y; };

  poleCamera.setPositionX = function(newPositionX) { cameraPole.position.x = newPositionX; };
  poleCamera.setPositionY = function(newPositionY) { cameraPole.position.y = newPositionY; };
  poleCamera.setPositionZ = function(newPositionZ) { cameraPole.position.z = newPositionZ; };
  poleCamera.setRotationX = function(newRotationX) { camera.rotation.x = newRotationX; };
  poleCamera.setRotationY = function(newRotationY) { cameraPole.rotation.y = newRotationY; };

  return poleCamera;
};

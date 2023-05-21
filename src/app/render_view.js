"use strict";

import * as THREE from "three";

var RenderView = function(container, scene) {
  var VIEW_ANGLE = 45, DEFAULT_ASPECT = 1.0, NEAR = 0.005, FAR = 1000;

  var renderer;
  var camera;

  var previousCameraPositionX;
  var previousCameraPositionY;
  var previousCameraPositionZ;
  var previousCameraRotationX;
  var previousCameraRotationY;
  let isDirty = false;

  var resize = function() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    container.style.width = `${width}px`;
    container.style.height = `${height}px`;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    isDirty = true;
    render();
  };

  var render = function() {
    var cameraHasMoved = previousCameraPositionX !== camera.position.x ||
                         previousCameraPositionY !== camera.position.y ||
                         previousCameraPositionZ !== camera.position.z ||
                         previousCameraRotationX !== camera.rotation.x ||
                         previousCameraRotationY !== camera.rotation.y;

    if (cameraHasMoved || isDirty) {
      renderer.render(scene, camera);

      previousCameraPositionX = camera.position.x;
      previousCameraPositionY = camera.position.y;
      previousCameraPositionZ = camera.position.z;
      previousCameraRotationX = camera.rotation.x;
      previousCameraRotationY = camera.rotation.y;
      isDirty = false;
    }
  };


  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(window.devicePixelRatio);

  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);
  camera.lookAt(scene.position);
  camera.rotation.order = "YXZ";


  return {
    render: render,
    resize: resize,
    domElement: function() { return renderer.domElement; },
    renderer: function() { return renderer; },
    camera: function() { return camera; },
    makeDirty: function() { isDirty = true; },
  };
};

export { RenderView };

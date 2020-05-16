"use strict";

var RenderView = function(container, scene) {
  var VIEW_ANGLE = 45, DEFAULT_ASPECT = 1.0, NEAR = 0.005, FAR = 1000;

  var renderer;
  var camera;

  var previousCameraPositionX;
  var previousCameraPositionY;
  var previousCameraPositionZ;
  var previousCameraRotationX;
  var previousCameraRotationY;
  var dirtyFromResize = false;

  var resize = function() {
    var width = container.clientWidth;
    var height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    dirtyFromResize = true;
    render();
  };

  var render = function() {
    var cameraHasMoved = previousCameraPositionX !== camera.position.x ||
                         previousCameraPositionY !== camera.position.y ||
                         previousCameraPositionZ !== camera.position.z ||
                         previousCameraRotationX !== camera.rotation.x ||
                         previousCameraRotationY !== camera.rotation.y;

    if (cameraHasMoved || dirtyFromResize) {
      renderer.render(scene, camera);

      previousCameraPositionX = camera.position.x;
      previousCameraPositionY = camera.position.y;
      previousCameraPositionZ = camera.position.z;
      previousCameraRotationX = camera.rotation.x;
      previousCameraRotationY = camera.rotation.y;
      dirtyFromResize = false;
    }
  };


  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);
  camera.lookAt(scene.position);
  camera.rotation.order = "YXZ";


  return {
    render: render,
    resize: resize,
    domElement: function() { return renderer.domElement; },
    renderer: function() { return renderer; },
    camera: function() { return camera; },
  };
};

export { RenderView };

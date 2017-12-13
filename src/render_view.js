"use strict";

var CityTour = CityTour || {};

CityTour.RenderView = function(container, initialScene) {
  var scene;
  var renderer;
  var poleCamera;

  var previousPoleCameraPositionX;
  var previousPoleCameraPositionY;
  var previousPoleCameraPositionZ;
  var previousPoleCameraRotationX;
  var previousPoleCameraRotationY;
  var dirtyFromResize = false;

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

  var resize = function() {
    var width = container.clientWidth;
    var height = container.clientHeight;

    var camera = poleCamera.camera();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    dirtyFromResize = true;
    render();
  };

  var render = function() {
    var cameraHasMoved = previousPoleCameraPositionX !== poleCamera.positionX() ||
                         previousPoleCameraPositionY !== poleCamera.positionY() ||
                         previousPoleCameraPositionZ !== poleCamera.positionZ() ||
                         previousPoleCameraRotationX !== poleCamera.rotationX() ||
                         previousPoleCameraRotationY !== poleCamera.rotationY();

    if (cameraHasMoved || dirtyFromResize) {
      renderer.render(scene, poleCamera.camera());

      previousPoleCameraPositionX = poleCamera.positionX();
      previousPoleCameraPositionY = poleCamera.positionY();
      previousPoleCameraPositionZ = poleCamera.positionZ();
      previousPoleCameraRotationX = poleCamera.rotationX();
      previousPoleCameraRotationY = poleCamera.rotationY();
      dirtyFromResize = false;
    }
  };

  var setScene = function(newScene) {
    scene = newScene;
    poleCamera = new CityTour.PoleCamera(scene.position);
    scene.add(poleCamera.pole());
  };

  setScene(initialScene);


  return {
    render: render,
    resize: resize,
    setScene: setScene,
    domElement: function() { return renderer.domElement; },
    poleCamera: function() { return poleCamera; },
  };
};

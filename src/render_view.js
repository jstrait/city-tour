"use strict";

var CityTour = CityTour || {};

CityTour.RenderView = function(container, scene) {
  var renderer, poleCamera;

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

  poleCamera = new CityTour.PoleCamera(scene.position);
  scene.add(poleCamera.pole());

  var resize = function() {
    var width = container.clientWidth;
    var height = container.clientHeight;

    var camera = poleCamera.camera();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    render();
  };

  var render = function() {
    renderer.render(scene, poleCamera.camera());
  };

  var setScene = function(newScene) {
    scene = newScene;
    poleCamera = new CityTour.PoleCamera(scene.position);
    scene.add(poleCamera.pole());
  };

  var renderView = {};

  renderView.render = render;
  renderView.resize = resize;
  renderView.setScene = setScene;
  renderView.domElement = function() { return renderer.domElement; };
  renderView.poleCamera = function() { return poleCamera; };

  return renderView;
};

"use strict";

var CityTour = CityTour || {};

CityTour.SceneView = function(containerEl, interactiveCamera, messageBroker) {
  var INTERACTIVE = 1;
  var FLYTHROUGH = 2;

  var worldData;
  var renderView = null, poleCamera;
  var timer;
  var animationManager;
  var mode = INTERACTIVE;

  var updateCamera = function(data) {
    interactiveCamera.syncCamera(poleCamera);
    renderView.render();
  };

  var startFlythrough = function() {
    animationManager.init(worldData.centerX, worldData.centerZ, poleCamera.positionX(), poleCamera.positionY(), poleCamera.positionZ(), poleCamera.rotationX(), poleCamera.rotationY());
    timer.onTick(1);
    timer.start();
    mode = FLYTHROUGH;
    messageBroker.publish("flythrough.started", {});
  };

  var stopFlythrough = function() {
    timer.togglePause();
    interactiveCamera.syncFromPoleCamera(poleCamera);
    updateCamera();
    mode = INTERACTIVE;
    messageBroker.publish("flythrough.stopped", {});
  };

  var toggleFlythrough = function() {
    if (mode === INTERACTIVE) {
      startFlythrough();
    }
    else {
      stopFlythrough();
    }
  };

  var reset = function(newWorldConfig) {
    worldData = CityTour.WorldGenerator.generate(newWorldConfig);
    var sceneBuilder = new CityTour.Scene.Builder();
    var scene = sceneBuilder.build(worldData.terrain, worldData.roadNetwork, worldData.buildings);

    if (renderView === null) {
      renderView = new CityTour.RenderView(containerEl, scene);
    }
    else {
      renderView.setScene(scene);
    }

    poleCamera = renderView.poleCamera();

    timer = new CityTour.Timer();
    animationManager = new CityTour.AnimationManager(worldData.terrain, worldData.roadNetwork, poleCamera);
    timer.onTick = function(frameCount) {
      animationManager.tick(frameCount);
      renderView.render();
    };

    updateCamera();

    renderView.resize();
    renderView.render();
  };

  renderView = new CityTour.RenderView(containerEl, new THREE.Scene());
  containerEl.appendChild(renderView.domElement());

  window.addEventListener('resize', renderView.resize, false);
  var id1 = messageBroker.addSubscriber("camera.updated", updateCamera);


  return {
    reset: reset,
    toggleFlythrough: toggleFlythrough,
    domElement: function() { return renderView.domElement(); },
  };
};

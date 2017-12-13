"use strict";

var CityTour = CityTour || {};

CityTour.SceneView = function(renderView, interactiveCamera, messageBroker) {
  var INTERACTIVE = 1;
  var FLYTHROUGH = 2;

  var worldData;
  var poleCamera;
  var sceneBuilder;
  var scene;
  var timer;
  var animationManager;
  var mode = INTERACTIVE;

  var updateCamera = function(data) {
    interactiveCamera.syncCamera(poleCamera);
  };

  var startFlythrough = function() {
    var initialCoordinates = {
      positionX: poleCamera.positionX(),
      positionY: poleCamera.positionY(),
      positionZ: poleCamera.positionZ(),
      rotationX: poleCamera.rotationX(),
      rotationY: poleCamera.rotationY(),
    };

    var targetSceneX = CityTour.Coordinates.mapXToSceneX(worldData.centerX);
    var targetSceneZ = CityTour.Coordinates.mapZToSceneZ(worldData.centerZ);

    animationManager.init(initialCoordinates, targetSceneX, targetSceneZ);
    mode = FLYTHROUGH;
    messageBroker.publish("flythrough.started", {});
  };

  var requestStopFlythrough = function() {
    interactiveCamera.syncFromPoleCamera(poleCamera);
    interactiveCamera.syncCamera(poleCamera);

    var target = {
      positionX: poleCamera.positionX(),
      positionY: poleCamera.positionY(),
      positionZ: poleCamera.positionZ(),
      rotationX: poleCamera.rotationX(),
      rotationY: poleCamera.rotationY(),
    };

    animationManager.requestStop(target);
  };

  var stopFlythrough = function() {
    interactiveCamera.syncFromPoleCamera(poleCamera);
    updateCamera();
    mode = INTERACTIVE;
  };

  var toggleFlythrough = function() {
    if (mode === INTERACTIVE) {
      startFlythrough();
    }
    else {
      requestStopFlythrough();
    }
  };

  var reset = function(newWorldConfig) {
    worldData = CityTour.WorldGenerator.generate(newWorldConfig);
    sceneBuilder = new CityTour.Scene.Builder();
    scene = sceneBuilder.build(worldData.terrain, worldData.roadNetwork, worldData.buildings);

    interactiveCamera.setTerrain(worldData.terrain);
    renderView.setScene(scene);
    poleCamera = renderView.poleCamera();

    timer = new CityTour.Timer();
    animationManager = new CityTour.AnimationManager(worldData.terrain, worldData.roadNetwork, poleCamera, messageBroker);
    timer.onTick = function(frameCount) {
      animationManager.tick(frameCount);
      renderView.render();
    };

    timer.start();

    updateCamera();

    renderView.resize();
  };

  // See https://stackoverflow.com/questions/25126352/deallocating-buffergeometry
  var removeChildFromScene = function(obj) {
    var i;
    for (i = obj.children.length - 1; i >= 0; i--) {
      removeChildFromScene(obj.children[i]);
    }

    scene.remove(obj);
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      obj.geometry = null;
      obj.material.dispose();
      obj.material = null;
    }

    obj = null;
  };

  window.addEventListener('resize', renderView.resize, false);
  var id1 = messageBroker.addSubscriber("camera.updated", updateCamera);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", stopFlythrough);

  var destroy = function() {
    var i;

    window.removeEventListener('resize', renderView.resize, false);
    messageBroker.removeSubscriber("camera.updated", id1);

    for (i = scene.children.length - 1; i >= 0; i--) {
      removeChildFromScene(scene.children[i]);
    }
  };


  return {
    reset: reset,
    toggleFlythrough: toggleFlythrough,
    domElement: function() { return renderView.domElement(); },
    destroy: destroy,
  };
};

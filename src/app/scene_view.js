"use strict";

var CityTour = CityTour || {};

CityTour.SceneView = function(renderView, interactiveCamera, initialWorldConfig, messageBroker) {
  var INTERACTIVE = 1;
  var FLYTHROUGH = 2;

  var worldData;
  var poleCamera;
  var sceneBuilder = new CityTour.Scene.Builder();
  var scene = sceneBuilder.buildEmptyScene();
  var timer;
  var animationManager;
  var mode = INTERACTIVE;

  var syncInteractiveCameraToPoleCamera = function(data) {
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
    syncInteractiveCameraToPoleCamera();
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
    var masterStartTime, masterEndTime;
    var terrainStartTime, terrainEndTime;
    var roadStartTime, roadEndTime;
    var buildingsStartTime, buildingsEndTime;

    worldData = CityTour.WorldGenerator.generate(newWorldConfig);

    destroyPreviousMeshes();

    masterStartTime = new Date();

    terrainStartTime = new Date();
    scene.add(sceneBuilder.buildTerrainMeshes(worldData.terrain, worldData.roadNetwork));
    terrainEndTime = new Date();

    roadStartTime = new Date();
    scene.add(sceneBuilder.buildRoadNetworkMeshes(worldData.terrain, worldData.roadNetwork));
    roadEndTime = new Date();

    buildingsStartTime = new Date();
    scene.add(sceneBuilder.buildBuildingMeshes(worldData.buildings, worldData.roadNetwork));
    buildingsEndTime = new Date();

    masterEndTime = new Date();

    console.log("Time to generate scene geometry: " + (masterEndTime - masterStartTime) + "ms");
    console.log("  Terrain:   " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Roads:     " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Buildings: " + (buildingsEndTime - buildingsStartTime) + "ms");

    interactiveCamera.setTerrain(worldData.terrain);
    poleCamera = renderView.poleCamera();

    animationManager = new CityTour.AnimationManager(worldData.terrain, worldData.roadNetwork, poleCamera, messageBroker);

    syncInteractiveCameraToPoleCamera();

    renderView.resize();
  };

  var destroyPreviousMeshes = function() {
    var terrainMeshes = scene.getObjectByName("terrainMeshes");
    var roadNetworkMeshes = scene.getObjectByName("roadNetworkMeshes");
    var buildingMeshes = scene.getObjectByName("buildingMeshes");

    if (terrainMeshes !== undefined) {
      removeChildFromScene(terrainMeshes);
    }

    if (roadNetworkMeshes !== undefined) {
      removeChildFromScene(roadNetworkMeshes);
    }

    if (buildingMeshes !== undefined) {
      removeChildFromScene(buildingMeshes);
    }
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
  var id1 = messageBroker.addSubscriber("camera.updated", syncInteractiveCameraToPoleCamera);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", stopFlythrough);

  renderView.setScene(scene);
  reset(initialWorldConfig);

  timer = new CityTour.Timer();
  animationManager = new CityTour.AnimationManager(worldData.terrain, worldData.roadNetwork, poleCamera, messageBroker);
  timer.onTick = function(frameCount) {
    animationManager.tick(frameCount);
    renderView.render();
  };

  timer.start();

  return {
    reset: reset,
    toggleFlythrough: toggleFlythrough,
    domElement: function() { return renderView.domElement(); },
  };
};

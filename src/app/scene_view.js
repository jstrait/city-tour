"use strict";

var CityTour = CityTour || {};


CityTour.SceneView = function(containerEl, initialWorldData, messageBroker) {
  var sceneBuilder = new CityTour.Scene.Builder();
  var scene = sceneBuilder.buildEmptyScene();
  var renderView = new CityTour.RenderView(containerEl, scene);
  var camera = renderView.camera();

  var reset = function(newWorldData) {
    var masterStartTime, masterEndTime;
    var terrainStartTime, terrainEndTime;
    var roadStartTime, roadEndTime;
    var buildingsStartTime, buildingsEndTime;

    destroyPreviousMeshes();

    masterStartTime = new Date();

    terrainStartTime = new Date();
    scene.add(sceneBuilder.buildTerrainMeshes(newWorldData.terrain, newWorldData.roadNetwork));
    terrainEndTime = new Date();

    roadStartTime = new Date();
    scene.add(sceneBuilder.buildRoadNetworkMeshes(newWorldData.terrain, newWorldData.roadNetwork));
    roadEndTime = new Date();

    buildingsStartTime = new Date();
    scene.add(sceneBuilder.buildBuildingMeshes(newWorldData.buildings, newWorldData.roadNetwork));
    buildingsEndTime = new Date();

    masterEndTime = new Date();

    console.log("Time to generate scene geometry: " + (masterEndTime - masterStartTime) + "ms");
    console.log("  Terrain:   " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Roads:     " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Buildings: " + (buildingsEndTime - buildingsStartTime) + "ms");

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

  var render = function() {
    renderView.render();
  };

  window.addEventListener('resize', renderView.resize, false);

  reset(initialWorldData);

  return {
    reset: reset,
    render: render,
    camera: function() { return camera; },
    domElement: function() { return renderView.domElement(); },
  };
};

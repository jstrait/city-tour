"use strict";

var CityTour = CityTour || {};


CityTour.SceneView = function(containerEl, messageBroker) {
  var SHOW_MARKERS = false;

  var centerOfCityMarkerMesh;
  var centerOfActionMarkerMesh;
  var targetOfActionMarkerMesh;
  var touchPoint1MarkerMesh;
  var touchPoint2MarkerMesh;

  var sceneBuilder = new CityTour.Meshes.Builder();
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

    centerOfCityMarkerMesh.position.x = newWorldData.centerX;
    centerOfCityMarkerMesh.position.z = newWorldData.centerZ;

    masterEndTime = new Date();

    console.log("Time to generate scene geometry: " + (masterEndTime - masterStartTime) + "ms");
    console.log("  Terrain:   " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Roads:     " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Buildings: " + (buildingsEndTime - buildingsStartTime) + "ms");
  };

  var buildMarkerMeshes = function() {
    var MARKER_WIDTH = 0.2;
    var MARKER_DEPTH = 0.2;
    var MARKER_HEIGHT = 16;

    var markersStartTime, markersEndTime;
    var group;

    markersStartTime = new Date();

    group = new THREE.Group();
    group.name = "markerMeshes";

    centerOfCityMarkerMesh = new THREE.Mesh(new THREE.BoxGeometry(MARKER_WIDTH, MARKER_HEIGHT, MARKER_DEPTH),
                                            new THREE.MeshBasicMaterial({ color: 0xff00ff }));
    group.add(centerOfCityMarkerMesh);

    centerOfActionMarkerMesh = new THREE.Mesh(new THREE.BoxGeometry(MARKER_WIDTH, MARKER_HEIGHT, MARKER_DEPTH),
                                              new THREE.MeshBasicMaterial({ color: 0x55ff00 }));
    group.add(centerOfActionMarkerMesh);

    targetOfActionMarkerMesh = new THREE.Mesh(new THREE.BoxGeometry(MARKER_WIDTH, MARKER_HEIGHT, MARKER_DEPTH),
                                              new THREE.MeshBasicMaterial({ color: 0xff5a00 }));
    group.add(targetOfActionMarkerMesh);

    touchPoint1MarkerMesh = new THREE.Mesh(new THREE.BoxGeometry(MARKER_WIDTH, MARKER_HEIGHT, MARKER_DEPTH),
                                           new THREE.MeshBasicMaterial({ color: 0xff0055 }));
    group.add(touchPoint1MarkerMesh);

    touchPoint2MarkerMesh = new THREE.Mesh(new THREE.BoxGeometry(MARKER_WIDTH, MARKER_HEIGHT, MARKER_DEPTH),
                                           new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    group.add(touchPoint2MarkerMesh);

    if (SHOW_MARKERS) {
      scene.add(group);
    }

    markersEndTime = new Date();
    console.log("Time to generate touch debug markers:   " + (markersEndTime - markersStartTime) + "ms");

    return group;
  };

  var destroyPreviousMeshes = function() {
    var terrainMeshes = scene.getObjectByName("terrainMeshes");
    var roadNetworkMeshes = scene.getObjectByName("roadNetworkMeshes");
    var buildingMeshes = scene.getObjectByName("buildingMeshes");
    var markerMeshes = scene.getObjectByName("markerMeshes");

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

  var resize = function() {
    renderView.resize();
  };

  var render = function() {
    renderView.render();
  };

  window.addEventListener('resize', renderView.resize, false);

  buildMarkerMeshes();

  return {
    reset: reset,
    resize: resize,
    render: render,
    camera: function() { return camera; },
    domElement: function() { return renderView.domElement(); },
    scene: function() { return scene; },
    centerOfActionMarkerMesh: function() { return centerOfActionMarkerMesh; },
    targetOfActionMarkerMesh: function() { return targetOfActionMarkerMesh; },
    touchPoint1MarkerMesh: function() { return touchPoint1MarkerMesh; },
    touchPoint2MarkerMesh: function() { return touchPoint2MarkerMesh; },
  };
};

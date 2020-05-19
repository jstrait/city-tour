"use strict";

import { RenderView } from "./render_view";
import { Builder } from "./../meshes/builder";

const GRID_PLANE_MESH_GROUP_NAME = "gridPlaneMeshes";
const TERRAIN_MESH_GROUP_NAME = "terrainMeshes";
const ROAD_NETWORK_MESH_GROUP_NAME = "roadNetworkMeshes";
const BUILDINGS_MESH_GROUP_NAME = "buildingMeshes";
const DEBUG_MARKERS_MESH_GROUP_NAME = "markerMeshes";
const DEBUG_NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME = "debugNeighborhoodCentersMeshes";

var SceneView = function(containerEl, gridTexture) {
  var SHOW_MARKERS = false;
  var SHOW_DEBUG_NEIGHBORHOOD_CENTER_MARKERS = false;

  var centerOfCityMarkerMesh;
  var centerOfActionMarkerMesh;
  var targetOfActionMarkerMesh;
  var touchPoint1MarkerMesh;
  var touchPoint2MarkerMesh;

  var sceneBuilder = new Builder(gridTexture);
  var scene = sceneBuilder.buildEmptyScene();
  var renderView = new RenderView(containerEl, scene);
  var camera = renderView.camera();

  var reset = function(newWorldData) {
    var masterStartTime, masterEndTime;
    var terrainStartTime, terrainEndTime;
    var roadStartTime, roadEndTime;
    var buildingsStartTime, buildingsEndTime;
    var meshes;

    destroyPreviousMeshes();

    masterStartTime = new Date();

    terrainStartTime = new Date();
    meshes = sceneBuilder.buildTerrainMeshes(newWorldData.terrain, newWorldData.roadNetwork);
    scene.add(buildMeshGroup(TERRAIN_MESH_GROUP_NAME, meshes));
    terrainEndTime = new Date();

    roadStartTime = new Date();
    meshes = sceneBuilder.buildRoadNetworkMeshes(newWorldData.terrain, newWorldData.roadNetwork);
    scene.add(buildMeshGroup(ROAD_NETWORK_MESH_GROUP_NAME, meshes));
    roadEndTime = new Date();

    buildingsStartTime = new Date();
    meshes = sceneBuilder.buildBuildingMeshes(newWorldData.buildings, newWorldData.terrain, newWorldData.roadNetwork);
    scene.add(buildMeshGroup(BUILDINGS_MESH_GROUP_NAME, meshes));
    buildingsEndTime = new Date();

    if (SHOW_DEBUG_NEIGHBORHOOD_CENTER_MARKERS === true) {
      meshes = sceneBuilder.buildDebugNeighborhoodCentersMeshes(newWorldData.terrain, newWorldData.neighborhoods);
      scene.add(buildMeshGroup(DEBUG_NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME, meshes));
    }

    centerOfCityMarkerMesh.position.x = newWorldData.centerX;
    centerOfCityMarkerMesh.position.z = newWorldData.centerZ;

    masterEndTime = new Date();

    console.log("Time to generate scene geometry: " + (masterEndTime - masterStartTime) + "ms");
    console.log("  Terrain:   " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Roads:     " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Buildings: " + (buildingsEndTime - buildingsStartTime) + "ms");
  };

  var buildMeshGroup = function(groupName, meshes) {
    var group = new THREE.Group();
    var mesh;

    group.name = groupName;

    for (mesh of meshes) {
      group.add(mesh);
    };

    return group;
  };

  var buildMarkerMeshes = function() {
    var MARKER_WIDTH = 0.2;
    var MARKER_DEPTH = 0.2;
    var MARKER_HEIGHT = 16;

    var markersStartTime, markersEndTime;
    var group;

    markersStartTime = new Date();

    group = new THREE.Group();
    group.name = DEBUG_MARKERS_MESH_GROUP_NAME;

    centerOfCityMarkerMesh = new THREE.Mesh(new THREE.BoxGeometry(MARKER_WIDTH, MARKER_HEIGHT, MARKER_DEPTH),
                                            new THREE.MeshBasicMaterial({ color: 0xff00ff }));
    group.add(centerOfCityMarkerMesh);

    centerOfActionMarkerMesh = new THREE.Mesh(new THREE.SphereGeometry(MARKER_WIDTH, 25, 25),
                                              new THREE.MeshBasicMaterial({ color: 0xff0000 }));
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
    var terrainMeshes = scene.getObjectByName(TERRAIN_MESH_GROUP_NAME);
    var roadNetworkMeshes = scene.getObjectByName(ROAD_NETWORK_MESH_GROUP_NAME);
    var buildingMeshes = scene.getObjectByName(BUILDINGS_MESH_GROUP_NAME);
    var neighborhoodCentersDebugMeshes = scene.getObjectByName(DEBUG_NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME);

    if (terrainMeshes !== undefined) {
      removeChildFromScene(terrainMeshes);
    }

    if (roadNetworkMeshes !== undefined) {
      removeChildFromScene(roadNetworkMeshes);
    }

    if (buildingMeshes !== undefined) {
      removeChildFromScene(buildingMeshes);
    }

    if (neighborhoodCentersDebugMeshes !== undefined) {
      removeChildFromScene(neighborhoodCentersDebugMeshes);
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

  gridTexture.anisotropy = Math.min(16, renderView.renderer().capabilities.getMaxAnisotropy());
  gridTexture.repeat = new THREE.Vector2(40, 40);
  gridTexture.wrapS = THREE.RepeatWrapping;
  gridTexture.wrapT = THREE.RepeatWrapping;

  window.addEventListener('resize', renderView.resize, false);

  buildMarkerMeshes();
  scene.add(sceneBuilder.buildGridPlaneMeshes()[0]);

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

export { SceneView };

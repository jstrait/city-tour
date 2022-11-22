"use strict";

import * as THREE from "three";

import { RenderView } from "./render_view";
import { Builder } from "./../meshes/builder";

const GRID_PLANE_MESH_GROUP_NAME = "gridPlaneMeshes";
const TERRAIN_MESH_GROUP_NAME = "terrainMeshes";
const ROAD_NETWORK_MESH_GROUP_NAME = "roadNetworkMeshes";
const BUILDINGS_MESH_GROUP_NAME = "buildingMeshes";
const DEBUG_GESTURE_MARKERS_MESH_GROUP_NAME = "debugGestureMarkerMeshes";
const DEBUG_NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME = "debugNeighborhoodCentersMeshes";
const DEBUG_CURVE_MESH_GROUP_NAME = "debugCurveMeshes";

var SceneView = function(containerEl, gridTexture) {
  var centerOfActionMarkerMesh;
  var touchPoint1MarkerMesh;
  var touchPoint2MarkerMesh;

  var sceneBuilder = new Builder(gridTexture);
  var scene = sceneBuilder.buildEmptyScene();
  var renderView = new RenderView(containerEl, scene);
  var camera = renderView.camera();

  let isGestureMarkersVisible = false;
  let isNeighborhoodCentersVisible = false;

  var reset = function(newWorldData) {
    var masterStartTime, masterEndTime;
    var terrainStartTime, terrainEndTime;
    var roadStartTime, roadEndTime;
    var buildingsStartTime, buildingsEndTime;
    var meshes;
    let debugNeighborhoodCentersGroup;

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
    meshes = sceneBuilder.buildBuildingMeshes(newWorldData.buildings);
    scene.add(buildMeshGroup(BUILDINGS_MESH_GROUP_NAME, meshes));
    buildingsEndTime = new Date();

    meshes = sceneBuilder.buildDebugNeighborhoodCentersMeshes(newWorldData.terrain, newWorldData.neighborhoods);
    debugNeighborhoodCentersGroup = buildMeshGroup(DEBUG_NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME, meshes);
    debugNeighborhoodCentersGroup.visible = isNeighborhoodCentersVisible;
    scene.add(debugNeighborhoodCentersGroup);

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

  let buildGestureMarkerMeshes = function() {
    const GESTURE_MARKER_WIDTH = 0.2;
    const GESTURE_MARKER_DEPTH = 0.2;
    const GESTURE_MARKER_HEIGHT = 16;

    let gestureMarkersStartTime;
    let gestureMarkersEndTime;
    var group;

    gestureMarkersStartTime = new Date();

    group = new THREE.Group();
    group.name = DEBUG_GESTURE_MARKERS_MESH_GROUP_NAME;
    group.visible = isGestureMarkersVisible;

    centerOfActionMarkerMesh = new THREE.Mesh(new THREE.SphereGeometry(GESTURE_MARKER_WIDTH, 25, 25),
                                              new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    group.add(centerOfActionMarkerMesh);

    touchPoint1MarkerMesh = new THREE.Mesh(new THREE.BoxGeometry(GESTURE_MARKER_WIDTH, GESTURE_MARKER_HEIGHT, GESTURE_MARKER_DEPTH),
                                           new THREE.MeshBasicMaterial({ color: 0xff0055 }));
    group.add(touchPoint1MarkerMesh);

    touchPoint2MarkerMesh = new THREE.Mesh(new THREE.BoxGeometry(GESTURE_MARKER_WIDTH, GESTURE_MARKER_HEIGHT, GESTURE_MARKER_DEPTH),
                                           new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    group.add(touchPoint2MarkerMesh);

    scene.add(group);

    gestureMarkersEndTime = new Date();
    console.log("Time to generate touch debug markers:   " + (gestureMarkersEndTime - gestureMarkersStartTime) + "ms");

    return group;
  };

  var destroyPreviousMeshes = function() {
    var meshGroupNames = [
      TERRAIN_MESH_GROUP_NAME,
      ROAD_NETWORK_MESH_GROUP_NAME,
      BUILDINGS_MESH_GROUP_NAME,
      DEBUG_NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME,
      DEBUG_CURVE_MESH_GROUP_NAME,
    ];

    var meshGroupName;
    var meshGroup;

    for (meshGroupName of meshGroupNames) {
      meshGroup = scene.getObjectByName(meshGroupName);
      if (meshGroup !== undefined) {
        removeChildFromScene(meshGroup);
      }
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

  var setDebugCurves = function(newCurves) {
    var previousMeshGroup = scene.getObjectByName(DEBUG_CURVE_MESH_GROUP_NAME);
    var newCurveMeshes;

    if (previousMeshGroup !== undefined) {
      removeChildFromScene(previousMeshGroup);
    }

    if (newCurves.length > 0) {
      newCurveMeshes = sceneBuilder.buildDebugCurveMeshes(newCurves);
      scene.add(buildMeshGroup(DEBUG_CURVE_MESH_GROUP_NAME, newCurveMeshes));
    }
  };

  let setIsGestureMarkersVisible = function(newIsGestureMarkersVisible) {
    isGestureMarkersVisible = newIsGestureMarkersVisible;

    scene.getObjectByName(DEBUG_GESTURE_MARKERS_MESH_GROUP_NAME).visible = newIsGestureMarkersVisible;
    renderView.makeDirty();
  };

  let setIsNeighborhoodCentersVisible = function(newIsNeighborhoodCentersVisible) {
    isNeighborhoodCentersVisible = newIsNeighborhoodCentersVisible;

    scene.getObjectByName(DEBUG_NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME).visible = newIsNeighborhoodCentersVisible;
    renderView.makeDirty();
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

  window.addEventListener("resize", renderView.resize, false);

  buildGestureMarkerMeshes();
  scene.add(sceneBuilder.buildGridPlaneMeshes()[0]);

  return {
    reset: reset,
    resize: resize,
    render: render,
    camera: function() { return camera; },
    domElement: function() { return renderView.domElement(); },
    scene: function() { return scene; },
    centerOfActionMarkerMesh: function() { return centerOfActionMarkerMesh; },
    touchPoint1MarkerMesh: function() { return touchPoint1MarkerMesh; },
    touchPoint2MarkerMesh: function() { return touchPoint2MarkerMesh; },
    setDebugCurves: setDebugCurves,
    isGestureMarkersVisible: function() { return isGestureMarkersVisible; },
    setIsGestureMarkersVisible: setIsGestureMarkersVisible,
    isNeighborhoodCentersVisible: function() { return isNeighborhoodCentersVisible; },
    setIsNeighborhoodCentersVisible: setIsNeighborhoodCentersVisible,
  };
};

export { SceneView };

"use strict";

import * as THREE from "three";

import { Config } from "./../config";
import { BuildingMeshBuilder } from "./building_mesh_builder";
import { RoadMeshBuilder } from "./road_mesh_builder";
import { TerrainMeshBuilder } from "./terrain_mesh_builder";

const CITY_CENTER_NEIGHBORHOOD_MARKER_COLOR = Object.freeze([1.0, 1.0, 0.0]);
const GENERIC_NEIGHBORHOOD_MARKER_COLOR = Object.freeze([1.0, 0.0, 1.0]);

var Builder = function(gridTexture) {
  var buildEmptyScene = function() {
    var scene, light, directionalLight;

    scene = new THREE.Scene();

    light = new THREE.HemisphereLight(0xffffff, 0xffffff, Math.PI);
    scene.add(light);

    directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI);
    directionalLight.position.set(-1, 0.9, 0.9);
    scene.add(directionalLight);

    return scene;
  };

  var buildGridPlaneMeshes = function() {
    var gridPlaneGeometry = new THREE.PlaneGeometry(320, 320, 1, 1);
    var gridPlaneMaterial = new THREE.MeshBasicMaterial({
      map: gridTexture,
      transparent: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    var gridPlaneMesh = new THREE.Mesh(gridPlaneGeometry, gridPlaneMaterial);

    gridPlaneMesh.position.y = Config.SIDEWALL_BOTTOM;
    gridPlaneMesh.rotation.x = -Math.PI / 2;

    return [gridPlaneMesh];
  };

  var buildTerrainMeshes = function(terrain, roadNetwork) {
    return TerrainMeshBuilder().build(terrain, roadNetwork);
  };

  var buildRoadNetworkMeshes = function(terrain, roadNetwork) {
    return RoadMeshBuilder().build(terrain, roadNetwork);
  };

  var buildBuildingMeshes = function(buildings) {
    return BuildingMeshBuilder().build(buildings);
  };

  var buildNeighborhoodCentersMeshes = function(terrain, neighborhoods) {
    let neighborhoodCentersGeometry = new THREE.BoxGeometry(0.5, 15, 0.5);
    let neighborhoodCentersMaterial = new THREE.MeshBasicMaterial({vertexColors: true});
    let neighborhoodCentersMesh = new THREE.InstancedMesh(neighborhoodCentersGeometry, neighborhoodCentersMaterial, neighborhoods.length);
    let neighborhoodCenterPrototype = new THREE.Object3D();
    let colorAttributes = new Float32Array(neighborhoods.length * 3);

    for (let i = 0; i < neighborhoods.length; i++) {
      neighborhoodCenterPrototype.position.x = neighborhoods[i].centerX;
      neighborhoodCenterPrototype.position.y = terrain.landHeightAt(neighborhoods[i].centerX, neighborhoods[i].centerZ);
      neighborhoodCenterPrototype.position.z = neighborhoods[i].centerZ;

      neighborhoodCenterPrototype.updateMatrix();
      neighborhoodCentersMesh.setMatrixAt(i, neighborhoodCenterPrototype.matrix);
    }

    if (neighborhoods.length > 0) {
      colorAttributes.set(CITY_CENTER_NEIGHBORHOOD_MARKER_COLOR, 0);

      for (let i = 3; i < colorAttributes.length; i += 3) {
        colorAttributes.set(GENERIC_NEIGHBORHOOD_MARKER_COLOR, i);
      }
    }

    neighborhoodCentersGeometry.setAttribute("color", new THREE.InstancedBufferAttribute(colorAttributes, 3).onUpload(disposeArray));

    return [neighborhoodCentersMesh];
  };

  var buildRouteCurveMeshes = function(routeCurves) {
    var tubeGeometry;
    var tubeMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
    var meshes = [];
    var routeCurve;

    for (routeCurve of routeCurves) {
      tubeGeometry = new THREE.TubeGeometry(routeCurve, Math.ceil(routeCurve.getLength()) * 10, 0.05, 4, false);
      meshes.push(new THREE.Mesh(tubeGeometry, tubeMaterial));
    }
    return meshes;
  };

  let disposeArray = function() {
    this.array = null;
  };

  return {
    buildEmptyScene: buildEmptyScene,
    buildGridPlaneMeshes: buildGridPlaneMeshes,
    buildTerrainMeshes: buildTerrainMeshes,
    buildRoadNetworkMeshes: buildRoadNetworkMeshes,
    buildBuildingMeshes: buildBuildingMeshes,
    buildNeighborhoodCentersMeshes: buildNeighborhoodCentersMeshes,
    buildRouteCurveMeshes: buildRouteCurveMeshes,
  };
};

export { Builder };

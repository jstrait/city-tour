"use strict";

import * as THREE from "three";

import { Config } from "./../config";
import { BuildingMeshBuilder } from "./building_mesh_builder";
import { RoadMeshBuilder } from "./road_mesh_builder";
import { TerrainMeshBuilder } from "./terrain_mesh_builder";

var Builder = function(gridTexture) {
  var buildEmptyScene = function() {
    var scene, light, directionalLight;

    scene = new THREE.Scene();

    light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    light.position.set( 0, 500, 0 );
    scene.add(light);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(-1, 0.9, 0.9);
    scene.add(directionalLight);

    return scene;
  };

  var buildGridPlaneMeshes = function() {
    var gridPlaneGeometry = new THREE.PlaneGeometry(320, 320, 1, 1);
    var gridPlaneMaterial = new THREE.MeshBasicMaterial({map: gridTexture});
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

  var buildDebugNeighborhoodCentersMeshes = function(terrain, neighborhoods) {
    var neighborhoodCenterGeometry = new THREE.Geometry();
    var reusableNeighborhoodCenterMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 15, 0.5));
    var neighborhoodCenterX;
    var neighborhoodCenterY;
    var neighborhoodCenterZ;
    var color = new THREE.Color(0xffff00);
    var face;
    var i;

    for (face of reusableNeighborhoodCenterMesh.geometry.faces) {
      face.color = color;
    }

    for (i = 0; i < neighborhoods.length; i++) {
      neighborhoodCenterX = neighborhoods[i].centerX;
      neighborhoodCenterZ = neighborhoods[i].centerZ;
      neighborhoodCenterY = terrain.landHeightAt(neighborhoodCenterX, neighborhoodCenterZ);

      reusableNeighborhoodCenterMesh.position.set(neighborhoodCenterX, neighborhoodCenterY, neighborhoodCenterZ);
      reusableNeighborhoodCenterMesh.updateMatrix();
      neighborhoodCenterGeometry.merge(reusableNeighborhoodCenterMesh.geometry, reusableNeighborhoodCenterMesh.matrix);

      if (i === 0) {
        color.set(0xff00ff);
        for (face of reusableNeighborhoodCenterMesh.geometry.faces) {
          face.color = color;
        }
      }
    }

    return [new THREE.Mesh(neighborhoodCenterGeometry, new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors}))];
  };

  var buildDebugCurveMeshes = function(curves) {
    var tubeGeometry;
    var tubeMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
    var meshes = [];
    var curve;

    for (curve of curves) {
      tubeGeometry = new THREE.TubeGeometry(curve, Math.ceil(curve.getLength()) * 10, 0.05, 4, false);
      meshes.push(new THREE.Mesh(tubeGeometry, tubeMaterial));
    }
    return meshes;
  };

  return {
    buildEmptyScene: buildEmptyScene,
    buildGridPlaneMeshes: buildGridPlaneMeshes,
    buildTerrainMeshes: buildTerrainMeshes,
    buildRoadNetworkMeshes: buildRoadNetworkMeshes,
    buildBuildingMeshes: buildBuildingMeshes,
    buildDebugNeighborhoodCentersMeshes: buildDebugNeighborhoodCentersMeshes,
    buildDebugCurveMeshes: buildDebugCurveMeshes,
  };
};

export { Builder };

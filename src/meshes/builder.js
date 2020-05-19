"use strict";

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

    gridPlaneMesh.position.y = -8.333333333333333;
    gridPlaneMesh.rotation.x = -Math.PI / 2;

    return [gridPlaneMesh];
  };

  var buildTerrainMeshes = function(terrain, roadNetwork) {
    return TerrainMeshBuilder().build(terrain, roadNetwork);
  };

  var buildRoadNetworkMeshes = function(terrain, roadNetwork) {
    return RoadMeshBuilder().build(terrain, roadNetwork);
  };

  var buildBuildingMeshes = function(buildings, terrain, roadNetwork) {
    return BuildingMeshBuilder().build(buildings, terrain, roadNetwork);
  };

  var buildDebugNeighborhoodCentersMeshes = function(terrain, neighborhoods) {
    var neighborhoodCenterGeometry = new THREE.Geometry();
    var reusableNeighborhoodCenterMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 15, 0.5));
    var neighborhoodCenterX;
    var neighborhoodCenterY;
    var neighborhoodCenterZ;
    var i;

    for (i = 0; i < neighborhoods.length; i++) {
      neighborhoodCenterX = neighborhoods[i].centerX;
      neighborhoodCenterZ = neighborhoods[i].centerZ;
      neighborhoodCenterY = terrain.landHeightAtCoordinates(neighborhoodCenterX, neighborhoodCenterZ);

      reusableNeighborhoodCenterMesh.position.set(neighborhoodCenterX, neighborhoodCenterY, neighborhoodCenterZ);
      reusableNeighborhoodCenterMesh.updateMatrix();
      neighborhoodCenterGeometry.merge(reusableNeighborhoodCenterMesh.geometry, reusableNeighborhoodCenterMesh.matrix);
    }

    return [new THREE.Mesh(neighborhoodCenterGeometry, new THREE.MeshBasicMaterial({color: 0xff00ff}))];
  };

  return {
    buildEmptyScene: buildEmptyScene,
    buildGridPlaneMeshes: buildGridPlaneMeshes,
    buildTerrainMeshes: buildTerrainMeshes,
    buildRoadNetworkMeshes: buildRoadNetworkMeshes,
    buildBuildingMeshes: buildBuildingMeshes,
    buildDebugNeighborhoodCentersMeshes: buildDebugNeighborhoodCentersMeshes,
  };
};

export { Builder };

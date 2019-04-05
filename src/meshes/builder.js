"use strict";

var CityTour = CityTour || {};
CityTour.Meshes = CityTour.Meshes || {};

CityTour.Meshes.Builder = function() {
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

  var buildMeshGroup = function(groupName, meshes) {
    var group = new THREE.Group();
    group.name = groupName;

    meshes.forEach(function(mesh) {
      group.add(mesh);
    });

    return group;
  };

  var buildTerrainMeshes = function(terrain, roadNetwork) {
    return buildMeshGroup("terrainMeshes", CityTour.Meshes.TerrainMeshBuilder().build(terrain, roadNetwork));
  };

  var buildRoadNetworkMeshes = function(terrain, roadNetwork) {
    return buildMeshGroup("roadNetworkMeshes", CityTour.Meshes.RoadMeshBuilder().build(terrain, roadNetwork));
  };

  var buildBuildingMeshes = function(buildings, roadNetwork, neighborhoods) {
    return buildMeshGroup("buildingMeshes", CityTour.Meshes.BuildingMeshBuilder().build(buildings, roadNetwork, neighborhoods));
  };


  return {
    buildEmptyScene: buildEmptyScene,
    buildTerrainMeshes: buildTerrainMeshes,
    buildRoadNetworkMeshes: buildRoadNetworkMeshes,
    buildBuildingMeshes: buildBuildingMeshes,
  };
};

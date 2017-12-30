"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.Builder = function() {
  var SKY_COLOR = new THREE.Color(0x66ccff);

  var buildEmptyScene = function() {
    var scene, light, directionalLight;

    scene = new THREE.Scene();
    scene.background = SKY_COLOR;

    light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    light.position.set( 0, 500, 0 );
    scene.add(light);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(-1, 0.9, 0.9);
    scene.add(directionalLight);

    return scene;
  };

  var buildTerrainMeshes = function(terrain, roadNetwork) {
    var terrainMeshes = CityTour.Scene.TerrainMeshBuilder().build(terrain, roadNetwork);
    var terrainGroup = new THREE.Group();
    terrainGroup.name = "terrainMeshes";

    terrainMeshes.forEach(function(mesh) {
      terrainGroup.add(mesh);
    });

    return terrainGroup;
  };

  var buildRoadNetworkMeshes = function(terrain, roadNetwork) {
    var roadNetworkMeshes = CityTour.Scene.RoadMeshBuilder().build(terrain, roadNetwork);
    var roadNetworkGroup = new THREE.Group();
    roadNetworkGroup.name = "roadNetworkMeshes";

    roadNetworkMeshes.forEach(function(mesh) {
      roadNetworkGroup.add(mesh);
    });

    return roadNetworkGroup;
  };

  var buildBuildingMeshes = function(buildings, roadNetwork) {
    var buildingMeshes;
    var buildingsGroup = new THREE.Group();
    buildingsGroup.name = "buildingMeshes";

    buildingMeshes = new CityTour.Scene.BuildingMeshBuilder().build(buildings, roadNetwork);

    buildingMeshes.forEach(function(mesh) {
      buildingsGroup.add(mesh);
    });

    return buildingsGroup;
  };


  return {
    buildEmptyScene: buildEmptyScene,
    buildTerrainMeshes: buildTerrainMeshes,
    buildRoadNetworkMeshes: buildRoadNetworkMeshes,
    buildBuildingMeshes: buildBuildingMeshes,
  };
};

"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.Builder = function() {
  var SKY_COLOR = new THREE.Color(0x66ccff);

  var scene;

  var sceneBuilder = {};

  sceneBuilder.build = function(terrain, roadNetwork, buildings) {
    var masterStartTime = new Date();

    scene = new THREE.Scene();
    scene.background = SKY_COLOR;

    var terrainStartTime = new Date();
    var terrainMeshes = new CityTour.Scene.TerrainGeometryBuilder().build(terrain, roadNetwork);
    terrainMeshes.forEach(function(terrainMesh) {
      scene.add(terrainMesh);
    });
    var terrainEndTime = new Date();

    var roadStartTime = new Date();
    var roadMeshes = new CityTour.Scene.RoadGeometryBuilder().build(terrain, roadNetwork);
    roadMeshes.forEach(function(roadMesh) {
      scene.add(roadMesh);
    });
    var roadEndTime = new Date();

    var buildingsStartTime = new Date();
    if (buildings) {
      var buildingMeshes = new CityTour.Scene.BuildingGeometryBuilder().build(buildings, roadNetwork);
      buildingMeshes.forEach(function(buildingMesh) {
        scene.add(buildingMesh);
      });
    }
    var buildingsEndTime = new Date();

    var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    light.position.set( 0, 500, 0 );
    scene.add(light);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(-1, 0.9, 0.9);
    scene.add(directionalLight);

    var masterEndTime = new Date();
    console.log("Time to generate scene geometry: " + (masterEndTime - masterStartTime) + "ms");
    console.log("  Terrain:   " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Roads:     " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Buildings: " + (buildingsEndTime - buildingsStartTime) + "ms");

    return scene;
  };

  // See https://stackoverflow.com/questions/25126352/deallocating-buffergeometry
  var removeChild = function(obj) {
    scene.remove(obj);
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      obj.geometry = null;
      obj.material.dispose();
      obj.material = null;
    }

    obj = null;
  };

  sceneBuilder.destroy = function() {
    scene.children.forEach(removeChild);
  };

  return sceneBuilder;
};

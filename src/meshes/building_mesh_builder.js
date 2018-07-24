"use strict";

var CityTour = CityTour || {};
CityTour.Meshes = CityTour.Meshes || {};

CityTour.Meshes.BuildingMeshBuilder = function() {
  var buildMaterials = function() {
    var i;
    var random;
    var r, g, b;
    var buildingMaterials = [];

    for (i = 0; i < CityTour.Config.MAX_BUILDING_MATERIALS; i++) {
      random = Math.random() * 0.7;
      r = random;
      g = random;
      b = random;

      buildingMaterials.push(new THREE.MeshLambertMaterial({ color: new THREE.Color(r, g, b), }));
    }

    return buildingMaterials;
  };

  var buildEmptyGeometriesForBuildings = function() {
    var i;
    var buildingGeometries = [];

    for (i = 0; i < CityTour.Config.MAX_BUILDING_MATERIALS; i++) {
      buildingGeometries.push(new THREE.Geometry());
    }

    return buildingGeometries;
  };

  var generateBuildingGeometries = function(buildings, buildingGeometries, roadNetwork) {
    var HALF_STREET_WIDTH = CityTour.Config.STREET_WIDTH / 2;
    var HALF_STREET_DEPTH = CityTour.Config.STREET_DEPTH / 2;

    var mapX, mapZ, sceneX, sceneZ;
    var block;

    var reusableBuildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    reusableBuildingGeometry.faces.splice(6, 2);   // Remove bottom faces, since they are underground and invisible

    var reusableBuildingMesh = new THREE.Mesh(reusableBuildingGeometry);

    var generateLotBuilding = function(lot) {
      var storyHeight = Math.round(CityTour.Math.randomInRange(CityTour.Config.MIN_STORY_HEIGHT, CityTour.Config.MAX_STORY_HEIGHT));
      var buildingHeight = storyHeight * lot.stories + (lot.ySurface - lot.yFloor);
      var materialIndex = Math.floor(Math.random() * CityTour.Config.MAX_BUILDING_MATERIALS);
      var cylinderMesh;

      reusableBuildingMesh.scale.x = lot.dimensions.width * CityTour.Config.BLOCK_WIDTH;
      reusableBuildingMesh.position.x = sceneX + (CityTour.Config.BLOCK_WIDTH * lot.dimensions.midpointX);

      reusableBuildingMesh.scale.y = buildingHeight;
      reusableBuildingMesh.position.y = (buildingHeight / 2) + lot.yFloor;

      reusableBuildingMesh.scale.z = lot.dimensions.depth * CityTour.Config.BLOCK_DEPTH;
      reusableBuildingMesh.position.z = sceneZ + (CityTour.Config.BLOCK_DEPTH * lot.dimensions.midpointZ);

      reusableBuildingMesh.updateMatrix();

      buildingGeometries[materialIndex].merge(reusableBuildingMesh.geometry, reusableBuildingMesh.matrix);

      if (lot.roofStyle === 'antenna') {
        cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 4));
        cylinderMesh.position.x = sceneX + (CityTour.Config.BLOCK_WIDTH * lot.dimensions.midpointX);
        cylinderMesh.position.y = lot.yFloor + buildingHeight + 5;
        cylinderMesh.position.z = sceneZ + (CityTour.Config.BLOCK_DEPTH * lot.dimensions.midpointZ);
        cylinderMesh.updateMatrix();
        buildingGeometries[materialIndex].merge(cylinderMesh.geometry, cylinderMesh.matrix);
      }
    };

    for (mapX = roadNetwork.minColumn(); mapX < roadNetwork.maxColumn(); mapX++) {
      sceneX = CityTour.Coordinates.mapXToSceneX(mapX) + HALF_STREET_WIDTH;

      for (mapZ = roadNetwork.minRow(); mapZ < roadNetwork.maxRow(); mapZ++) {
        sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ) + HALF_STREET_DEPTH;

        block = buildings.blockAtCoordinates(mapX, mapZ);
        block.forEach(generateLotBuilding);
      }
    }
  };


  var buildingMeshBuilder = {};

  buildingMeshBuilder.build = function(buildings, roadNetwork) {
    var i;
    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();
    var buildingMeshes = [];

    generateBuildingGeometries(buildings, buildingGeometries, roadNetwork);

    for (i = 0; i < CityTour.Config.MAX_BUILDING_MATERIALS; i++) {
      buildingMeshes.push(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
    }

    return buildingMeshes;
  };

  return buildingMeshBuilder;
};

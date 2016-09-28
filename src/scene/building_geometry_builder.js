"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.BuildingGeometryBuilder = function() {
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

  var generateBuildingGeometries = function(buildings, buildingGeometries) {
    var HALF_STREET_WIDTH = CityTour.Config.STREET_WIDTH / 2;
    var HALF_STREET_DEPTH = CityTour.Config.STREET_DEPTH / 2;
    var MIN_STORIES_FOR_ANTENNA = 25;
    var PROBABILITY_OF_TALL_BUILDING_ANTENNA = 0.3;

    var mapX, mapZ, sceneX, sceneZ;
    var block;
    var storyHeight, buildingHeight;
    var materialIndex;

    var mapLotWidth, mapLotDepth, mapLotXMidpoint, mapLotZMidpoint;

    var reusableBuildingMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    var cylinderMesh;

    for (mapX = -CityTour.Config.HALF_BLOCK_COLUMNS; mapX < CityTour.Config.HALF_BLOCK_COLUMNS; mapX++) {
      sceneX = CityTour.Coordinates.mapXToSceneX(mapX) + HALF_STREET_WIDTH;

      for (mapZ = -CityTour.Config.HALF_BLOCK_ROWS; mapZ < CityTour.Config.HALF_BLOCK_ROWS; mapZ++) {
        sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ) + HALF_STREET_DEPTH;

        block = buildings.blockAtCoordinates(mapX, mapZ) || [];

        block.forEach(function(lot) {
          mapLotWidth = lot.right - lot.left;
          mapLotDepth = lot.bottom - lot.top;
          mapLotXMidpoint = lot.left + (mapLotWidth / 2);
          mapLotZMidpoint = lot.top + (mapLotDepth / 2);

          storyHeight = ((CityTour.Config.MAX_STORY_HEIGHT - CityTour.Config.MIN_STORY_HEIGHT) * Math.random()) + CityTour.Config.MIN_STORY_HEIGHT;
          buildingHeight = storyHeight * lot.stories + (lot.ySurface - lot.yFloor); 

          reusableBuildingMesh.scale.x = mapLotWidth * CityTour.Config.BLOCK_WIDTH;
          reusableBuildingMesh.position.x = sceneX + (CityTour.Config.BLOCK_WIDTH * mapLotXMidpoint);

          reusableBuildingMesh.scale.y = buildingHeight;
          reusableBuildingMesh.position.y = (buildingHeight / 2) + lot.yFloor;

          reusableBuildingMesh.scale.z = mapLotDepth * CityTour.Config.BLOCK_DEPTH;
          reusableBuildingMesh.position.z = sceneZ + (CityTour.Config.BLOCK_DEPTH * mapLotZMidpoint);

          reusableBuildingMesh.updateMatrix();

          materialIndex = Math.floor(Math.random() * CityTour.Config.MAX_BUILDING_MATERIALS);
          buildingGeometries[materialIndex].merge(reusableBuildingMesh.geometry, reusableBuildingMesh.matrix);

          // Add antenna to tall buildings
          if (lot.stories > MIN_STORIES_FOR_ANTENNA && (Math.random() < PROBABILITY_OF_TALL_BUILDING_ANTENNA)) {
            cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 4));
            cylinderMesh.position.x = sceneX + (CityTour.Config.BLOCK_WIDTH * mapLotXMidpoint);
            cylinderMesh.position.y = lot.yFloor + buildingHeight + 5;
            cylinderMesh.position.z = sceneZ + (CityTour.Config.BLOCK_DEPTH * mapLotZMidpoint);
            cylinderMesh.updateMatrix();
            buildingGeometries[materialIndex].merge(cylinderMesh.geometry, cylinderMesh.matrix);
          }
        });
      }
    }
  };


  var buildingGeometryBuilder = {};

  buildingGeometryBuilder.build = function(buildings) {
    var i;
    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();
    var buildingMeshes = [];

    generateBuildingGeometries(buildings, buildingGeometries);

    for (i = 0; i < CityTour.Config.MAX_BUILDING_MATERIALS; i++) {
      buildingMeshes.push(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
    }

    return buildingMeshes;
  };

  return buildingGeometryBuilder;
};

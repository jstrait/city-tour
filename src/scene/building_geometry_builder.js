"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.BuildingGeometryBuilder = function() {
  var buildMaterials = function() {
    var buildingMaterials = [];

    for (var i = 0; i < CityTour.Config.MAX_BUILDING_MATERIALS; i++) {
      var random = Math.random() * 0.7;
      var r = random;
      var g = random;
      var b = random;

      buildingMaterials.push(new THREE.MeshLambertMaterial({ color: new THREE.Color(r, g, b), }));
    }

    return buildingMaterials;
  };

  var buildEmptyGeometriesForBuildings = function() {
    var buildingGeometries = [];

    for (var i = 0; i < CityTour.Config.MAX_BUILDING_MATERIALS; i++) {
      buildingGeometries.push(new THREE.Geometry());
    }

    return buildingGeometries;
  };

  var generateBuildingGeometries = function(buildings, buildingGeometries) {
    var HALF_STREET_WIDTH = CityTour.Config.STREET_WIDTH / 2;
    var HALF_STREET_DEPTH = CityTour.Config.STREET_DEPTH / 2;

    var mapX, mapZ, sceneX, sceneZ;
    var block;
    var storyHeight, buildingHeight;
    var materialIndex;

    var reusableBuildingMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

    for (mapX = -CityTour.Config.HALF_BLOCK_COLUMNS; mapX < CityTour.Config.HALF_BLOCK_COLUMNS; mapX++) {
      sceneX = CityTour.Coordinates.mapXToSceneX(mapX) + HALF_STREET_WIDTH;

      for (mapZ = -CityTour.Config.HALF_BLOCK_ROWS; mapZ < CityTour.Config.HALF_BLOCK_ROWS; mapZ++) {
        sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ) + HALF_STREET_DEPTH;

        block = buildings.blockAtCoordinates(mapX, mapZ);

        block.forEach(function(lot) {
          var mapLotWidth = lot.right - lot.left;
          var mapLotDepth = lot.bottom - lot.top;
          var mapLotXMidpoint = lot.left + (mapLotWidth / 2);
          var mapLotZMidpoint = lot.top + (mapLotDepth / 2);

          storyHeight = ((CityTour.Config.MAX_STORY_HEIGHT - CityTour.Config.MIN_STORY_HEIGHT) * Math.random()) + CityTour.Config.MIN_STORY_HEIGHT;
          buildingHeight = storyHeight * lot.stories + (lot.ySurface - lot.yFloor); 

          reusableBuildingMesh.scale.x = mapLotWidth * CityTour.Config.BLOCK_WIDTH;
          reusableBuildingMesh.position.x = sceneX + (CityTour.Config.BLOCK_WIDTH * mapLotXMidpoint);

          reusableBuildingMesh.scale.y = buildingHeight;
          reusableBuildingMesh.position.y = (buildingHeight / 2) + lot.yFloor;

          reusableBuildingMesh.scale.z = mapLotDepth * CityTour.Config.BLOCK_WIDTH;
          reusableBuildingMesh.position.z = sceneZ + (CityTour.Config.BLOCK_DEPTH * mapLotZMidpoint);

          reusableBuildingMesh.updateMatrix();

          materialIndex = Math.floor(Math.random() * CityTour.Config.MAX_BUILDING_MATERIALS);
          buildingGeometries[materialIndex].merge(reusableBuildingMesh.geometry, reusableBuildingMesh.matrix);
        
          if (lot.stories > 25 && (Math.random() < 0.3)) {
            var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 4));
            cylinder.position.x = sceneX + (CityTour.Config.BLOCK_WIDTH * mapLotXMidpoint);
            cylinder.position.y = lot.yFloor + buildingHeight + 5;
            cylinder.position.z = sceneZ + (CityTour.Config.BLOCK_DEPTH * mapLotZMidpoint);
            cylinder.updateMatrix();
            buildingGeometries[materialIndex].merge(cylinder.geometry, cylinder.matrix);
          }
        });
      }
    }
  };


  var buildingGeometryBuilder = {};

  buildingGeometryBuilder.build = function(buildings) {
    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();

    generateBuildingGeometries(buildings, buildingGeometries);

    var buildingMeshes = [];
    for (var i = 0; i < CityTour.Config.MAX_BUILDING_MATERIALS; i++) {
      buildingMeshes.push(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
    }

    return buildingMeshes;
  };

  return buildingGeometryBuilder;
};

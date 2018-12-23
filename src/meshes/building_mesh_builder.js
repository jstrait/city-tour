"use strict";

var CityTour = CityTour || {};
CityTour.Meshes = CityTour.Meshes || {};

CityTour.Meshes.BuildingMeshBuilder = function() {
  var MAX_BUILDING_MATERIALS = 50;
  var SHOW_NEIGHBORHOOD_CENTER_MARKERS = false;

  var buildMaterials = function() {
    var i;
    var random;
    var r, g, b;
    var buildingMaterials = [];

    for (i = 0; i < MAX_BUILDING_MATERIALS; i++) {
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

    for (i = 0; i < MAX_BUILDING_MATERIALS; i++) {
      buildingGeometries.push(new THREE.Geometry());
    }

    return buildingGeometries;
  };

  var generateBuildingGeometries = function(buildings, buildingGeometries, roadNetwork) {
    var HALF_STREET_WIDTH = CityTour.Config.STREET_WIDTH / 2;
    var HALF_STREET_DEPTH = CityTour.Config.STREET_DEPTH / 2;

    var x, z, leftX, topZ;
    var minX, maxX, minZ, maxZ;
    var block;

    var reusableBuildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    reusableBuildingGeometry.faces.splice(6, 2);   // Remove bottom faces, since they are underground and invisible

    var reusableBuildingMesh = new THREE.Mesh(reusableBuildingGeometry);

    var generateLotBuilding = function(lot) {
      var materialIndex = Math.floor(Math.random() * MAX_BUILDING_MATERIALS);
      var cylinderMesh;

      reusableBuildingMesh.scale.x = lot.dimensions.width * CityTour.Config.BLOCK_WIDTH;
      reusableBuildingMesh.position.x = leftX + (CityTour.Config.BLOCK_WIDTH * lot.dimensions.midpointX);

      reusableBuildingMesh.scale.y = lot.height;
      reusableBuildingMesh.position.y = (lot.height / 2) + lot.yFloor;

      reusableBuildingMesh.scale.z = lot.dimensions.depth * CityTour.Config.BLOCK_DEPTH;
      reusableBuildingMesh.position.z = topZ + (CityTour.Config.BLOCK_DEPTH * lot.dimensions.midpointZ);

      reusableBuildingMesh.updateMatrix();

      buildingGeometries[materialIndex].merge(reusableBuildingMesh.geometry, reusableBuildingMesh.matrix);

      if (lot.roofStyle === 'antenna') {
        cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.016666666666667, 0.016666666666667, 0.833333333333333, 4));
        cylinderMesh.position.x = leftX + (CityTour.Config.BLOCK_WIDTH * lot.dimensions.midpointX);
        cylinderMesh.position.y = lot.yFloor + lot.height + 0.416666666666667;
        cylinderMesh.position.z = topZ + (CityTour.Config.BLOCK_DEPTH * lot.dimensions.midpointZ);
        cylinderMesh.updateMatrix();
        buildingGeometries[materialIndex].merge(cylinderMesh.geometry, cylinderMesh.matrix);
      }
    };

    minX = roadNetwork.minColumn();
    maxX = roadNetwork.maxColumn();
    minZ = roadNetwork.minRow();
    maxZ = roadNetwork.maxRow();

    for (x = minX; x < maxX; x++) {
      leftX = x + HALF_STREET_WIDTH;

      for (z = minZ; z < maxZ; z++) {
        topZ = z + HALF_STREET_DEPTH;

        block = buildings.blockAtCoordinates(x, z);
        block.forEach(generateLotBuilding);
      }
    }
  };

  var generateNeighborhoodCenterMarkersMesh = function(neighborhoods) {
    var neighborhoodCenterGeometry = new THREE.Geometry();
    var reusableNeighborhoodCenterMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 15, 0.5));
    var i;

    for (i = 0; i < neighborhoods.length; i++) {
      reusableNeighborhoodCenterMesh.position.set(neighborhoods[i].centerX, 7.5, neighborhoods[i].centerZ);
      reusableNeighborhoodCenterMesh.updateMatrix();
      neighborhoodCenterGeometry.merge(reusableNeighborhoodCenterMesh.geometry, reusableNeighborhoodCenterMesh.matrix);
    }

    return new THREE.Mesh(neighborhoodCenterGeometry, new THREE.MeshBasicMaterial({ color: 0xff00ff }));
  };


  var buildingMeshBuilder = {};

  buildingMeshBuilder.build = function(buildings, roadNetwork, neighborhoods) {
    var i;
    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();
    var buildingMeshes = [];

    generateBuildingGeometries(buildings, buildingGeometries, roadNetwork);

    for (i = 0; i < MAX_BUILDING_MATERIALS; i++) {
      buildingMeshes.push(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
    }

    if (SHOW_NEIGHBORHOOD_CENTER_MARKERS === true && neighborhoods !== undefined) {
      buildingMeshes.push(generateNeighborhoodCenterMarkersMesh(neighborhoods));
    }

    return buildingMeshes;
  };

  return buildingMeshBuilder;
};

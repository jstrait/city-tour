"use strict";

import { Config } from "./../config";

var BuildingMeshBuilder = function() {
  var SHOW_NEIGHBORHOOD_CENTER_MARKERS = false;

  var generateBuildingGeometries = function(buildings, buildingsGeometry, roadNetwork) {
    var HALF_STREET_WIDTH = Config.STREET_WIDTH / 2;
    var HALF_STREET_DEPTH = Config.STREET_DEPTH / 2;

    var x, z, leftX, topZ;
    var minX, maxX, minZ, maxZ;
    var block;
    var color = new THREE.Color();

    var reusableBuildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    reusableBuildingGeometry.faces.splice(6, 2);   // Remove bottom faces, since they are underground and invisible

    var reusableBuildingMesh = new THREE.Mesh(reusableBuildingGeometry);

    var generateLotBuilding = function(lot) {
      var cylinderGeometry;
      var cylinderMesh;
      var random;
      var i;

      reusableBuildingMesh.scale.x = lot.dimensions.width * Config.BLOCK_WIDTH;
      reusableBuildingMesh.position.x = leftX + (Config.BLOCK_WIDTH * lot.dimensions.midpointX);

      reusableBuildingMesh.scale.y = lot.height;
      reusableBuildingMesh.position.y = (lot.height / 2) + lot.yFloor;

      reusableBuildingMesh.scale.z = lot.dimensions.depth * Config.BLOCK_DEPTH;
      reusableBuildingMesh.position.z = topZ + (Config.BLOCK_DEPTH * lot.dimensions.midpointZ);

      reusableBuildingMesh.updateMatrix();

      random = Math.random();
      color.setRGB(random, random, random);
      reusableBuildingGeometry.faces[0].color = color;
      reusableBuildingGeometry.faces[1].color = color;
      reusableBuildingGeometry.faces[2].color = color;
      reusableBuildingGeometry.faces[3].color = color;
      reusableBuildingGeometry.faces[4].color = color;
      reusableBuildingGeometry.faces[5].color = color;
      reusableBuildingGeometry.faces[6].color = color;
      reusableBuildingGeometry.faces[7].color = color;
      reusableBuildingGeometry.faces[8].color = color;
      reusableBuildingGeometry.faces[9].color = color;

      buildingsGeometry.merge(reusableBuildingMesh.geometry, reusableBuildingMesh.matrix);

      if (lot.roofStyle === 'antenna') {
        cylinderGeometry = new THREE.CylinderGeometry(0.016666666666667, 0.016666666666667, 0.833333333333333, 4);
        cylinderMesh = new THREE.Mesh(cylinderGeometry);

        cylinderMesh.position.x = leftX + (Config.BLOCK_WIDTH * lot.dimensions.midpointX);
        cylinderMesh.position.y = lot.yFloor + lot.height + 0.416666666666667;
        cylinderMesh.position.z = topZ + (Config.BLOCK_DEPTH * lot.dimensions.midpointZ);
        cylinderMesh.updateMatrix();

        for (i = 0; i < cylinderGeometry.faces.length; i++) {
          cylinderGeometry.faces[i].color = color;
        }

        buildingsGeometry.merge(cylinderMesh.geometry, cylinderMesh.matrix);
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
    var buildingsMaterial = new THREE.MeshLambertMaterial({vertexColors: THREE.FaceColors});
    var buildingsGeometry = new THREE.Geometry();
    var buildingMeshes = [];

    generateBuildingGeometries(buildings, buildingsGeometry, roadNetwork);

    buildingMeshes.push(new THREE.Mesh(buildingsGeometry, buildingsMaterial));

    if (SHOW_NEIGHBORHOOD_CENTER_MARKERS === true && neighborhoods !== undefined) {
      buildingMeshes.push(generateNeighborhoodCenterMarkersMesh(neighborhoods));
    }

    return buildingMeshes;
  };

  return buildingMeshBuilder;
};

export { BuildingMeshBuilder };

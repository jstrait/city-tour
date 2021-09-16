"use strict";

import * as THREE from "three";

import { Config } from "./../config";

var BuildingMeshBuilder = function() {
  const USE_INSTANCING = true;

  var generateBuildingGeometries = function(buildings, buildingsGeometry, roadNetwork) {
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

      if (lot.roofStyle === "antenna") {
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

    minX = roadNetwork.minBoundingX();
    maxX = roadNetwork.maxBoundingX();
    minZ = roadNetwork.minBoundingZ();
    maxZ = roadNetwork.maxBoundingZ();

    for (x = minX; x < maxX; x++) {
      leftX = x + Config.HALF_STREET_WIDTH;

      for (z = minZ; z < maxZ; z++) {
        topZ = z + Config.HALF_STREET_DEPTH;

        block = buildings.blockAtCoordinates(x, z);
        block.forEach(generateLotBuilding);
      }
    }
  };

  let build = function(buildings, roadNetwork) {
    let buildingsMaterial;
    let buildingsGeometry;
    let buildingMeshes;

    if (USE_INSTANCING === true) {
      return [generateInstancedBuildingsMesh(buildings, roadNetwork)];
    }
    else {
      buildingsMaterial = new THREE.MeshLambertMaterial({vertexColors: THREE.FaceColors});
      buildingsGeometry = new THREE.Geometry();
      buildingMeshes = [];

      generateBuildingGeometries(buildings, buildingsGeometry, roadNetwork);

      buildingMeshes.push(new THREE.Mesh(buildingsGeometry, buildingsMaterial));

      return buildingMeshes;
    }
  };

  let generateInstancedBuildingsMesh = function(buildings, roadNetwork) {
    const INSTANCE_COUNT = buildings.count;

    let buildingsGeometry = buildBuildingsBufferGeometry(INSTANCE_COUNT);
    let buildingsMaterial = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors});
    let buildingsMesh = new THREE.InstancedMesh(buildingsGeometry, buildingsMaterial, INSTANCE_COUNT);
    let buildingPrototype = new THREE.Object3D();

    let minX = roadNetwork.minBoundingX();
    let maxX = roadNetwork.maxBoundingX();
    let minZ = roadNetwork.minBoundingZ();
    let maxZ = roadNetwork.maxBoundingZ();

    let instanceIndex = 0;
    let x;
    let z;
    let l;
    let leftX;
    let topZ;
    let block;
    let lot;

    for (x = minX; x < maxX; x++) {
      leftX = x + Config.HALF_STREET_WIDTH;

      for (z = minZ; z < maxZ; z++) {
        topZ = z + Config.HALF_STREET_DEPTH;

        block = buildings.blockAtCoordinates(x, z);
        for (l = 0; l < block.length; l++) {
          lot = block[l];

          buildingPrototype.position.x = leftX + (Config.BLOCK_WIDTH * lot.dimensions.midpointX);
          buildingPrototype.position.y = (lot.height / 2) + lot.yFloor;
          buildingPrototype.position.z = topZ + (Config.BLOCK_DEPTH * lot.dimensions.midpointZ);

          buildingPrototype.scale.x = lot.dimensions.width * Config.BLOCK_WIDTH;
          buildingPrototype.scale.y = lot.height;
          buildingPrototype.scale.z = lot.dimensions.depth * Config.BLOCK_DEPTH;

          buildingPrototype.updateMatrix();
          buildingsMesh.setMatrixAt(instanceIndex, buildingPrototype.matrix);

          instanceIndex += 1;
        }
      }
    }

    return buildingsMesh;
  };

  let buildBuildingsBufferGeometry = function(instanceCount) {
    let buildingsGeometry = new THREE.BufferGeometry();
    let disposeArray = function() {
      this.array = null;
    };

    // Purposely does not include triangles for the floor,
    // since floors should never be visible.
    let vertices = new Float32Array([
      -0.5, -0.5, 0.5,
      0.5, -0.5, 0.5,
      0.5, 0.5, 0.5,

      0.5, 0.5, 0.5,
      -0.5, 0.5, 0.5,
      -0.5, -0.5, 0.5,

      0.5, -0.5, -0.5,
      -0.5, -0.5, -0.5,
      -0.5, 0.5, -0.5,

      -0.5, 0.5, -0.5,
      0.5, 0.5, -0.5,
      0.5, -0.5, -0.5,

      -0.5, -0.5, -0.5,
      -0.5, 0.5, 0.5,
      -0.5, 0.5, -0.5,

      -0.5, 0.5, 0.5,
      -0.5, -0.5, -0.5,
      -0.5, -0.5, 0.5,

      0.5, 0.5, -0.5,
      0.5, -0.5, 0.5,
      0.5, -0.5, -0.5,

      0.5, 0.5, -0.5,
      0.5, 0.5, 0.5,
      0.5, -0.5, 0.5,

      0.5, 0.5, -0.5,
      -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5,

      0.5, 0.5, -0.5,
      -0.5, 0.5,  0.5,
      0.5, 0.5,  0.5,
    ]);

    let normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,

      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,

      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,

      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,

      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
    ]);

    buildingsGeometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3).onUpload(disposeArray));
    buildingsGeometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3).onUpload(disposeArray));
    buildingsGeometry.setAttribute("color", buildInstancedColorBufferAttributes(instanceCount).onUpload(disposeArray));

    return buildingsGeometry;
  };

  let buildInstancedColorBufferAttributes = function(instanceCount) {
    let colorAttributes = new Float32Array(instanceCount * 3);
    let color = new THREE.Color();
    let gray;
    let i;

    for (i = 0;  i < instanceCount; i++) {
      gray = Math.random();
      color.setRGB(gray, gray, gray);
      color.toArray(colorAttributes, i * 3);
    }

    return new THREE.InstancedBufferAttribute(colorAttributes, 3);
  };


  return {
    build: build,
  };
};

export { BuildingMeshBuilder };

"use strict";

import * as THREE from "three";

import { Config } from "./../config";

const ANTENNA_WIDTH = 0.023570226039552;
const ANTENNA_DEPTH = 0.023570226039552;
const ANTENNA_HEIGHT = 0.833333333333333;
const ANTENNA_Y_CENTER_OFFSET = 0.416666666666667;

var BuildingMeshBuilder = function() {
  let build = function(buildings) {
    const INSTANCE_COUNT = buildings.buildingCount + buildings.antennaCount;

    let buildingsGeometry = buildBuildingsBufferGeometry();
    let buildingsMaterial = new THREE.MeshLambertMaterial({vertexColors: true});
    let buildingsMesh = new THREE.InstancedMesh(buildingsGeometry, buildingsMaterial, INSTANCE_COUNT);
    let buildingPrototype = new THREE.Object3D();
    let colorAttributes = new Float32Array(INSTANCE_COUNT * 3);
    let color = new THREE.Color();
    let gray;

    let minX = buildings.boundingBox.minX;
    let maxX = buildings.boundingBox.maxX;
    let minZ = buildings.boundingBox.minZ;
    let maxZ = buildings.boundingBox.maxZ;

    let instanceIndex = 0;
    let x;
    let z;
    let l;
    let leftX;
    let topZ;
    let block;
    let lot;

    for (x = minX; x <= maxX; x++) {
      leftX = x + Config.HALF_STREET_WIDTH;

      for (z = minZ; z <= maxZ; z++) {
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

          gray = Math.random();
          color.setRGB(gray, gray, gray);
          color.toArray(colorAttributes, instanceIndex * 3);

          instanceIndex += 1;

          if (lot.roofStyle === "antenna") {
            // The X and Z position are the same as the main building (i.e., the center of
            // the lot) and should already be set, so only the Y position needs to be modified.
            buildingPrototype.position.y = lot.yFloor + lot.height + ANTENNA_Y_CENTER_OFFSET;

            buildingPrototype.scale.x = ANTENNA_WIDTH;
            buildingPrototype.scale.y = ANTENNA_HEIGHT;
            buildingPrototype.scale.z = ANTENNA_DEPTH;

            buildingPrototype.updateMatrix();
            buildingsMesh.setMatrixAt(instanceIndex, buildingPrototype.matrix);

            color.toArray(colorAttributes, instanceIndex * 3);

            instanceIndex += 1;
          }
        }
      }
    }

    if (instanceIndex !== INSTANCE_COUNT) {
      throw new Error(`Expected ${INSTANCE_COUNT} building instances to be created, but ${instanceIndex} were.`);
    }

    buildingsGeometry.setAttribute("color", new THREE.InstancedBufferAttribute(colorAttributes, 3).onUpload(disposeArray));

    return [buildingsMesh];
  };

  let buildBuildingsBufferGeometry = function() {
    let buildingsGeometry = new THREE.BufferGeometry();

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

    return buildingsGeometry;
  };

  let disposeArray = function() {
    this.array = null;
  };


  return {
    build: build,
  };
};

export { BuildingMeshBuilder };

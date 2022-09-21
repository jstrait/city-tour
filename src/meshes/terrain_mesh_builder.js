"use strict";

import * as THREE from "three";

import { Config } from "./../config";
import { RoadNetwork } from "./../road_network";

const LAND_COLOR_R = 0.0;
const LAND_COLOR_G = 0.48;
const LAND_COLOR_B = 0.0;

const WATER_COLOR_R = 0.1;
const WATER_COLOR_G = 0.2;
const WATER_COLOR_B = 1.0;

var TerrainMeshBuilder = function() {
  var LAND = 1;
  var WATER = 2;

  var SIDE_BOTTOM_HEIGHT = Config.SIDEWALL_BOTTOM;
  var MAX_WATER_HEIGHT = -SIDE_BOTTOM_HEIGHT;

  let positionAttributes = null;
  let normalAttributes = null;
  let colorAttributes = null;

  var reusableTriangleVertex1 = new THREE.Vector3();
  var reusableTriangleVertex2 = new THREE.Vector3();
  var reusableTriangleVertex3 = new THREE.Vector3();
  let reusableTriangle = new THREE.Triangle(reusableTriangleVertex1, reusableTriangleVertex2, reusableTriangleVertex3);
  let reusableTriangleNormal = new THREE.Vector3();

  let build = function(terrain, roadNetwork) {
    var triangleWidth = terrain.scale();
    var triangleDepth = terrain.scale();

    var terrainGeometry = new THREE.BufferGeometry();
    var terrainMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });

    let disposeArray = function() {
      this.array = null;
    };

    positionAttributes = [];
    normalAttributes = [];
    colorAttributes = [];

    // Vertical sides along the edges of the terrain
    addNorthVerticalFace(terrain, triangleWidth);
    addSouthVerticalFace(terrain, triangleWidth);
    addWestVerticalFace(terrain, triangleDepth);
    addEastVerticalFace(terrain, triangleDepth);

    // Main terrain
    addMainTerrain(terrain, roadNetwork, triangleWidth, triangleDepth);

    terrainGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positionAttributes), 3).onUpload(disposeArray));
    terrainGeometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normalAttributes), 3).onUpload(disposeArray));
    terrainGeometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colorAttributes), 3).onUpload(disposeArray));

    positionAttributes = null;
    normalAttributes = null;
    colorAttributes = null;

    return [new THREE.Mesh(terrainGeometry, terrainMaterial)];
  };

  var addTriangle = function(x1, y1, z1, material1, x2, y2, z2, material2, x3, y3, z3, material3) {
    positionAttributes.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);

    reusableTriangleVertex1.set(x1, y1, z1);
    reusableTriangleVertex2.set(x2, y2, z2);
    reusableTriangleVertex3.set(x3, y3, z3);
    reusableTriangle.getNormal(reusableTriangleNormal);
    normalAttributes.push(reusableTriangleNormal.x, reusableTriangleNormal.y, reusableTriangleNormal.z,
                          reusableTriangleNormal.x, reusableTriangleNormal.y, reusableTriangleNormal.z,
                          reusableTriangleNormal.x, reusableTriangleNormal.y, reusableTriangleNormal.z);

    if (material1 === WATER && material2 === WATER && material3 == WATER) {
      colorAttributes.push(WATER_COLOR_R, WATER_COLOR_G, WATER_COLOR_B,
                           WATER_COLOR_R, WATER_COLOR_G, WATER_COLOR_B,
                           WATER_COLOR_R, WATER_COLOR_G, WATER_COLOR_B);
    }
    else {
      colorAttributes.push(LAND_COLOR_R, LAND_COLOR_G, LAND_COLOR_B,
                           LAND_COLOR_R, LAND_COLOR_G, LAND_COLOR_B,
                           LAND_COLOR_R, LAND_COLOR_G, LAND_COLOR_B);
    }
  };

  var addNorthVerticalFace = function(terrain, triangleWidth) {
    var x;
    var z = terrain.maxZ();
    var leftX, rightX;
    var leftLandHeight, leftWaterHeight, leftTotalHeight;
    var rightLandHeight, rightWaterHeight, rightTotalHeight;
    var neighboringWaterHeight;

    for (x = terrain.minX(); x < terrain.maxX(); x += triangleWidth) {
      leftX = x;
      rightX = x + triangleWidth;

      leftLandHeight = Math.max(SIDE_BOTTOM_HEIGHT, terrain.landHeightAt(leftX, z));
      leftWaterHeight = Math.min(MAX_WATER_HEIGHT, terrain.waterHeightAt(leftX, z));
      leftTotalHeight = leftLandHeight + leftWaterHeight;
      rightLandHeight = Math.max(SIDE_BOTTOM_HEIGHT, terrain.landHeightAt(rightX, z));
      rightWaterHeight = Math.min(MAX_WATER_HEIGHT, terrain.waterHeightAt(rightX, z));
      rightTotalHeight = rightLandHeight + rightWaterHeight;
      neighboringWaterHeight = terrain.waterHeightAt(rightX, z - 1);

      if (leftWaterHeight === 0.0 || rightWaterHeight === 0.0 || neighboringWaterHeight === 0.0) {
        leftLandHeight = leftTotalHeight;
        rightLandHeight = rightTotalHeight;
      }

      if (leftWaterHeight !== MAX_WATER_HEIGHT || rightWaterHeight !== MAX_WATER_HEIGHT) {
        addTriangle(leftX,  leftLandHeight,     z, LAND,
                    leftX,  SIDE_BOTTOM_HEIGHT, z, LAND,
                    rightX, rightLandHeight,    z, LAND);

        addTriangle(leftX,  SIDE_BOTTOM_HEIGHT, z, LAND,
                    rightX, SIDE_BOTTOM_HEIGHT, z, LAND,
                    rightX, rightLandHeight,    z, LAND);
      }

      if (leftWaterHeight > 0.0 && rightWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        addTriangle(leftX,  leftTotalHeight,  z, WATER,
                    leftX,  leftLandHeight,   z, WATER,
                    rightX, rightTotalHeight, z, WATER);

        addTriangle(leftX,  leftLandHeight,   z, WATER,
                    rightX, rightLandHeight,  z, WATER,
                    rightX, rightTotalHeight, z, WATER);
      }
    }
  };

  var addSouthVerticalFace = function(terrain, triangleWidth) {
    var x;
    var z = terrain.minZ();
    var leftX, rightX;
    var leftLandHeight, leftWaterHeight, leftTotalHeight;
    var rightLandHeight, rightWaterHeight, rightTotalHeight;
    var neighboringWaterHeight;

    for (x = terrain.minX(); x < terrain.maxX(); x += triangleWidth) {
      leftX = x;
      rightX = x + triangleWidth;

      leftLandHeight = Math.max(SIDE_BOTTOM_HEIGHT, terrain.landHeightAt(leftX, z));
      leftWaterHeight = Math.min(MAX_WATER_HEIGHT, terrain.waterHeightAt(leftX, z));
      leftTotalHeight = leftLandHeight + leftWaterHeight;
      rightLandHeight = Math.max(SIDE_BOTTOM_HEIGHT, terrain.landHeightAt(rightX, z));
      rightWaterHeight = Math.min(MAX_WATER_HEIGHT, terrain.waterHeightAt(rightX, z));
      rightTotalHeight = rightLandHeight + rightWaterHeight;
      neighboringWaterHeight = terrain.waterHeightAt(leftX, z + 1);

      if (leftWaterHeight === 0.0 || rightWaterHeight === 0.0 || neighboringWaterHeight === 0.0) {
        leftLandHeight = leftTotalHeight;
        rightLandHeight = rightTotalHeight;
      }

      if (leftWaterHeight !== MAX_WATER_HEIGHT || rightWaterHeight !== MAX_WATER_HEIGHT) {
        addTriangle(rightX, rightLandHeight,    z, LAND,
                    leftX,  SIDE_BOTTOM_HEIGHT, z, LAND,
                    leftX,  leftLandHeight,     z, LAND);

        addTriangle(leftX,  SIDE_BOTTOM_HEIGHT, z, LAND,
                    rightX, rightLandHeight,    z, LAND,
                    rightX, SIDE_BOTTOM_HEIGHT, z, LAND);
      }

      if (leftWaterHeight > 0.0 && rightWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        addTriangle(rightX, rightTotalHeight, z, WATER,
                    leftX,  leftLandHeight,   z, WATER,
                    leftX,  leftTotalHeight,  z, WATER);

        addTriangle(leftX,  leftLandHeight,   z, WATER,
                    rightX, rightTotalHeight, z, WATER,
                    rightX, rightLandHeight,  z, WATER);
      }
    }
  };

  var addWestVerticalFace = function(terrain, triangleDepth) {
    var z;
    var x = terrain.minX();
    var topZ, bottomZ;
    var topLandHeight, topWaterHeight, topTotalHeight;
    var bottomLandHeight, bottomWaterHeight, bottomTotalHeight;
    var neighboringWaterHeight;

    for (z = terrain.minZ(); z < terrain.maxZ(); z += triangleDepth) {
      topZ = z;
      bottomZ = z + triangleDepth;

      topLandHeight = Math.max(SIDE_BOTTOM_HEIGHT, terrain.landHeightAt(x, topZ));
      topWaterHeight = Math.min(MAX_WATER_HEIGHT, terrain.waterHeightAt(x, topZ));
      topTotalHeight = topLandHeight + topWaterHeight;
      bottomLandHeight = Math.max(SIDE_BOTTOM_HEIGHT, terrain.landHeightAt(x, bottomZ));
      bottomWaterHeight = Math.min(MAX_WATER_HEIGHT, terrain.waterHeightAt(x, bottomZ));
      bottomTotalHeight = bottomLandHeight + bottomWaterHeight;
      neighboringWaterHeight = terrain.waterHeightAt(x + 1, topZ);

      if (topWaterHeight === 0.0 || bottomWaterHeight === 0.0 || neighboringWaterHeight === 0.0) {
        topLandHeight = topTotalHeight;
        bottomLandHeight = bottomTotalHeight;
      }

      if (topWaterHeight !== MAX_WATER_HEIGHT || bottomWaterHeight !== MAX_WATER_HEIGHT) {
        addTriangle(x, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                    x, bottomLandHeight,   bottomZ, LAND,
                    x, topLandHeight,      topZ,    LAND);

        addTriangle(x, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                    x, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                    x, bottomLandHeight,   bottomZ, LAND);
      }

      if (topWaterHeight > 0.0 && bottomWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        addTriangle(x, topLandHeight,     topZ,    WATER,
                    x, bottomTotalHeight, bottomZ, WATER,
                    x, topTotalHeight,    topZ,    WATER);

        addTriangle(x, topLandHeight,     topZ,    WATER,
                    x, bottomLandHeight,  bottomZ, WATER,
                    x, bottomTotalHeight, bottomZ, WATER);
      }
    }
  };

  var addEastVerticalFace = function(terrain, triangleDepth) {
    var z;
    var x = terrain.maxX();
    var topZ, bottomZ;
    var topLandHeight, topWaterHeight, topTotalHeight;
    var bottomLandHeight, bottomWaterHeight, bottomTotalHeight;
    var neighboringWaterHeight;

    for (z = terrain.minZ(); z < terrain.maxZ(); z += triangleDepth) {
      topZ = z;
      bottomZ = z + triangleDepth;

      topLandHeight = Math.max(SIDE_BOTTOM_HEIGHT, terrain.landHeightAt(x, topZ));
      topWaterHeight = Math.min(MAX_WATER_HEIGHT, terrain.waterHeightAt(x, topZ));
      topTotalHeight = topLandHeight + topWaterHeight;
      bottomLandHeight = Math.max(SIDE_BOTTOM_HEIGHT, terrain.landHeightAt(x, bottomZ));
      bottomWaterHeight = Math.min(MAX_WATER_HEIGHT, terrain.waterHeightAt(x, bottomZ));
      bottomTotalHeight = bottomLandHeight + bottomWaterHeight;
      neighboringWaterHeight = terrain.waterHeightAt(x - 1, bottomZ);

      if (topWaterHeight === 0.0 || bottomWaterHeight === 0.0 || neighboringWaterHeight === 0.0) {
        topLandHeight = topTotalHeight;
        bottomLandHeight = bottomTotalHeight;
      }

      if (topWaterHeight !== MAX_WATER_HEIGHT || bottomWaterHeight !== MAX_WATER_HEIGHT) {
        addTriangle(x, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                    x, topLandHeight,      topZ,    LAND,
                    x, bottomLandHeight,   bottomZ, LAND);

        addTriangle(x, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                    x, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                    x, topLandHeight,      topZ,    LAND);
      }

      if (topWaterHeight > 0.0 && bottomWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        addTriangle(x, bottomLandHeight,  bottomZ, WATER,
                    x, topTotalHeight,    topZ,    WATER,
                    x, bottomTotalHeight, bottomZ, WATER);

        addTriangle(x, bottomLandHeight, bottomZ, WATER,
                    x, topLandHeight,    topZ,    WATER,
                    x, topTotalHeight,   topZ,    WATER);
      }
    }
  };

  var addMainTerrain = function(terrain, roadNetwork, triangleWidth, triangleDepth) {
    var x, z;
    var leftRoad, topRoad, bottomRoad, rightRoad;
    var topLeftRoad, topRightRoad, bottomLeftRoad, bottomRightRoad;
    var topLeftX, topLeftZ, topRightX, topRightZ, bottomLeftX, bottomLeftZ, bottomRightX, bottomRightZ;
    var topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight;
    var topLeftMaterial, topRightMaterial, bottomLeftMaterial, bottomRightMaterial;

    var minX = terrain.minX();
    var maxX = terrain.maxX();
    var minZ = terrain.minZ();
    var maxZ = terrain.maxZ();

    for (x = minX; x < maxX; x += triangleWidth) {
      bottomLeftRoad = roadNetwork.getIntersectionGradeType(x, minZ) === RoadNetwork.SURFACE_GRADE;
      bottomRightRoad = roadNetwork.getIntersectionGradeType(x + triangleWidth, minZ) === RoadNetwork.SURFACE_GRADE;

      bottomRoad = (Math.floor(minZ) === minZ) &&
                   roadNetwork.hasEdgeBetween(Math.floor(x), minZ, Math.floor(x) + 1, minZ, RoadNetwork.SURFACE_GRADE);

      bottomLeftHeight = terrain.heightAt(x, minZ);
      bottomRightHeight = terrain.heightAt(x + triangleWidth, minZ);

      bottomLeftMaterial = terrain.waterHeightAt(x, minZ) === 0.0 ? LAND : WATER;
      bottomRightMaterial = terrain.waterHeightAt(x + triangleWidth, minZ) === 0.0 ? LAND : WATER;

      for (z = minZ; z < maxZ; z += triangleDepth) {
        topLeftRoad     = bottomLeftRoad;
        topRightRoad    = bottomRightRoad;
        bottomLeftRoad  = roadNetwork.getIntersectionGradeType(x, z + triangleDepth) === RoadNetwork.SURFACE_GRADE;
        bottomRightRoad = roadNetwork.getIntersectionGradeType(x + triangleWidth, z + triangleDepth) === RoadNetwork.SURFACE_GRADE;

        leftRoad = (Math.floor(x) === x) && roadNetwork.hasEdgeBetween(x, Math.floor(z), x, Math.floor(z) + 1, RoadNetwork.SURFACE_GRADE);
        rightRoad = (Math.ceil(x + triangleWidth) === (x + triangleWidth)) && roadNetwork.hasEdgeBetween(x + triangleWidth, Math.floor(z), x + triangleWidth, Math.floor(z) + 1, RoadNetwork.SURFACE_GRADE);
        topRoad = bottomRoad;
        bottomRoad = (Math.ceil(z + triangleDepth) === (z + triangleDepth)) && roadNetwork.hasEdgeBetween(Math.floor(x), z + triangleDepth, Math.floor(x) + 1, z + triangleDepth, RoadNetwork.SURFACE_GRADE);

        topLeftX = x;
        topLeftZ = z;
        if (topLeftRoad || leftRoad) {
          topLeftX += Config.HALF_STREET_WIDTH;
        }
        if (topLeftRoad || topRoad) {
          topLeftZ += Config.HALF_STREET_DEPTH;
        }

        topRightX = x + triangleWidth;
        topRightZ = z;
        if (topRightRoad || rightRoad) {
          topRightX -= Config.HALF_STREET_WIDTH;
        }
        if (topRightRoad || topRoad) {
          topRightZ += Config.HALF_STREET_DEPTH;
        }

        bottomLeftX = x;
        bottomLeftZ = z + triangleDepth;
        if (bottomLeftRoad || leftRoad) {
          bottomLeftX += Config.HALF_STREET_WIDTH;
        }
        if (bottomLeftRoad || bottomRoad) {
          bottomLeftZ -= Config.HALF_STREET_DEPTH;
        }

        bottomRightX = x + triangleWidth;
        bottomRightZ = z + triangleDepth;
        if (bottomRightRoad || rightRoad) {
          bottomRightX -= Config.HALF_STREET_WIDTH;
        }
        if (bottomRightRoad || bottomRoad) {
          bottomRightZ -= Config.HALF_STREET_DEPTH;
        }

        topLeftHeight = bottomLeftHeight;
        topRightHeight = bottomRightHeight;
        bottomLeftHeight = terrain.heightAt(x, z + triangleDepth);
        bottomRightHeight = terrain.heightAt(x + triangleWidth, z + triangleDepth);

        topLeftMaterial = bottomLeftMaterial;
        topRightMaterial = bottomRightMaterial;
        bottomLeftMaterial = terrain.waterHeightAt(x, z + triangleDepth) === 0.0 ? LAND : WATER;
        bottomRightMaterial = terrain.waterHeightAt(x + triangleWidth, z + triangleDepth) === 0.0 ? LAND : WATER;

        // Core triangles
        addTriangle(topLeftX, topLeftHeight, topLeftZ, topLeftMaterial,
                    bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                    topRightX, topRightHeight, topRightZ, topRightMaterial);

        addTriangle(bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                    bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                    topRightX, topRightHeight, topRightZ, topRightMaterial);


        // Extra left-side triangles
        if (!leftRoad) {
          if (topLeftRoad && !bottomLeftRoad) {
            addTriangle(x, topLeftHeight, topLeftZ, topLeftMaterial,
                        x, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                        topLeftX, topLeftHeight, topLeftZ, topLeftMaterial);
          }
          else if (!topLeftRoad && bottomLeftRoad) {
            addTriangle(x, topLeftHeight, topLeftZ, topLeftMaterial,
                        x, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                        bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial);
          }
          else if (topLeftRoad && bottomLeftRoad) {
            addTriangle(bottomLeftX - Config.STREET_WIDTH, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                        bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                        topLeftX, topLeftHeight, topLeftZ, topLeftMaterial);
          }
        }


        // Extra right-side triangles
        if (!rightRoad) {
          if (topRightRoad && !bottomRightRoad) {
            addTriangle(x + triangleWidth, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                        x + triangleWidth, topRightHeight, topRightZ, topRightMaterial,
                        topRightX, topRightHeight, topRightZ, topRightMaterial);
          }
          else if (!topRightRoad && bottomRightRoad) {
            addTriangle(bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                        x + triangleWidth, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                        x + triangleWidth, topRightHeight, topRightZ, topRightMaterial);
          }
          else if (topRightRoad && bottomRightRoad) {
            addTriangle(topRightX, topRightHeight, topRightZ, topRightMaterial,
                        bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                        topRightX + Config.STREET_WIDTH, topRightHeight, topRightZ, topRightMaterial);
          }
        }

        // Extra top-side triangles
        if (!topRoad) {
          if (topLeftRoad && !topRightRoad) {
            addTriangle(topLeftX, topLeftHeight, z, topLeftMaterial,
                        topLeftX, topLeftHeight, topLeftZ, topLeftMaterial,
                        x + triangleWidth, topRightHeight, z, topRightMaterial);
          }
          else if (!topLeftRoad && topRightRoad) {
            addTriangle(x, topLeftHeight, z, topLeftMaterial,
                        topRightX, topRightHeight, topRightZ, topRightMaterial,
                        topRightX, topRightHeight, z, topRightMaterial);
          }
          else if (topLeftRoad && topRightRoad) {
            addTriangle(topLeftX, topLeftHeight, topLeftZ, topLeftMaterial,
                        topRightX, topRightHeight, topRightZ, topRightMaterial,
                        topRightX, topRightHeight, topRightZ - Config.STREET_DEPTH, topRightMaterial);
          }
        }


        // Extra bottom-side triangles
        if (!bottomRoad) {
          if (bottomLeftRoad && !bottomRightRoad) {
            addTriangle(bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                        bottomLeftX, bottomLeftHeight, z + triangleDepth, bottomLeftMaterial,
                        bottomRightX, bottomRightHeight, z + triangleDepth, bottomRightMaterial);
          }
          else if (!bottomLeftRoad && bottomRightRoad) {
            addTriangle(x, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                        bottomRightX, bottomRightHeight, z + triangleDepth, bottomRightMaterial,
                        bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial);
          }
          else if (bottomLeftRoad && bottomRightRoad) {
            addTriangle(bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                        bottomLeftX, bottomLeftHeight, bottomLeftZ + Config.STREET_DEPTH, bottomLeftMaterial,
                        bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial);
          }
        }

      }
    }
  };


  return {
    build: build,
  };
};

export { TerrainMeshBuilder };

"use strict";

import { Config } from "./../config";
import { RoadNetwork } from "./../road_network";

var TerrainMeshBuilder = function() {
  var LAND_COLOR = new THREE.Color(0.0, 0.48, 0.0);
  var WATER_COLOR = new THREE.Color(0.1, 0.2, 1.0);

  var LAND = 1;
  var WATER = 2;

  var SOLID_SHADING_MODE = 1;
  var GRADIENT_SHADING_MODE = 2;
  var SHADING_MODE = SOLID_SHADING_MODE;

  var WATER_VERTEX_COLORS = [WATER_COLOR, WATER_COLOR, WATER_COLOR];
  var LAND_VERTEX_COLORS = [LAND_COLOR, LAND_COLOR, LAND_COLOR];

  var SIDE_BOTTOM_HEIGHT = Config.SIDEWALL_BOTTOM;
  var MAX_WATER_HEIGHT = -SIDE_BOTTOM_HEIGHT;

  var reusableTriangle = new THREE.Geometry();
  reusableTriangle.faces = [new THREE.Face3(0, 1, 2)];

  var buildTriangleGeometry = function(x1, y1, z1, material1, x2, y2, z2, material2, x3, y3, z3, material3) {
    reusableTriangle.vertices = [ new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2), new THREE.Vector3(x3, y3, z3) ];

    if (SHADING_MODE === SOLID_SHADING_MODE) {
      if (material1 === WATER && material2 === WATER && material3 == WATER) {
        reusableTriangle.faces[0].vertexColors = WATER_VERTEX_COLORS;
      }
      else {
        reusableTriangle.faces[0].vertexColors = LAND_VERTEX_COLORS;
      }
    }
    else {
      reusableTriangle.faces[0].vertexColors = [(material1 === WATER) ? WATER_COLOR : LAND_COLOR,
                                                (material2 === WATER) ? WATER_COLOR : LAND_COLOR,
                                                (material3 === WATER) ? WATER_COLOR : LAND_COLOR,];
    }

    reusableTriangle.computeFaceNormals();

    return reusableTriangle;
  };

  var addNorthVerticalFace = function(terrain, terrainGeometry, triangleWidth) {
    var x;
    var z = terrain.maxZ();
    var triangle;
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
        triangle = buildTriangleGeometry(leftX,  leftLandHeight,     z, LAND,
                                         leftX,  SIDE_BOTTOM_HEIGHT, z, LAND,
                                         rightX, rightLandHeight,    z, LAND);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(leftX,  SIDE_BOTTOM_HEIGHT, z, LAND,
                                         rightX, SIDE_BOTTOM_HEIGHT, z, LAND,
                                         rightX, rightLandHeight,    z, LAND);
        terrainGeometry.merge(triangle);
      }

      if (leftWaterHeight > 0.0 && rightWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        triangle = buildTriangleGeometry(leftX,  leftTotalHeight,  z, WATER,
                                         leftX,  leftLandHeight,   z, WATER,
                                         rightX, rightTotalHeight, z, WATER);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(leftX,  leftLandHeight,   z, WATER,
                                         rightX, rightLandHeight,  z, WATER,
                                         rightX, rightTotalHeight, z, WATER);
        terrainGeometry.merge(triangle);
      }
    }
  };

  var addSouthVerticalFace = function(terrain, terrainGeometry, triangleWidth) {
    var x;
    var z = terrain.minZ();
    var triangle;
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
        triangle = buildTriangleGeometry(rightX, rightLandHeight,    z, LAND,
                                         leftX,  SIDE_BOTTOM_HEIGHT, z, LAND,
                                         leftX,  leftLandHeight,     z, LAND);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(leftX,  SIDE_BOTTOM_HEIGHT, z, LAND,
                                         rightX, rightLandHeight,    z, LAND,
                                         rightX, SIDE_BOTTOM_HEIGHT, z, LAND);
        terrainGeometry.merge(triangle);
      }

      if (leftWaterHeight > 0.0 && rightWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        triangle = buildTriangleGeometry(rightX, rightTotalHeight, z, WATER,
                                         leftX,  leftLandHeight,   z, WATER,
                                         leftX,  leftTotalHeight,  z, WATER);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(leftX,  leftLandHeight,   z, WATER,
                                         rightX, rightTotalHeight, z, WATER,
                                         rightX, rightLandHeight,  z, WATER);
        terrainGeometry.merge(triangle);
      }
    }
  };

  var addWestVerticalFace = function(terrain, terrainGeometry, triangleDepth) {
    var z;
    var x = terrain.minX();
    var triangle;
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
        triangle = buildTriangleGeometry(x, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                         x, bottomLandHeight,   bottomZ, LAND,
                                         x, topLandHeight,      topZ,    LAND);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(x, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                         x, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                         x, bottomLandHeight,   bottomZ, LAND);
        terrainGeometry.merge(triangle);
      }

      if (topWaterHeight > 0.0 && bottomWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        triangle = buildTriangleGeometry(x, topLandHeight,     topZ,    WATER,
                                         x, bottomTotalHeight, bottomZ, WATER,
                                         x, topTotalHeight,    topZ,    WATER);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(x, topLandHeight,     topZ,    WATER,
                                         x, bottomLandHeight,  bottomZ, WATER,
                                         x, bottomTotalHeight, bottomZ, WATER);
        terrainGeometry.merge(triangle);
      }
    }
  };

  var addEastVerticalFace = function(terrain, terrainGeometry, triangleDepth) {
    var z;
    var x = terrain.maxX();
    var triangle;
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
        triangle = buildTriangleGeometry(x, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                         x, topLandHeight,      topZ,    LAND,
                                         x, bottomLandHeight,   bottomZ, LAND);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(x, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                         x, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                         x, topLandHeight,      topZ,    LAND);
        terrainGeometry.merge(triangle);
      }

      if (topWaterHeight > 0.0 && bottomWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        triangle = buildTriangleGeometry(x, bottomLandHeight,  bottomZ, WATER,
                                         x, topTotalHeight,    topZ,    WATER,
                                         x, bottomTotalHeight, bottomZ, WATER);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(x, bottomLandHeight, bottomZ, WATER,
                                         x, topLandHeight,    topZ,    WATER,
                                         x, topTotalHeight,   topZ,    WATER);
        terrainGeometry.merge(triangle);
      }
    }
  };

  var addMainTerrain = function(terrain, roadNetwork, terrainGeometry, triangleWidth, triangleDepth) {
    var x, z, triangle;
    var leftRoad, topRoad, bottomRoad, rightRoad;
    var topLeftRoad, topRightRoad, bottomLeftRoad, bottomRightRoad;
    var topLeftX, topLeftZ, topRightX, topRightZ, bottomLeftX, bottomLeftZ, bottomRightX, bottomRightZ;
    var topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight;
    var topLeftMaterial, topRightMaterial, bottomLeftMaterial, bottomRightMaterial;

    var minX = terrain.minX();
    var maxX = terrain.maxX();
    var minZ = terrain.minZ();
    var maxZ = terrain.maxZ();

    var halfStreetWidth = Config.STREET_WIDTH / 2;
    var halfStreetDepth = Config.STREET_DEPTH / 2;

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
          topLeftX += halfStreetWidth;
        }
        if (topLeftRoad || topRoad) {
          topLeftZ += halfStreetDepth;
        }

        topRightX = x + triangleWidth;
        topRightZ = z;
        if (topRightRoad || rightRoad) {
          topRightX -= halfStreetWidth;
        }
        if (topRightRoad || topRoad) {
          topRightZ += halfStreetDepth;
        }

        bottomLeftX = x;
        bottomLeftZ = z + triangleDepth;
        if (bottomLeftRoad || leftRoad) {
          bottomLeftX += halfStreetWidth;
        }
        if (bottomLeftRoad || bottomRoad) {
          bottomLeftZ -= halfStreetDepth;
        }

        bottomRightX = x + triangleWidth;
        bottomRightZ = z + triangleDepth;
        if (bottomRightRoad || rightRoad) {
          bottomRightX -= halfStreetWidth;
        }
        if (bottomRightRoad || bottomRoad) {
          bottomRightZ -= halfStreetDepth;
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
        triangle = buildTriangleGeometry(topLeftX,    topLeftHeight,    topLeftZ, topLeftMaterial,
                                         bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                         topRightX,   topRightHeight,   topRightZ, topRightMaterial);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                         bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                         topRightX,    topRightHeight, topRightZ, topRightMaterial);
        terrainGeometry.merge(triangle);


        // Extra left-side triangles
        if (!leftRoad) {
          if (topLeftRoad && !bottomLeftRoad) {
            triangle = buildTriangleGeometry(x, topLeftHeight, topLeftZ, topLeftMaterial,
                                             x, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             topLeftX, topLeftHeight, topLeftZ, topLeftMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (!topLeftRoad && bottomLeftRoad) {
            triangle = buildTriangleGeometry(x, topLeftHeight, topLeftZ, topLeftMaterial,
                                             x, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (topLeftRoad && bottomLeftRoad) {
            triangle = buildTriangleGeometry(bottomLeftX - Config.STREET_WIDTH, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             topLeftX, topLeftHeight, topLeftZ, topLeftMaterial);
            terrainGeometry.merge(triangle);
          }
        }


        // Extra right-side triangles
        if (!rightRoad) {
          if (topRightRoad && !bottomRightRoad) {
            triangle = buildTriangleGeometry(x + triangleWidth, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             x + triangleWidth, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial);

            terrainGeometry.merge(triangle);
          }
          else if (!topRightRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             x + triangleWidth, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             x + triangleWidth, topRightHeight, topRightZ, topRightMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (topRightRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(topRightX,    topRightHeight, topRightZ, topRightMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             topRightX + Config.STREET_WIDTH, topRightHeight, topRightZ, topRightMaterial);
            terrainGeometry.merge(triangle);
          }
        }

        // Extra top-side triangles
        if (!topRoad) {
          if (topLeftRoad && !topRightRoad) {
            triangle = buildTriangleGeometry(topLeftX,  topLeftHeight, z, topLeftMaterial,
                                             topLeftX,  topLeftHeight, topLeftZ, topLeftMaterial,
                                             x + triangleWidth, topRightHeight, z, topRightMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (!topLeftRoad && topRightRoad) {
            triangle = buildTriangleGeometry(x, topLeftHeight, z, topLeftMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, z, topRightMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (topLeftRoad && topRightRoad) {
            triangle = buildTriangleGeometry(topLeftX, topLeftHeight, topLeftZ, topLeftMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, topRightZ - Config.STREET_DEPTH, topRightMaterial);

            terrainGeometry.merge(triangle);
          }
        }


        // Extra bottom-side triangles
        if (!bottomRoad) {
          if (bottomLeftRoad && !bottomRightRoad) {
            triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX,  bottomLeftHeight, z + triangleDepth, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, z + triangleDepth, bottomRightMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (!bottomLeftRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(x, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, z + triangleDepth, bottomRightMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (bottomLeftRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX,  bottomLeftHeight, bottomLeftZ + Config.STREET_DEPTH, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial);

            terrainGeometry.merge(triangle);
          }
        }

      }
    }
  };


  var terrainMeshBuilder = {};

  terrainMeshBuilder.build = function(terrain, roadNetwork) {
    var triangleWidth = terrain.scale();
    var triangleDepth = terrain.scale();

    var terrainGeometry = new THREE.Geometry();
    var terrainMaterial = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors });

    // Vertical sides along the edges of the terrain
    addNorthVerticalFace(terrain, terrainGeometry, triangleWidth);
    addSouthVerticalFace(terrain, terrainGeometry, triangleWidth);
    addWestVerticalFace(terrain, terrainGeometry, triangleDepth);
    addEastVerticalFace(terrain, terrainGeometry, triangleDepth);

    // Main terrain
    addMainTerrain(terrain, roadNetwork, terrainGeometry, triangleWidth, triangleDepth);

    return [new THREE.Mesh(terrainGeometry, terrainMaterial)];
  };

  return terrainMeshBuilder;
};

export { TerrainMeshBuilder };

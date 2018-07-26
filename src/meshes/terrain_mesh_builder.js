"use strict";

var CityTour = CityTour || {};
CityTour.Meshes = CityTour.Meshes || {};

CityTour.Meshes.TerrainMeshBuilder = function() {
  var TERRAIN_COLOR_1 = new THREE.Color(0.0, 0.48, 0.0);
  var TERRAIN_COLOR_2 = new THREE.Color(0.0, 0.48, 0.0);
  var WATER_COLOR_1 = new THREE.Color(0.1, 0.2, 1.0);
  var WATER_COLOR_2 = new THREE.Color(0.1, 0.2, 1.0);

  var LAND = 1;
  var WATER = 2;

  var SOLID_SHADING_MODE = 1;
  var GRADIENT_SHADING_MODE = 2;
  var SHADING_MODE = SOLID_SHADING_MODE;

  var SIDE_BOTTOM_HEIGHT = -8.333333333333333;

  var reusableTriangle = new THREE.Geometry();
  reusableTriangle.faces = [new THREE.Face3(0, 1, 2)];

  var buildTriangleGeometry = function(x1, y1, z1, material1, x2, y2, z2, material2, x3, y3, z3, material3, color_variant) {
    var waterColor, landColor;

    reusableTriangle.vertices = [ new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2), new THREE.Vector3(x3, y3, z3) ];

    if (color_variant === 1) {
      waterColor = WATER_COLOR_1;
      landColor = TERRAIN_COLOR_1;
    }
    else {
      waterColor = WATER_COLOR_2;
      landColor = TERRAIN_COLOR_2;
    }

    if (SHADING_MODE === SOLID_SHADING_MODE) {
      if (material1 === WATER && material2 === WATER && material3 == WATER) {
        reusableTriangle.faces[0].vertexColors = [waterColor, waterColor, waterColor];
      }
      else {
        reusableTriangle.faces[0].vertexColors = [landColor, landColor, landColor];
      }
    }
    else {
      reusableTriangle.faces[0].vertexColors = [(material1 === WATER) ? waterColor : landColor,
                                                (material2 === WATER) ? waterColor : landColor,
                                                (material3 === WATER) ? waterColor : landColor,];
    }

    reusableTriangle.computeFaceNormals();

    return reusableTriangle;
  };

  var addNorthVerticalFace = function(terrain, terrainGeometry, triangleWidth) {
    var mapX;
    var mapZ = terrain.maxMapZ();
    var triangle;
    var leftX, rightX;
    var leftHeight, rightHeight;
    var leftWaterHeight, rightWaterHeight;
    var material;

    for (mapX = terrain.minMapX(); mapX < terrain.maxMapX(); mapX += triangleWidth) {
      leftX = mapX;
      rightX = mapX + triangleWidth;

      leftHeight = terrain.heightAtCoordinates(leftX, mapZ);
      rightHeight = terrain.heightAtCoordinates(rightX, mapZ);

      leftWaterHeight = terrain.waterHeightAtCoordinates(leftX, mapZ);
      rightWaterHeight = terrain.waterHeightAtCoordinates(rightX, mapZ);
      material = (leftWaterHeight > 0.0 && rightWaterHeight > 0.0) ? WATER : LAND;

      triangle = buildTriangleGeometry(leftX,  leftHeight,         mapZ, material,
                                       leftX,  SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       rightX, rightHeight,        mapZ, material,
                                       1);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(leftX,  SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       rightX, SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       rightX, rightHeight,        mapZ, material,
                                       1);
      terrainGeometry.merge(triangle);
    }
  };

  var addSouthVerticalFace = function(terrain, terrainGeometry, triangleWidth) {
    var mapX;
    var mapZ = terrain.minMapZ();
    var triangle;
    var leftX, rightX;
    var leftHeight, rightHeight;
    var leftWaterHeight, rightWaterHeight;
    var material;

    for (mapX = terrain.minMapX(); mapX < terrain.maxMapX(); mapX += triangleWidth) {
      leftX = mapX;
      rightX = mapX + triangleWidth;

      leftHeight = terrain.heightAtCoordinates(leftX, mapZ);
      rightHeight = terrain.heightAtCoordinates(rightX, mapZ);

      leftWaterHeight = terrain.waterHeightAtCoordinates(leftX, mapZ);
      rightWaterHeight = terrain.waterHeightAtCoordinates(rightX, mapZ);
      material = (leftWaterHeight > 0.0 && rightWaterHeight > 0.0) ? WATER : LAND;

      triangle = buildTriangleGeometry(rightX, rightHeight,        mapZ, material,
                                       leftX,  SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       leftX,  leftHeight,         mapZ, material,
                                       1);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(leftX,  SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       rightX, rightHeight,        mapZ, material,
                                       rightX, SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       1);
      terrainGeometry.merge(triangle);
    }
  };

  var addWestVerticalFace = function(terrain, terrainGeometry, triangleDepth) {
    var mapZ;
    var mapX = terrain.minMapX();
    var triangle;
    var topZ, bottomZ;
    var topLandHeight, topWaterHeight, topTotalHeight;
    var bottomLandHeight, bottomWaterHeight, bottomTotalHeight;
    var neighboringWaterHeight;

    for (mapZ = terrain.minMapZ(); mapZ < terrain.maxMapZ(); mapZ += triangleDepth) {
      topZ = mapZ;
      bottomZ = mapZ + triangleDepth;

      topLandHeight = terrain.landHeightAtCoordinates(mapX, topZ);
      topWaterHeight = terrain.waterHeightAtCoordinates(mapX, topZ);
      topTotalHeight = topLandHeight + topWaterHeight;
      bottomLandHeight = terrain.landHeightAtCoordinates(mapX, bottomZ);
      bottomWaterHeight = terrain.waterHeightAtCoordinates(mapX, bottomZ);
      bottomTotalHeight = bottomLandHeight + bottomWaterHeight;
      neighboringWaterHeight = terrain.waterHeightAtCoordinates(mapX + 1, topZ);

      if (topWaterHeight === 0.0 || bottomWaterHeight === 0.0 || neighboringWaterHeight === 0.0) {
        topLandHeight = topTotalHeight;
        bottomLandHeight = bottomTotalHeight;
      }

      triangle = buildTriangleGeometry(mapX, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                       mapX, bottomLandHeight,   bottomZ, LAND,
                                       mapX, topLandHeight,      topZ,    LAND,
                                       1);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(mapX, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                       mapX, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                       mapX, bottomLandHeight,   bottomZ, LAND,
                                       1);
      terrainGeometry.merge(triangle);

      if (topWaterHeight > 0.0 && bottomWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        triangle = buildTriangleGeometry(mapX, topLandHeight,     topZ,    WATER,
                                         mapX, bottomTotalHeight, bottomZ, WATER,
                                         mapX, topTotalHeight,    topZ,    WATER,
                                         1);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(mapX, topLandHeight,     topZ,    WATER,
                                         mapX, bottomLandHeight,  bottomZ, WATER,
                                         mapX, bottomTotalHeight, bottomZ, WATER,
                                         1);
        terrainGeometry.merge(triangle);
      }
    }
  };

  var addEastVerticalFace = function(terrain, terrainGeometry, triangleDepth) {
    var mapZ;
    var mapX = terrain.maxMapX();
    var triangle;
    var topZ, bottomZ;
    var topLandHeight, topWaterHeight, topTotalHeight;
    var bottomLandHeight, bottomWaterHeight, bottomTotalHeight;
    var neighboringWaterHeight;

    for (mapZ = terrain.minMapZ(); mapZ < terrain.maxMapZ(); mapZ += triangleDepth) {
      topZ = mapZ;
      bottomZ = mapZ + triangleDepth;

      topLandHeight = terrain.landHeightAtCoordinates(mapX, topZ);
      topWaterHeight = terrain.waterHeightAtCoordinates(mapX, topZ);
      topTotalHeight = topLandHeight + topWaterHeight;
      bottomLandHeight = terrain.landHeightAtCoordinates(mapX, bottomZ);
      bottomWaterHeight = terrain.waterHeightAtCoordinates(mapX, bottomZ);
      bottomTotalHeight = bottomLandHeight + bottomWaterHeight;
      neighboringWaterHeight = terrain.waterHeightAtCoordinates(mapX - 1, bottomZ);

      if (topWaterHeight === 0.0 || bottomWaterHeight === 0.0 || neighboringWaterHeight === 0.0) {
        topLandHeight = topTotalHeight;
        bottomLandHeight = bottomTotalHeight;
      }

      triangle = buildTriangleGeometry(mapX, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                       mapX, topLandHeight,      topZ,    LAND,
                                       mapX, bottomLandHeight,   bottomZ, LAND,
                                       1);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(mapX, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                       mapX, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                       mapX, topLandHeight,      topZ,    LAND,
                                       1);
      terrainGeometry.merge(triangle);

      if (topWaterHeight > 0.0 && bottomWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        triangle = buildTriangleGeometry(mapX, bottomLandHeight,  bottomZ, WATER,
                                         mapX, topTotalHeight,    topZ,    WATER,
                                         mapX, bottomTotalHeight, bottomZ, WATER,
                                         1);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(mapX, bottomLandHeight, bottomZ, WATER,
                                         mapX, topLandHeight,    topZ,    WATER,
                                         mapX, topTotalHeight,   topZ,    WATER,
                                         1);
        terrainGeometry.merge(triangle);
      }
    }
  };


  var terrainMeshBuilder = {};

  terrainMeshBuilder.build = function(terrain, roadNetwork) {
    var mapX, mapZ, triangle;
    var leftRoad, topRoad, bottomRoad, rightRoad;
    var topLeftRoad, topRightRoad, bottomLeftRoad, bottomRightRoad;
    var topLeftX, topLeftZ, topRightX, topRightZ, bottomLeftX, bottomLeftZ, bottomRightX, bottomRightZ;
    var topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight;
    var topLeftMaterial, topRightMaterial, bottomLeftMaterial, bottomRightMaterial;

    var minMapX = terrain.minMapX();
    var maxMapX = terrain.maxMapX();
    var minMapZ = terrain.minMapZ();
    var maxMapZ = terrain.maxMapZ();

    var halfStreetWidth = CityTour.Config.STREET_WIDTH / 2;
    var halfStreetDepth = CityTour.Config.STREET_DEPTH / 2;

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
    for (mapX = minMapX; mapX < maxMapX; mapX += triangleWidth) {
      bottomLeftRoad = roadNetwork.getIntersectionSurfaceType(mapX, minMapZ) === CityTour.RoadNetwork.TERRAIN_SURFACE;
      bottomRightRoad = roadNetwork.getIntersectionSurfaceType(mapX + triangleWidth, minMapZ) === CityTour.RoadNetwork.TERRAIN_SURFACE;

      bottomRoad = (Math.floor(minMapZ) === minMapZ) &&
                   roadNetwork.hasEdgeBetween(Math.floor(mapX), minMapZ, Math.floor(mapX) + 1, minMapZ, CityTour.RoadNetwork.TERRAIN_SURFACE);

      bottomLeftHeight = terrain.heightAtCoordinates(mapX, minMapZ);
      bottomRightHeight = terrain.heightAtCoordinates(mapX + triangleWidth, minMapZ);

      bottomLeftMaterial = terrain.waterHeightAtCoordinates(mapX, minMapZ) === 0.0 ? LAND : WATER;
      bottomRightMaterial = terrain.waterHeightAtCoordinates(mapX + triangleWidth, minMapZ) === 0.0 ? LAND : WATER;

      for (mapZ = minMapZ; mapZ < maxMapZ; mapZ += triangleDepth) {
        topLeftRoad     = bottomLeftRoad;
        topRightRoad    = bottomRightRoad;
        bottomLeftRoad  = roadNetwork.getIntersectionSurfaceType(mapX, mapZ + triangleDepth) === CityTour.RoadNetwork.TERRAIN_SURFACE;
        bottomRightRoad = roadNetwork.getIntersectionSurfaceType(mapX + triangleWidth, mapZ + triangleDepth) === CityTour.RoadNetwork.TERRAIN_SURFACE;

        leftRoad = (Math.floor(mapX) === mapX) && roadNetwork.hasEdgeBetween(mapX, Math.floor(mapZ), mapX, Math.floor(mapZ) + 1, CityTour.RoadNetwork.TERRAIN_SURFACE);
        rightRoad = (Math.ceil(mapX + triangleWidth) === (mapX + triangleWidth)) && roadNetwork.hasEdgeBetween(mapX + triangleWidth, Math.floor(mapZ), mapX + triangleWidth, Math.floor(mapZ) + 1, CityTour.RoadNetwork.TERRAIN_SURFACE);
        topRoad = bottomRoad;
        bottomRoad = (Math.ceil(mapZ + triangleDepth) === (mapZ + triangleDepth)) && roadNetwork.hasEdgeBetween(Math.floor(mapX), mapZ + triangleDepth, Math.floor(mapX) + 1, mapZ + triangleDepth, CityTour.RoadNetwork.TERRAIN_SURFACE);

        topLeftX = mapX;
        topLeftZ = mapZ;
        if (topLeftRoad || leftRoad) {
          topLeftX += halfStreetWidth;
        }
        if (topLeftRoad || topRoad) {
          topLeftZ += halfStreetDepth;
        }

        topRightX = mapX + triangleWidth;
        topRightZ = mapZ;
        if (topRightRoad || rightRoad) {
          topRightX -= halfStreetWidth;
        }
        if (topRightRoad || topRoad) {
          topRightZ += halfStreetDepth;
        }

        bottomLeftX = mapX;
        bottomLeftZ = mapZ + triangleDepth;
        if (bottomLeftRoad || leftRoad) {
          bottomLeftX += halfStreetWidth;
        }
        if (bottomLeftRoad || bottomRoad) {
          bottomLeftZ -= halfStreetDepth;
        }

        bottomRightX = mapX + triangleWidth;
        bottomRightZ = mapZ + triangleDepth;
        if (bottomRightRoad || rightRoad) {
          bottomRightX -= halfStreetWidth;
        }
        if (bottomRightRoad || bottomRoad) {
          bottomRightZ -= halfStreetDepth;
        }

        topLeftHeight = bottomLeftHeight;
        topRightHeight = bottomRightHeight;
        bottomLeftHeight = terrain.heightAtCoordinates(mapX, mapZ + triangleDepth);
        bottomRightHeight = terrain.heightAtCoordinates(mapX + triangleWidth, mapZ + triangleDepth);

        topLeftMaterial = bottomLeftMaterial;
        topRightMaterial = bottomRightMaterial;
        bottomLeftMaterial = terrain.waterHeightAtCoordinates(mapX, mapZ + triangleDepth) === 0.0 ? LAND : WATER;
        bottomRightMaterial = terrain.waterHeightAtCoordinates(mapX + triangleWidth, mapZ + triangleDepth) === 0.0 ? LAND : WATER;

        // Core triangles
        triangle = buildTriangleGeometry(topLeftX,    topLeftHeight,    topLeftZ, topLeftMaterial,
                                         bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                         topRightX,   topRightHeight,   topRightZ, topRightMaterial, 1);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                         bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                         topRightX,    topRightHeight, topRightZ, topRightMaterial, 2);
        terrainGeometry.merge(triangle);


        // Extra left-side triangles
        if (!leftRoad) {
          if (topLeftRoad && !bottomLeftRoad) {
            triangle = buildTriangleGeometry(mapX, topLeftHeight, topLeftZ, topLeftMaterial,
                                             mapX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             topLeftX, topLeftHeight, topLeftZ, topLeftMaterial, 2);
            terrainGeometry.merge(triangle);
          }

          if (bottomLeftRoad && !topLeftRoad) {
            triangle = buildTriangleGeometry(mapX, topLeftHeight, topLeftZ, topLeftMaterial,
                                             mapX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial, 2);
            terrainGeometry.merge(triangle);
          }

          if (topLeftRoad && bottomLeftRoad) {
            triangle = buildTriangleGeometry(bottomLeftX - CityTour.Config.STREET_WIDTH, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             topLeftX, topLeftHeight, topLeftZ, topLeftMaterial, 2);
            terrainGeometry.merge(triangle);
          }
        }


        // Extra right-side triangles
        if (!rightRoad) {
          if (topRightRoad && !bottomRightRoad) {
            triangle = buildTriangleGeometry(mapX + triangleWidth, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             mapX + triangleWidth, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial, 1);

            terrainGeometry.merge(triangle);
          }

          if (bottomRightRoad && !topRightRoad) {
            triangle = buildTriangleGeometry(bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             mapX + triangleWidth, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             mapX + triangleWidth, topRightHeight, topRightZ, topRightMaterial, 1);
            terrainGeometry.merge(triangle);
          }

          if (topRightRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(topRightX,    topRightHeight, topRightZ, topRightMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             topRightX + CityTour.Config.STREET_WIDTH, topRightHeight, topRightZ, topRightMaterial, 1);
            terrainGeometry.merge(triangle);
          }
        }

        // Extra top-side triangles
        if (!topRoad) {
          if (topLeftRoad && !topRightRoad) {
            triangle = buildTriangleGeometry(topLeftX,  topLeftHeight, mapZ, topLeftMaterial,
                                             topLeftX,  topLeftHeight, topLeftZ, topLeftMaterial,
                                             mapX + triangleWidth, topRightHeight, mapZ, topRightMaterial, 2);
            terrainGeometry.merge(triangle);
          }

          if (topRightRoad && !topLeftRoad) {
            triangle = buildTriangleGeometry(mapX, topLeftHeight, mapZ, topLeftMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, mapZ, topRightMaterial, 2);
            terrainGeometry.merge(triangle);
          }

          if (topLeftRoad && topRightRoad) {
            triangle = buildTriangleGeometry(topLeftX, topLeftHeight, topLeftZ, topLeftMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, topRightZ - CityTour.Config.STREET_DEPTH, topRightMaterial, 2);

            terrainGeometry.merge(triangle);
          }
        }


        // Extra bottom-side triangles
        if (!bottomRoad) {
          if (bottomLeftRoad && !bottomRightRoad) {
            triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX,  bottomLeftHeight, mapZ + triangleDepth, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, mapZ + triangleDepth, bottomRightMaterial, 1);
            terrainGeometry.merge(triangle);
          }

          if (bottomRightRoad && !bottomLeftRoad) {
            triangle = buildTriangleGeometry(mapX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, mapZ + triangleDepth, bottomRightMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial, 1);
            terrainGeometry.merge(triangle);
          }

          if (bottomLeftRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX,  bottomLeftHeight, bottomLeftZ + CityTour.Config.STREET_DEPTH, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial, 1);

            terrainGeometry.merge(triangle);
          }
        }

      }
    }

    return [new THREE.Mesh(terrainGeometry, terrainMaterial)];
  };

  return terrainMeshBuilder;
};

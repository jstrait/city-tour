"use strict";

var CityTour = CityTour || {};
CityTour.Meshes = CityTour.Meshes || {};

CityTour.Meshes.TerrainMeshBuilder = function() {
  var LAND_COLOR = new THREE.Color(0.0, 0.48, 0.0);
  var WATER_COLOR = new THREE.Color(0.1, 0.2, 1.0);

  var LAND = 1;
  var WATER = 2;

  var SOLID_SHADING_MODE = 1;
  var GRADIENT_SHADING_MODE = 2;
  var SHADING_MODE = SOLID_SHADING_MODE;

  var SIDE_BOTTOM_HEIGHT = -8.333333333333333;

  var reusableTriangle = new THREE.Geometry();
  reusableTriangle.faces = [new THREE.Face3(0, 1, 2)];

  var buildTriangleGeometry = function(x1, y1, z1, material1, x2, y2, z2, material2, x3, y3, z3, material3) {
    reusableTriangle.vertices = [ new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2), new THREE.Vector3(x3, y3, z3) ];

    if (SHADING_MODE === SOLID_SHADING_MODE) {
      if (material1 === WATER && material2 === WATER && material3 == WATER) {
        reusableTriangle.faces[0].vertexColors = [WATER_COLOR, WATER_COLOR, WATER_COLOR];
      }
      else {
        reusableTriangle.faces[0].vertexColors = [LAND_COLOR, LAND_COLOR, LAND_COLOR];
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
    var mapX;
    var mapZ = terrain.maxZ();
    var triangle;
    var leftX, rightX;
    var leftHeight, rightHeight;
    var leftWaterHeight, rightWaterHeight;
    var material;

    for (mapX = terrain.minX(); mapX < terrain.maxX(); mapX += triangleWidth) {
      leftX = mapX;
      rightX = mapX + triangleWidth;

      leftHeight = terrain.heightAtCoordinates(leftX, mapZ);
      rightHeight = terrain.heightAtCoordinates(rightX, mapZ);

      leftWaterHeight = terrain.waterHeightAtCoordinates(leftX, mapZ);
      rightWaterHeight = terrain.waterHeightAtCoordinates(rightX, mapZ);
      material = (leftWaterHeight > 0.0 && rightWaterHeight > 0.0) ? WATER : LAND;

      triangle = buildTriangleGeometry(leftX,  leftHeight,         mapZ, material,
                                       leftX,  SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       rightX, rightHeight,        mapZ, material);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(leftX,  SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       rightX, SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       rightX, rightHeight,        mapZ, material);
      terrainGeometry.merge(triangle);
    }
  };

  var addSouthVerticalFace = function(terrain, terrainGeometry, triangleWidth) {
    var mapX;
    var mapZ = terrain.minZ();
    var triangle;
    var leftX, rightX;
    var leftHeight, rightHeight;
    var leftWaterHeight, rightWaterHeight;
    var material;

    for (mapX = terrain.minX(); mapX < terrain.maxX(); mapX += triangleWidth) {
      leftX = mapX;
      rightX = mapX + triangleWidth;

      leftHeight = terrain.heightAtCoordinates(leftX, mapZ);
      rightHeight = terrain.heightAtCoordinates(rightX, mapZ);

      leftWaterHeight = terrain.waterHeightAtCoordinates(leftX, mapZ);
      rightWaterHeight = terrain.waterHeightAtCoordinates(rightX, mapZ);
      material = (leftWaterHeight > 0.0 && rightWaterHeight > 0.0) ? WATER : LAND;

      triangle = buildTriangleGeometry(rightX, rightHeight,        mapZ, material,
                                       leftX,  SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       leftX,  leftHeight,         mapZ, material);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(leftX,  SIDE_BOTTOM_HEIGHT, mapZ, material,
                                       rightX, rightHeight,        mapZ, material,
                                       rightX, SIDE_BOTTOM_HEIGHT, mapZ, material);
      terrainGeometry.merge(triangle);
    }
  };

  var addWestVerticalFace = function(terrain, terrainGeometry, triangleDepth) {
    var mapZ;
    var mapX = terrain.minX();
    var triangle;
    var topZ, bottomZ;
    var topLandHeight, topWaterHeight, topTotalHeight;
    var bottomLandHeight, bottomWaterHeight, bottomTotalHeight;
    var neighboringWaterHeight;

    for (mapZ = terrain.minZ(); mapZ < terrain.maxZ(); mapZ += triangleDepth) {
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
                                       mapX, topLandHeight,      topZ,    LAND);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(mapX, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                       mapX, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                       mapX, bottomLandHeight,   bottomZ, LAND);
      terrainGeometry.merge(triangle);

      if (topWaterHeight > 0.0 && bottomWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        triangle = buildTriangleGeometry(mapX, topLandHeight,     topZ,    WATER,
                                         mapX, bottomTotalHeight, bottomZ, WATER,
                                         mapX, topTotalHeight,    topZ,    WATER);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(mapX, topLandHeight,     topZ,    WATER,
                                         mapX, bottomLandHeight,  bottomZ, WATER,
                                         mapX, bottomTotalHeight, bottomZ, WATER);
        terrainGeometry.merge(triangle);
      }
    }
  };

  var addEastVerticalFace = function(terrain, terrainGeometry, triangleDepth) {
    var mapZ;
    var mapX = terrain.maxX();
    var triangle;
    var topZ, bottomZ;
    var topLandHeight, topWaterHeight, topTotalHeight;
    var bottomLandHeight, bottomWaterHeight, bottomTotalHeight;
    var neighboringWaterHeight;

    for (mapZ = terrain.minZ(); mapZ < terrain.maxZ(); mapZ += triangleDepth) {
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
                                       mapX, bottomLandHeight,   bottomZ, LAND);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(mapX, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                       mapX, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                       mapX, topLandHeight,      topZ,    LAND);
      terrainGeometry.merge(triangle);

      if (topWaterHeight > 0.0 && bottomWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        triangle = buildTriangleGeometry(mapX, bottomLandHeight,  bottomZ, WATER,
                                         mapX, topTotalHeight,    topZ,    WATER,
                                         mapX, bottomTotalHeight, bottomZ, WATER);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(mapX, bottomLandHeight, bottomZ, WATER,
                                         mapX, topLandHeight,    topZ,    WATER,
                                         mapX, topTotalHeight,   topZ,    WATER);
        terrainGeometry.merge(triangle);
      }
    }
  };

  var addMainTerrain = function(terrain, roadNetwork, terrainGeometry, triangleWidth, triangleDepth) {
    var mapX, mapZ, triangle;
    var leftRoad, topRoad, bottomRoad, rightRoad;
    var topLeftRoad, topRightRoad, bottomLeftRoad, bottomRightRoad;
    var topLeftX, topLeftZ, topRightX, topRightZ, bottomLeftX, bottomLeftZ, bottomRightX, bottomRightZ;
    var topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight;
    var topLeftMaterial, topRightMaterial, bottomLeftMaterial, bottomRightMaterial;

    var minX = terrain.minX();
    var maxX = terrain.maxX();
    var minZ = terrain.minZ();
    var maxZ = terrain.maxZ();

    var halfStreetWidth = CityTour.Config.STREET_WIDTH / 2;
    var halfStreetDepth = CityTour.Config.STREET_DEPTH / 2;

    for (mapX = minX; mapX < maxX; mapX += triangleWidth) {
      bottomLeftRoad = roadNetwork.getIntersectionSurfaceType(mapX, minZ) === CityTour.RoadNetwork.TERRAIN_SURFACE;
      bottomRightRoad = roadNetwork.getIntersectionSurfaceType(mapX + triangleWidth, minZ) === CityTour.RoadNetwork.TERRAIN_SURFACE;

      bottomRoad = (Math.floor(minZ) === minZ) &&
                   roadNetwork.hasEdgeBetween(Math.floor(mapX), minZ, Math.floor(mapX) + 1, minZ, CityTour.RoadNetwork.TERRAIN_SURFACE);

      bottomLeftHeight = terrain.heightAtCoordinates(mapX, minZ);
      bottomRightHeight = terrain.heightAtCoordinates(mapX + triangleWidth, minZ);

      bottomLeftMaterial = terrain.waterHeightAtCoordinates(mapX, minZ) === 0.0 ? LAND : WATER;
      bottomRightMaterial = terrain.waterHeightAtCoordinates(mapX + triangleWidth, minZ) === 0.0 ? LAND : WATER;

      for (mapZ = minZ; mapZ < maxZ; mapZ += triangleDepth) {
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
                                         topRightX,   topRightHeight,   topRightZ, topRightMaterial);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                         bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                         topRightX,    topRightHeight, topRightZ, topRightMaterial);
        terrainGeometry.merge(triangle);


        // Extra left-side triangles
        if (!leftRoad) {
          if (topLeftRoad && !bottomLeftRoad) {
            triangle = buildTriangleGeometry(mapX, topLeftHeight, topLeftZ, topLeftMaterial,
                                             mapX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             topLeftX, topLeftHeight, topLeftZ, topLeftMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (!topLeftRoad && bottomLeftRoad) {
            triangle = buildTriangleGeometry(mapX, topLeftHeight, topLeftZ, topLeftMaterial,
                                             mapX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (topLeftRoad && bottomLeftRoad) {
            triangle = buildTriangleGeometry(bottomLeftX - CityTour.Config.STREET_WIDTH, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             topLeftX, topLeftHeight, topLeftZ, topLeftMaterial);
            terrainGeometry.merge(triangle);
          }
        }


        // Extra right-side triangles
        if (!rightRoad) {
          if (topRightRoad && !bottomRightRoad) {
            triangle = buildTriangleGeometry(mapX + triangleWidth, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             mapX + triangleWidth, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial);

            terrainGeometry.merge(triangle);
          }
          else if (!topRightRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             mapX + triangleWidth, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             mapX + triangleWidth, topRightHeight, topRightZ, topRightMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (topRightRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(topRightX,    topRightHeight, topRightZ, topRightMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             topRightX + CityTour.Config.STREET_WIDTH, topRightHeight, topRightZ, topRightMaterial);
            terrainGeometry.merge(triangle);
          }
        }

        // Extra top-side triangles
        if (!topRoad) {
          if (topLeftRoad && !topRightRoad) {
            triangle = buildTriangleGeometry(topLeftX,  topLeftHeight, mapZ, topLeftMaterial,
                                             topLeftX,  topLeftHeight, topLeftZ, topLeftMaterial,
                                             mapX + triangleWidth, topRightHeight, mapZ, topRightMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (!topLeftRoad && topRightRoad) {
            triangle = buildTriangleGeometry(mapX, topLeftHeight, mapZ, topLeftMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, mapZ, topRightMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (topLeftRoad && topRightRoad) {
            triangle = buildTriangleGeometry(topLeftX, topLeftHeight, topLeftZ, topLeftMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, topRightZ - CityTour.Config.STREET_DEPTH, topRightMaterial);

            terrainGeometry.merge(triangle);
          }
        }


        // Extra bottom-side triangles
        if (!bottomRoad) {
          if (bottomLeftRoad && !bottomRightRoad) {
            triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX,  bottomLeftHeight, mapZ + triangleDepth, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, mapZ + triangleDepth, bottomRightMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (!bottomLeftRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(mapX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, mapZ + triangleDepth, bottomRightMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial);
            terrainGeometry.merge(triangle);
          }
          else if (bottomLeftRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX,  bottomLeftHeight, bottomLeftZ + CityTour.Config.STREET_DEPTH, bottomLeftMaterial,
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

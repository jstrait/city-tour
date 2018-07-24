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

  var SIDE_BOTTOM_HEIGHT = -100;

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
    var sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ);
    var triangle;

    for (mapX = terrain.minMapX(); mapX < terrain.maxMapX(); mapX += triangleWidth) {
      var leftX = CityTour.Coordinates.mapXToSceneX(mapX);
      var rightX = CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth);

      var leftHeight = terrain.heightAtCoordinates(mapX, mapZ);
      var rightHeight = terrain.heightAtCoordinates(mapX + triangleWidth, mapZ);

      var leftWaterHeight = terrain.waterHeightAtCoordinates(mapX, mapZ);
      var rightWaterHeight = terrain.waterHeightAtCoordinates(mapX + triangleWidth, mapZ);
      var material = (leftWaterHeight > 0.0 && rightWaterHeight > 0.0) ? WATER : LAND;

      triangle = buildTriangleGeometry(leftX,  leftHeight,         sceneZ, material,
                                       leftX,  SIDE_BOTTOM_HEIGHT, sceneZ, material,
                                       rightX, rightHeight,        sceneZ, material,
                                       1);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(leftX,  SIDE_BOTTOM_HEIGHT, sceneZ, material,
                                       rightX, SIDE_BOTTOM_HEIGHT, sceneZ, material,
                                       rightX, rightHeight,        sceneZ, material,
                                       1);
      terrainGeometry.merge(triangle);
    }
  };

  var addSouthVerticalFace = function(terrain, terrainGeometry, triangleWidth) {
    var mapX;
    var mapZ = terrain.minMapZ();
    var sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ);
    var triangle;

    for (mapX = terrain.minMapX(); mapX < terrain.maxMapX(); mapX += triangleWidth) {
      var leftX = CityTour.Coordinates.mapXToSceneX(mapX);
      var rightX = CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth);

      var leftHeight = terrain.heightAtCoordinates(mapX, mapZ);
      var rightHeight = terrain.heightAtCoordinates(mapX + triangleWidth, mapZ);

      var leftWaterHeight = terrain.waterHeightAtCoordinates(mapX, mapZ);
      var rightWaterHeight = terrain.waterHeightAtCoordinates(mapX + triangleWidth, mapZ);
      var material = (leftWaterHeight > 0.0 && rightWaterHeight > 0.0) ? WATER : LAND;

      triangle = buildTriangleGeometry(rightX, rightHeight,        sceneZ, material,
                                       leftX,  SIDE_BOTTOM_HEIGHT, sceneZ, material,
                                       leftX,  leftHeight,         sceneZ, material,
                                       1);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(leftX,  SIDE_BOTTOM_HEIGHT, sceneZ, material,
                                       rightX, rightHeight,        sceneZ, material,
                                       rightX, SIDE_BOTTOM_HEIGHT, sceneZ, material,
                                       1);
      terrainGeometry.merge(triangle);
    }
  };

  var addWestVerticalFace = function(terrain, terrainGeometry, triangleDepth) {
    var mapZ;
    var mapX = terrain.minMapX();
    var sceneX = CityTour.Coordinates.mapXToSceneX(mapX);
    var triangle;

    for (mapZ = terrain.minMapZ(); mapZ < terrain.maxMapZ(); mapZ += triangleDepth) {
      var topZ = CityTour.Coordinates.mapZToSceneZ(mapZ);
      var bottomZ = CityTour.Coordinates.mapZToSceneZ(mapZ + triangleDepth);

      var topLandHeight = terrain.landHeightAtCoordinates(mapX, mapZ);
      var topWaterHeight = terrain.waterHeightAtCoordinates(mapX, mapZ);
      var topTotalHeight = topLandHeight + topWaterHeight;
      var bottomLandHeight = terrain.landHeightAtCoordinates(mapX, mapZ + triangleDepth);
      var bottomWaterHeight = terrain.waterHeightAtCoordinates(mapX, mapZ + triangleDepth);
      var bottomTotalHeight = bottomLandHeight + bottomWaterHeight;
      var neighboringWaterHeight = terrain.waterHeightAtCoordinates(mapX + 1, mapZ);

      if (topWaterHeight === 0.0 || bottomWaterHeight === 0.0 || neighboringWaterHeight === 0.0) {
        topLandHeight = topTotalHeight;
        bottomLandHeight = bottomTotalHeight;
      }

      triangle = buildTriangleGeometry(sceneX, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                       sceneX, bottomLandHeight,   bottomZ, LAND,
                                       sceneX, topLandHeight,      topZ,    LAND,
                                       1);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(sceneX, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                       sceneX, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                       sceneX, bottomLandHeight,   bottomZ, LAND,
                                       1);
      terrainGeometry.merge(triangle);

      if (topWaterHeight > 0.0 && bottomWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        triangle = buildTriangleGeometry(sceneX, topLandHeight,     topZ,    WATER,
                                         sceneX, bottomTotalHeight, bottomZ, WATER,
                                         sceneX, topTotalHeight,    topZ,    WATER,
                                         1);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(sceneX, topLandHeight,     topZ,    WATER,
                                         sceneX, bottomLandHeight,  bottomZ, WATER,
                                         sceneX, bottomTotalHeight, bottomZ, WATER,
                                         1);
        terrainGeometry.merge(triangle);
      }
    }
  };

  var addEastVerticalFace = function(terrain, terrainGeometry, triangleDepth) {
    var mapZ;
    var mapX = terrain.maxMapX();
    var sceneX = CityTour.Coordinates.mapXToSceneX(mapX);
    var triangle;

    for (mapZ = terrain.minMapZ(); mapZ < terrain.maxMapZ(); mapZ += triangleDepth) {
      var topZ = CityTour.Coordinates.mapZToSceneZ(mapZ);
      var bottomZ = CityTour.Coordinates.mapZToSceneZ(mapZ + triangleDepth);

      var topLandHeight = terrain.landHeightAtCoordinates(mapX, mapZ);
      var topWaterHeight = terrain.waterHeightAtCoordinates(mapX, mapZ);
      var topTotalHeight = topLandHeight + topWaterHeight;
      var bottomLandHeight = terrain.landHeightAtCoordinates(mapX, mapZ + triangleDepth);
      var bottomWaterHeight = terrain.waterHeightAtCoordinates(mapX, mapZ + triangleDepth);
      var bottomTotalHeight = bottomLandHeight + bottomWaterHeight;
      var neighboringWaterHeight = terrain.waterHeightAtCoordinates(mapX - 1, mapZ + triangleDepth);

      if (topWaterHeight === 0.0 || bottomWaterHeight === 0.0 || neighboringWaterHeight === 0.0) {
        topLandHeight = topTotalHeight;
        bottomLandHeight = bottomTotalHeight;
      }

      triangle = buildTriangleGeometry(sceneX, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                       sceneX, topLandHeight,      topZ,    LAND,
                                       sceneX, bottomLandHeight,   bottomZ, LAND,
                                       1);
      terrainGeometry.merge(triangle);

      triangle = buildTriangleGeometry(sceneX, SIDE_BOTTOM_HEIGHT, bottomZ, LAND,
                                       sceneX, SIDE_BOTTOM_HEIGHT, topZ,    LAND,
                                       sceneX, topLandHeight,      topZ,    LAND,
                                       1);
      terrainGeometry.merge(triangle);

      if (topWaterHeight > 0.0 && bottomWaterHeight > 0.0 && neighboringWaterHeight > 0.0) {
        triangle = buildTriangleGeometry(sceneX, bottomLandHeight,  bottomZ, WATER,
                                         sceneX, topTotalHeight,    topZ,    WATER,
                                         sceneX, bottomTotalHeight, bottomZ, WATER,
                                         1);
        terrainGeometry.merge(triangle);

        triangle = buildTriangleGeometry(sceneX, bottomLandHeight, bottomZ, WATER,
                                         sceneX, topLandHeight,    topZ,    WATER,
                                         sceneX, topTotalHeight,   topZ,    WATER,
                                         1);
        terrainGeometry.merge(triangle);
      }
    }
  };


  var terrainMeshBuilder = {};

  terrainMeshBuilder.build = function(terrain, roadNetwork) {
    var mapX, mapZ, triangle;
    var sceneX, sceneZ;
    var leftRoad, topRoad, bottomRoad, rightRoad;
    var topLeftRoad, topRightRoad, bottomLeftRoad, bottomRightRoad;
    var topLeftX, topLeftZ, topRightX, topRightZ, bottomLeftX, bottomLeftZ, bottomRightX, bottomRightZ;
    var topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight;
    var topLeftMaterial, topRightMaterial, bottomLeftMaterial, bottomRightMaterial;

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
    for (mapX = terrain.minMapX(); mapX < terrain.maxMapX(); mapX += triangleWidth) {
      bottomLeftRoad = roadNetwork.getIntersectionSurfaceType(mapX, terrain.minMapZ()) === CityTour.RoadNetwork.TERRAIN_SURFACE;
      bottomRightRoad = roadNetwork.getIntersectionSurfaceType(mapX + triangleWidth, terrain.minMapZ()) === CityTour.RoadNetwork.TERRAIN_SURFACE;

      bottomRoad = (Math.floor(terrain.minMapZ()) === terrain.minMapZ()) &&
                   roadNetwork.hasEdgeBetween(Math.floor(mapX), terrain.minMapZ(), Math.floor(mapX) + 1, terrain.minMapZ(), CityTour.RoadNetwork.TERRAIN_SURFACE);

      bottomLeftHeight = terrain.heightAtCoordinates(mapX, terrain.minMapZ());
      bottomRightHeight = terrain.heightAtCoordinates(mapX + triangleWidth, terrain.minMapZ());

      bottomLeftMaterial = terrain.waterHeightAtCoordinates(mapX, terrain.minMapZ()) === 0.0 ? LAND : WATER;
      bottomRightMaterial = terrain.waterHeightAtCoordinates(mapX + triangleWidth, terrain.minMapZ()) === 0.0 ? LAND : WATER;

      for (mapZ = terrain.minMapZ(); mapZ < terrain.maxMapZ(); mapZ += triangleDepth) {
        topLeftRoad     = bottomLeftRoad;
        topRightRoad    = bottomRightRoad;
        bottomLeftRoad  = roadNetwork.getIntersectionSurfaceType(mapX, mapZ + triangleDepth) === CityTour.RoadNetwork.TERRAIN_SURFACE;
        bottomRightRoad = roadNetwork.getIntersectionSurfaceType(mapX + triangleWidth, mapZ + triangleDepth) === CityTour.RoadNetwork.TERRAIN_SURFACE;

        leftRoad = (Math.floor(mapX) === mapX) && roadNetwork.hasEdgeBetween(mapX, Math.floor(mapZ), mapX, Math.floor(mapZ) + 1, CityTour.RoadNetwork.TERRAIN_SURFACE);
        rightRoad = (Math.ceil(mapX + triangleWidth) === (mapX + triangleWidth)) && roadNetwork.hasEdgeBetween(mapX + triangleWidth, Math.floor(mapZ), mapX + triangleWidth, Math.floor(mapZ) + 1, CityTour.RoadNetwork.TERRAIN_SURFACE);
        topRoad = bottomRoad;
        bottomRoad = (Math.ceil(mapZ + triangleDepth) === (mapZ + triangleDepth)) && roadNetwork.hasEdgeBetween(Math.floor(mapX), mapZ + triangleDepth, Math.floor(mapX) + 1, mapZ + triangleDepth, CityTour.RoadNetwork.TERRAIN_SURFACE);

        topLeftX = CityTour.Coordinates.mapXToSceneX(mapX);
        topLeftZ = CityTour.Coordinates.mapZToSceneZ(mapZ);
        if (topLeftRoad || leftRoad) {
          topLeftX += halfStreetWidth;
        }
        if (topLeftRoad || topRoad) {
          topLeftZ += halfStreetDepth;
        }

        topRightX = CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth);
        topRightZ = CityTour.Coordinates.mapZToSceneZ(mapZ);
        if (topRightRoad || rightRoad) {
          topRightX -= halfStreetWidth;
        }
        if (topRightRoad || topRoad) {
          topRightZ += halfStreetDepth;
        }

        bottomLeftX = CityTour.Coordinates.mapXToSceneX(mapX);
        bottomLeftZ = CityTour.Coordinates.mapZToSceneZ(mapZ + triangleDepth);
        if (bottomLeftRoad || leftRoad) {
          bottomLeftX += halfStreetWidth;
        }
        if (bottomLeftRoad || bottomRoad) {
          bottomLeftZ -= halfStreetDepth;
        }

        bottomRightX = CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth);
        bottomRightZ = CityTour.Coordinates.mapZToSceneZ(mapZ + triangleDepth);
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
            triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), topLeftHeight, topLeftZ, topLeftMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX), bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             topLeftX, topLeftHeight, topLeftZ, topLeftMaterial, 2);
            terrainGeometry.merge(triangle);
          }

          if (bottomLeftRoad && !topLeftRoad) {
            triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), topLeftHeight, topLeftZ, topLeftMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX), bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
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
            triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth), bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth), topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial, 1);

            terrainGeometry.merge(triangle);
          }

          if (bottomRightRoad && !topRightRoad) {
            triangle = buildTriangleGeometry(bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth), bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth), topRightHeight, topRightZ, topRightMaterial, 1);
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
            triangle = buildTriangleGeometry(topLeftX,  topLeftHeight, CityTour.Coordinates.mapZToSceneZ(mapZ), topLeftMaterial,
                                             topLeftX,  topLeftHeight, topLeftZ, topLeftMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth), topRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ), topRightMaterial, 2);
            terrainGeometry.merge(triangle);
          }

          if (topRightRoad && !topLeftRoad) {
            triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), topLeftHeight, CityTour.Coordinates.mapZToSceneZ(mapZ), topLeftMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ), topRightMaterial, 2);
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
                                             bottomLeftX,  bottomLeftHeight, CityTour.Coordinates.mapZToSceneZ(mapZ + triangleDepth), bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ + triangleDepth), bottomRightMaterial, 1);
            terrainGeometry.merge(triangle);
          }

          if (bottomRightRoad && !bottomLeftRoad) {
            triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ + triangleDepth), bottomRightMaterial,
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

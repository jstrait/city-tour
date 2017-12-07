"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.TerrainGeometryBuilder = function() {
  var TERRAIN_COLOR_1 = new THREE.Color(0.0, 0.48, 0.0);
  var TERRAIN_COLOR_2 = new THREE.Color(0.0, 0.49, 0.0);
  var WATER_COLOR_1 = new THREE.Color(0.1, 0.2, 1.0);
  var WATER_COLOR_2 = new THREE.Color(0.1, 0.19, 1.0);

  var SOLID_SHADING_MODE = 1;
  var GRADIENT_SHADING_MODE = 2;
  var SHADING_MODE = SOLID_SHADING_MODE;

  var reusableTriangle = new THREE.Geometry();
  reusableTriangle.faces = [new THREE.Face3(0, 1, 2)];

  var buildTriangleGeometry = function(x1, y1, z1, material1, x2, y2, z2, material2, x3, y3, z3, material3) {
    reusableTriangle.vertices = [ new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2), new THREE.Vector3(x3, y3, z3) ];

    if (SHADING_MODE === SOLID_SHADING_MODE) {
      if (material1 === CityTour.Terrain.WATER && material2 === CityTour.Terrain.WATER && material3 == CityTour.Terrain.WATER) {
        reusableTriangle.faces[0].vertexColors = [WATER_COLOR_1, WATER_COLOR_1, WATER_COLOR_1];
      }
      else {
        reusableTriangle.faces[0].vertexColors = [TERRAIN_COLOR_1, TERRAIN_COLOR_1, TERRAIN_COLOR_1];
      }
    }
    else {
      reusableTriangle.faces[0].vertexColors = [(material1 === CityTour.Terrain.WATER) ? WATER_COLOR_1 : TERRAIN_COLOR_1,
                                                (material2 === CityTour.Terrain.WATER) ? WATER_COLOR_1 : TERRAIN_COLOR_1,
                                                (material3 === CityTour.Terrain.WATER) ? WATER_COLOR_1 : TERRAIN_COLOR_1,];
    }

    reusableTriangle.computeFaceNormals();

    return reusableTriangle;
  };

  var terrainGeometryBuilder = {};

  terrainGeometryBuilder.build = function(terrain, roadNetwork) {
    var mapX, mapZ, triangle;
    var leftRoad, topRoad, bottomRoad, rightRoad;
    var topLeftRoad, topRightRoad, bottomLeftRoad, bottomRightRoad;
    var topLeftX, topLeftZ, topRightX, topRightZ, bottomLeftX, bottomLeftZ, bottomRightX, bottomRightZ;
    var topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight;
    var topLeftMaterial, topRightMaterial, bottomLeftMaterial, bottomRightMaterial;

    var halfStreetWidth = CityTour.Config.STREET_WIDTH / 2;
    var halfStreetDepth = CityTour.Config.STREET_DEPTH / 2;

    var triangleWidth = 1 / terrain.subDivisions();
    var triangleDepth = 1 / terrain.subDivisions();

    var terrainGeometry1 = new THREE.Geometry();
    var terrainGeometry2 = new THREE.Geometry();
    var waterGeometry1 = new THREE.Geometry();
    var waterGeometry2 = new THREE.Geometry();
    var terrainMaterial1 = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors });
    var terrainMaterial2 = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors });
    var waterMaterial1 = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors });
    var waterMaterial2 = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors });

    for (mapX = terrain.minColumn(); mapX < terrain.maxColumn(); mapX += triangleWidth) {
      for (mapZ = terrain.minRow(); mapZ < terrain.maxRow(); mapZ += triangleDepth) {
        topLeftRoad     = roadNetwork.getIntersectionSurfaceType(mapX, mapZ) === CityTour.RoadNetwork.TERRAIN_SURFACE;
        topRightRoad    = roadNetwork.getIntersectionSurfaceType(mapX + triangleWidth, mapZ) === CityTour.RoadNetwork.TERRAIN_SURFACE;
        bottomLeftRoad  = roadNetwork.getIntersectionSurfaceType(mapX, mapZ + triangleDepth) === CityTour.RoadNetwork.TERRAIN_SURFACE;
        bottomRightRoad = roadNetwork.getIntersectionSurfaceType(mapX + triangleWidth, mapZ + triangleDepth) === CityTour.RoadNetwork.TERRAIN_SURFACE;

        leftRoad = (Math.floor(mapX) === mapX) && roadNetwork.hasEdgeBetween(mapX, Math.floor(mapZ), mapX, Math.floor(mapZ) + 1, CityTour.RoadNetwork.TERRAIN_SURFACE);
        rightRoad = (Math.ceil(mapX + triangleWidth) === (mapX + triangleWidth)) && roadNetwork.hasEdgeBetween(mapX + triangleWidth, Math.floor(mapZ), mapX + triangleWidth, Math.floor(mapZ) + 1, CityTour.RoadNetwork.TERRAIN_SURFACE);
        topRoad = (Math.floor(mapZ) === mapZ) && roadNetwork.hasEdgeBetween(Math.floor(mapX), mapZ, Math.floor(mapX) + 1, mapZ, CityTour.RoadNetwork.TERRAIN_SURFACE);
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

        topLeftHeight = terrain.heightAtCoordinates(mapX, mapZ);
        topRightHeight = terrain.heightAtCoordinates(mapX + triangleWidth, mapZ);
        bottomLeftHeight = terrain.heightAtCoordinates(mapX, mapZ + triangleDepth);
        bottomRightHeight = terrain.heightAtCoordinates(mapX + triangleWidth, mapZ + triangleDepth);

        topLeftMaterial = terrain.materialAtCoordinates(mapX, mapZ);
        topRightMaterial = terrain.materialAtCoordinates(mapX + triangleWidth, mapZ);
        bottomLeftMaterial = terrain.materialAtCoordinates(mapX, mapZ + triangleDepth);
        bottomRightMaterial = terrain.materialAtCoordinates(mapX + triangleWidth, mapZ + triangleDepth);

        // Core triangles
        triangle = buildTriangleGeometry(topLeftX,    topLeftHeight,    topLeftZ, topLeftMaterial,
                                         bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                         topRightX,   topRightHeight,   topRightZ, topRightMaterial);
        if (topLeftMaterial === CityTour.Terrain.WATER && topRightMaterial === CityTour.Terrain.WATER && bottomLeftMaterial === CityTour.Terrain.WATER) {
          waterGeometry1.merge(triangle);
        }
        else {
          terrainGeometry1.merge(triangle);
        }

        triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                         bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                         topRightX,    topRightHeight, topRightZ, topRightMaterial);
        if (bottomLeftMaterial === CityTour.Terrain.WATER && topRightMaterial === CityTour.Terrain.WATER && bottomRightMaterial === CityTour.Terrain.WATER) {
          waterGeometry2.merge(triangle);
        }
        else {
          terrainGeometry2.merge(triangle);
        }


        // Extra left-side triangles
        if (!leftRoad) {
          if (topLeftRoad && !bottomLeftRoad) {
            triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), topLeftHeight, topLeftZ, topLeftMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX), bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             topLeftX, topLeftHeight, topLeftZ, topLeftMaterial);
            terrainGeometry2.merge(triangle);
          }

          if (bottomLeftRoad && !topLeftRoad) {
            triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), topLeftHeight, topLeftZ, topLeftMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX), bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial);
            terrainGeometry2.merge(triangle);
          }

          if (topLeftRoad && bottomLeftRoad) {
            triangle = buildTriangleGeometry(bottomLeftX - CityTour.Config.STREET_WIDTH, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX, bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             topLeftX, topLeftHeight, topLeftZ, topLeftMaterial);
            terrainGeometry2.merge(triangle);
          }
        }


        // Extra right-side triangles
        if (!rightRoad) {
          if (topRightRoad && !bottomRightRoad) {
            triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth), bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth), topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial);

            terrainGeometry1.merge(triangle);
          }

          if (bottomRightRoad && !topRightRoad) {
            triangle = buildTriangleGeometry(bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth), bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth), topRightHeight, topRightZ, topRightMaterial);
            terrainGeometry1.merge(triangle);
          }

          if (topRightRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(topRightX,    topRightHeight, topRightZ, topRightMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial,
                                             topRightX + CityTour.Config.STREET_WIDTH, topRightHeight, topRightZ, topRightMaterial);
            terrainGeometry1.merge(triangle);
          }
        }

        // Extra top-side triangles
        if (!topRoad) {
          if (topLeftRoad && !topRightRoad) {
            triangle = buildTriangleGeometry(topLeftX,  topLeftHeight, CityTour.Coordinates.mapZToSceneZ(mapZ), topLeftMaterial,
                                             topLeftX,  topLeftHeight, topLeftZ, topLeftMaterial,
                                             CityTour.Coordinates.mapXToSceneX(mapX + triangleWidth), topRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ), topRightMaterial);
            terrainGeometry2.merge(triangle);
          }

          if (topRightRoad && !topLeftRoad) {
            triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), topLeftHeight, CityTour.Coordinates.mapZToSceneZ(mapZ), topLeftMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ), topRightMaterial);
            terrainGeometry2.merge(triangle);
          }

          if (topLeftRoad && topRightRoad) {
            triangle = buildTriangleGeometry(topLeftX, topLeftHeight, topLeftZ, topLeftMaterial,
                                             topRightX, topRightHeight, topRightZ, topRightMaterial,
                                             topRightX, topRightHeight, topRightZ - CityTour.Config.STREET_DEPTH, topRightMaterial);

            terrainGeometry2.merge(triangle);
          }
        }


        // Extra bottom-side triangles
        if (!bottomRoad) {
          if (bottomLeftRoad && !bottomRightRoad) {
            triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX,  bottomLeftHeight, CityTour.Coordinates.mapZToSceneZ(mapZ + triangleDepth), bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ + triangleDepth), bottomRightMaterial);
            terrainGeometry1.merge(triangle);
          }

          if (bottomRightRoad && !bottomLeftRoad) {
            triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ + triangleDepth), bottomRightMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial);
            terrainGeometry1.merge(triangle);
          }

          if (bottomLeftRoad && bottomRightRoad) {
            triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ, bottomLeftMaterial,
                                             bottomLeftX,  bottomLeftHeight, bottomLeftZ + CityTour.Config.STREET_DEPTH, bottomLeftMaterial,
                                             bottomRightX, bottomRightHeight, bottomRightZ, bottomRightMaterial);

            terrainGeometry1.merge(triangle);
          }
        }

      }
    }

    var mesh1 = new THREE.Mesh(terrainGeometry1, terrainMaterial1);
    var mesh2 = new THREE.Mesh(terrainGeometry2, terrainMaterial2);
    var waterMesh1 = new THREE.Mesh(waterGeometry1, waterMaterial1);
    var waterMesh2 = new THREE.Mesh(waterGeometry2, waterMaterial2);

    return [mesh1, mesh2, waterMesh1, waterMesh2];
  };

  return terrainGeometryBuilder;
};

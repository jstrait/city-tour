"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.TerrainGeometryBuilder = function() {
  var TERRAIN_COLOR_1 = new THREE.Color(0.0, 0.48, 0.0);
  var TERRAIN_COLOR_2 = new THREE.Color(0.0, 0.49, 0.0);
  var WATER_COLOR = new THREE.Color(0.1, 0.2, 1.0);

  var LAND = 'land';
  var WATER = 'water';

  var reusableTriangle = new THREE.Geometry();
  reusableTriangle.faces = [new THREE.Face3(0, 1, 2)];

  var buildTriangleGeometry = function(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
    reusableTriangle.vertices = [ new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2), new THREE.Vector3(x3, y3, z3) ];
    reusableTriangle.computeFaceNormals();

    return reusableTriangle;
  };

  var terrainGeometryBuilder = {};

  terrainGeometryBuilder.build = function(terrain, roadNetwork) {
    var mapX, mapZ, triangle;
    var topLeftRoad, topRightRoad, bottomLeftRoad, bottomRightRoad;
    var topLeftX, topLeftZ, topRightX, topRightZ, bottomLeftX, bottomLeftZ, bottomRightX, bottomRightZ;
    var topLeftHeight, topRightHeight, bottomLeftHeight, bottomRightHeight;
    var topLeftMaterial, topRightMaterial, bottomLeftMaterial, bottomRightMaterial;

    var halfStreetWidth = CityTour.Config.STREET_WIDTH / 2;
    var halfStreetDepth = CityTour.Config.STREET_DEPTH / 2;

    var terrainGeometry1 = new THREE.Geometry();
    var terrainGeometry2 = new THREE.Geometry();
    var waterGeometry = new THREE.Geometry();
    var terrainMaterial1 = new THREE.MeshLambertMaterial({ color: TERRAIN_COLOR_1 });
    var terrainMaterial2 = new THREE.MeshLambertMaterial({ color: TERRAIN_COLOR_2 });
    var waterMaterial = new THREE.MeshLambertMaterial({ color: WATER_COLOR });

    for (mapX = -CityTour.Config.HALF_TERRAIN_COLUMNS; mapX < CityTour.Config.HALF_TERRAIN_COLUMNS; mapX++) {
      for (mapZ = -CityTour.Config.HALF_TERRAIN_ROWS; mapZ < CityTour.Config.HALF_TERRAIN_ROWS; mapZ++) {
        topLeftRoad     = roadNetwork.hasIntersection(mapX, mapZ);
        topRightRoad    = roadNetwork.hasIntersection(mapX + 1, mapZ);
        bottomLeftRoad  = roadNetwork.hasIntersection(mapX, mapZ + 1);
        bottomRightRoad = roadNetwork.hasIntersection(mapX + 1, mapZ + 1);

        topLeftX = CityTour.Coordinates.mapXToSceneX(mapX);
        topLeftZ = CityTour.Coordinates.mapZToSceneZ(mapZ);
        if (topLeftRoad) {
          topLeftX += halfStreetWidth;
          topLeftZ += halfStreetDepth;
        }

        topRightX = CityTour.Coordinates.mapXToSceneX(mapX + 1);
        topRightZ = CityTour.Coordinates.mapZToSceneZ(mapZ);
        if (topRightRoad) {
          topRightX -= halfStreetWidth;
          topRightZ += halfStreetDepth;
        }

        bottomLeftX = CityTour.Coordinates.mapXToSceneX(mapX);
        bottomLeftZ = CityTour.Coordinates.mapZToSceneZ(mapZ + 1);
        if (bottomLeftRoad) {
          bottomLeftX += halfStreetWidth;
          bottomLeftZ -= halfStreetDepth;
        }

        bottomRightX = CityTour.Coordinates.mapXToSceneX(mapX + 1);
        bottomRightZ = CityTour.Coordinates.mapZToSceneZ(mapZ + 1);
        if (bottomRightRoad) {
          bottomRightX -= halfStreetWidth;
          bottomRightZ -= halfStreetDepth;
        }

        topLeftHeight = terrain.heightAtCoordinates(mapX, mapZ);
        topRightHeight = terrain.heightAtCoordinates(mapX + 1, mapZ);
        bottomLeftHeight = terrain.heightAtCoordinates(mapX, mapZ + 1);
        bottomRightHeight = terrain.heightAtCoordinates(mapX + 1, mapZ + 1);

        topLeftMaterial = terrain.materialAtCoordinates(mapX, mapZ);
        topRightMaterial = terrain.materialAtCoordinates(mapX + 1, mapZ);
        bottomLeftMaterial = terrain.materialAtCoordinates(mapX, mapZ + 1);
        bottomRightMaterial = terrain.materialAtCoordinates(mapX + 1, mapZ + 1);

        // Core triangles
        triangle = buildTriangleGeometry(topLeftX,    topLeftHeight,    topLeftZ,
                                         bottomLeftX, bottomLeftHeight, bottomLeftZ,
                                         topRightX,   topRightHeight,   topRightZ);
        if (topLeftMaterial === WATER && topRightMaterial === WATER && bottomLeftMaterial === WATER) {
          waterGeometry.merge(triangle);
        }
        else {
          terrainGeometry1.merge(triangle);
        }

        triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ,
                                         bottomRightX, bottomRightHeight, bottomRightZ,
                                         topRightX,    topRightHeight, topRightZ);
        if (bottomLeftMaterial === WATER && topRightMaterial === WATER && bottomRightMaterial === WATER) {
          waterGeometry.merge(triangle);
        }
        else {
          terrainGeometry2.merge(triangle);;
        }


        // Extra left-side triangles
        if (topLeftRoad && !bottomLeftRoad) {
          triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), topLeftHeight, topLeftZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX), bottomLeftHeight, bottomLeftZ,
                                           topLeftX, topLeftHeight, topLeftZ);
          terrainGeometry2.merge(triangle);
        }

        if (bottomLeftRoad && !topLeftRoad) {
          triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX),  topLeftHeight,     topLeftZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX),  bottomLeftHeight, bottomLeftZ,
                                           bottomLeftX, bottomLeftHeight, bottomLeftZ);
          terrainGeometry2.merge(triangle);
        }

        if (topLeftRoad && bottomLeftRoad && !roadNetwork.hasEdgeBetween(mapX, mapZ, mapX, mapZ + 1)) {
          triangle = buildTriangleGeometry(bottomLeftX - CityTour.Config.STREET_WIDTH, bottomLeftHeight, bottomLeftZ,
                                           bottomLeftX, bottomLeftHeight, bottomLeftZ,
                                           topLeftX, topLeftHeight, topLeftZ);
          terrainGeometry2.merge(triangle);
        }


        // Extra right-side triangles
        if (topRightRoad && !bottomRightRoad) {
          triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX + 1), bottomRightHeight, bottomRightZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX + 1), topRightHeight, topRightZ,
                                           topRightX, topRightHeight, topRightZ);

          terrainGeometry1.merge(triangle);
        }

        if (bottomRightRoad && !topRightRoad) {
          triangle = buildTriangleGeometry(bottomRightX, bottomRightHeight, bottomRightZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX + 1), bottomRightHeight, bottomRightZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX + 1), topRightHeight, topRightZ);
          terrainGeometry1.merge(triangle);
        }

        if (topRightRoad && bottomRightRoad && !roadNetwork.hasEdgeBetween(mapX + 1, mapZ, mapX + 1, mapZ + 1)) {
          triangle = buildTriangleGeometry(topRightX,    topRightHeight, topRightZ,
                                           bottomRightX, bottomRightHeight, bottomRightZ,
                                           topRightX + CityTour.Config.STREET_WIDTH, topRightHeight, topRightZ);
          terrainGeometry1.merge(triangle);
        }


        // Extra top-side triangles
        if (topLeftRoad && !topRightRoad) {
          triangle = buildTriangleGeometry(topLeftX,  topLeftHeight, CityTour.Coordinates.mapZToSceneZ(mapZ),
                                           topLeftX,  topLeftHeight, topLeftZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX + 1), topRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ));
          terrainGeometry2.merge(triangle);
        }

        if (topRightRoad && !topLeftRoad) {
          triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), topLeftHeight, CityTour.Coordinates.mapZToSceneZ(mapZ),
                                           topRightX, topRightHeight, topRightZ,
                                           topRightX, topRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ));
          terrainGeometry2.merge(triangle);
        }

        if (topLeftRoad && topRightRoad && !roadNetwork.hasEdgeBetween(mapX, mapZ, mapX + 1, mapZ)) {
          triangle = buildTriangleGeometry(topLeftX, topLeftHeight, topLeftZ,
                                           topRightX, topRightHeight, topRightZ,
                                           topRightX, topRightHeight, topRightZ - CityTour.Config.STREET_DEPTH);

          terrainGeometry2.merge(triangle);
        }


        // Extra bottom-side triangles
        if (bottomLeftRoad && !bottomRightRoad) {
          triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ,
                                           bottomLeftX,  bottomLeftHeight, CityTour.Coordinates.mapZToSceneZ(mapZ + 1),
                                           bottomRightX, bottomRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ + 1));
          terrainGeometry1.merge(triangle);
        }

        if (bottomRightRoad && !bottomLeftRoad) {
          triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), bottomLeftHeight, bottomLeftZ,
                                           bottomRightX, bottomRightHeight, CityTour.Coordinates.mapZToSceneZ(mapZ + 1),
                                           bottomRightX, bottomRightHeight, bottomRightZ);
          terrainGeometry1.merge(triangle);
        }

        if (bottomLeftRoad && bottomRightRoad && !roadNetwork.hasEdgeBetween(mapX, mapZ + 1, mapX + 1, mapZ + 1)) {
          triangle = buildTriangleGeometry(bottomLeftX,  bottomLeftHeight, bottomLeftZ,
                                           bottomLeftX,  bottomLeftHeight, bottomLeftZ + CityTour.Config.STREET_DEPTH,
                                           bottomRightX, bottomRightHeight, bottomRightZ);

          terrainGeometry1.merge(triangle);
        }
      }
    }

    var mesh1 = new THREE.Mesh(terrainGeometry1, terrainMaterial1);
    var mesh2 = new THREE.Mesh(terrainGeometry2, terrainMaterial2);
    var waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);

    return [mesh1, mesh2, waterMesh];
  };

  return terrainGeometryBuilder;
};

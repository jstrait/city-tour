"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.TerrainGeometryBuilder = function() {
  var TERRAIN_COLOR_1 = new THREE.Color(0.0, 0.48, 0.0);
  var TERRAIN_COLOR_2 = new THREE.Color(0.0, 0.49, 0.0);

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

    var halfStreetWidth = CityTour.Config.STREET_WIDTH / 2;
    var halfStreetDepth = CityTour.Config.STREET_DEPTH / 2;

    var terrainGeometry1 = new THREE.Geometry();
    var terrainGeometry2 = new THREE.Geometry();
    var terrainMaterial1 = new THREE.MeshLambertMaterial({ color: TERRAIN_COLOR_1 });
    var terrainMaterial2 = new THREE.MeshLambertMaterial({ color: TERRAIN_COLOR_2 });

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

        triangle = buildTriangleGeometry(topLeftX,     terrain.heightAtCoordinates(mapX, mapZ),     topLeftZ,
                                         bottomLeftX,  terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ,
                                         topRightX,    terrain.heightAtCoordinates(mapX + 1, mapZ), topRightZ);
        terrainGeometry1.merge(triangle);

        triangle = buildTriangleGeometry(bottomLeftX,  terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ,
                                         bottomRightX, terrain.heightAtCoordinates(mapX + 1, mapZ + 1), bottomRightZ,
                                         topRightX,    terrain.heightAtCoordinates(mapX + 1, mapZ), topRightZ);
        terrainGeometry2.merge(triangle);


        // Extra left-side triangles
        if (topLeftRoad && !bottomLeftRoad) {
          triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX), terrain.heightAtCoordinates(mapX, mapZ), topLeftZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX),  terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ,
                                           topLeftX,    terrain.heightAtCoordinates(mapX, mapZ), topLeftZ);
          terrainGeometry2.merge(triangle);
        }

        if (bottomLeftRoad && !topLeftRoad) {
          triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX),     terrain.heightAtCoordinates(mapX, mapZ),     topLeftZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX),  terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ,
                                           bottomLeftX,    terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ);
          terrainGeometry2.merge(triangle);
        }

        if (topLeftRoad && bottomLeftRoad && !roadNetwork.hasEdgeBetween(mapX, mapZ, mapX, mapZ + 1)) {
          triangle = buildTriangleGeometry(bottomLeftX - CityTour.Config.STREET_WIDTH, terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ,
                                           bottomLeftX, terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ,
                                           topLeftX, terrain.heightAtCoordinates(mapX, mapZ), topLeftZ);
          terrainGeometry2.merge(triangle);
        }


        // Extra right-side triangles
        if (topRightRoad && !bottomRightRoad) {
          triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX + 1), terrain.heightAtCoordinates(mapX + 1, mapZ + 1), bottomRightZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX + 1), terrain.heightAtCoordinates(mapX + 1, mapZ), topRightZ,
                                           topRightX, terrain.heightAtCoordinates(mapX + 1, mapZ), topRightZ);

          terrainGeometry1.merge(triangle);
        }

        if (bottomRightRoad && !topRightRoad) {
          triangle = buildTriangleGeometry(bottomRightX,  terrain.heightAtCoordinates(mapX + 1, mapZ + 1), bottomRightZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX + 1), terrain.heightAtCoordinates(mapX + 1, mapZ + 1), bottomRightZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX + 1), terrain.heightAtCoordinates(mapX + 1, mapZ), topRightZ);
          terrainGeometry1.merge(triangle);
        }

        if (topRightRoad && bottomRightRoad && !roadNetwork.hasEdgeBetween(mapX + 1, mapZ, mapX + 1, mapZ + 1)) {
          triangle = buildTriangleGeometry(topRightX,    terrain.heightAtCoordinates(mapX + 1, mapZ), topRightZ,
                                           bottomRightX, terrain.heightAtCoordinates(mapX + 1, mapZ + 1), bottomRightZ,
                                           topRightX + CityTour.Config.STREET_WIDTH, terrain.heightAtCoordinates(mapX + 1, mapZ), topRightZ);
          terrainGeometry1.merge(triangle);
        }


        // Extra top-side triangles
        if (topLeftRoad && !topRightRoad) {
          triangle = buildTriangleGeometry(topLeftX,  terrain.heightAtCoordinates(mapX, mapZ), CityTour.Coordinates.mapZToSceneZ(mapZ),
                                           topLeftX,  terrain.heightAtCoordinates(mapX, mapZ), topLeftZ,
                                           CityTour.Coordinates.mapXToSceneX(mapX + 1), terrain.heightAtCoordinates(mapX + 1, mapZ), CityTour.Coordinates.mapZToSceneZ(mapZ));
          terrainGeometry2.merge(triangle);
        }

        if (topRightRoad && !topLeftRoad) {
          triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX),     terrain.heightAtCoordinates(mapX, mapZ),  CityTour.Coordinates.mapZToSceneZ(mapZ),
                                           topRightX,  terrain.heightAtCoordinates(mapX + 1, mapZ), topRightZ,
                                           topRightX,    terrain.heightAtCoordinates(mapX + 1, mapZ), CityTour.Coordinates.mapZToSceneZ(mapZ));
          terrainGeometry2.merge(triangle);
        }

        if (topLeftRoad && topRightRoad && !roadNetwork.hasEdgeBetween(mapX, mapZ, mapX + 1, mapZ)) {
          triangle = buildTriangleGeometry(topLeftX, terrain.heightAtCoordinates(mapX, mapZ), topLeftZ,
                                           topRightX, terrain.heightAtCoordinates(mapX + 1, mapZ), topRightZ,
                                           topRightX, terrain.heightAtCoordinates(mapX + 1, mapZ), topRightZ - CityTour.Config.STREET_DEPTH);

          terrainGeometry2.merge(triangle);
        }



        // Extra bottom-side triangles
        if (bottomLeftRoad && !bottomRightRoad) {
          triangle = buildTriangleGeometry(bottomLeftX,  terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ,
                                           bottomLeftX, terrain.heightAtCoordinates(mapX, mapZ + 1), CityTour.Coordinates.mapZToSceneZ(mapZ + 1),
                                           bottomRightX, terrain.heightAtCoordinates(mapX + 1, mapZ + 1), CityTour.Coordinates.mapZToSceneZ(mapZ + 1));
          terrainGeometry1.merge(triangle);
        }

        if (bottomRightRoad && !bottomLeftRoad) {
          triangle = buildTriangleGeometry(CityTour.Coordinates.mapXToSceneX(mapX),  terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ,
                                           bottomRightX, terrain.heightAtCoordinates(mapX + 1, mapZ + 1), CityTour.Coordinates.mapZToSceneZ(mapZ + 1),
                                           bottomRightX, terrain.heightAtCoordinates(mapX + 1, mapZ + 1), bottomRightZ);
          terrainGeometry1.merge(triangle);
        }

        if (bottomLeftRoad && bottomRightRoad && !roadNetwork.hasEdgeBetween(mapX, mapZ + 1, mapX + 1, mapZ + 1)) {
          triangle = buildTriangleGeometry(bottomLeftX, terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ,
                                           bottomLeftX, terrain.heightAtCoordinates(mapX, mapZ + 1), bottomLeftZ + CityTour.Config.STREET_DEPTH,
                                           bottomRightX, terrain.heightAtCoordinates(mapX + 1, mapZ + 1), bottomRightZ);

          terrainGeometry1.merge(triangle);
        }
      }
    }

    var mesh1 = new THREE.Mesh(terrainGeometry1, terrainMaterial1);
    var mesh2 = new THREE.Mesh(terrainGeometry2, terrainMaterial2);

    return [mesh1, mesh2];
  };

  return terrainGeometryBuilder;
};

"use strict";

var CityTour = CityTour || {};

CityTour.TerrainGeometryBuilder = function() {
  var TERRAIN_COLOR_1 = new THREE.Color(0.0, 0.48, 0.0);
  var TERRAIN_COLOR_2 = new THREE.Color(0.0, 0.49, 0.0);

  var buildTriangleGeometry = function(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
    var triangle = new THREE.Geometry();

    triangle.vertices.push(new THREE.Vector3(x1, y1, z1));
    triangle.vertices.push(new THREE.Vector3(x2, y2, z2));
    triangle.vertices.push(new THREE.Vector3(x3, y3, z3));

    triangle.faces.push(new THREE.Face3(0, 1, 2));
    triangle.computeFaceNormals();

    return triangle;
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


CityTour.RoadGeometryBuilder = function() {
  var COLOR_ROAD = 0xaaaaaa;

  var roadGeometryBuilder = {};

  roadGeometryBuilder.build = function(terrain, roadNetwork) {
    var mapX, mapZ, sceneX, sceneZ;

    var roadMaterial = new THREE.MeshBasicMaterial({ color: COLOR_ROAD, });
    var roadGeometry = new THREE.Geometry();
    var roadSegment;
    var heightAtPoint1, heightAtPoint2;
    var midpointHeight, angle, segmentLength;
    var roadIntersection;

    var reusableIntersectionMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.STREET_WIDTH, CityTour.Config.STREET_DEPTH), roadMaterial);
    reusableIntersectionMesh.rotation.x = -(Math.PI / 2);

    for (mapX = -CityTour.Config.HALF_BLOCK_COLUMNS; mapX <= CityTour.Config.HALF_BLOCK_COLUMNS; mapX++) {
      sceneX = CityTour.Coordinates.mapXToSceneX(mapX);

      for (mapZ = -CityTour.Config.HALF_BLOCK_ROWS; mapZ <= CityTour.Config.HALF_BLOCK_ROWS; mapZ++) { 
        sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ);

        roadIntersection = roadNetwork.intersectionAt(mapX, mapZ);

        if (roadIntersection) {
          // Road intersection
          roadSegment = reusableIntersectionMesh;
          roadSegment.position.x = sceneX;
          roadSegment.position.y = terrain.heightAtCoordinates(mapX, mapZ);
          roadSegment.position.z = sceneZ;
          roadSegment.updateMatrix();
          roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);

          // North/South road segment
          if (roadIntersection.hasPathTo(mapX, mapZ + 1)) {
            if (mapZ < CityTour.Config.HALF_BLOCK_ROWS) {
              heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
              heightAtPoint2 = terrain.heightAtCoordinates(mapX, mapZ + 1);
              midpointHeight = (heightAtPoint1 + heightAtPoint2) / 2;
              angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_DEPTH);

              segmentLength = Math.sqrt(Math.pow((heightAtPoint2 - heightAtPoint1), 2) + Math.pow(CityTour.Config.BLOCK_DEPTH, 2));

              roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.STREET_WIDTH, segmentLength), roadMaterial);
              roadSegment.position.x = sceneX;
              roadSegment.rotation.x = angle - (Math.PI / 2);
              roadSegment.position.y = midpointHeight;
              roadSegment.position.z = sceneZ + (CityTour.Config.BLOCK_AND_STREET_DEPTH / 2);
              roadSegment.updateMatrix();
              roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);
            }
          }

          // East/West road segment
          if (roadIntersection.hasPathTo(mapX + 1, mapZ)) {
            if (mapX < CityTour.Config.HALF_BLOCK_COLUMNS) {
              heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
              heightAtPoint2 = terrain.heightAtCoordinates(mapX + 1, mapZ);
              midpointHeight = (heightAtPoint1 + heightAtPoint2) / 2;
              angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_WIDTH);

              segmentLength = Math.sqrt(Math.pow((heightAtPoint2 - heightAtPoint1), 2) + Math.pow(CityTour.Config.BLOCK_WIDTH, 2));

              roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(segmentLength, CityTour.Config.STREET_WIDTH), roadMaterial);
              roadSegment.position.x = sceneX + (CityTour.Config.BLOCK_AND_STREET_WIDTH / 2);
              roadSegment.rotation.x = -(Math.PI / 2);
              roadSegment.position.y = midpointHeight;
              roadSegment.rotation.y = angle;
              roadSegment.position.z = sceneZ;
              roadSegment.updateMatrix();
              roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);
            }
          }
        }
      }
    }

    return new THREE.Mesh(roadGeometry, roadMaterial);
  };

  return roadGeometryBuilder;
};


CityTour.BuildingGeometryBuilder = function() {
  var buildMaterials = function() {
    var buildingMaterials = [];

    for (var i = 0; i < CityTour.Config.MAX_BUILDING_MATERIALS; i++) {
      var random = Math.random() * 0.7;
      var r = random;
      var g = random;
      var b = random;

      buildingMaterials.push(new THREE.MeshLambertMaterial({ color: new THREE.Color(r, g, b), }));
    }

    return buildingMaterials;
  };

  var buildEmptyGeometriesForBuildings = function() {
    var buildingGeometries = [];

    for (var i = 0; i < CityTour.Config.MAX_BUILDING_MATERIALS; i++) {
      buildingGeometries.push(new THREE.Geometry());
    }

    return buildingGeometries;
  };

  var generateBuildingGeometries = function(buildings, buildingGeometries) {
    var mapX, mapZ, sceneX, sceneZ;
    var block;
    var storyHeight, buildingHeight;
    var materialIndex;

    var reusableBuildingMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

    for (mapX = -CityTour.Config.HALF_BLOCK_COLUMNS; mapX < CityTour.Config.HALF_BLOCK_COLUMNS; mapX++) {
      sceneX = CityTour.Coordinates.mapXToSceneX(mapX) + (CityTour.Config.STREET_WIDTH / 2);

      for (mapZ = -CityTour.Config.HALF_BLOCK_ROWS; mapZ < CityTour.Config.HALF_BLOCK_ROWS; mapZ++) {
        sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ) + (CityTour.Config.STREET_DEPTH / 2);

        block = buildings.blockAtCoordinates(mapX, mapZ);

        block.forEach(function(lot) {
          var mapLotWidth = lot.right - lot.left;
          var mapLotDepth = lot.bottom - lot.top;
          var mapLotXMidpoint = lot.left + (mapLotWidth / 2);
          var mapLotZMidpoint = lot.top + (mapLotDepth / 2);

          storyHeight = ((CityTour.Config.MAX_STORY_HEIGHT - CityTour.Config.MIN_STORY_HEIGHT) * Math.random()) + CityTour.Config.MIN_STORY_HEIGHT;
          buildingHeight = storyHeight * lot.stories + (lot.ySurface - lot.yFloor); 

          reusableBuildingMesh.scale.x = mapLotWidth * CityTour.Config.BLOCK_WIDTH;
          reusableBuildingMesh.position.x = sceneX + (CityTour.Config.BLOCK_WIDTH * mapLotXMidpoint);

          reusableBuildingMesh.scale.y = buildingHeight;
          reusableBuildingMesh.position.y = (buildingHeight / 2) + lot.yFloor;

          reusableBuildingMesh.scale.z = mapLotDepth * CityTour.Config.BLOCK_WIDTH;
          reusableBuildingMesh.position.z = sceneZ + (CityTour.Config.BLOCK_DEPTH * mapLotZMidpoint);

          reusableBuildingMesh.updateMatrix();

          materialIndex = Math.floor(Math.random() * CityTour.Config.MAX_BUILDING_MATERIALS);
          buildingGeometries[materialIndex].merge(reusableBuildingMesh.geometry, reusableBuildingMesh.matrix);
        
          if (lot.stories > 25 && (Math.random() < 0.3)) {
            var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 4));
            cylinder.position.x = sceneX + (CityTour.Config.BLOCK_WIDTH * mapLotXMidpoint);
            cylinder.position.y = lot.yFloor + buildingHeight + 5;
            cylinder.position.z = sceneZ + (CityTour.Config.BLOCK_DEPTH * mapLotZMidpoint);
            cylinder.updateMatrix();
            buildingGeometries[materialIndex].merge(cylinder.geometry, cylinder.matrix);
          }
        });
      }
    }
  };


  var buildingGeometryBuilder = {};

  buildingGeometryBuilder.build = function(buildings) {
    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();

    generateBuildingGeometries(buildings, buildingGeometries);

    var buildingMeshes = [];
    for (var i = 0; i < CityTour.Config.MAX_BUILDING_MATERIALS; i++) {
      buildingMeshes.push(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
    }

    return buildingMeshes;
  };

  return buildingGeometryBuilder;
};


CityTour.SceneBuilder = function() {
  var sceneBuilder = {};

  sceneBuilder.build = function(terrain, roadNetwork, buildings) {
    var masterStartTime = new Date();

    var scene = new THREE.Scene();

    var terrainStartTime = new Date();
    var terrainMeshes = new CityTour.TerrainGeometryBuilder().build(terrain, roadNetwork);
    terrainMeshes.forEach(function(terrainMesh) {
      scene.add(terrainMesh);
    });
    var terrainEndTime = new Date();

    var roadStartTime = new Date();
    scene.add(new CityTour.RoadGeometryBuilder().build(terrain, roadNetwork));
    var roadEndTime = new Date();

    var buildingsStartTime = new Date();
    var buildingMeshes = new CityTour.BuildingGeometryBuilder().build(buildings);
    buildingMeshes.forEach(function(buildingMesh) {
      scene.add(buildingMesh);
    });
    var buildingsEndTime = new Date();

    var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    light.position.set( 0, 500, 0 );
    scene.add(light);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(-1, 0.9, 0.9);
    scene.add(directionalLight);

    var masterEndTime = new Date();
    console.log("Time to generate scene geometry: " + (masterEndTime - masterStartTime) + "ms");
    console.log("  Terrain:   " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Roads:     " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Buildings: " + (buildingsEndTime - buildingsStartTime) + "ms");

    return scene;
  };

  return sceneBuilder;
};

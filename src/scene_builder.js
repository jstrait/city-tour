"use strict";

var SceneBuilder = function() {
  var COLOR_GROUND = 0xaaaaaa;

  var buildTriangleGeometry = function(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
    var triangle = new THREE.Geometry();

    triangle.vertices.push(new THREE.Vector3(x1, y1, z1));
    triangle.vertices.push(new THREE.Vector3(x2, y2, z2));
    triangle.vertices.push(new THREE.Vector3(x3, y3, z3));

    triangle.faces.push(new THREE.Face3(0, 1, 2));
    triangle.computeFaceNormals();

    return triangle;
  };

  var buildTerrainGeometry = function(terrain) {
    var mapX, mapZ;
    var sceneX_Left, sceneX_Right, sceneZ_Top, sceneZ_Bottom;

    var terrainGeometry1 = new THREE.Geometry();
    var terrainGeometry2 = new THREE.Geometry();
    var terrainMaterial1 = new THREE.MeshLambertMaterial({ color: new THREE.Color(0, 200, 0) });
    var terrainMaterial2 = new THREE.MeshLambertMaterial({ color: new THREE.Color(255, 25, 0) });

    var triangle, v1, v2, v3;

    for (mapX = -CityConfig.HALF_BLOCK_COLUMNS; mapX < CityConfig.HALF_BLOCK_COLUMNS; mapX++) {
      sceneX_Left = Coordinates.mapXToSceneX(mapX) + (CityConfig.STREET_WIDTH / 2);
      sceneX_Right = sceneX_Left + CityConfig.BLOCK_WIDTH;

      for (mapZ = -CityConfig.HALF_BLOCK_ROWS; mapZ < CityConfig.HALF_BLOCK_ROWS; mapZ++) {
        sceneZ_Top = Coordinates.mapZToSceneZ(mapZ) + (CityConfig.STREET_DEPTH / 2);
        sceneZ_Bottom = sceneZ_Top + CityConfig.BLOCK_DEPTH;

        triangle = buildTriangleGeometry(sceneX_Left,  terrain.heightAtCoordinates(mapX, mapZ),     sceneZ_Top,
                                         sceneX_Left,  terrain.heightAtCoordinates(mapX, mapZ + 1), sceneZ_Bottom,
                                         sceneX_Right, terrain.heightAtCoordinates(mapX + 1, mapZ), sceneZ_Top);
        terrainGeometry1.merge(triangle);

        triangle = buildTriangleGeometry(sceneX_Left,  terrain.heightAtCoordinates(mapX, mapZ + 1),     sceneZ_Bottom,
                                         sceneX_Right, terrain.heightAtCoordinates(mapX + 1, mapZ + 1), sceneZ_Bottom,
                                         sceneX_Right, terrain.heightAtCoordinates(mapX + 1, mapZ),     sceneZ_Top);
        terrainGeometry2.merge(triangle);
      }
    }

    var mesh1 = new THREE.Mesh(terrainGeometry1, terrainMaterial1);
    var mesh2 = new THREE.Mesh(terrainGeometry2, terrainMaterial2);

    return [mesh1, mesh2];
  };

  var buildRoadGeometry = function(terrain) {
    var mapX, mapZ, sceneX, sceneZ;

    var roadMaterial = new THREE.MeshBasicMaterial({ color: COLOR_GROUND, });
    var roadGeometry = new THREE.Geometry();
    var roadSegment;

    var reusableIntersectionMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityConfig.STREET_WIDTH, CityConfig.STREET_DEPTH), roadMaterial);
    reusableIntersectionMesh.rotation.x = -(Math.PI / 2);

    for (mapX = -CityConfig.HALF_BLOCK_COLUMNS; mapX < CityConfig.HALF_BLOCK_COLUMNS; mapX++) {
      sceneX = Coordinates.mapXToSceneX(mapX);

      for (mapZ = -CityConfig.HALF_BLOCK_ROWS; mapZ < CityConfig.HALF_BLOCK_ROWS; mapZ++) { 
        sceneZ = Coordinates.mapZToSceneZ(mapZ);

        // Road intersection
        roadSegment = reusableIntersectionMesh;
        roadSegment.position.x = sceneX;
        roadSegment.position.y = terrain.heightAtCoordinates(mapX, mapZ);
        roadSegment.position.z = sceneZ;
        roadSegment.updateMatrix();
        roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);


        // North/South road segment
        var north = terrain.heightAtCoordinates(mapX, mapZ);
        var south = terrain.heightAtCoordinates(mapX, mapZ + 1);
        var midpoint = (north + south) / 2;
        var angle = -Math.atan2(CityConfig.BLOCK_DEPTH, (north - south));

        var segmentLength = Math.sqrt(Math.pow((south - north), 2) + Math.pow(CityConfig.BLOCK_DEPTH, 2));

        roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(CityConfig.STREET_WIDTH, segmentLength), roadMaterial);
        roadSegment.position.x = sceneX;
        roadSegment.rotation.x = angle;
        roadSegment.position.y = midpoint;
        roadSegment.position.z = sceneZ + (CityConfig.BLOCK_AND_STREET_DEPTH / 2);
        roadSegment.updateMatrix();
        roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);


        // East/West road segment
        if (mapX < CityConfig.BLOCK_COLUMNS) {
          var west = terrain.heightAtCoordinates(mapX, mapZ);
          var east = terrain.heightAtCoordinates(mapX + 1, mapZ);
          var midpoint = (west + east) / 2;
          var angle = Math.atan2((west - east), CityConfig.BLOCK_WIDTH);

          var segmentLength = Math.sqrt(Math.pow((east - west), 2) + Math.pow(CityConfig.BLOCK_WIDTH, 2));

          roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(segmentLength, CityConfig.STREET_WIDTH), roadMaterial);
          roadSegment.position.x = sceneX + (CityConfig.BLOCK_AND_STREET_WIDTH / 2);
          roadSegment.rotation.x = -(Math.PI / 2);
          roadSegment.position.y = midpoint;
          roadSegment.rotation.y = angle;
          roadSegment.position.z = sceneZ;
          roadSegment.updateMatrix();
          roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);
        }
      }
    }

    return new THREE.Mesh(roadGeometry, roadMaterial);
  };

  var buildMaterials = function() {
    var buildingMaterials = [];

    for (var i = 0; i < CityConfig.MAX_BUILDING_MATERIALS; i++) {
      var random = Math.random() * 0.6;
      var r = random;
      var g = random;
      var b = random;

      buildingMaterials.push(new THREE.MeshLambertMaterial({ color: new THREE.Color(r, g, b), }));
    }

    return buildingMaterials;
  };

  var buildEmptyGeometriesForBuildings = function() {
    var buildingGeometries = [];

    for (var i = 0; i < CityConfig.MAX_BUILDING_MATERIALS; i++) {
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

    for (mapX = -CityConfig.HALF_BLOCK_ROWS; mapX < CityConfig.HALF_BLOCK_COLUMNS; mapX++) {
      sceneX = Coordinates.mapXToSceneX(mapX) + (CityConfig.STREET_WIDTH / 2);

      for (mapZ = -CityConfig.HALF_BLOCK_ROWS; mapZ < CityConfig.HALF_BLOCK_ROWS; mapZ++) {
        sceneZ = Coordinates.mapZToSceneZ(mapZ) + (CityConfig.STREET_DEPTH / 2);

        block = buildings.blockAtCoordinates(mapX, mapZ);

        block.forEach(function(lot) {
          var mapLotWidth = lot.right - lot.left;
          var mapLotDepth = lot.bottom - lot.top;
          var mapLotXMidpoint = lot.left + (mapLotWidth / 2);
          var mapLotZMidpoint = lot.top + (mapLotDepth / 2);

          var storyHeight = ((CityConfig.MAX_STORY_HEIGHT - CityConfig.MIN_STORY_HEIGHT) * Math.random()) + CityConfig.MIN_STORY_HEIGHT;
          var buildingHeight = storyHeight * lot.stories + (lot.ySurface - lot.yFloor); 

          reusableBuildingMesh.scale.x = mapLotWidth * CityConfig.BLOCK_WIDTH;
          reusableBuildingMesh.position.x = sceneX + (CityConfig.BLOCK_WIDTH * mapLotXMidpoint);

          reusableBuildingMesh.scale.y = buildingHeight;
          reusableBuildingMesh.position.y = (buildingHeight / 2) + lot.yFloor;

          reusableBuildingMesh.scale.z = mapLotDepth * CityConfig.BLOCK_WIDTH;
          reusableBuildingMesh.position.z = sceneZ + (CityConfig.BLOCK_DEPTH * mapLotZMidpoint);

          reusableBuildingMesh.updateMatrix();

          materialIndex = Math.floor(Math.random() * CityConfig.MAX_BUILDING_MATERIALS);
          buildingGeometries[materialIndex].merge(reusableBuildingMesh.geometry, reusableBuildingMesh.matrix);
        
          if (lot.stories > 25 && (Math.random() < 0.3)) {
            var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 4));
            cylinder.position.x = sceneX + (CityConfig.BLOCK_WIDTH * mapLotXMidpoint);
            cylinder.position.y = lot.yFloor + buildingHeight + 5;
            cylinder.position.z = sceneZ + (CityConfig.BLOCK_DEPTH * mapLotZMidpoint);
            cylinder.updateMatrix();
            buildingGeometries[materialIndex].merge(cylinder.geometry, cylinder.matrix);
          }
        });
      }
    }
  };


  var sceneBuilder = {};

  sceneBuilder.build = function(terrain, buildings) {
    var masterStartTime = new Date();

    var scene = new THREE.Scene();

    var terrainStartTime = new Date();
    var terrainMeshes = buildTerrainGeometry(terrain);
    terrainMeshes.forEach(function(terrainMesh) {
      scene.add(terrainMesh);
    });
    var terrainEndTime = new Date();

    var roadStartTime = new Date();
    scene.add(buildRoadGeometry(terrain));
    var roadEndTime = new Date();

    var buildingsStartTime = new Date();
    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();

    generateBuildingGeometries(buildings, buildingGeometries);

    for (var i = 0; i < CityConfig.MAX_BUILDING_MATERIALS; i++) {
      scene.add(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
    }
    var buildingsEndTime = new Date();

    var masterEndTime = new Date();
    console.log("Time to generate scene geometry: " + (masterEndTime - masterStartTime) + "ms");
    console.log("  Terrain:   " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Roads:     " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Buildings: " + (buildingsEndTime - buildingsStartTime) + "ms");

    return scene;
  };

  return sceneBuilder;
};

"use strict";

var City = function() {
  var COLOR_GROUND = 0xaaaaaa;

  var city = {};

  CityConfig.BLOCK_LAYOUTS = [
    [ { left:     0.0,  right: 1.0,  top: 0.0,  bottom: 1.0, } ],


    [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom:  1.0 },
      { left:     0.5,  right: 1.0,  top: 0.0,  bottom:  1.0 } ],


    [ { left:     0.0,  right: 1.0,  top: 0.0,  bottom: 0.5 },
      { left:     0.0,  right: 1.0,  top: 0.5,  bottom: 1.0 } ],


    [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom: 1.0 },
      { left:     0.5,  right: 1.0,  top: 0.0,  bottom: 0.5 },
      { left:     0.5,  right: 1.0,  top: 0.5,  bottom: 1.0 } ],


    [ { left:     0.0,  right: 0.5,  top: 0.0,  bottom: 0.5, },
      { left:     0.5,  right: 1.0,  top: 0.0,  bottom: 0.5, },
      { left:     0.0,  right: 0.5,  top: 0.5,  bottom: 1.0, },
      { left:     0.5,  right: 1.0,  top: 0.5,  bottom: 1.0, } ],


    [ { left:     0.0,  right: (1 / 3),  top: 0.0,  bottom:  0.5 },
      { left: (1 / 3),  right: (2 / 3),  top: 0.0,  bottom:  0.5 },
      { left: (2 / 3),  right:     1.0,  top: 0.0,  bottom:  0.5 },
      { left:     0.0,  right:     0.5,  top: 0.5,  bottom: 1.0 },
      { left:     0.5,  right:     1.0,  top: 0.5,  bottom: 1.0 } ],


    [ { left:     0.0,  right: 0.25,  top: 0.0,    bottom:  (1/3), },
      { left:     0.75, right: 1.0,   top: 0.0,    bottom:  (1/3), },
      { left:     0.0,  right: 0.25,  top: (2/3),  bottom:  1.0, },
      { left:     0.75, right: 1.0,   top: (2/3),  bottom:  1.0, },

      { left:     0.0, right: 0.25,   top: (1/3),  bottom:  0.5, },
      { left:     0.0, right: 0.25,   top:   0.5,  bottom:  (2/3), },
      { left:     0.75, right: 1.0,   top: (1/3),  bottom:  0.5, },
      { left:     0.75, right: 1.0,   top:   0.5,  bottom:  (2/3), },

      { left:     0.25,   right: 0.4167,  top: 0.0,  bottom:  0.5, },
      { left:     0.4167, right: 0.5834,  top: 0.0,  bottom:  0.5, },
      { left:     0.5834, right: 0.75,    top: 0.0,  bottom:  0.5, },
      { left:     0.25,   right: 0.4167,  top: 0.5,  bottom:  1.0, },
      { left:     0.4167, right: 0.5834,  top: 0.5,  bottom:  1.0, },
      { left:     0.5834, right: 0.75,    top: 0.5,  bottom:  1.0, }, ],
  ];

  city.buildScene = function(terrain) {
    var scene = new THREE.Scene();

    var terrainMeshes = buildTerrainGeometry(terrain);
    terrainMeshes.forEach(function(terrainMesh) {
      scene.add(terrainMesh);
    });

    //scene.add(buildGroundGeometry());
    scene.add(buildRoadGeometry(terrain));

    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();

    var unitBlocks = generateUnitBlocks(terrain);

    generateSceneBlocks(unitBlocks, buildingGeometries);

    for (var i = 0; i < CityConfig.MAX_BUILDING_MATERIALS; i++) {
      scene.add(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
    }

    return scene;
  };

  var mapXToSceneX = function(mapX) {
    var cartesianMapX = mapX - (CityConfig.BLOCK_COLUMNS / 2);

    return (cartesianMapX * CityConfig.BLOCK_WIDTH) + (cartesianMapX * CityConfig.STREET_WIDTH);
  };

  var mapZToSceneZ = function(mapZ) {
    var cartesianMapZ = mapZ - (CityConfig.BLOCK_ROWS / 2);

    return (cartesianMapZ * CityConfig.BLOCK_DEPTH) + (cartesianMapZ * CityConfig.STREET_DEPTH);
  };

  var buildGroundGeometry = function() {
    var groundMaterial = new THREE.MeshBasicMaterial({ color: COLOR_GROUND, });
    var groundGeometry = new THREE.Mesh(new THREE.PlaneGeometry(CityConfig.TOTAL_SCENE_WIDTH * 25, CityConfig.TOTAL_SCENE_DEPTH * 25), groundMaterial);
    groundGeometry.rotation.x = -(Math.PI / 2);

    return groundGeometry;
  };

  var buildRoadGeometry = function(terrain) {
    var mapX, mapZ, sceneX, sceneZ;

    var roadMaterial = new THREE.MeshBasicMaterial({ color: COLOR_GROUND, });
    var roadGeometry = new THREE.Geometry();
    var roadSegment;

    var reusableIntersectionMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityConfig.STREET_WIDTH, CityConfig.STREET_DEPTH), roadMaterial);
    reusableIntersectionMesh.rotation.x = -(Math.PI / 2);

    for (mapX = 0; mapX <= CityConfig.BLOCK_ROWS; mapX++) {
      for (mapZ = 0; mapZ <= CityConfig.BLOCK_COLUMNS; mapZ++) {
        sceneX = mapXToSceneX(mapX);
        sceneZ = mapZToSceneZ(mapZ);

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
        roadSegment.position.z = sceneZ + (CityConfig.STREET_DEPTH / 2) + (CityConfig.BLOCK_DEPTH / 2);
        roadSegment.updateMatrix();
        roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);


        // East/West road segment
        if (mapX < CityConfig.BLOCK_ROWS) {
          var west = terrain.heightAtCoordinates(mapX, mapZ);
          var east = terrain.heightAtCoordinates(mapX + 1, mapZ);
          var midpoint = (west + east) / 2;
          var angle = Math.atan2((west - east), CityConfig.BLOCK_WIDTH);

          var segmentLength = Math.sqrt(Math.pow((east - west), 2) + Math.pow(CityConfig.BLOCK_WIDTH, 2));

          roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(segmentLength, CityConfig.STREET_WIDTH), roadMaterial);
          roadSegment.position.x = sceneX + (CityConfig.STREET_WIDTH / 2) + (CityConfig.BLOCK_WIDTH / 2);
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

    for (mapX = 0; mapX < CityConfig.BLOCK_ROWS; mapX++) {
      for (mapZ = 0; mapZ < CityConfig.BLOCK_COLUMNS; mapZ++) {
        sceneX_Left = mapXToSceneX(mapX);
        sceneX_Right = sceneX_Left + CityConfig.BLOCK_WIDTH + CityConfig.STREET_WIDTH;
        sceneZ_Top = mapZToSceneZ(mapZ);
        sceneZ_Bottom = sceneZ_Top + CityConfig.BLOCK_DEPTH + CityConfig.STREET_DEPTH;

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


  var generateUnitBlocks = function(terrain) {
    var blocks = [];
    var block;
    var mapX, mapZ;
    var buildingHeight, buildingBottom, buildingMinimumHeight;

    for (mapX = 0; mapX < CityConfig.BLOCK_ROWS; mapX++) {
      blocks[mapX] = [];

      for (mapZ = 0; mapZ < CityConfig.BLOCK_COLUMNS; mapZ++) {
        var blockLayout = CityConfig.BLOCK_LAYOUTS[Math.floor(Math.random() * CityConfig.BLOCK_LAYOUTS.length)];

        var blockTerrainCoordinates = [
          terrain.heightAtCoordinates(mapX, mapZ),
          terrain.heightAtCoordinates(mapX + 1, mapZ),
          terrain.heightAtCoordinates(mapX, mapZ + 1),
          terrain.heightAtCoordinates(mapX + 1, mapZ + 1),
        ];
        var minimumTerrainHeight = Math.min(...blockTerrainCoordinates);
        var maximumTerrainHeight = Math.max(...blockTerrainCoordinates);

        block = [];
        blockLayout.forEach(function(lot) {
          buildingHeight = calculateBuildingHeight(mapX, mapZ) + maximumTerrainHeight;
          buildingMinimumHeight = maximumTerrainHeight + CityConfig.MIN_BUILDING_HEIGHT;
          buildingBottom = minimumTerrainHeight;

          block.push({
            left: lot.left,
            right: lot.right,
            top: lot.top,
            bottom: lot.bottom,
            yFloor: buildingBottom,
            yMinimumHeight: buildingMinimumHeight,
            yTargetHeight: buildingHeight,
          });
        });

        blocks[mapX][mapZ] = block;
      }
    }

    console.log(blocks);
    return blocks;
  };

  var generateSceneBlocks = function(unitBlocks, buildingGeometries) {
    var mapX, mapZ, sceneX, sceneZ;
    var block;
    var materialIndex;

    var reusableBuildingMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

    for (mapX = 0; mapX < unitBlocks.length; mapX++) {
      for (mapZ = 0; mapZ < unitBlocks[mapX].length; mapZ++) {
        sceneX = mapXToSceneX(mapX) + (CityConfig.STREET_WIDTH / 2);
        sceneZ = mapZToSceneZ(mapZ) + (CityConfig.STREET_DEPTH / 2);

        block = unitBlocks[mapX][mapZ];

        block.forEach(function(lot) {
          var unitWidth = lot.right - lot.left;
          var unitDepth = lot.bottom - lot.top;
          var xUnitMid = lot.left + (unitWidth / 2);
          var zUnitMid = lot.top + (unitDepth / 2);

          reusableBuildingMesh.scale.x = unitWidth * CityConfig.BLOCK_WIDTH;
          reusableBuildingMesh.position.x = sceneX + (CityConfig.BLOCK_WIDTH * xUnitMid);

          reusableBuildingMesh.scale.y = Math.max(lot.yMinimumHeight, (Math.random() * lot.yTargetHeight) + CityConfig.MIN_BUILDING_HEIGHT);
          reusableBuildingMesh.position.y = (reusableBuildingMesh.scale.y / 2) + lot.yFloor;

          reusableBuildingMesh.scale.z = unitDepth * CityConfig.BLOCK_WIDTH;
          reusableBuildingMesh.position.z = sceneZ + (CityConfig.BLOCK_DEPTH * zUnitMid);

          reusableBuildingMesh.updateMatrix();

          materialIndex = Math.floor(Math.random() * CityConfig.MAX_BUILDING_MATERIALS);
          buildingGeometries[materialIndex].merge(reusableBuildingMesh.geometry, reusableBuildingMesh.matrix);
        });
      }
    }
  };

  var calculateBuildingHeight = function(x, z) {
    var squareRootOfMaxBuildingHeight = Math.pow(CityConfig.MAX_BUILDING_HEIGHT, (1/12));

    var halfRows = CityConfig.BLOCK_ROWS / 2;
    var halfColumns = CityConfig.BLOCK_COLUMNS / 2;

    var multiplierX = squareRootOfMaxBuildingHeight * ((halfRows - Math.abs(halfRows - x)) / halfRows);
    var multiplierZ = squareRootOfMaxBuildingHeight * ((halfColumns - Math.abs(halfColumns - z)) / halfColumns);
    var multiplier = Math.min(multiplierX, multiplierZ);

    return Math.pow(multiplier, 12);
  };

  return city;
};

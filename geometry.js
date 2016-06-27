"use strict";

var City = function() {
  var COLOR_GROUND = 0xaaaaaa;

  var city = {};

  city.STREET_WIDTH = 3;
  city.STREET_DEPTH = 3;
  city.BLOCK_WIDTH = 8;
  city.BLOCK_DEPTH = 8;
  city.BLOCK_ROWS = 4;
  city.BLOCK_COLUMNS = 4;
  city.MIN_BUILDING_HEIGHT = 1.2;
  city.MAX_BUILDING_HEIGHT = 40;
  city.MAX_BUILDING_MATERIALS = 50;
  city.TOTAL_SCENE_WIDTH = (city.BLOCK_WIDTH * city.BLOCK_ROWS) + (city.STREET_WIDTH * (city.BLOCK_ROWS - 1));
  city.HALF_SCENE_WIDTH = city.TOTAL_SCENE_WIDTH / 2;
  city.TOTAL_SCENE_DEPTH = (city.BLOCK_DEPTH * city.BLOCK_COLUMNS) + (city.STREET_DEPTH * (city.BLOCK_COLUMNS - 1));
  city.HALF_SCENE_DEPTH = city.TOTAL_SCENE_DEPTH / 2;

  city.BLOCK_LAYOUTS = [
    [ { width:     1.0,  depth: 1.0,  offsetFromBlockCenterX:      0.0,  offsetFromBlockCenterZ:  0.0 } ],

    [ { width:     0.5,  depth: 1.0,  offsetFromBlockCenterX:     -0.5,  offsetFromBlockCenterZ:  0.0 },
      { width:     0.5,  depth: 1.0,  offsetFromBlockCenterX:      0.5,  offsetFromBlockCenterZ:  0.0 } ],

    [ { width:     1.0,  depth: 0.5,  offsetFromBlockCenterX:      0.0,  offsetFromBlockCenterZ: -0.5 },
      { width:     1.0,  depth: 0.5,  offsetFromBlockCenterX:      0.0,  offsetFromBlockCenterZ:  0.5 } ],

    [ { width:     0.5,  depth: 1.0,  offsetFromBlockCenterX:     -0.5,  offsetFromBlockCenterZ:  0.0 },
      { width:     0.5,  depth: 0.5,  offsetFromBlockCenterX:      0.5,  offsetFromBlockCenterZ: -0.5 },
      { width:     0.5,  depth: 0.5,  offsetFromBlockCenterX:      0.5,  offsetFromBlockCenterZ:  0.5 } ],

    [ { width:     0.5,  depth: 0.5,  offsetFromBlockCenterX:     -0.5,  offsetFromBlockCenterZ: -0.5 },
      { width:     0.5,  depth: 0.5,  offsetFromBlockCenterX:     -0.5,  offsetFromBlockCenterZ:  0.5 },
      { width:     0.5,  depth: 0.5,  offsetFromBlockCenterX:      0.5,  offsetFromBlockCenterZ: -0.5 },
      { width:     0.5,  depth: 0.5,  offsetFromBlockCenterX:      0.5,  offsetFromBlockCenterZ:  0.5 } ],

    [ { width: (1 / 3),  depth: 0.5,  offsetFromBlockCenterX: -(2 / 3),  offsetFromBlockCenterZ:  0.5 },
      { width: (1 / 3),  depth: 0.5,  offsetFromBlockCenterX:      0.0,  offsetFromBlockCenterZ:  0.5 },
      { width: (1 / 3),  depth: 0.5,  offsetFromBlockCenterX:  (2 / 3),  offsetFromBlockCenterZ:  0.5 },
      { width:     0.5,  depth: 0.5,  offsetFromBlockCenterX:     -0.5,  offsetFromBlockCenterZ: -0.5 },
      { width:     0.5,  depth: 0.5,  offsetFromBlockCenterX:      0.5,  offsetFromBlockCenterZ: -0.5 } ],
  ];

  city.buildScene = function() {
    var scene = new THREE.Scene();

    scene.add(buildGroundGeometry());

    var terrainCoordinates = buildTerrainCoordinates();

    var terrainMeshes = buildTerrainGeometry(terrainCoordinates);
    terrainMeshes.forEach(function(terrainMesh) {
      scene.add(terrainMesh);
    });

    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();

    // Loop through the lower left corner of each block
    var x, z;
    for (x = -(city.HALF_SCENE_WIDTH); x < city.HALF_SCENE_WIDTH - (city.BLOCK_WIDTH + city.STREET_WIDTH); x += city.BLOCK_WIDTH + city.STREET_WIDTH) {
      for (z = -(city.HALF_SCENE_DEPTH); z < city.HALF_SCENE_DEPTH; z += city.BLOCK_DEPTH + city.STREET_DEPTH) {
        generateBlock(x, z, terrainCoordinates, buildingGeometries);
      }
    }

    for (var i = 0; i < city.MAX_BUILDING_MATERIALS; i++) {
      scene.add(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
    }

    return scene;
  };

  var buildGroundGeometry = function() {
    var groundMaterial = new THREE.MeshBasicMaterial({ color: COLOR_GROUND, });
    var groundGeometry = new THREE.Mesh(new THREE.PlaneGeometry(city.TOTAL_SCENE_WIDTH * 25, city.TOTAL_SCENE_DEPTH * 25), groundMaterial);
    groundGeometry.rotation.x = -(Math.PI / 2);

    return groundGeometry;
  };

  var buildTerrainCoordinates = function() {
    var MAX_HEIGHT = 4;
    var i, j, x, z;


    // Generate unit coordinates
    var terrainCoordinates = [];
    for (x = 0; x <= city.BLOCK_ROWS; x++) {
      terrainCoordinates[x] = [];

      for (z = 0; z <= city.BLOCK_COLUMNS; z++) {
        terrainCoordinates[x][z] = Math.floor(Math.random() * MAX_HEIGHT);
      }
    }
    console.log(terrainCoordinates);


    // Convert the unit coordinates to scene coordinates
    var sceneTerrainCoordinates = [];
    x = -city.HALF_SCENE_WIDTH;
    for (i = 0; i <= city.BLOCK_ROWS; i++) {
      sceneTerrainCoordinates[x] = [];
      z = -city.HALF_SCENE_DEPTH;

      for (j = 0; j <= city.BLOCK_COLUMNS; j++) {
        sceneTerrainCoordinates[x][z] = terrainCoordinates[i][j];
      
        z += city.BLOCK_DEPTH + city.STREET_DEPTH;
      }

      x += city.BLOCK_WIDTH + city.STREET_WIDTH;
    }

    console.log(sceneTerrainCoordinates);

    return sceneTerrainCoordinates;
  }

  var buildTerrainGeometry = function(terrainCoordinates) {
    var x, z;
    var terrainGeometry1 = new THREE.Geometry();
    var terrainGeometry2 = new THREE.Geometry();
    var terrainMaterial1 = new THREE.MeshLambertMaterial({ color: new THREE.Color(0, 200, 0) });
    var terrainMaterial2 = new THREE.MeshLambertMaterial({ color: new THREE.Color(255, 25, 0) });

    var triangle, v1, v2, v3;
    for (x = -(city.HALF_SCENE_WIDTH); x < city.HALF_SCENE_WIDTH - (city.BLOCK_WIDTH + city.STREET_WIDTH); x += city.BLOCK_WIDTH + city.STREET_WIDTH) {
      for (z = -(city.HALF_SCENE_DEPTH); z < city.HALF_SCENE_DEPTH; z += city.BLOCK_DEPTH + city.STREET_DEPTH) {
        triangle = new THREE.Geometry();
        v1 = new THREE.Vector3(x, terrainCoordinates[x][z], z);
        v2 = new THREE.Vector3(x, terrainCoordinates[x][z + city.BLOCK_DEPTH + city.STREET_DEPTH], z + city.BLOCK_DEPTH + city.STREET_DEPTH);
        v3 = new THREE.Vector3(x + city.BLOCK_WIDTH + city.STREET_WIDTH, terrainCoordinates[x + city.BLOCK_WIDTH + city.STREET_WIDTH][z], z);

        triangle.vertices.push(v1);
        triangle.vertices.push(v2);
        triangle.vertices.push(v3);

        triangle.faces.push(new THREE.Face3(0, 1, 2));
        triangle.computeFaceNormals();

        terrainGeometry1.merge(triangle);

        triangle = new THREE.Geometry();
        v1 = new THREE.Vector3(x, terrainCoordinates[x][z + city.BLOCK_DEPTH + city.STREET_DEPTH], z + city.BLOCK_DEPTH + city.STREET_DEPTH);
        v2 = new THREE.Vector3(x + city.BLOCK_WIDTH + city.STREET_WIDTH, terrainCoordinates[x + city.BLOCK_WIDTH + city.STREET_WIDTH][z + city.BLOCK_DEPTH + city.STREET_DEPTH], z + city.BLOCK_DEPTH + city.STREET_DEPTH);
        v3 = new THREE.Vector3(x + city.BLOCK_WIDTH + city.STREET_WIDTH, terrainCoordinates[x + city.BLOCK_WIDTH + city.STREET_WIDTH][z], z);

        triangle.vertices.push(v1);
        triangle.vertices.push(v2);
        triangle.vertices.push(v3);

        triangle.faces.push(new THREE.Face3(0, 1, 2));
        triangle.computeFaceNormals();

        terrainGeometry2.merge(triangle);
      }
    }

    var mesh1 = new THREE.Mesh(terrainGeometry1, terrainMaterial1);
    var mesh2 = new THREE.Mesh(terrainGeometry2, terrainMaterial2);

    return [mesh1, mesh2];
  };

  var buildMaterials = function() {
    var buildingMaterials = [];

    for (var i = 0; i < city.MAX_BUILDING_MATERIALS; i++) {
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

    for (var i = 0; i < city.MAX_BUILDING_MATERIALS; i++) {
      buildingGeometries.push(new THREE.Geometry());
    }

    return buildingGeometries;
  };

  var generateBlock = function(x, z, terrainCoordinates, buildingGeometries) {
    var i, lotLayout, buildingHeight, building;
    var blockLayout = city.BLOCK_LAYOUTS[Math.floor(Math.random() * city.BLOCK_LAYOUTS.length)];

    var terrainCoordinates = [
                              terrainCoordinates[x][z],
                              terrainCoordinates[x + city.BLOCK_WIDTH + city.STREET_WIDTH][z],
                              terrainCoordinates[x][z + city.BLOCK_DEPTH + city.STREET_DEPTH],
                              terrainCoordinates[x + city.BLOCK_WIDTH + city.STREET_WIDTH][z + city.BLOCK_DEPTH + city.STREET_DEPTH],
                             ];
    var minimumTerrainHeight = Math.min(...terrainCoordinates);
    var maximumTerrainHeight = Math.max(...terrainCoordinates);

    for (i = 0; i < blockLayout.length; i++) {
      lotLayout = blockLayout[i];
      buildingHeight = calculateBuildingHeight(x, z);
      building = generateBuilding(x, minimumTerrainHeight, maximumTerrainHeight, buildingHeight, z, lotLayout);

      var materialIndex = Math.floor(Math.random() * city.MAX_BUILDING_MATERIALS);
      buildingGeometries[materialIndex].merge(building.geometry, building.matrix);
    }
  };

  var calculateBuildingHeight = function(x, z) {
    var squareRootOfMaxBuildingHeight = Math.sqrt(city.MAX_BUILDING_HEIGHT);

    var multiplierX = squareRootOfMaxBuildingHeight * ((city.HALF_SCENE_WIDTH - Math.abs(x)) / city.HALF_SCENE_WIDTH);
    var multiplierZ = squareRootOfMaxBuildingHeight * ((city.HALF_SCENE_DEPTH - Math.abs(z)) / city.HALF_SCENE_DEPTH);
    var multiplier = Math.min(multiplierX, multiplierZ);

    return multiplier * multiplier;
  };

  var generateBuilding = function(x, minY, maxY, maxAboveGroundHeight, z, lotLayout) {
    var building = new THREE.Mesh(new THREE.BoxGeometry(lotLayout.width * city.BLOCK_WIDTH, 1, lotLayout.depth * city.BLOCK_WIDTH));

    building.position.x = x + city.BLOCK_WIDTH / 2 + ((city.BLOCK_WIDTH / 2) * lotLayout.offsetFromBlockCenterX);
    building.scale.y =  (Math.random() * maxAboveGroundHeight) + city.MIN_BUILDING_HEIGHT + (maxY - minY);
    building.position.y = (building.scale.y / 2) + minY;
    building.position.z = z + city.BLOCK_DEPTH / 2 + ((city.BLOCK_DEPTH / 2) * lotLayout.offsetFromBlockCenterZ);
    building.updateMatrix();

    return building;
  };

  return city;
};

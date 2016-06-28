"use strict";

var Terrain = function() {
  var CityConfig = {
    BLOCK_ROWS:    64,
    BLOCK_COLUMNS: 64,
  };

  var buildTerrainCoordinates = function() {
    var MAX_HEIGHT = 6;
    var i, j;

    var terrainCoordinates = [];
    for (i = 0; i <= CityConfig.BLOCK_ROWS; i++) {
      terrainCoordinates[i] = [];

      for (j = 0; j <= CityConfig.BLOCK_COLUMNS; j++) {
        terrainCoordinates[i][j] = 0.0;
      }
    }

    // Initial randomization of corners
    terrainCoordinates[0][0] = Math.floor(Math.random() * MAX_HEIGHT);
    terrainCoordinates[0][CityConfig.BLOCK_COLUMNS] = Math.floor(Math.random() * MAX_HEIGHT);
    terrainCoordinates[CityConfig.BLOCK_ROWS][0] = Math.floor(Math.random() * MAX_HEIGHT);
    terrainCoordinates[CityConfig.BLOCK_ROWS][CityConfig.BLOCK_COLUMNS] = Math.floor(Math.random() * MAX_HEIGHT);

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    midpointDisplace(terrainCoordinates, 20, 0.65, 0, CityConfig.BLOCK_ROWS, CityConfig.BLOCK_COLUMNS, 0);

    // Clamp negative heights to 0
    for (i = 0; i <= CityConfig.BLOCK_ROWS; i++) {
      for (j = 0; j <= CityConfig.BLOCK_COLUMNS; j++) {
        terrainCoordinates[i][j] = Math.max(0.0, terrainCoordinates[i][j]);
      }
    }

    console.log(terrainCoordinates);

    return terrainCoordinates;
  };

  // Adapted from http://stevelosh.com/blog/2016/02/midpoint-displacement/
  var midpointDisplace = function(terrainCoordinates, jitterAmount, jitterDecay, top, right, bottom, left) {
    var topLeft = terrainCoordinates[top][left];
    var topRight = terrainCoordinates[top][right];
    var bottomLeft = terrainCoordinates[bottom][left];
    var bottomRight = terrainCoordinates[bottom][right];

    var midY = top + ((bottom - top) / 2);
    var midX = left + ((right - left) / 2);

    var jitter;

    // Left column
    jitter = (Math.random() * jitterAmount) - (jitterAmount / 2);
    terrainCoordinates[midY][left] = ((topLeft + bottomLeft) / 2) + jitter;
    // Right column
    jitter = (Math.random() * jitterAmount) - (jitterAmount / 2);
    terrainCoordinates[midY][right] = ((topRight + bottomRight) / 2) + jitter;
    // Top row
    jitter = (Math.random() * jitterAmount) - (jitterAmount / 2);
    terrainCoordinates[top][midX] = ((topLeft + bottomLeft) / 2) + jitter;
    // Bottom row
    jitter = (Math.random() * jitterAmount) - (jitterAmount / 2);
    terrainCoordinates[bottom][midX] = ((topLeft + bottomLeft) / 2) + jitter;

    // Middle
    var middleAverage = (terrainCoordinates[midY][left] + terrainCoordinates[midY][right] + terrainCoordinates[top][midX] + terrainCoordinates[bottom][midX]) / 4
    terrainCoordinates[midY][midX] = middleAverage;

    if ((midY - top) >= 2) {
      midpointDisplace(terrainCoordinates, (jitterAmount * jitterDecay), jitterDecay, top, midX, midY, left);
      midpointDisplace(terrainCoordinates, (jitterAmount * jitterDecay), jitterDecay, top, right, midY, midX);
      midpointDisplace(terrainCoordinates, (jitterAmount * jitterDecay), jitterDecay, midY, midX, bottom, left);
      midpointDisplace(terrainCoordinates, (jitterAmount * jitterDecay), jitterDecay, midY, right, bottom, midX);
    }
  };

  var terrainCoordinates = buildTerrainCoordinates();

  var terrain = {};

  terrain.coordinates = function() { return terrainCoordinates; };

  return terrain;
};

var City = function() {
  var COLOR_GROUND = 0xaaaaaa;

  var city = {};

  city.STREET_WIDTH = 3;
  city.STREET_DEPTH = 3;
  city.BLOCK_WIDTH = 8;
  city.BLOCK_DEPTH = 8;
  city.BLOCK_ROWS = 64;
  city.BLOCK_COLUMNS = 64;
  city.MIN_BUILDING_HEIGHT = 1.2;
  city.MAX_BUILDING_HEIGHT = 40;
  city.MAX_BUILDING_MATERIALS = 50;
  city.TOTAL_SCENE_WIDTH = (city.BLOCK_WIDTH * city.BLOCK_ROWS) + (city.STREET_WIDTH * (city.BLOCK_ROWS - 1));
  city.HALF_SCENE_WIDTH = city.TOTAL_SCENE_WIDTH / 2;
  city.TOTAL_SCENE_DEPTH = (city.BLOCK_DEPTH * city.BLOCK_COLUMNS) + (city.STREET_DEPTH * (city.BLOCK_COLUMNS - 1));
  city.HALF_SCENE_DEPTH = city.TOTAL_SCENE_DEPTH / 2;

  city.BLOCK_LAYOUTS = [
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
  ];

  city.buildScene = function(terrain) {
    var scene = new THREE.Scene();

    var terrainMeshes = buildTerrainGeometry(terrain.coordinates());
    terrainMeshes.forEach(function(terrainMesh) {
      scene.add(terrainMesh);
    });

    //scene.add(buildGroundGeometry());
    scene.add(buildRoadGeometry(terrain.coordinates()));

    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();

    var unitBlocks = generateUnitBlocks(terrain.coordinates());

    generateSceneBlocks(unitBlocks, buildingGeometries);

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

  var buildRoadGeometry = function(terrainCoordinates) {
    var i, j, x, z;

    var roadMaterial = new THREE.MeshBasicMaterial({ color: COLOR_GROUND, });
    var roadGeometry = new THREE.Geometry();
    var roadSegment;

    x = -city.HALF_SCENE_WIDTH - (city.STREET_WIDTH / 2);
    for (i = 0; i <= city.BLOCK_ROWS; i++) {
      z = -city.HALF_SCENE_DEPTH - (city.STREET_DEPTH / 2);

      for (j = 0; j <= city.BLOCK_COLUMNS; j++) {
        // Road intersection
        roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(city.STREET_WIDTH, city.STREET_DEPTH), roadMaterial);
        roadSegment.position.x = x;
        roadSegment.rotation.x = -(Math.PI / 2);
        roadSegment.position.y = terrainCoordinates[i][j];
        roadSegment.position.z = z;
        roadSegment.updateMatrix();
        roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);


        // North/South road segment
        var north = terrainCoordinates[i][j];
        var south = terrainCoordinates[i][j + 1];
        var midpoint = (north + south) / 2;
        var angle = -Math.atan2(city.BLOCK_DEPTH, (north - south));

        var segmentLength = Math.sqrt(Math.pow((south - north), 2) + Math.pow(city.BLOCK_DEPTH, 2));

        roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(city.STREET_WIDTH, segmentLength), roadMaterial);
        roadSegment.position.x = x;
        roadSegment.rotation.x = angle;
        roadSegment.position.y = midpoint;
        roadSegment.position.z = z + (city.STREET_DEPTH / 2) + (city.BLOCK_DEPTH / 2);
        roadSegment.updateMatrix();
        roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);


        // East/West road segment
        if (i < city.BLOCK_ROWS) {
          var west = terrainCoordinates[i][j];
          var east = terrainCoordinates[i + 1][j];
          var midpoint = (west + east) / 2;
          var angle = Math.atan2((west - east), city.BLOCK_WIDTH);

          var segmentLength = Math.sqrt(Math.pow((east - west), 2) + Math.pow(city.BLOCK_WIDTH, 2));

          roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(segmentLength, city.STREET_WIDTH), roadMaterial);
          roadSegment.position.x = x + (city.STREET_WIDTH / 2) + (city.BLOCK_WIDTH / 2);
          roadSegment.rotation.x = -(Math.PI / 2);
          roadSegment.position.y = midpoint;
          roadSegment.rotation.y = angle;
          roadSegment.position.z = z;
          roadSegment.updateMatrix();
          roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);
        }


        z += city.BLOCK_DEPTH + city.STREET_DEPTH;
      }

      x += city.BLOCK_WIDTH + city.STREET_WIDTH;
    }


    return new THREE.Mesh(roadGeometry, roadMaterial);
  };

  var buildTerrainGeometry = function(terrainCoordinates) {
    var i, j, x, z;
    var terrainGeometry1 = new THREE.Geometry();
    var terrainGeometry2 = new THREE.Geometry();
    var terrainMaterial1 = new THREE.MeshLambertMaterial({ color: new THREE.Color(0, 200, 0) });
    var terrainMaterial2 = new THREE.MeshLambertMaterial({ color: new THREE.Color(255, 25, 0) });

    var triangle, v1, v2, v3;

    x = -city.HALF_SCENE_WIDTH - (city.STREET_WIDTH / 2);
    for (i = 0; i < city.BLOCK_ROWS; i++) {
      z = -city.HALF_SCENE_DEPTH - (city.STREET_DEPTH / 2);

      for (j = 0; j < city.BLOCK_COLUMNS; j++) {
        triangle = new THREE.Geometry();

        v1 = new THREE.Vector3(x, terrainCoordinates[i][j], z);
        v2 = new THREE.Vector3(x, terrainCoordinates[i][j + 1], z + city.BLOCK_DEPTH + city.STREET_DEPTH);
        v3 = new THREE.Vector3(x + city.BLOCK_WIDTH + city.STREET_WIDTH, terrainCoordinates[i + 1][j], z);

        triangle.vertices.push(v1);
        triangle.vertices.push(v2);
        triangle.vertices.push(v3);

        triangle.faces.push(new THREE.Face3(0, 1, 2));
        triangle.computeFaceNormals();

        terrainGeometry1.merge(triangle);

        triangle = new THREE.Geometry();
        v1 = new THREE.Vector3(x, terrainCoordinates[i][j + 1], z + city.BLOCK_DEPTH + city.STREET_DEPTH);
        v2 = new THREE.Vector3(x + city.BLOCK_WIDTH + city.STREET_WIDTH, terrainCoordinates[i + 1][j + 1], z + city.BLOCK_DEPTH + city.STREET_DEPTH);
        v3 = new THREE.Vector3(x + city.BLOCK_WIDTH + city.STREET_WIDTH, terrainCoordinates[i + 1][j], z);

        triangle.vertices.push(v1);
        triangle.vertices.push(v2);
        triangle.vertices.push(v3);

        triangle.faces.push(new THREE.Face3(0, 1, 2));
        triangle.computeFaceNormals();

        terrainGeometry2.merge(triangle);

        z += city.BLOCK_DEPTH + city.STREET_DEPTH;
      }

      x += city.BLOCK_WIDTH + city.STREET_WIDTH;
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


  var generateUnitBlocks = function(terrainCoordinates) {
    var blocks = [];
    var block;
    var i, j, l;
    var lotLayout, buildingHeight, buildingBottom;

    for (i = 0; i < city.BLOCK_ROWS; i++) {
      blocks[i] = [];

      for (j = 0; j < city.BLOCK_COLUMNS; j++) {
        var blockLayout = city.BLOCK_LAYOUTS[Math.floor(Math.random() * city.BLOCK_LAYOUTS.length)];

        var blockTerrainCoordinates = [
          terrainCoordinates[i][j],
          terrainCoordinates[i + 1][j],
          terrainCoordinates[i][j + 1],
          terrainCoordinates[i + 1][j + 1],
        ];
        var minimumTerrainHeight = Math.min(...blockTerrainCoordinates);
        var maximumTerrainHeight = Math.max(...blockTerrainCoordinates);

        block = [];
        for (l = 0; l < blockLayout.length; l++) {
          lotLayout = blockLayout[l];
          buildingHeight = calculateBuildingHeight(i, j) + (maximumTerrainHeight - minimumTerrainHeight);
          buildingBottom = minimumTerrainHeight;

          block.push({
            left: lotLayout.left,
            right: lotLayout.right,
            top: lotLayout.top,
            bottom: lotLayout.bottom,
            yMin: buildingBottom,
            yMax: buildingHeight,
          });
        }

        blocks[i][j] = block;
      }
    }

    console.log(blocks);
    return blocks;
  };

  var generateSceneBlocks = function(unitBlocks, buildingGeometries) {
    var i, j, b, x, z;
    var block;
    var unitBuilding, building, materialIndex;
    var maxAboveGroundHeight = 5;

    x = -city.HALF_SCENE_WIDTH;
    for (i = 0; i < unitBlocks.length; i++) {
      z = -city.HALF_SCENE_DEPTH;

      for (j = 0; j < unitBlocks[i].length; j++) {
        block = unitBlocks[i][j];

        for (b = 0; b < block.length; b++) {
          unitBuilding = block[b];

          var unitWidth = unitBuilding.right - unitBuilding.left;
          var unitDepth = unitBuilding.bottom - unitBuilding.top;
          var xUnitMid = unitBuilding.left + (unitWidth / 2);
          var zUnitMid = unitBuilding.top + (unitDepth / 2);

          building = new THREE.Mesh(new THREE.BoxGeometry(unitWidth * city.BLOCK_WIDTH, 1, unitDepth * city.BLOCK_WIDTH));

          building.position.x = x + (city.BLOCK_WIDTH * xUnitMid);
          building.scale.y = (Math.random() * unitBuilding.yMax) + city.MIN_BUILDING_HEIGHT;
          building.position.y = (building.scale.y / 2) + unitBuilding.yMin;
          building.position.z = z + (city.BLOCK_DEPTH * zUnitMid);
          building.updateMatrix();

          materialIndex = Math.floor(Math.random() * city.MAX_BUILDING_MATERIALS);
          buildingGeometries[materialIndex].merge(building.geometry, building.matrix);
        }

        z += city.BLOCK_DEPTH + city.STREET_DEPTH;
      }

      x += city.BLOCK_WIDTH + city.STREET_WIDTH;
    }
  };

  var calculateBuildingHeight = function(i, j) {
    var squareRootOfMaxBuildingHeight = Math.pow(city.MAX_BUILDING_HEIGHT, (1/12));

    var halfRows = city.BLOCK_ROWS / 2;
    var halfColumns = city.BLOCK_COLUMNS / 2;

    var multiplierX = squareRootOfMaxBuildingHeight * ((halfRows - Math.abs(halfRows - i)) / halfRows);
    var multiplierZ = squareRootOfMaxBuildingHeight * ((halfColumns - Math.abs(halfColumns - j)) / halfColumns);
    var multiplier = Math.min(multiplierX, multiplierZ);

    return Math.pow(multiplier, 12);
  };

  return city;
};

var City = function() {
  var city = {};

  city.STREET_WIDTH = 2;
  city.STREET_DEPTH = 2;
  city.BLOCK_WIDTH = 4;
  city.BLOCK_DEPTH = 4;
  city.BLOCK_ROWS = 60;
  city.BLOCK_COLUMNS = 20;
  city.MIN_BUILDING_HEIGHT = 0.5;
  city.MAX_BUILDING_HEIGHT = 20;
  city.MAX_BUILDING_MATERIALS = 50;
  city.TOTAL_SCENE_WIDTH = (city.BLOCK_WIDTH * city.BLOCK_ROWS) + (city.STREET_WIDTH * (city.BLOCK_ROWS - 1));
  city.HALF_SCENE_WIDTH = city.TOTAL_SCENE_WIDTH / 2;
  city.TOTAL_SCENE_DEPTH = (city.BLOCK_DEPTH * city.BLOCK_COLUMNS) + (city.STREET_DEPTH * (city.BLOCK_COLUMNS - 1));
  city.HALF_SCENE_DEPTH = city.TOTAL_SCENE_DEPTH / 2;

  city.BLOCK_LAYOUTS = [
                        [ { width: 1.0, depth: 1.0, offsetFromBlockCenterX: 0.0, offsetFromBlockCenterZ: 0.0 } ],
                        [ { width: 0.5, depth: 1.0, offsetFromBlockCenterX: -0.5, offsetFromBlockCenterZ: 0.0 },
                          { width: 0.5, depth: 1.0, offsetFromBlockCenterX: 0.5, offsetFromBlockCenterZ: 0.0 } ],
                        [ { width: 1.0, depth: 0.5, offsetFromBlockCenterX: 0.0, offsetFromBlockCenterZ: -0.5 },
                          { width: 1.0, depth: 0.5, offsetFromBlockCenterX: 0.0, offsetFromBlockCenterZ: 0.5 } ],
                        [ { width: 0.5, depth: 1.0, offsetFromBlockCenterX: -0.5, offsetFromBlockCenterZ: 0.0 },
                          { width: 0.5, depth: 0.5, offsetFromBlockCenterX: 0.5, offsetFromBlockCenterZ: -0.5},
                          { width: 0.5, depth: 0.5, offsetFromBlockCenterX: 0.5, offsetFromBlockCenterZ: 0.5} ],
                        [ { width: 0.5, depth: 0.5, offsetFromBlockCenterX: -0.5, offsetFromBlockCenterZ: -0.5 },
                          { width: 0.5, depth: 0.5, offsetFromBlockCenterX: -0.5, offsetFromBlockCenterZ: 0.5},
                          { width: 0.5, depth: 0.5, offsetFromBlockCenterX: 0.5, offsetFromBlockCenterZ: -0.5},
                          { width: 0.5, depth: 0.5, offsetFromBlockCenterX: 0.5, offsetFromBlockCenterZ: 0.5} ],
                        [ { width: (1 / 3), depth: 0.5, offsetFromBlockCenterX: -(2 / 3), offsetFromBlockCenterZ: 0.5 },
                          { width: (1 / 3), depth: 0.5, offsetFromBlockCenterX: 0.0, offsetFromBlockCenterZ: 0.5},
                          { width: (1 / 3), depth: 0.5, offsetFromBlockCenterX: (2 / 3), offsetFromBlockCenterZ: 0.5},
                          { width: 0.5, depth: 0.5, offsetFromBlockCenterX: -0.5, offsetFromBlockCenterZ: -0.5},
                          { width: 0.5, depth: 0.5, offsetFromBlockCenterX: 0.5, offsetFromBlockCenterZ: -0.5} ],
                      ];

  city.buildScene = function() {
    var scene = new THREE.Scene();

    scene.add(buildGroundGeometry());

    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();

    var x, z;

    // Loop through the lower left corner of each block
    for (x = -(city.HALF_SCENE_WIDTH); x < city.HALF_SCENE_WIDTH; x += city.BLOCK_WIDTH + city.STREET_WIDTH) {
      for (z = -(city.HALF_SCENE_DEPTH); z < city.HALF_SCENE_DEPTH; z += city.BLOCK_DEPTH + city.STREET_DEPTH) {

        var layoutIndex, lotLayout, buildingHeight, building;
        var blockLayout = city.BLOCK_LAYOUTS[Math.floor(Math.random() * city.BLOCK_LAYOUTS.length)];
        for (layoutIndex = 0; layoutIndex < blockLayout.length; layoutIndex++) {
          lotLayout = blockLayout[layoutIndex];
          buildingHeight = calculateBuildingHeight(x, z);
          building = generateBuilding(x, buildingHeight, z, lotLayout);

          var index = Math.floor(Math.random() * city.MAX_BUILDING_MATERIALS);
          THREE.GeometryUtils.merge(buildingGeometries[index], building);
        }
      }
    }

    for (var i = 0; i < city.MAX_BUILDING_MATERIALS; i++) {
      scene.add(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
    }

    return scene;
  };

  var buildGroundGeometry = function() {
    var groundMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    var groundGeometry = new THREE.Mesh(new THREE.PlaneGeometry(city.TOTAL_SCENE_WIDTH * 25, city.TOTAL_SCENE_DEPTH * 25), groundMaterial);
    groundGeometry.rotation.x = -(Math.PI / 2);

    return groundGeometry;
  };

  var buildMaterials = function() {
    var buildingMaterials = [];

    for (var i = 0; i < city.MAX_BUILDING_MATERIALS; i++) {
      var r = Math.random();
      var g = r;
      var b = r;
      var buildingColor = new THREE.Color(0xffffff).setRGB(r, g, b);

      buildingMaterials.push(new THREE.MeshLambertMaterial({ color: buildingColor.getHex() }));
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

  var calculateBuildingHeight = function(x, z) {
    var maxHeightX = city.MAX_BUILDING_HEIGHT * ((city.HALF_SCENE_WIDTH - Math.abs(x)) / city.HALF_SCENE_WIDTH);
    var maxHeightZ = city.MAX_BUILDING_HEIGHT * ((city.HALF_SCENE_DEPTH - Math.abs(z)) / city.HALF_SCENE_DEPTH);
    var maxHeight = Math.min(maxHeightX, maxHeightZ);
    //var buildingHeight = Math.floor((Math.random() * maxHeight - city.MIN_BUILDING_HEIGHT)) + city.MIN_BUILDING_HEIGHT;

    return maxHeight;
  };

  var generateBuilding = function(x, maxY, z, lotLayout) {
    var building = new THREE.Mesh(new THREE.BoxGeometry(lotLayout.width * city.BLOCK_WIDTH, 1, lotLayout.depth * city.BLOCK_WIDTH));

    building.position.x = x + city.BLOCK_WIDTH / 2 + ((city.BLOCK_WIDTH / 2) * lotLayout.offsetFromBlockCenterX);
    building.scale.y =  (Math.random() * maxY) + city.MIN_BUILDING_HEIGHT;
    building.position.y = building.scale.y / 2;
    building.position.z = z + city.BLOCK_DEPTH / 2 + ((city.BLOCK_DEPTH / 2) * lotLayout.offsetFromBlockCenterZ);

    return building;
  };

  return city;
};

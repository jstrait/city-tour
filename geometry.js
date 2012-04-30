var LOT_WIDTH = 1;
var LOT_DEPTH = 1;
var STREET_WIDTH = 2;
var STREET_DEPTH = 2;
var BLOCK_WIDTH = 4;
var BLOCK_DEPTH = 4;
var BLOCK_ROWS = 60;
var BLOCK_COLUMNS = 20;
var MIN_BUILDING_HEIGHT = 0.5;
var MAX_BUILDING_HEIGHT = 20;
var MAX_BUILDING_MATERIALS = 50;
var TOTAL_SCENE_WIDTH = (BLOCK_WIDTH * BLOCK_ROWS) + (STREET_WIDTH * (BLOCK_ROWS - 1));
var HALF_SCENE_WIDTH = TOTAL_SCENE_WIDTH / 2;
var TOTAL_SCENE_DEPTH = (BLOCK_DEPTH * BLOCK_COLUMNS) + (STREET_DEPTH * (BLOCK_COLUMNS - 1));
var HALF_SCENE_DEPTH = TOTAL_SCENE_DEPTH / 2;

function buildScene() {
  scene = new THREE.Scene();
  
  var originMaterial = new THREE.MeshLambertMaterial({ color: 0xf32920 });
  var origin = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), originMaterial);
  scene.add(origin);

  var groundMaterial = new THREE.MeshBasicMaterial({ color: 0x777777 });
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(TOTAL_SCENE_WIDTH * 5, TOTAL_SCENE_DEPTH * 5), groundMaterial);
  ground.rotation.x = -(Math.PI / 2);
  scene.add(ground);

  var buildingMaterials = [];
  var buildingGeometries = [];
  for (var i = 0; i < MAX_BUILDING_MATERIALS; i++) {
    var r = Math.random();
    var g = Math.random();
    var b = Math.random();
    var buildingColor = new THREE.Color(0xffffff);
    buildingColor.setRGB(r, g, b);

    buildingMaterials.push(new THREE.MeshLambertMaterial({ color: buildingColor.getHex() }));
    buildingGeometries.push(new THREE.Geometry());
  }

  var BLOCK_LAYOUTS = [
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

  // Loop through the lower left corner of each block
  for (var i = -(HALF_SCENE_WIDTH); i < HALF_SCENE_WIDTH; i += BLOCK_WIDTH + STREET_WIDTH) {
    for (var j = -(HALF_SCENE_DEPTH); j < HALF_SCENE_DEPTH; j += BLOCK_DEPTH + STREET_DEPTH) {

      var building;
      var blockLayout = BLOCK_LAYOUTS[Math.floor(Math.random() * BLOCK_LAYOUTS.length)];
      for (var layoutIndex = 0; layoutIndex < blockLayout.length; layoutIndex++) {
        var lotLayout = blockLayout[layoutIndex];
        var maxHeightI = MAX_BUILDING_HEIGHT * ((HALF_SCENE_WIDTH - Math.abs(i)) / HALF_SCENE_WIDTH);
        var maxHeightJ = MAX_BUILDING_HEIGHT * ((HALF_SCENE_DEPTH - Math.abs(j)) / HALF_SCENE_DEPTH);
        var maxHeight = Math.min(maxHeightI, maxHeightJ);
        var buildingHeight = Math.floor((Math.random() * maxHeight - MIN_BUILDING_HEIGHT)) + MIN_BUILDING_HEIGHT;

        building = new THREE.Mesh(new THREE.CubeGeometry(lotLayout.width * BLOCK_WIDTH, 1, lotLayout.depth * BLOCK_WIDTH));
      
        building.position.x = i + BLOCK_WIDTH / 2 + ((BLOCK_WIDTH / 2) * lotLayout.offsetFromBlockCenterX);
        building.scale.y =  (Math.random() * maxHeight) + MIN_BUILDING_HEIGHT;
        building.position.y = building.scale.y / 2;
        building.position.z = j + BLOCK_DEPTH / 2 + ((BLOCK_DEPTH / 2) * lotLayout.offsetFromBlockCenterZ);

        var index = Math.floor(Math.random() * MAX_BUILDING_MATERIALS);
        THREE.GeometryUtils.merge(buildingGeometries[index], building); 
      }
    }
  }

  for (var i = 0; i < MAX_BUILDING_MATERIALS; i++) {
    scene.add(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
  }
}

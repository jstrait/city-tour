function City() {
  this.LOT_WIDTH = 1;
  this.LOT_DEPTH = 1;
  this.STREET_WIDTH = 2;
  this.STREET_DEPTH = 2;
  this.BLOCK_WIDTH = 4;
  this.BLOCK_DEPTH = 4;
  this.BLOCK_ROWS = 60;
  this.BLOCK_COLUMNS = 20;
  this.MIN_BUILDING_HEIGHT = 0.5;
  this.MAX_BUILDING_HEIGHT = 20;
  this.MAX_BUILDING_MATERIALS = 50;
  this.TOTAL_SCENE_WIDTH = (this.BLOCK_WIDTH * this.BLOCK_ROWS) + (this.STREET_WIDTH * (this.BLOCK_ROWS - 1));
  this.HALF_SCENE_WIDTH = this.TOTAL_SCENE_WIDTH / 2;
  this.TOTAL_SCENE_DEPTH = (this.BLOCK_DEPTH * this.BLOCK_COLUMNS) + (this.STREET_DEPTH * (this.BLOCK_COLUMNS - 1));
  this.HALF_SCENE_DEPTH = this.TOTAL_SCENE_DEPTH / 2;

  this.BLOCK_LAYOUTS = [
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
}

City.prototype.buildScene = function() {
  var scene = new THREE.Scene();

  var groundMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(this.TOTAL_SCENE_WIDTH * 25, this.TOTAL_SCENE_DEPTH * 25), groundMaterial);
  ground.rotation.x = -(Math.PI / 2);
  scene.add(ground);

  var buildingMaterials = this.buildMaterials();
  var buildingGeometries = this.buildGeometries();
  
  // Loop through the lower left corner of each block
  for (var i = -(this.HALF_SCENE_WIDTH); i < this.HALF_SCENE_WIDTH; i += this.BLOCK_WIDTH + this.STREET_WIDTH) {
    for (var j = -(this.HALF_SCENE_DEPTH); j < this.HALF_SCENE_DEPTH; j += this.BLOCK_DEPTH + this.STREET_DEPTH) {

      var building;
      var blockLayout = this.BLOCK_LAYOUTS[Math.floor(Math.random() * this.BLOCK_LAYOUTS.length)];
      for (var layoutIndex = 0; layoutIndex < blockLayout.length; layoutIndex++) {
        var lotLayout = blockLayout[layoutIndex];
        var maxHeightI = this.MAX_BUILDING_HEIGHT * ((this.HALF_SCENE_WIDTH - Math.abs(i)) / this.HALF_SCENE_WIDTH);
        var maxHeightJ = this.MAX_BUILDING_HEIGHT * ((this.HALF_SCENE_DEPTH - Math.abs(j)) / this.HALF_SCENE_DEPTH);
        var maxHeight = Math.min(maxHeightI, maxHeightJ);
        var buildingHeight = Math.floor((Math.random() * maxHeight - this.MIN_BUILDING_HEIGHT)) + this.MIN_BUILDING_HEIGHT;

        var building = this.generateBuilding(i, maxHeight, j, lotLayout);

        var index = Math.floor(Math.random() * this.MAX_BUILDING_MATERIALS);
        THREE.GeometryUtils.merge(buildingGeometries[index], building); 
      }
    }
  }

  for (var i = 0; i < this.MAX_BUILDING_MATERIALS; i++) {
    scene.add(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
  }

  return scene;
}

City.prototype.buildMaterials = function() {
  var buildingMaterials = [];

  for (var i = 0; i < this.MAX_BUILDING_MATERIALS; i++) {
    var r = Math.random();
    var g = r;
    var b = r;
    var buildingColor = new THREE.Color(0xffffff).setRGB(r, g, b);

    buildingMaterials.push(new THREE.MeshLambertMaterial({ color: buildingColor.getHex() }));
  }

  return buildingMaterials;
}

City.prototype.buildGeometries = function() {
  var buildingGeometries = [];

  for (var i = 0; i < this.MAX_BUILDING_MATERIALS; i++) {
    buildingGeometries.push(new THREE.Geometry());
  }

  return buildingGeometries;
}

City.prototype.generateBuilding = function(x, maxY, z, lotLayout) {
  var building = new THREE.Mesh(new THREE.CubeGeometry(lotLayout.width * this.BLOCK_WIDTH, 1, lotLayout.depth * this.BLOCK_WIDTH));

  building.position.x = x + this.BLOCK_WIDTH / 2 + ((this.BLOCK_WIDTH / 2) * lotLayout.offsetFromBlockCenterX);
  building.scale.y =  (Math.random() * maxY) + this.MIN_BUILDING_HEIGHT;
  building.position.y = building.scale.y / 2;
  building.position.z = z + this.BLOCK_DEPTH / 2 + ((this.BLOCK_DEPTH / 2) * lotLayout.offsetFromBlockCenterZ);

  return building;
}


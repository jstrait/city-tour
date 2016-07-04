"use strict";

var renderer, scene, camera;

var CityConfig = (function() {
  var config = {};

  config.STREET_WIDTH = 3;
  config.STREET_DEPTH = 3;
  config.BLOCK_WIDTH = 8;
  config.BLOCK_DEPTH = 8;
  config.BLOCK_AND_STREET_WIDTH = config.BLOCK_WIDTH + config.STREET_WIDTH;
  config.BLOCK_AND_STREET_DEPTH = config.BLOCK_DEPTH + config.STREET_DEPTH;
  config.BLOCK_ROWS = 64;
  config.BLOCK_COLUMNS = 64;
  config.HALF_BLOCK_ROWS = config.BLOCK_ROWS / 2;
  config.HALF_BLOCK_COLUMNS = config.BLOCK_COLUMNS / 2;
  config.TERRAIN_ROWS = 128;
  config.TERRAIN_COLUMNS = 128;
  config.HALF_TERRAIN_ROWS = config.TERRAIN_ROWS / 2;
  config.HALF_TERRAIN_COLUMNS = config.TERRAIN_COLUMNS / 2;
  config.MIN_STORY_HEIGHT = 1.2;
  config.MAX_STORY_HEIGHT = 1.5;
  config.MAX_BUILDING_MATERIALS = 50;
  config.TOTAL_SCENE_WIDTH = (config.BLOCK_WIDTH * config.BLOCK_COLUMNS) + (config.STREET_WIDTH * (config.BLOCK_COLUMNS - 1));
  config.HALF_SCENE_WIDTH = config.TOTAL_SCENE_WIDTH / 2;
  config.TOTAL_SCENE_DEPTH = (config.BLOCK_DEPTH * config.BLOCK_ROWS) + (config.STREET_DEPTH * (config.BLOCK_ROWS - 1));
  config.HALF_SCENE_DEPTH = config.TOTAL_SCENE_DEPTH / 2;

  return config;
})();

var Coordinates = (function() {
  var HALF_COLUMNS = CityConfig.BLOCK_COLUMNS / 2;
  var HALF_ROWS = CityConfig.BLOCK_ROWS / 2;

  var coordinates = {};

  coordinates.mapXToSceneX = function(mapX) {
    return mapX * CityConfig.BLOCK_AND_STREET_WIDTH;
  };

  coordinates.mapZToSceneZ = function(mapZ) {
    return mapZ * CityConfig.BLOCK_AND_STREET_DEPTH;
  };

  coordinates.sceneXToMapX = function(sceneX) {
    return sceneX / CityConfig.BLOCK_AND_STREET_WIDTH;
  };

  coordinates.sceneZToMapZ = function(sceneZ) {
    return sceneZ / CityConfig.BLOCK_AND_STREET_DEPTH;
  };

  return coordinates;
})();

function detectWebGL() {
  if (!window.WebGLRenderingContext) {
    return false;
  }

  // Adapted from https://github.com/Modernizr/Modernizr/blob/master/feature-detects/webgl-extensions.js
  var canvas = document.createElement('canvas');
  var webgl_context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (webgl_context === null) {
    return false;
  }

  return true;
}

function initScene($container, terrain, buildings) {
  var WIDTH = $container.width(), HEIGHT = $container.height();

  // Build renderer
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1)
  renderer.setClearColor(0x66ccff, 1);

  $container.append(renderer.domElement);

  var sceneBuilder = new SceneBuilder();
  scene = sceneBuilder.build(terrain, buildings);

  // Build camera
  var VIEW_ANGLE = 45, ASPECT = WIDTH / HEIGHT, NEAR = 0.1, FAR = 10000;
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  camera.lookAt(scene.position);

  var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  light.position.set( 0, 500, 0 );
  scene.add(light);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(-1, 0.9, 0.9);
  scene.add(directionalLight);

  renderer.render(scene, camera);
}

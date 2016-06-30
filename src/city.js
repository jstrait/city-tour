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
    var cartesianMapX = mapX - HALF_COLUMNS;
    return cartesianMapX * CityConfig.BLOCK_AND_STREET_WIDTH;
  };

  coordinates.mapZToSceneZ = function(mapZ) {
    var cartesianMapZ = mapZ - HALF_ROWS;
    return cartesianMapZ * CityConfig.BLOCK_AND_STREET_DEPTH;
  };

  coordinates.sceneXToMapX = function(sceneX) {
    var cartesianMapX = sceneX / CityConfig.BLOCK_AND_STREET_WIDTH;
    return cartesianMapX + HALF_COLUMNS;
  };

  coordinates.sceneZToMapZ = function(sceneZ) {
    var cartesianMapZ = sceneZ / CityConfig.BLOCK_AND_STREET_DEPTH;
    return cartesianMapZ + HALF_ROWS;
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
  camera.position.x = 0;
  camera.position.y = 8;
  camera.position.z = CityConfig.HALF_SCENE_DEPTH;

  // Build light sources
  addPointLight(scene, 0, 0, 100000);
  addPointLight(scene, 0, 0, -100000);
  addPointLight(scene, -10000, 20, -10000);
  addPointLight(scene, 10000, 20, -10000);
  addPointLight(scene, 10000, 20, 10000);
  addPointLight(scene, -10000, 20, 10000);

  renderer.render(scene, camera);
}

function addPointLight(scene, x, y, z) {
  var pointLight = new THREE.PointLight(0xffffff);
  pointLight.position.x = x;
  pointLight.position.y = y;
  pointLight.position.z = z;

  scene.add(pointLight);
}

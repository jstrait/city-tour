"use strict";

var renderer, scene, camera;
var city;

var CityConfig = (function() {
  var config = {};

  config.STREET_WIDTH = 3;
  config.STREET_DEPTH = 3;
  config.BLOCK_WIDTH = 8;
  config.BLOCK_DEPTH = 8;
  config.BLOCK_ROWS = 64;
  config.BLOCK_COLUMNS = 64;
  config.MIN_BUILDING_HEIGHT = 1.2;
  config.MAX_BUILDING_HEIGHT = 40;
  config.MAX_BUILDING_MATERIALS = 50;
  config.TOTAL_SCENE_WIDTH = (config.BLOCK_WIDTH * config.BLOCK_ROWS) + (config.STREET_WIDTH * (config.BLOCK_ROWS - 1));
  config.HALF_SCENE_WIDTH = config.TOTAL_SCENE_WIDTH / 2;
  config.TOTAL_SCENE_DEPTH = (config.BLOCK_DEPTH * config.BLOCK_COLUMNS) + (config.STREET_DEPTH * (config.BLOCK_COLUMNS - 1));
  config.HALF_SCENE_DEPTH = config.TOTAL_SCENE_DEPTH / 2;

  return config;
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

function initScene($container, terrain) {
  var WIDTH = $container.width(), HEIGHT = $container.height();

  // Build renderer
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1)
  renderer.setClearColor(0x66ccff, 1);

  $container.append(renderer.domElement);

  city = new City();
  scene = city.buildScene(terrain);

  // Build camera
  var VIEW_ANGLE = 45, ASPECT = WIDTH / HEIGHT, NEAR = 0.1, FAR = 10000;
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  camera.lookAt(scene.position);
  camera.position.x = 0;
  camera.position.y = 8;
  camera.position.z = CityConfig.HALF_SCENE_DEPTH + 22;

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

var renderer, scene, camera;
var city;

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

function initScene($container) {
  var WIDTH = $container.width(), HEIGHT = $container.height();

  // Build renderer
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(WIDTH, HEIGHT);

  $container.append(renderer.domElement);
  
  city = new City();
  scene = city.buildScene();

  // Build camera
  var VIEW_ANGLE = 45, ASPECT = WIDTH / HEIGHT, NEAR = 0.1, FAR = 10000;
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  camera.lookAt(scene.position);
  camera.position.x = 0;
  camera.position.y = 5;
  camera.position.z = city.HALF_SCENE_DEPTH + 90;

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

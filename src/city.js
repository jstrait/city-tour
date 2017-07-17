"use strict";

var CityTour = CityTour || {};

CityTour.Coordinates = (function() {
  var coordinates = {};

  coordinates.mapXToSceneX = function(mapX) {
    return mapX * CityTour.Config.BLOCK_AND_STREET_WIDTH;
  };

  coordinates.mapZToSceneZ = function(mapZ) {
    return mapZ * CityTour.Config.BLOCK_AND_STREET_DEPTH;
  };

  coordinates.sceneXToMapX = function(sceneX) {
    return sceneX / CityTour.Config.BLOCK_AND_STREET_WIDTH;
  };

  coordinates.sceneZToMapZ = function(sceneZ) {
    return sceneZ / CityTour.Config.BLOCK_AND_STREET_DEPTH;
  };

  return coordinates;
})();


CityTour.RenderView = function(container, scene) {
  var renderer, poleCamera;

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

  poleCamera = new CityTour.PoleCamera(scene.position);
  scene.add(poleCamera.pole());

  var resize = function() {
    var width = container.clientWidth;
    var height = container.clientHeight;

    var camera = poleCamera.camera();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    render();
  };

  var render = function() {
    renderer.render(scene, poleCamera.camera());
  };

  var setScene = function(newScene) {
    scene = newScene;
    poleCamera = new CityTour.PoleCamera(scene.position);
    scene.add(poleCamera.pole());
  };

  var renderView = {};

  renderView.render = render;
  renderView.resize = resize;
  renderView.setScene = setScene;
  renderView.domElement = function() { return renderer.domElement; };
  renderView.poleCamera = function() { return poleCamera; };

  return renderView;
};


CityTour.City = function(container) {
  var scene, timer, animationManager;
  var renderView;

  var detectWebGL = function() {
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
  };

  var generateWorldData = function() {
    var config = {
      terrain: {
        heightJitter: 20,
        heightJitterDecay: 0.65,
        probabilityOfRiver: (2 / 3),
      },
      roadNetwork: {
        safeFromDecayPercentage: 0.4,
      },
      zonedBlocks: {
        percentageDistanceDecayBegins: 0.4,
        maxBuildingStories: 40,
      },
    };

    return CityTour.WorldGenerator.generate(config);
  };

  var init = function(onComplete) {
    if (!detectWebGL()) {
      document.getElementById("loading-message").innerText = "This page is not compatible with your browser, because it requires WebGL.";
      return;
    }

    var masterStartTime = new Date();
    var masterEndTime;

    // Generate abstract terrain, road network, building representations
    var worldData = generateWorldData();

    var sceneBuilder = new CityTour.Scene.Builder();
    scene = sceneBuilder.build(worldData.terrain, worldData.roadNetwork, worldData.buildings);

    renderView = new CityTour.RenderView(container, scene);
    renderView.resize();

    timer = new CityTour.Timer();
    animationManager = new CityTour.AnimationManager(worldData.terrain, worldData.roadNetwork, renderView.poleCamera());
    timer.onTick = function(frameCount) {
      animationManager.tick(frameCount);
      renderView.render();
    }

    var SWOOP_DISTANCE_IN_BLOCKS = 20;
    var furthestOutIntersection = worldData.centerZ + CityTour.Config.HALF_BLOCK_ROWS;
    while (!worldData.roadNetwork.hasIntersection(worldData.centerX, furthestOutIntersection)) {
      furthestOutIntersection -= 1;
    }

    var initialXPosition = worldData.centerX * CityTour.Config.BLOCK_AND_STREET_WIDTH;
    var initialYPosition = 40;
    var initialZPosition = (furthestOutIntersection + SWOOP_DISTANCE_IN_BLOCKS) * CityTour.Config.BLOCK_AND_STREET_DEPTH;
    var initialXRotation = 0.0;
    var initialYRotation = 0.0;
    animationManager.init(worldData.centerX, furthestOutIntersection, initialXPosition, initialYPosition, initialZPosition, initialXRotation, initialYRotation);

    timer.onTick(1);
    container.appendChild(renderView.domElement());

    timer.start();
    masterEndTime = new Date();
    console.log("Time to generate world+scene: " + (masterEndTime - masterStartTime) + "ms");

    onComplete();
  };

  var resize = function() {
    renderView.resize();
  };

  var togglePause = function() {
    timer.togglePause();
  };

  var toggleDebug = function() {
    animationManager.toggleDebug();
  }

  var city = {};

  city.init = init;
  city.resize = resize;
  city.togglePause = togglePause;
  city.toggleDebug = toggleDebug;

  return city;
};

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
    var GENERATE_BUILDINGS = true;
    var PROBABILITY_OF_RIVER = 2 / 3;

    var combinedStartTime = new Date();

    var terrainConfig = {
      heightJitter: 20,
      heightJitterDecay: 0.65,
      river: (Math.random() < PROBABILITY_OF_RIVER),
    };

    var terrainStartTime = new Date();
    var terrain = CityTour.TerrainGenerator.generate(CityTour.Config.TERRAIN_COLUMNS, CityTour.Config.TERRAIN_ROWS, terrainConfig);
    var terrainEndTime = new Date();

    var centerX = 0, centerZ = 0;
    while(terrain.materialAtCoordinates(centerX, centerZ) != CityTour.Terrain.LAND) {
      centerZ -= 1;
    }

    var roadConfig = {
      centerMapX: centerX,
      centerMapZ: centerZ,
      safeFromDecayPercentage: 0.4,
    };

    var roadStartTime = new Date();
    var roadNetwork = CityTour.RoadNetworkGenerator.generate(terrain, roadConfig);
    var roadEndTime = new Date();

    var zonedBlockConfig = {
      percentageDistanceDecayBegins: 0.4,
      maxBuildingStories: 40,
    };

    var zonedBlocksStartTime = new Date();
    var zonedBlocks = (GENERATE_BUILDINGS) ? CityTour.ZonedBlockGenerator.generate(terrain, roadNetwork, centerX, centerZ, zonedBlockConfig) : false;
    var zonedBlocksEndTime = new Date();
    var buildingsStartTime = new Date();
    var buildings = (GENERATE_BUILDINGS) ? CityTour.BuildingsGenerator.generate(terrain, zonedBlocks) : false;
    var buildingsEndTime = new Date();

    var combinedEndTime = new Date();

    console.log("Time to generate world data: " + (combinedEndTime - combinedStartTime) + "ms");
    console.log("  Terrain:      " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Road Network: " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Lots:         " + (zonedBlocksEndTime - zonedBlocksStartTime) + "ms");
    console.log("  Buildings:    " + (buildingsEndTime - buildingsStartTime) + "ms");

    return {
      terrain: terrain,
      roadNetwork: roadNetwork,
      buildings: buildings,
      centerX: centerX,
      centerZ: centerZ,
    };
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
    animationManager.init(worldData.centerX, worldData.centerZ); 

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

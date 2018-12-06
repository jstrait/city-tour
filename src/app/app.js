"use strict";

var CityTour = CityTour || {};


CityTour.App = (function() {
  var EMPTY_TERRAIN = CityTour.Terrain([[]], 1);
  var EMPTY_WORLD_DATA = {
    terrain: EMPTY_TERRAIN,
    roadNetwork: CityTour.RoadNetwork(EMPTY_TERRAIN),
    buildings: [],
    centerX: undefined,
    centerZ: undefined,
  };

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

  var showLoadFailureMessage = function() {
    var loadingMessage = document.getElementById("loading-message");
    loadingMessage.innerText = "This site is not compatible with your browser, because it requires WebGL.";
    loadingMessage.classList.add("flex");
    loadingMessage.classList.remove("display-none");
  };

  var init = function() {
    if (!detectWebGL()) {
      showLoadFailureMessage();
      return;
    }

    var container = document.getElementById("container");

    var messageBroker = new CityTour.MessageBroker();
    var cityConfigService = new CityTour.CityConfigService();
    var sceneView = new CityTour.SceneView(container, messageBroker);
    var mapCamera = new CityTour.MapCamera(sceneView, EMPTY_WORLD_DATA.terrain);
    var timerLoop = new CityTour.TimerLoop(EMPTY_WORLD_DATA, sceneView, mapCamera, messageBroker);
    var cityEditorController = new CityTour.CityEditorController(cityConfigService, messageBroker);
    var navigationController = new CityTour.NavigationController(sceneView, mapCamera, EMPTY_WORLD_DATA.terrain, timerLoop, messageBroker);
    var navigationTouchController = new CityTour.NavigationTouchController(sceneView, mapCamera, EMPTY_WORLD_DATA.terrain, messageBroker);

    container.appendChild(sceneView.domElement());

    var resetCity = function(data) {
      console.log("Starting city generation");
      var startTime = new Date();
      var endTime;
      var renderStartTime, renderEndTime;
      var newWorldData;

      // Replace old scene with mostly empty scene, to reclaim memory.
      // A device with limited memory (such as a phone) might have enough
      // memory to have a single city, but not two at once (which can
      // temporarily be the case while creating a new city).
      timerLoop.reset(EMPTY_WORLD_DATA);
      sceneView.reset(EMPTY_WORLD_DATA);
      mapCamera.setTerrain(EMPTY_WORLD_DATA.terrain);
      navigationController.setTerrain(EMPTY_WORLD_DATA.terrain);
      navigationTouchController.setTerrain(EMPTY_WORLD_DATA.terrain);

      // Now that old city's memory has been reclaimed, add new city
      newWorldData = CityTour.WorldGenerator.generate(cityConfigService.toWorldConfig());
      timerLoop.reset(newWorldData);
      sceneView.reset(newWorldData);
      mapCamera.setTerrain(newWorldData.terrain);
      navigationController.setTerrain(newWorldData.terrain);
      navigationTouchController.setTerrain(newWorldData.terrain);

      // Force the new scene to be rendered
      renderStartTime = new Date();
      sceneView.resize();
      renderEndTime = new Date();
      console.log("Time to perform initial render: " + (renderEndTime - renderStartTime) + "ms");

      endTime = new Date();
      console.log("City generation complete, total time: " + (endTime - startTime) + "ms");

      messageBroker.publish("generation.complete", {});
    };

    messageBroker.addSubscriber("generation.started", resetCity);

    resetCity();
  };


  return {
    init: init,
  };
})();

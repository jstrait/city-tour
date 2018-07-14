"use strict";

var CityTour = CityTour || {};


CityTour.App = (function() {
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
    var orbitalCamera = new CityTour.OrbitalCamera(messageBroker);
    var cityConfigService = new CityTour.CityConfigService();
    var initialWorldData = CityTour.WorldGenerator.generate(cityConfigService.toWorldConfig());
    var sceneView = new CityTour.SceneView(container, initialWorldData, messageBroker);
    var timerLoop = new CityTour.TimerLoop(initialWorldData, sceneView, orbitalCamera, messageBroker);
    var cityEditorController = new CityTour.CityEditorController(cityConfigService, messageBroker);
    var navigationController = new CityTour.NavigationController(orbitalCamera, timerLoop, messageBroker);
    var navigationTouchController = new CityTour.NavigationTouchController(sceneView, orbitalCamera, messageBroker);

    container.appendChild(sceneView.domElement());

    messageBroker.publish("generation.complete", {});

    messageBroker.addSubscriber("generation.started", function(data) {
      console.log("Starting city generation");
      var startTime = new Date();
      var endTime;

      var emptyTerrain = CityTour.Terrain([[]], 1);
      var emptyWorldData = {
        terrain: emptyTerrain,
        roadNetwork: CityTour.RoadNetwork(emptyTerrain),
        buildings: [],
        centerX: undefined,
        centerZ: undefined,
      };
      var newWorldData;

      // Replace old scene with mostly empty scene, to reclaim memory.
      // A device with limited memory (such as a phone) might have enough
      // memory to have a single city, but not two at once (which can
      // temporarily be the case while creating a new city).
      timerLoop.reset(emptyWorldData);
      sceneView.reset(emptyWorldData);

      // Now that old city's memory has been reclaimed, add new city
      newWorldData = CityTour.WorldGenerator.generate(cityConfigService.toWorldConfig());
      timerLoop.reset(newWorldData);
      sceneView.reset(newWorldData);

      endTime = new Date();
      console.log("City generation complete, total time: " + (endTime - startTime) + "ms");

      messageBroker.publish("generation.complete", {});
    });
  };


  return {
    init: init,
  };
})();

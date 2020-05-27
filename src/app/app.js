"use strict";

import { MessageBroker } from "./../message_broker";
import { RoadNetwork } from "./../road_network";
import { Terrain } from "./../terrain";

import { CityConfigService } from "./city_config_service";
import { CityEditorController } from "./city_editor_controller";
import { MapCamera } from "./map_camera";
import { NavigationController } from "./navigation_controller";
import { NavigationTouchController } from "./navigation_touch_controller";
import { SceneView } from "./scene_view";
import { TimerLoop } from "./timer_loop";

import { WorldGenerator } from "./../generators/world_generator";

var App = (function() {
  var EMPTY_TERRAIN = Terrain([[]], 1);
  var EMPTY_WORLD_DATA = {
    terrain: EMPTY_TERRAIN,
    roadNetwork: RoadNetwork(EMPTY_TERRAIN),
    buildings: [],
    neighborhoods: [],
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

  var init = function(gridTexture) {
    if (!detectWebGL()) {
      showLoadFailureMessage();
      return;
    }

    var container = document.getElementById("container");

    var messageBroker = new MessageBroker();
    var cityConfigService = new CityConfigService();
    var sceneView = new SceneView(document.documentElement, gridTexture);
    var mapCamera = new MapCamera(sceneView, EMPTY_WORLD_DATA.terrain, messageBroker);
    var timerLoop = new TimerLoop(EMPTY_WORLD_DATA, sceneView, mapCamera, messageBroker);
    var cityEditorController = new CityEditorController(cityConfigService, messageBroker);
    var navigationController = new NavigationController(sceneView, mapCamera, EMPTY_WORLD_DATA.terrain, timerLoop, messageBroker);
    var navigationTouchController = new NavigationTouchController(sceneView, mapCamera, EMPTY_WORLD_DATA.terrain, messageBroker);

    container.appendChild(sceneView.domElement());

    var resetCity = function(data) {
      console.log("Starting city generation");
      var startTime = new Date();
      var endTime;
      var renderStartTime, renderEndTime;
      var newWorldData;

      mapCamera.reset();

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
      newWorldData = WorldGenerator.generate(cityConfigService.toWorldConfig());
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


new THREE.TextureLoader().load("textures/grid.png", function(gridTexture) {
  App.init(gridTexture);
});

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

  var init = function() {
    var loadingMessage;
    if (!detectWebGL()) {
      loadingMessage = document.getElementById("loading-message");
      loadingMessage.innerText = "This site is not compatible with your browser, because it requires WebGL.";
      loadingMessage.classList.add("flex");
      loadingMessage.classList.remove("display-none");
      return;
    }

    var container = document.getElementById("container");

    var messageBroker = new CityTour.MessageBroker();
    var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
    var cityConfigService = new CityTour.CityConfigService();
    var initialWorldData = CityTour.WorldGenerator.generate(cityConfigService.toWorldConfig());
    var sceneView = new CityTour.SceneView(container, initialWorldData, messageBroker);
    var timerLoop = new CityTour.TimerLoop(initialWorldData, sceneView, interactiveCamera, messageBroker);
    var cityEditorController = new CityTour.CityEditorController(cityConfigService, messageBroker);
    var navigationController = new CityTour.NavigationController(interactiveCamera, timerLoop, messageBroker);
    var navigationTouchController = new CityTour.NavigationTouchController(sceneView.domElement(), interactiveCamera, messageBroker);

    container.appendChild(sceneView.domElement());

    messageBroker.publish("generation.complete", {});

    messageBroker.addSubscriber("generation.started", function(data) {
      var newWorldData = CityTour.WorldGenerator.generate(cityConfigService.toWorldConfig());

      timerLoop.reset(newWorldData);
      sceneView.reset(newWorldData);
      messageBroker.publish("generation.complete", {});
    });
  };


  return {
    init: init,
  };
})();

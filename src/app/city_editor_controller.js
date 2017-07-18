"use strict";

var CityTour = CityTour || {};

CityTour.CityEditorController = function(cityConfigService, sceneView, messageBroker) {
  var container = document.getElementById("city-editor-container");
  var editorToggleButton = document.getElementById("city-editor-toggle");
  var resetButton = document.getElementById("reset");

  var terrainJitter = document.getElementById("terrain-jitter");
  var heightJitterDecay = document.getElementById("terrain-decay");
  var includeRiver = document.getElementById("terrain-river");
  var safeFromDecayPercentage = document.getElementById("roads-decay-distance-percentage");
  var percentageDistanceDecayBegins = document.getElementById("buildings-decay-distance-percentage");
  var maxBuildingStories = document.getElementById("buildings-max-stories");

  var toggleCityEditor = function(e) {
    document.getElementById("city-editor").classList.toggle("display-none");
  };

  var reset = function(e) {
    sceneView.reset(cityConfigService.toWorldConfig());
  };

  var onFlythroughStarted = function(e) {
    container.classList.add("display-none");
  };

  var onFlythroughStopped = function(e) {
    container.classList.remove("display-none");
  };

  terrainJitter.addEventListener('change', function(e) { cityConfigService.setHeightJitter(parseInt(e.target.value)); }, false);
  heightJitterDecay.addEventListener('change', function(e) { cityConfigService.setHeightJitterDecay(parseFloat(e.target.value)); }, false);
  includeRiver.addEventListener('change', function(e) { cityConfigService.setIncludeRiver(e.target.checked); }, false);
  safeFromDecayPercentage.addEventListener('change', function(e) { cityConfigService.setSafeFromDecayPercentage(parseFloat(e.target.value)); }, false);
  percentageDistanceDecayBegins.addEventListener('change', function(e) { cityConfigService.setPercentageDistanceDecayBegins(parseFloat(e.target.value)); }, false);
  maxBuildingStories.addEventListener('change', function(e) { cityConfigService.setMaxBuildingStories(parseInt(e.target.value)); }, false);

  editorToggleButton.addEventListener('click', toggleCityEditor, false);
  resetButton.addEventListener('click', reset, false);

  var id1 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);
};

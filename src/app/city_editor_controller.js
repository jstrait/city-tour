"use strict";

var CityEditorController = function(cityConfigService, messageBroker) {
  var EDITOR_MENU = 1;
  var ABOUT_MENU = 2;

  var loadingMessage = document.getElementById("loading-message");
  var navigationControlsContainer = document.getElementById("navigation-controls-container");
  var container = document.getElementById("city-editor-container");
  var editorMenuTitle = document.getElementById("menu-editor-title");
  var aboutMenuTitle = document.getElementById("menu-about-title");
  var editorMenu = document.getElementById("menu-editor");
  var aboutMenu = document.getElementById("menu-about");
  var resetButton = document.getElementById("reset");

  var terrainJitter = document.getElementById("terrain-jitter");
  var heightJitterDecay = document.getElementById("terrain-decay");
  var hillCount = document.getElementById("terrain-hill-count");
  var maxHillHeight = document.getElementById("terrain-max-hill-height");
  var includeRiver = document.getElementById("terrain-river");
  var safeFromDecayBlocks = document.getElementById("roads-decay-distance-blocks");
  var blockDistanceDecayBegins = document.getElementById("buildings-decay-distance-blocks");
  var maxBuildingStories = document.getElementById("buildings-max-stories");
  var neighborhoodCount = document.getElementById("buildings-neighborhood-count");

  var currentMenu;

  var toggleEditMenu = function(e) {
    if (currentMenu === EDITOR_MENU) {
      currentMenu = undefined;
    }
    else {
      currentMenu = EDITOR_MENU;
    }

    render();
    e.stopPropagation();
  };

  var toggleAboutMenu = function(e) {
    if (currentMenu === ABOUT_MENU) {
      currentMenu = undefined;
    }
    else {
      currentMenu = ABOUT_MENU;
    }

    render();
    e.stopPropagation();
  };

  var reset = function(e) {
    currentMenu = undefined;
    loadingMessage.classList.add("flex");
    loadingMessage.classList.remove("display-none");
    render();

    // Allow DOM to update to show the "Loading..." message
    setTimeout(function() { messageBroker.publish("generation.started", {}); }, 1);
  };

  var resetPart2 = function() {
    loadingMessage.classList.remove("flex");
    loadingMessage.classList.add("display-none");
  };

  var onFlythroughStarted = function(e) {
    container.classList.add("display-none");
    currentMenu = undefined;
    render();
  };

  var onFlythroughStopped = function(e) {
    container.classList.remove("display-none");
  };

  var preventClickThru = function(e) {
    e.stopPropagation();
  };

  var hideMenus = function(e) {
    currentMenu = undefined;
    render();
  };

  var render = function() {
    container.classList.toggle("full-width", currentMenu !== undefined);
    container.classList.toggle("full-height", currentMenu !== undefined);

    navigationControlsContainer.classList.toggle("display-none", currentMenu !== undefined);

    editorMenuTitle.classList.toggle("menu-title-active", currentMenu === EDITOR_MENU);
    editorMenu.classList.toggle("display-none", currentMenu !== EDITOR_MENU);
    editorMenu.classList.toggle("inline-block", currentMenu === EDITOR_MENU);

    aboutMenuTitle.classList.toggle("menu-title-active", currentMenu === ABOUT_MENU);
    aboutMenu.classList.toggle("display-none", currentMenu !== ABOUT_MENU);
    aboutMenu.classList.toggle("inline-block", currentMenu === ABOUT_MENU);
  };

  terrainJitter.addEventListener("change", function(e) { cityConfigService.setHeightJitter(parseInt(e.target.value)); }, false);
  heightJitterDecay.addEventListener("change", function(e) { cityConfigService.setHeightJitterDecay(parseFloat(e.target.value)); }, false);
  hillCount.addEventListener("change", function(e) { cityConfigService.setHillCount(parseInt(e.target.value)); }, false);
  maxHillHeight.addEventListener("change", function(e) { cityConfigService.setMaxHillHeight(parseInt(e.target.value, 10)); }, false);
  includeRiver.addEventListener("change", function(e) { cityConfigService.setIncludeRiver(e.target.checked); }, false);
  safeFromDecayBlocks.addEventListener("change", function(e) { cityConfigService.setSafeFromDecayBlocks(parseInt(e.target.value, 10)); }, false);
  blockDistanceDecayBegins.addEventListener("change", function(e) { cityConfigService.setBlockDistanceDecayBegins(parseInt(e.target.value, 10)); }, false);
  maxBuildingStories.addEventListener("change", function(e) { cityConfigService.setMaxBuildingStories(parseInt(e.target.value)); }, false);
  neighborhoodCount.addEventListener("change", function(e) { cityConfigService.setNeighborhoodCount(parseInt(e.target.value)); }, false);

  container.addEventListener("click", hideMenus, false);
  editorMenuTitle.addEventListener("click", toggleEditMenu, false);
  aboutMenuTitle.addEventListener("click", toggleAboutMenu, false);
  editorMenu.addEventListener("click", preventClickThru, false);
  aboutMenu.addEventListener("click", preventClickThru, false);
  resetButton.addEventListener("click", reset, false);

  var id1 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);
  var id3 = messageBroker.addSubscriber("generation.complete", resetPart2);

  render();


  return {};
};

export { CityEditorController };

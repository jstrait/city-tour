"use strict";

const EDITOR_MENU = 1;
const ABOUT_MENU = 2;

var MenusController = function(cityConfigService, messageBroker) {
  var menusContainer = document.getElementById("menus-container");

  // "New City" menu
  var editorMenuTitle = document.getElementById("menu-editor-title");
  var editorMenu = document.getElementById("menu-editor");
  var terrainJitter = document.getElementById("terrain-jitter");
  var heightJitterDecay = document.getElementById("terrain-decay");
  var hillCount = document.getElementById("terrain-hill-count");
  var maxHillHeight = document.getElementById("terrain-max-hill-height");
  var includeRiver = document.getElementById("terrain-river");
  var maxBuildingStories = document.getElementById("buildings-max-stories");
  var neighborhoodCount = document.getElementById("buildings-neighborhood-count");
  var resetButton = document.getElementById("reset");

  // "About" menu
  var aboutMenuTitle = document.getElementById("menu-about-title");
  var aboutMenu = document.getElementById("menu-about");

  // Non menu bar elements
  var loadingMessage = document.getElementById("loading-message");
  var navigationControlsContainer = document.getElementById("navigation-controls-container");

  var currentMenu = null;

  var toggleEditMenu = function(e) {
    setMenu(EDITOR_MENU);
    e.stopPropagation();
  };

  var toggleAboutMenu = function(e) {
    setMenu(ABOUT_MENU);
    e.stopPropagation();
  };

  var setMenu = function(menuID) {
    if (currentMenu === menuID) {
      currentMenu = null;
    }
    else {
      currentMenu = menuID;
    }

    render();
  };

  var reset = function(e) {
    currentMenu = null;
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
    menusContainer.classList.add("display-none");
    currentMenu = null;
    render();
  };

  var onFlythroughStopped = function(e) {
    menusContainer.classList.remove("display-none");
  };

  var preventClickThru = function(e) {
    e.stopPropagation();
  };

  var hideMenus = function(e) {
    currentMenu = null;
    render();
  };

  var render = function() {
    menusContainer.classList.toggle("full-width", currentMenu !== null);
    menusContainer.classList.toggle("full-height", currentMenu !== null);

    navigationControlsContainer.classList.toggle("display-none", currentMenu !== null);

    editorMenuTitle.classList.toggle("menu-title-active", currentMenu === EDITOR_MENU);
    editorMenu.classList.toggle("display-none", currentMenu !== EDITOR_MENU);
    editorMenu.classList.toggle("inline-block", currentMenu === EDITOR_MENU);

    aboutMenuTitle.classList.toggle("menu-title-active", currentMenu === ABOUT_MENU);
    aboutMenu.classList.toggle("display-none", currentMenu !== ABOUT_MENU);
    aboutMenu.classList.toggle("inline-block", currentMenu === ABOUT_MENU);
  };

  menusContainer.addEventListener("click", hideMenus, false);

  // "New City" menu event handlers
  editorMenuTitle.addEventListener("click", toggleEditMenu, false);
  editorMenu.addEventListener("click", preventClickThru, false);
  terrainJitter.addEventListener("change", function(e) { cityConfigService.setHeightJitter(parseInt(e.target.value)); }, false);
  heightJitterDecay.addEventListener("change", function(e) { cityConfigService.setHeightJitterDecay(parseFloat(e.target.value)); }, false);
  hillCount.addEventListener("change", function(e) { cityConfigService.setHillCount(parseInt(e.target.value)); }, false);
  maxHillHeight.addEventListener("change", function(e) { cityConfigService.setMaxHillHeight(parseInt(e.target.value, 10)); }, false);
  includeRiver.addEventListener("change", function(e) { cityConfigService.setIncludeRiver(e.target.checked); }, false);
  maxBuildingStories.addEventListener("change", function(e) { cityConfigService.setMaxBuildingStories(parseInt(e.target.value)); }, false);
  neighborhoodCount.addEventListener("change", function(e) { cityConfigService.setNeighborhoodCount(parseInt(e.target.value)); }, false);
  resetButton.addEventListener("click", reset, false);

  // "About" menu event handlers
  aboutMenuTitle.addEventListener("click", toggleAboutMenu, false);
  aboutMenu.addEventListener("click", preventClickThru, false);

  var id1 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);
  var id3 = messageBroker.addSubscriber("generation.complete", resetPart2);

  render();


  return {};
};

export { MenusController };

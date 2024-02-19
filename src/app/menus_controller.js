"use strict";

const NEW_CITY_MENU = 1;
const DEV_MENU = 2;
const ABOUT_MENU = 3;

var MenusController = function(cityConfigService, sceneView, messageBroker) {
  var menusContainer = document.getElementById("menus-container");

  // "New City" menu
  var newCityMenuTitle = document.getElementById("menu-newcity-title");
  var newCityMenu = document.getElementById("menu-newcity");
  var includeRiver = document.getElementById("terrain-river");
  var maxBuildingStories = document.getElementById("buildings-max-stories");
  var neighborhoodCount = document.getElementById("buildings-neighborhood-count");
  var resetButton = document.getElementById("reset");

  // "Dev" menu
  let devMenuTitle = null;
  let devMenu = null;
  let terrainJitter = null;
  let heightJitterDecay = null;
  let hillCount = null;
  let maxHillHeight = null;
  let showGestureMarkersToggle = null;
  let showNeighborhoodCentersToggle = null;
  let showRouteCurvesToggle = null;

  // "About" menu
  var aboutMenuTitle = document.getElementById("menu-about-title");
  var aboutMenu = document.getElementById("menu-about");
  let appName = document.getElementById("app-name");

  // Non menu bar elements
  var loadingMessage = document.getElementById("loading-message");
  var navigationControlsContainer = document.getElementById("navigation-controls-container");

  var currentMenu = null;

  var toggleNewCityMenu = function(e) {
    setMenu(NEW_CITY_MENU);

    // Prevent page zoom from double tap on mobile
    e.preventDefault();
  };

  let toggleDevMenu = function(e) {
    setMenu(DEV_MENU);

    // Prevent page zoom from double tap on mobile
    e.preventDefault();
  };

  var toggleAboutMenu = function(e) {
    setMenu(ABOUT_MENU);

    // Prevent page zoom from double tap on mobile
    e.preventDefault();
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

  let addDevMenu = function(e) {
    if (devMenuTitle !== null) {
      return;
    }

    devMenuTitle = document.createElement("button");
    devMenuTitle.className = "menu-title";
    devMenuTitle.innerText = "Dev";
    devMenuTitle.addEventListener("click", toggleDevMenu, false);
    newCityMenuTitle.insertAdjacentElement("afterend", devMenuTitle);

    devMenu = document.createElement("div");
    devMenu.id = "menu-dev";
    devMenu.className = "display-none menu bg-white bt-thin bt-gray pointer-events-auto";
    devMenu.innerHTML = `<h3>Terrain</h3>
<span class="flex flex-align-center">
  <label class="width-4">Jitter</label>
  <span class="control-legend">&minus;</span>
  <input id="terrain-jitter" type="range" value="${cityConfigService.heightJitter()}" min="0" max="16" step="0.05" />
  <span class="control-legend">+</span>
</span>
<span class="flex flex-align-center">
  <label class="width-4">Ruggedness</label>
  <span class="control-legend">&minus;</span>
  <input id="terrain-decay" type="range" value="${cityConfigService.heightJitterDecay()}" min="0.0" max="1.0" step="0.01" />
  <span class="control-legend">+</span>
</span>
<span class="flex flex-align-center">
  <label class="width-4">Hill Count</label>
  <span class="control-legend">&minus;</span>
  <input id="terrain-hill-count" type="range" value="${cityConfigService.hillCount()}" min="0" max="50" step="1" />
  <span class="control-legend">+</span>
</span>
<span class="flex flex-align-center">
  <label class="width-4">Hill Size</label>
  <span class="control-legend">&minus;</span>
  <input id="terrain-max-hill-height" type="range" value="${cityConfigService.maxHillHeight()}" min="4" max="33" step="1" />
  <span class="control-legend">+</span>
</span>
<h3 class="mt-1">Debug</h3>
<span class="block">
  <input id="dev-show-gesture-markers" type="checkbox"${(sceneView.isGestureMarkersVisible() === true) ? " checked" : ""} />
  <label for="dev-show-gesture-markers">Show Gesture Markers</label>
</span>
<span class="block">
  <input id="dev-show-neighborhood-centers" type="checkbox"${(sceneView.isNeighborhoodCentersVisible() === true) ? " checked" : ""} />
  <label for="dev-show-neighborhood-centers">Show Neighborhood Centers</label>
</span>
<span class="block">
  <input id="dev-show-route-curves" type="checkbox"${(sceneView.isRouteCurvesVisible() === true) ? " checked" : ""} />
  <label for="dev-show-route-curves">Show Driving Path</label>
</span>`;
    newCityMenu.insertAdjacentElement("afterend", devMenu);

    terrainJitter = document.getElementById("terrain-jitter");
    terrainJitter.addEventListener("change", function(e) { cityConfigService.setHeightJitter(parseInt(e.target.value)); }, false);

    heightJitterDecay = document.getElementById("terrain-decay");
    heightJitterDecay.addEventListener("change", function(e) { cityConfigService.setHeightJitterDecay(parseFloat(e.target.value)); }, false);

    hillCount = document.getElementById("terrain-hill-count");
    hillCount.addEventListener("change", function(e) { cityConfigService.setHillCount(parseInt(e.target.value)); }, false);

    maxHillHeight = document.getElementById("terrain-max-hill-height");
    maxHillHeight.addEventListener("change", function(e) { cityConfigService.setMaxHillHeight(parseInt(e.target.value, 10)); }, false);

    showGestureMarkersToggle = document.getElementById("dev-show-gesture-markers");
    showGestureMarkersToggle.addEventListener("change", function(e) { sceneView.setIsGestureMarkersVisible(e.target.checked); }, false);

    showNeighborhoodCentersToggle = document.getElementById("dev-show-neighborhood-centers");
    showNeighborhoodCentersToggle.addEventListener("change", function(e) { sceneView.setIsNeighborhoodCentersVisible(e.target.checked); }, false);

    showRouteCurvesToggle = document.getElementById("dev-show-route-curves");
    showRouteCurvesToggle.addEventListener("change", function(e) { sceneView.setIsRouteCurvesVisible(e.target.checked); }, false);

    setMenu(DEV_MENU);
  };

  var hideMenus = function(e) {
    currentMenu = null;
    render();
  };

  var render = function() {
    navigationControlsContainer.classList.toggle("display-none", currentMenu !== null);

    newCityMenuTitle.classList.toggle("menu-title-active", currentMenu === NEW_CITY_MENU);
    newCityMenu.classList.toggle("display-none", currentMenu !== NEW_CITY_MENU);

    if (devMenuTitle !== null) {
      devMenuTitle.classList.toggle("menu-title-active", currentMenu === DEV_MENU);
      devMenu.classList.toggle("display-none", currentMenu !== DEV_MENU);
    }

    aboutMenuTitle.classList.toggle("menu-title-active", currentMenu === ABOUT_MENU);
    aboutMenu.classList.toggle("display-none", currentMenu !== ABOUT_MENU);
  };

  // "New City" menu event handlers
  newCityMenuTitle.addEventListener("click", toggleNewCityMenu, false);
  includeRiver.addEventListener("change", function(e) { cityConfigService.setIncludeRiver(e.target.checked); }, false);
  maxBuildingStories.addEventListener("change", function(e) { cityConfigService.setMaxBuildingStories(parseInt(e.target.value)); }, false);
  neighborhoodCount.addEventListener("change", function(e) { cityConfigService.setNeighborhoodCount(parseInt(e.target.value)); }, false);
  resetButton.addEventListener("click", reset, false);

  // "About" menu event handlers
  aboutMenuTitle.addEventListener("click", toggleAboutMenu, false);
  appName.addEventListener("dblclick", addDevMenu, false);

  var id1 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);
  var id3 = messageBroker.addSubscriber("generation.complete", resetPart2);
  var id4 = messageBroker.addSubscriber("touch.focus", hideMenus);

  render();


  return {};
};

export { MenusController };

"use strict";

const NEW_CITY_MENU = 1;
const DEV_MENU = 2;
const ABOUT_MENU = 3;

var MenusController = function(cityConfigService, sceneView, messageBroker) {
  var menusContainer = document.getElementById("menus-container");

  // "New City" menu
  var newCityMenuTitle = document.getElementById("menu-newcity-title");
  var newCityMenu = document.getElementById("menu-newcity");
  var terrainJitter = document.getElementById("terrain-jitter");
  var heightJitterDecay = document.getElementById("terrain-decay");
  var hillCount = document.getElementById("terrain-hill-count");
  var maxHillHeight = document.getElementById("terrain-max-hill-height");
  var includeRiver = document.getElementById("terrain-river");
  var maxBuildingStories = document.getElementById("buildings-max-stories");
  var neighborhoodCount = document.getElementById("buildings-neighborhood-count");
  var resetButton = document.getElementById("reset");

  // "Dev" menu
  let devMenuTitle = null;
  let devMenu = null;
  let showGestureMarkersToggle = null;
  let showNeighborhoodCentersToggle = null;

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
    // The reason for `style="width: auto;"` is to work around all `<label>` tags being given
    // a hard-coded width in `city_tour.css`, causing any label with wider text to wrap.
    devMenu.innerHTML = `<span class="block">
  <label for="dev-show-gesture-markers" style="width: auto;">Show Gesture Markers</label>
  <input id="dev-show-gesture-markers" type="checkbox"${(sceneView.isGestureMarkersVisible() === true) ? " checked" : ""} />
</span>
<span class="block">
  <label for="dev-show-neighborhood-centers" style="width: auto;">Show Neighborhood Centers</label>
  <input id="dev-show-neighborhood-centers" type="checkbox"${(sceneView.isNeighborhoodCentersVisible() === true) ? " checked" : ""} />
</span>`;
    newCityMenu.insertAdjacentElement("afterend", devMenu);

    showGestureMarkersToggle = document.getElementById("dev-show-gesture-markers");
    showGestureMarkersToggle.addEventListener("change", function(e) { sceneView.setIsGestureMarkersVisible(e.target.checked); }, false);

    showNeighborhoodCentersToggle = document.getElementById("dev-show-neighborhood-centers");
    showNeighborhoodCentersToggle.addEventListener("change", function(e) { sceneView.setIsNeighborhoodCentersVisible(e.target.checked); }, false);

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
  appName.addEventListener("dblclick", addDevMenu, false);

  var id1 = messageBroker.addSubscriber("flythrough.started", onFlythroughStarted);
  var id2 = messageBroker.addSubscriber("flythrough.stopped", onFlythroughStopped);
  var id3 = messageBroker.addSubscriber("generation.complete", resetPart2);
  var id4 = messageBroker.addSubscriber("touch.focus", hideMenus);

  render();


  return {};
};

export { MenusController };

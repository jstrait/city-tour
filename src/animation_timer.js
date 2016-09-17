"use strict";

var CityTour = CityTour || {};

CityTour.AnimationTimer = function() {
  var FRAMES_PER_SECONDS = 60;
  var TARGET_FRAME_WINDOW = 1000.0 / FRAMES_PER_SECONDS;

  var paused = true;
  var previousFrameTimestamp;

  var tick = function() {
    if (paused) {
      return;
    }

    var currentTimestamp = new Date().getTime();
    var frameCount;

    if (previousFrameTimestamp === undefined) {
      frameCount = 1;
    }
    else {
      frameCount = Math.floor((currentTimestamp - previousFrameTimestamp) / TARGET_FRAME_WINDOW);
      if (frameCount < 1) {
        frameCount = 1;
      }
    }
    previousFrameTimestamp = currentTimestamp;

    animationTimer.onAnimate(frameCount);

    requestAnimationFrame(tick);
  };

  var start = function() {
    paused = false;
    previousFrameTimestamp = undefined;
    requestAnimationFrame(tick);
  };

  var pause = function() {
    paused = true;
  };

  var animationTimer = {};

  animationTimer.onAnimate = function(frameCount) {};

  animationTimer.start = start;

  animationTimer.togglePause = function() {
    if (paused) {
      start();
    }
    else {
      pause();
    }
  };

  return animationTimer;
};

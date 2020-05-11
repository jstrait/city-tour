"use strict";

var Timer = function() {
  var FRAMES_PER_SECOND = 60;
  var TARGET_FRAME_WINDOW = 1000.0 / FRAMES_PER_SECOND;

  var isPaused = true;
  var previousFrameTimestamp;

  var animationRequestID;

  var tick = function() {
    if (isPaused) {
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

    timer.onTick(frameCount);

    animationRequestID = requestAnimationFrame(tick);
  };

  var start = function() {
    if (isPaused !== true) {
      return;
    }

    isPaused = false;
    previousFrameTimestamp = undefined;
    animationRequestID = requestAnimationFrame(tick);
  };

  var pause = function() {
    isPaused = true;
    window.cancelAnimationFrame(animationRequestID);
  };

  var timer = {};

  timer.onTick = function(frameCount) {};
  timer.start = start;
  timer.pause = pause;
  timer.isPaused = function() { return isPaused; };

  return timer;
};

export { Timer };

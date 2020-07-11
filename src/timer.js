"use strict";

var Timer = function() {
  var FRAMES_PER_SECOND = 60;
  var FRAME_DURATION_IN_MILLISECONDS = 1000.0 / FRAMES_PER_SECOND;

  var isPaused = true;
  var previousFrameTimestamp;

  var animationRequestID;

  var tick = function(currentTimestamp) {
    var frameCount;

    if (isPaused) {
      return;
    }

    if (previousFrameTimestamp === undefined) {
      frameCount = 1;
    }
    else {
      frameCount = Math.floor((currentTimestamp - previousFrameTimestamp) / FRAME_DURATION_IN_MILLISECONDS);
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

  var timer = {
    onTick: function(frameCount) {},
    start: start,
    pause: pause,
    isPaused: function() { return isPaused; },
  };

  return timer;
};

export { Timer };

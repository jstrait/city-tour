"use strict";

var FlythroughGestureProcessor = function() {
  var previousTouches;
  var vehicleView;

  var processGesture = function(currentTouches) {
    var normalizedDragDistanceX, normalizedDragDistanceY;

    if (currentTouches === undefined) {
      vehicleView.enableResetToCenterAnimation();
    }
    else {
      vehicleView.disableResetToCenterAnimation();

      if (previousTouches === undefined) {
        vehicleView.lockAngles();
      }
      else if (currentTouches.count() === 1 || currentTouches.count() === 2) {
        normalizedDragDistanceX = currentTouches.normalizedScreenMidpoint().x - previousTouches.normalizedScreenMidpoint().x;
        normalizedDragDistanceY = currentTouches.normalizedScreenMidpoint().y - previousTouches.normalizedScreenMidpoint().y;

        vehicleView.setLockedRotationOffsetX(vehicleView.lockedRotationOffsetX() + (normalizedDragDistanceY * (Math.PI / 2)));
        vehicleView.setLockedRotationOffsetY(vehicleView.lockedRotationOffsetY() - (normalizedDragDistanceX * (Math.PI / 2)));
      }
    }

    previousTouches = currentTouches;
  };

  return {
    processGesture: processGesture,
    setVehicleView: function(newVehicleView) { vehicleView = newVehicleView; },
  };
};

export { FlythroughGestureProcessor };

"use strict";

describe("CityTour.InteractiveCamera", function() {
  describe(".syncCamera()", function() {
    it("looking straight down on the center point", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var poleCamera = new CityTour.PoleCamera({ x: 0, y: 0, z: 0 });

      interactiveCamera.setCenterCoordinates(5, -8);
      interactiveCamera.setZoomPercentage(1.0);
      interactiveCamera.setTiltPercentage(1.0);
      interactiveCamera.setRotationAngle(0.0);
      interactiveCamera.syncCamera(poleCamera);

      expect(poleCamera.positionX()).toBe(5);
      expect(poleCamera.positionY()).toBe(20.0);
      expect(poleCamera.positionZ()).toBeCloseTo(-8);
      expect(poleCamera.rotationX()).toBe(-Math.PI / 2);
      expect(poleCamera.rotationY()).toBe(0.0);

      interactiveCamera.setZoomPercentage(0.5);
      interactiveCamera.syncCamera(poleCamera);

      expect(poleCamera.positionX()).toBe(5);
      expect(poleCamera.positionY()).toBe(510);
      expect(poleCamera.positionZ()).toBeCloseTo(-8);
      expect(poleCamera.rotationX()).toBe(-Math.PI / 2);
      expect(poleCamera.rotationY()).toBe(0.0);
    });

    it("looking at center with tilted, rotated angle", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var poleCamera = new CityTour.PoleCamera({ x: 0, y: 0, z: 0 });

      interactiveCamera.setCenterCoordinates(-7, 3);
      interactiveCamera.setZoomPercentage(0.5);
      interactiveCamera.setTiltPercentage(0.4);
      interactiveCamera.setRotationAngle(Math.PI / 3);
      interactiveCamera.syncCamera(poleCamera);

      expect(poleCamera.positionX()).toBe(334.11075581078666);
      expect(poleCamera.positionY()).toBe(323.97212281345827);
      expect(poleCamera.positionZ()).toBe(199.94038669083446);
      expect(poleCamera.rotationX()).toBe(-0.6883185307179586);
      expect(poleCamera.rotationY()).toBe(Math.PI / 3);
    });
  });
});

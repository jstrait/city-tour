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

    it("tilt angle is as close to flat as possible", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var poleCamera = new CityTour.PoleCamera({ x: 0, y: 0, z: 0 });

      interactiveCamera.setCenterCoordinates(5, 6);
      interactiveCamera.setZoomPercentage(1.0);
      interactiveCamera.setTiltPercentage(0.0);
      interactiveCamera.setRotationAngle(0.0);
      interactiveCamera.syncCamera(poleCamera);

      expect(poleCamera.positionX()).toBe(5);
      expect(poleCamera.positionY()).toBe(1.996668332936563);
      expect(poleCamera.positionZ()).toBe(25.900083305560514);
      expect(poleCamera.rotationX()).toBe(-0.1);
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


  // These tests are the inverse of the tests for `syncCamera()`
  describe(".syncFromPoleCamera()", function() {
    it("looking straight down", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var poleCamera = new CityTour.PoleCamera({ x: 0, y: 0, z: 0 });

      poleCamera.setPositionX(5.0);
      poleCamera.setPositionY(20.0);
      poleCamera.setPositionZ(-8.0);
      poleCamera.setRotationX(-Math.PI / 2);
      poleCamera.setRotationY(0.0);
      interactiveCamera.syncFromPoleCamera(poleCamera);

      expect(interactiveCamera.centerX()).toBe(5);
      expect(interactiveCamera.centerZ()).toBe(-8);
      expect(interactiveCamera.zoomPercentage()).toBe(1.0);
      expect(interactiveCamera.tiltPercentage()).toBe(1.0);
      expect(interactiveCamera.rotationAngle()).toBe(0.0);

      poleCamera.setPositionY(510.0);
      interactiveCamera.syncFromPoleCamera(poleCamera);

      expect(interactiveCamera.centerX()).toBe(5);
      expect(interactiveCamera.centerZ()).toBe(-8);
      expect(interactiveCamera.zoomPercentage()).toBe(0.5);
      expect(interactiveCamera.tiltPercentage()).toBe(1.0);
      expect(interactiveCamera.rotationAngle()).toBe(0.0);
    });

    it("tilt angle is completely flat", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var poleCamera = new CityTour.PoleCamera({ x: 0, y: 0, z: 0 });

      poleCamera.setPositionX(5.0);
      poleCamera.setPositionY(0.0);
      poleCamera.setPositionZ(6.0);
      poleCamera.setRotationX(0.0);
      poleCamera.setRotationY(0.0);
      interactiveCamera.syncFromPoleCamera(poleCamera);

      expect(interactiveCamera.centerX()).toBe(5);
      expect(interactiveCamera.centerZ()).toBe(6);
      expect(interactiveCamera.zoomPercentage()).toBe(1.0204081632653061);
      expect(interactiveCamera.tiltPercentage()).toBe(0.0);
      expect(interactiveCamera.rotationAngle()).toBe(0.0);
    });

    it("looking at tilted, rotated angle", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var poleCamera = new CityTour.PoleCamera({ x: 0, y: 0, z: 0 });

      poleCamera.setPositionX(334.11075581078666);
      poleCamera.setPositionY(323.97212281345827);
      poleCamera.setPositionZ(199.94038669083446);
      poleCamera.setRotationX(-0.6883185307179586);
      poleCamera.setRotationY(Math.PI / 3);
      interactiveCamera.syncFromPoleCamera(poleCamera);

      expect(interactiveCamera.centerX()).toBe(-7);
      expect(interactiveCamera.centerZ()).toBeCloseTo(3);
      expect(interactiveCamera.zoomPercentage()).toBe(0.5);
      expect(interactiveCamera.tiltPercentage()).toBe(0.4);
      expect(interactiveCamera.rotationAngle()).toBe(Math.PI / 3);
    });
  });
});

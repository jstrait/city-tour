"use strict";

describe("CityTour.InteractiveCamera", function() {
  var VIEW_ANGLE = 45, DEFAULT_ASPECT = 1.0, NEAR = 0.1, FAR = 10000;

  describe(".syncToCamera()", function() {
    it("looking straight down on the center point", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      interactiveCamera.setCenterCoordinates(5, -8);
      interactiveCamera.setZoomPercentage(1.0);
      interactiveCamera.setTiltPercentage(1.0);
      interactiveCamera.setRotationAngle(0.0);
      interactiveCamera.syncToCamera(camera);

      expect(camera.position.x).toBe(5);
      expect(camera.position.y).toBe(20.0);
      expect(camera.position.z).toBeCloseTo(-8);
      expect(camera.rotation.x).toBe(-Math.PI / 2);
      expect(camera.rotation.y).toBe(0.0);

      interactiveCamera.setZoomPercentage(0.5);
      interactiveCamera.syncToCamera(camera);

      expect(camera.position.x).toBe(5);
      expect(camera.position.y).toBe(510);
      expect(camera.position.z).toBeCloseTo(-8);
      expect(camera.rotation.x).toBe(-Math.PI / 2);
      expect(camera.rotation.y).toBe(0.0);
    });

    it("tilt angle is as close to flat as possible", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      interactiveCamera.setCenterCoordinates(5, 6);
      interactiveCamera.setZoomPercentage(1.0);
      interactiveCamera.setTiltPercentage(0.0);
      interactiveCamera.setRotationAngle(0.0);
      interactiveCamera.syncToCamera(camera);

      expect(camera.position.x).toBe(5);
      expect(camera.position.y).toBe(1.9966683329365646);
      expect(camera.position.z).toBe(25.900083305560514);
      expect(camera.rotation.x).toBeCloseTo(-0.1);
      expect(camera.rotation.y).toBe(0.0);
    });

    it("looking at center with tilted, rotated angle", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      interactiveCamera.setCenterCoordinates(-7, 3);
      interactiveCamera.setZoomPercentage(0.5);
      interactiveCamera.setTiltPercentage(0.4);
      interactiveCamera.setRotationAngle(Math.PI / 3);
      interactiveCamera.syncToCamera(camera);

      expect(camera.position.x).toBe(334.11075581078666);
      expect(camera.position.y).toBe(323.97212281345827);
      expect(camera.position.z).toBe(199.94038669083443);
      expect(camera.rotation.x).toBe(-0.6883185307179587);
      expect(camera.rotation.y).toBe(Math.PI / 3);
    });
  });


  // These tests are the inverse of the tests for `syncCamera()`
  describe(".syncFromCamera()", function() {
    it("looking straight down", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      camera.position.x = 5.0;
      camera.position.y = 20.0;
      camera.position.z = -8.0;
      camera.rotation.x = -Math.PI / 2;
      camera.rotation.y = 0.0;
      interactiveCamera.syncFromCamera(camera);

      expect(interactiveCamera.centerX()).toBe(5);
      expect(interactiveCamera.centerZ()).toBe(-8);
      expect(interactiveCamera.zoomPercentage()).toBe(1.0);
      expect(interactiveCamera.tiltPercentage()).toBe(1.0);
      expect(interactiveCamera.rotationAngle()).toBe(0.0);

      camera.position.y = 510.0;
      interactiveCamera.syncFromCamera(camera);

      expect(interactiveCamera.centerX()).toBe(5);
      expect(interactiveCamera.centerZ()).toBe(-8);
      expect(interactiveCamera.zoomPercentage()).toBe(0.5);
      expect(interactiveCamera.tiltPercentage()).toBe(1.0);
      expect(interactiveCamera.rotationAngle()).toBe(0.0);
    });

    it("tilt angle is completely flat", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      camera.position.x = 5.0;
      camera.position.y = 0.0;
      camera.position.z = 6.0;
      camera.rotation.x = 0.0;
      camera.rotation.y = 0.0;
      interactiveCamera.syncFromCamera(camera);

      expect(interactiveCamera.centerX()).toBe(5);
      expect(interactiveCamera.centerZ()).toBe(-14);
      expect(interactiveCamera.zoomPercentage()).toBe(1);
      expect(interactiveCamera.tiltPercentage()).toBe(0.0);
      expect(interactiveCamera.rotationAngle()).toBe(0.0);
    });

    it("looking at tilted, rotated angle", function() {
      var messageBroker = new CityTour.MessageBroker();
      var interactiveCamera = new CityTour.InteractiveCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      camera.position.x = 334.11075581078666;
      camera.position.y = 323.97212281345827;
      camera.position.z = 199.94038669083446;
      camera.rotation.x = -0.6883185307179586;
      camera.rotation.y = Math.PI / 3;
      interactiveCamera.syncFromCamera(camera);

      expect(interactiveCamera.centerX()).toBe(-7);
      expect(interactiveCamera.centerZ()).toBeCloseTo(3);
      expect(interactiveCamera.zoomPercentage()).toBe(0.5);
      expect(interactiveCamera.tiltPercentage()).toBe(0.4);
      expect(interactiveCamera.rotationAngle()).toBe(Math.PI / 3);
    });
  });
});

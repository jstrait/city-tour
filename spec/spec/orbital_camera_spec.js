"use strict";

describe("CityTour.OrbitalCamera", function() {
  var VIEW_ANGLE = 45, DEFAULT_ASPECT = 1.0, NEAR = 0.1, FAR = 10000;

  describe(".syncToCamera()", function() {
    it("looking straight down on the center point", function() {
      var messageBroker = new CityTour.MessageBroker();
      var orbitalCamera = new CityTour.OrbitalCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      orbitalCamera.setCenterCoordinates(5, -8);
      orbitalCamera.setZoomPercentage(1.0);
      orbitalCamera.setTiltPercentage(1.0);
      orbitalCamera.setRotationAngle(0.0);
      orbitalCamera.syncToCamera(camera);

      expect(camera.position.x).toBe(5);
      expect(camera.position.y).toBe(20.0);
      expect(camera.position.z).toBeCloseTo(-8);
      expect(camera.rotation.x).toBe(-Math.PI / 2);
      expect(camera.rotation.y).toBe(0.0);

      orbitalCamera.setZoomPercentage(0.5);
      orbitalCamera.syncToCamera(camera);

      expect(camera.position.x).toBe(5);
      expect(camera.position.y).toBe(510);
      expect(camera.position.z).toBeCloseTo(-8);
      expect(camera.rotation.x).toBe(-Math.PI / 2);
      expect(camera.rotation.y).toBe(0.0);
    });

    it("tilt angle is as close to flat as possible", function() {
      var messageBroker = new CityTour.MessageBroker();
      var orbitalCamera = new CityTour.OrbitalCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      orbitalCamera.setCenterCoordinates(5, 6);
      orbitalCamera.setZoomPercentage(1.0);
      orbitalCamera.setTiltPercentage(0.0);
      orbitalCamera.setRotationAngle(0.0);
      orbitalCamera.syncToCamera(camera);

      expect(camera.position.x).toBe(5);
      expect(camera.position.y).toBe(1.9966683329365646);
      expect(camera.position.z).toBe(25.900083305560514);
      expect(camera.rotation.x).toBeCloseTo(-0.1);
      expect(camera.rotation.y).toBe(0.0);
    });

    it("looking at center with tilted, rotated angle", function() {
      var messageBroker = new CityTour.MessageBroker();
      var orbitalCamera = new CityTour.OrbitalCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      orbitalCamera.setCenterCoordinates(-7, 3);
      orbitalCamera.setZoomPercentage(0.5);
      orbitalCamera.setTiltPercentage(0.4);
      orbitalCamera.setRotationAngle(Math.PI / 3);
      orbitalCamera.syncToCamera(camera);

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
      var orbitalCamera = new CityTour.OrbitalCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      camera.position.x = 5.0;
      camera.position.y = 20.0;
      camera.position.z = -8.0;
      camera.rotation.x = -Math.PI / 2;
      camera.rotation.y = 0.0;
      orbitalCamera.syncFromCamera(camera);

      expect(orbitalCamera.centerX()).toBe(5);
      expect(orbitalCamera.centerZ()).toBe(-8);
      expect(orbitalCamera.zoomPercentage()).toBe(1.0);
      expect(orbitalCamera.tiltPercentage()).toBe(1.0);
      expect(orbitalCamera.rotationAngle()).toBe(0.0);

      camera.position.y = 510.0;
      orbitalCamera.syncFromCamera(camera);

      expect(orbitalCamera.centerX()).toBe(5);
      expect(orbitalCamera.centerZ()).toBe(-8);
      expect(orbitalCamera.zoomPercentage()).toBe(0.5);
      expect(orbitalCamera.tiltPercentage()).toBe(1.0);
      expect(orbitalCamera.rotationAngle()).toBe(0.0);
    });

    it("tilt angle is completely flat", function() {
      var messageBroker = new CityTour.MessageBroker();
      var orbitalCamera = new CityTour.OrbitalCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      camera.position.x = 5.0;
      camera.position.y = 0.0;
      camera.position.z = 6.0;
      camera.rotation.x = 0.0;
      camera.rotation.y = 0.0;
      orbitalCamera.syncFromCamera(camera);

      expect(orbitalCamera.centerX()).toBe(5);
      expect(orbitalCamera.centerZ()).toBe(-14);
      expect(orbitalCamera.zoomPercentage()).toBe(1);
      expect(orbitalCamera.tiltPercentage()).toBe(0.0);
      expect(orbitalCamera.rotationAngle()).toBe(0.0);
    });

    it("looking at tilted, rotated angle", function() {
      var messageBroker = new CityTour.MessageBroker();
      var orbitalCamera = new CityTour.OrbitalCamera(messageBroker);
      var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, DEFAULT_ASPECT, NEAR, FAR);

      camera.position.x = 334.11075581078666;
      camera.position.y = 323.97212281345827;
      camera.position.z = 199.94038669083446;
      camera.rotation.x = -0.6883185307179586;
      camera.rotation.y = Math.PI / 3;
      orbitalCamera.syncFromCamera(camera);

      expect(orbitalCamera.centerX()).toBe(-7);
      expect(orbitalCamera.centerZ()).toBeCloseTo(3);
      expect(orbitalCamera.zoomPercentage()).toBe(0.5);
      expect(orbitalCamera.tiltPercentage()).toBe(0.4);
      expect(orbitalCamera.rotationAngle()).toBe(Math.PI / 3);
    });
  });
});

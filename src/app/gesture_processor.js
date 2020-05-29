"use strict";

import { CityTourMath } from "./../math";
import { WorldTouch } from "./world_touch";

const HALF_PI = Math.PI * 0.5;

var GestureProcessor = function(sceneView, mapCamera, terrain) {
  var PAN = "pan";
  var TILT = "tilt";
  var ROTATE = "rotate";
  var PINCH_ZOOM = "pinch zoom";

  var MIN_ROTATION_ANGLE =  0.01745329;  // 1 degree
  var MIN_ZOOM_DELTA = 2.0;
  var ALLOWABLE_DELTA_FOR_TILT_GESTURE = Math.PI / 16;
  var MIN_TILT_GESTURE_START_ANGLE = HALF_PI - ALLOWABLE_DELTA_FOR_TILT_GESTURE;
  var MAX_TILT_GESTURE_START_ANGLE = HALF_PI + ALLOWABLE_DELTA_FOR_TILT_GESTURE;

  var SCREEN_CENTER = new THREE.Vector3(0.0, 0.0, 0.0);

  var terrainBoundingBox = new THREE.Box3(new THREE.Vector3(terrain.minX(), Number.NEGATIVE_INFINITY, terrain.minZ()),
                                          new THREE.Vector3(terrain.maxX(), Number.POSITIVE_INFINITY, terrain.maxZ()));

  var currentGesture;
  var previousTouches;

  var processGesture = function(currentTouches, isShiftKey, isAltKey) {
    if (currentTouches === undefined) {
      currentGesture = undefined;
      mapCamera.setIsVelocityEnabled(true);
      sceneView.touchPoint1MarkerMesh().position.set(0.0, 0.0, 0.0);
      sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
    }
    else if (previousTouches === undefined) {
      mapCamera.setCenterOfAction(undefined);
      mapCamera.setIsVelocityEnabled(false);
    }
    else if (currentTouches.count() === 1) {
      processSingleTouchGestures(currentTouches, isShiftKey, isAltKey);
    }
    else if (currentTouches.count() === 2) {
      sceneView.touchPoint1MarkerMesh().position.set(currentTouches.touches()[0].worldPosition().x,
                                                     currentTouches.touches()[0].worldPosition().y,
                                                     currentTouches.touches()[0].worldPosition().z);
      sceneView.touchPoint2MarkerMesh().position.set(currentTouches.touches()[1].worldPosition().x,
                                                     currentTouches.touches()[1].worldPosition().y,
                                                     currentTouches.touches()[1].worldPosition().z);

      processMultiTouchGestures(currentTouches);
    }

    previousTouches = currentTouches;
  };

  var processSingleTouchGestures = function(currentTouches, isShiftKey, isAltKey) {
    var centerOfScreenTouch;
    var tiltAngleDelta;

    if (previousTouches.count() !== 1) {
      mapCamera.setIsVelocityEnabled(false);
      return;
    }

    if (isAltKey) {
      var distanceBetweenTouchesDeltaX = currentTouches.normalizedScreenMidpoint().x - previousTouches.normalizedScreenMidpoint().x;
      var distanceBetweenTouchesDeltaY = currentTouches.normalizedScreenMidpoint().y - previousTouches.normalizedScreenMidpoint().y;

      if (mapCamera.centerOfAction() === undefined) {
        setCenterOfAction(currentTouches);
      }

      if (Math.abs(distanceBetweenTouchesDeltaX) > Math.abs(distanceBetweenTouchesDeltaY)) {
        currentGesture = ROTATE;
        mapCamera.setCenterOfTilt(undefined);

        var azimuthAngleDelta = CityTourMath.lerp(0, Math.PI, (currentTouches.normalizedScreenMidpoint().x - previousTouches.normalizedScreenMidpoint().x));
        var newAzimuthAngle = mapCamera.azimuthAngle() + azimuthAngleDelta;
        mapCamera.rotateAzimuthAroundCenterOfAction(newAzimuthAngle - mapCamera.azimuthAngle());
      }
      else if (Math.abs(distanceBetweenTouchesDeltaX) < Math.abs(distanceBetweenTouchesDeltaY)) {
        currentGesture = TILT;

        if (mapCamera.centerOfTilt() === undefined) {
          centerOfScreenTouch = WorldTouch(sceneView.camera(), SCREEN_CENTER, terrain);
          mapCamera.setCenterOfTilt(centerOfScreenTouch.worldPosition());
        }

        tiltAngleDelta = -(distanceBetweenTouchesDeltaY * 0.5) * (mapCamera.minTiltAngle() - mapCamera.maxTiltAngle());
        mapCamera.tiltCamera(tiltAngleDelta);
      }
      else {
        // Mouse didn't move, so do nothing
      }
    }
    else if (isShiftKey) {
      currentGesture = PINCH_ZOOM;
      mapCamera.setCenterOfTilt(undefined);

      if (mapCamera.centerOfAction() === undefined) {
        setCenterOfAction(currentTouches);
      }

      var distanceBetweenTouchesDelta = currentTouches.normalizedScreenMidpoint().y - previousTouches.normalizedScreenMidpoint().y;
      var zoomDistanceDelta = -1.25 * distanceBetweenTouchesDelta;

      if (zoomDistanceDelta !== 0.0) {
        mapCamera.zoomTowardCenterOfAction(zoomDistanceDelta);
      }
    }
    else {
      currentGesture = PAN;
      mapCamera.setCenterOfAction(undefined);

      panCamera(currentTouches);

      sceneView.touchPoint1MarkerMesh().position.set(currentTouches.touches()[0].worldPosition().x,
                                                     currentTouches.touches()[0].worldPosition().y,
                                                     currentTouches.touches()[0].worldPosition().z);
      sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
    }
  };

  var processMultiTouchGestures = function(currentTouches) {
    var centerOfScreenTouch;
    var yDistanceDelta, tiltAngleDelta;
    var distanceBetweenTouchesDelta, zoomDistanceDelta;

    currentGesture = determineMultiTouchGesture(currentTouches);

    if (currentGesture === undefined) {
      return;
    }

    if (currentGesture === TILT) {
      if (mapCamera.centerOfTilt() === undefined) {
        centerOfScreenTouch = WorldTouch(sceneView.camera(), SCREEN_CENTER, terrain);
        mapCamera.setCenterOfTilt(centerOfScreenTouch.worldPosition());
      }

      yDistanceDelta = currentTouches.touches()[0].normalizedScreenY() - previousTouches.touches()[0].normalizedScreenY();
      tiltAngleDelta = -yDistanceDelta * (mapCamera.minTiltAngle() - mapCamera.maxTiltAngle());
      mapCamera.tiltCamera(tiltAngleDelta);
    }
    else if (currentGesture === ROTATE) {
      if (mapCamera.centerOfAction() === undefined) {
        setCenterOfAction(currentTouches);
      }

      mapCamera.rotateAzimuthAroundCenterOfAction(previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches());
    }
    else if (currentGesture === PINCH_ZOOM) {
      if (mapCamera.centerOfAction() === undefined) {
        setCenterOfAction(currentTouches);
      }

      distanceBetweenTouchesDelta = currentTouches.distanceInScreenPixels() - previousTouches.distanceInScreenPixels();
      zoomDistanceDelta = 0.01 * distanceBetweenTouchesDelta;

      mapCamera.zoomTowardCenterOfAction(zoomDistanceDelta);
    }
  };

  var determineMultiTouchGesture = function(currentTouches) {
    var screenAngleBetweenTouches = Math.abs(currentTouches.angleBetweenTouches());
    var touchPointsAreHorizontal = screenAngleBetweenTouches >= MIN_TILT_GESTURE_START_ANGLE &&
                                   screenAngleBetweenTouches <= MAX_TILT_GESTURE_START_ANGLE;

    if (previousTouches.count() !== 2) {
      return undefined;
    }

    if (currentGesture === TILT) {
      return TILT;
    }
    else if (currentGesture === undefined && touchPointsAreHorizontal) {
      return TILT;
    }
    else if (Math.abs(previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches()) >= MIN_ROTATION_ANGLE) {
      return ROTATE;
    }
    else if (Math.abs(currentTouches.distanceInScreenPixels() - previousTouches.distanceInScreenPixels()) >= MIN_ZOOM_DELTA) {
      return PINCH_ZOOM;
    }
    else {
      return currentGesture;
    }
  };

  var setCenterOfAction = function(currentTouches) {
    if (terrain.isPointInBounds(currentTouches.worldMidpoint().x, currentTouches.worldMidpoint().z)) {
      mapCamera.setCenterOfAction(currentTouches.worldMidpoint());
    }
    else {
      mapCamera.setCenterOfAction(clampedCenterOfAction(currentTouches));
    }
  };

  var clampedCenterOfAction = function(currentTouches) {
    var cameraPosition = new THREE.Vector3(mapCamera.positionX(), mapCamera.positionY(), mapCamera.positionZ());
    var direction = currentTouches.worldMidpoint().clone().sub(cameraPosition).normalize();
    var ray = new THREE.Ray(cameraPosition, direction);
    var intersectionPoint = ray.intersectBox(terrainBoundingBox, new THREE.Vector3());

    if (intersectionPoint === null) {
      return currentTouches.worldMidpoint();
    }

    // If camera is outside the terrain bounds, raycast again from the edge of the
    // terrain bounding box so that we choose the farthest edge of the bounding box.
    if (terrain.isPointInBounds(mapCamera.positionX(), mapCamera.positionZ()) === false) {
      ray.origin = intersectionPoint;
      ray.recast(0.00000001);
      intersectionPoint = ray.intersectBox(terrainBoundingBox, new THREE.Vector3());
    }

    return intersectionPoint;
  };

  var panCamera = function(currentTouches) {
    var normalizedScreenDragDistance = new THREE.Vector3(currentTouches.normalizedScreenMidpoint().x - previousTouches.normalizedScreenMidpoint().x,
                                                         currentTouches.normalizedScreenMidpoint().y - previousTouches.normalizedScreenMidpoint().y,
                                                         0.0);
    var tiltAngleDelta = mapCamera.minTiltAngle() - mapCamera.tiltAngle();
    var worldDragStart;
    var worldDragEnd;
    var worldDragDistance;

    mapCamera.setCenterOfTilt(WorldTouch(sceneView.camera(), SCREEN_CENTER, terrain).worldPosition());
    mapCamera.tiltCamera(tiltAngleDelta);

    worldDragStart = new THREE.Vector3(mapCamera.positionX(), 0.0, mapCamera.positionZ());
    worldDragEnd = WorldTouch(sceneView.camera(), normalizedScreenDragDistance, terrain).worldPosition();
    worldDragDistance = new THREE.Vector3(worldDragEnd.x - worldDragStart.x,
                                          worldDragEnd.y - worldDragStart.y,
                                          worldDragEnd.z - worldDragStart.z);

    mapCamera.tiltCamera(-tiltAngleDelta);
    mapCamera.setCenterOfTilt(undefined);

    mapCamera.pan(worldDragDistance.x, worldDragDistance.z);
  };

  var setTerrain = function(newTerrain) {
    terrain = newTerrain;
    terrainBoundingBox = new THREE.Box3(new THREE.Vector3(terrain.minX(), Number.NEGATIVE_INFINITY, terrain.minZ()),
                                        new THREE.Vector3(terrain.maxX(), Number.POSITIVE_INFINITY, terrain.maxZ()));
  };

  return {
    processGesture: processGesture,
    previousTouches: function() { return previousTouches; },
    setTerrain: setTerrain,
  };
};

export { GestureProcessor };

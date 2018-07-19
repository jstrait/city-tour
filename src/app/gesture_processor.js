"use strict";

var CityTour = CityTour || {};

CityTour.GestureProcessor = function(sceneView, orbitalCamera) {
  var PAN = 1;
  var TILT = 2;
  var ROTATE = 3;
  var PINCH_ZOOM = 4;

  var MIN_ROTATION_ANGLE =  0.01745329;  // 1 degree
  var MIN_ZOOM_DELTA = 2.0;
  var ALLOWABLE_DELTA_FOR_TILT_GESTURE = Math.PI / 16;
  var MIN_TILT_GESTURE_START_ANGLE = (Math.PI / 2) - ALLOWABLE_DELTA_FOR_TILT_GESTURE;
  var MAX_TILT_GESTURE_START_ANGLE = (Math.PI / 2) + ALLOWABLE_DELTA_FOR_TILT_GESTURE;

  var camera = sceneView.camera();
  var currentGesture;
  var previousTouches;
  var centerOfAction;
  var zoomProperties;

  // Adapted from https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z#13091694
  //
  // Instead of using the camera's current position to unproject from the screen coordinate to the world coordinate,
  // this always uses the equivalent of a camera looking straight down on the center of orbit, from the zoom distance away.
  //
  // The reason for doing this is so that the rate of movement is uniform regardless of the camera's tilt angle.
  // I.e., at the same zoom level, moving your mouse/finger 10 pixels on the screen will result in the same amount
  // of world movement if the camera is looking straight down, or straight forward. It also means that the location on
  // the screen (i.e. top-left vs. center vs. bottom-right) won't affect the amount of world movement when the camera is
  // tilted at an angle other than straight down.
  var screenCoordinateToWorldCoordinateStraightDown = function(normalizedScreenVector) {
    var straightDownEuler, straightDownPosition, straightDownQuaternion, straightDownScale, straightDownMatrix;
    var matrix;
    var direction, distanceToYPlane, worldPosition;

    // Similar camera world matrix from a "looking straight down on center of orbit" position/rotation
    straightDownEuler = new THREE.Euler(-Math.PI / 2, camera.rotation.y, 0.0, 'YXZ');
    straightDownPosition = new THREE.Vector3(orbitalCamera.centerX(), orbitalCamera.zoomDistance(), orbitalCamera.centerZ());
    straightDownQuaternion = new THREE.Quaternion();
    straightDownQuaternion.setFromEuler(straightDownEuler);
    straightDownScale = camera.scale.clone();
    straightDownMatrix = new THREE.Matrix4().compose(straightDownPosition, straightDownQuaternion, straightDownScale);

    // Unproject from the simulated camera position
    matrix = new THREE.Matrix4();
    matrix.multiplyMatrices(straightDownMatrix, matrix.getInverse(camera.projectionMatrix));
    normalizedScreenVector.applyMatrix4(matrix);

    direction = normalizedScreenVector.sub(straightDownPosition).normalize();
    distanceToYPlane = -(straightDownPosition.y / direction.y);
    worldPosition = straightDownPosition.clone().add(direction.multiplyScalar(distanceToYPlane));

    return worldPosition;
  };


  var panCamera = function(currentTouches) {
    var normalizedScreenDragDistance = new THREE.Vector3(currentTouches.screenMidpoint().x - previousTouches.screenMidpoint().x,
                                                         currentTouches.screenMidpoint().y - previousTouches.screenMidpoint().y,
                                                         0.0);

    var worldDragStart = new THREE.Vector3(orbitalCamera.centerX(), 0.0, orbitalCamera.centerZ());
    var worldDragEnd = screenCoordinateToWorldCoordinateStraightDown(normalizedScreenDragDistance);
    var worldDragDistance = new THREE.Vector3(worldDragEnd.x - worldDragStart.x,
                                              worldDragEnd.y - worldDragStart.y,
                                              worldDragEnd.z - worldDragStart.z);

    orbitalCamera.setCenterCoordinates(orbitalCamera.centerX() - worldDragDistance.x, orbitalCamera.centerZ() - worldDragDistance.z);
  };

  var calculateZoomProperties = function() {
    var cameraToCenterOfActionVector, centerOfActionPercentageOfFullHeight, zoomEndPoint;
    var newCenterOfOrbitX, newCenterOfOrbitZ;
    var centerXToZoomEndDistance, centerZToZoomEndDistance;
    var centerPointMovementPerOneZoomUnitX, centerPointMovementPerOneZoomUnitZ;
    var minZoomDistance;

    // Vector of camera to intersection with terrain
    cameraToCenterOfActionVector = new THREE.Vector3((camera.position.x - centerOfAction.x),
                                                     (camera.position.y - centerOfAction.y),
                                                     (camera.position.z - centerOfAction.z));
    centerOfActionPercentageOfFullHeight = (camera.position.y - centerOfAction.y) / camera.position.y;

    cameraToCenterOfActionVector.multiplyScalar(1 / centerOfActionPercentageOfFullHeight);

    // Point where camera would intersect the XZ plane if allowed to zoom indefinately
    zoomEndPoint = new THREE.Vector3(camera.position.x - cameraToCenterOfActionVector.x,
                                     camera.position.y - cameraToCenterOfActionVector.y,
                                     camera.position.z - cameraToCenterOfActionVector.z);

    sceneView.targetOfActionMarkerMesh().position.set(zoomEndPoint.x, zoomEndPoint.y, zoomEndPoint.z);

    // Calculate X/Z amount orbital camera center point needs to move per 1 unit of zoom
    // in order for center point to be same as expected camera intersection point with XZ plane
    // if zoom distance reaches 0.
    centerXToZoomEndDistance = orbitalCamera.centerX() - zoomEndPoint.x;
    centerZToZoomEndDistance = orbitalCamera.centerZ() - zoomEndPoint.z;
    centerPointMovementPerOneZoomUnitX = centerXToZoomEndDistance / orbitalCamera.zoomDistance();
    centerPointMovementPerOneZoomUnitZ = centerZToZoomEndDistance / orbitalCamera.zoomDistance();

    // Calculate the zoom distance at the point the camera would hit the terrain
    minZoomDistance = orbitalCamera.zoomDistance() * (1.0 - centerOfActionPercentageOfFullHeight);

    zoomProperties = {
      centerPointMovementPerOneZoomUnitX: centerPointMovementPerOneZoomUnitX,
      centerPointMovementPerOneZoomUnitZ: centerPointMovementPerOneZoomUnitZ,
      minZoomDistance: minZoomDistance,
    };

    return zoomProperties;
  };

  var processZoom = function(currentTouches, distanceBetweenTouches) {
    var zoomDelta = (distanceBetweenTouches > 0) ? -20 : 20;
    var newZoomDistance = orbitalCamera.zoomDistance() + zoomDelta;
    var newCenterOfOrbitX, newCenterOfOrbitZ;

    if (zoomProperties === undefined) {
      zoomProperties = calculateZoomProperties();
    }

    if (newZoomDistance < zoomProperties.minZoomDistance) {
      newZoomDistance = zoomProperties.minZoomDistance;
      zoomDelta = orbitalCamera.zoomDistance() - zoomProperties.minZoomDistance;
    }
    else if (newZoomDistance > orbitalCamera.maxZoomDistance()) {
      newZoomDistance = orbitalCamera.maxZoomDistance();
      zoomDelta = orbitalCamera.maxZoomDistance() - orbitalCamera.zoomDistance();
    }

    newCenterOfOrbitX = orbitalCamera.centerX() + (zoomDelta * zoomProperties.centerPointMovementPerOneZoomUnitX);
    newCenterOfOrbitZ = orbitalCamera.centerZ() + (zoomDelta * zoomProperties.centerPointMovementPerOneZoomUnitZ);

    orbitalCamera.setCenterCoordinates(newCenterOfOrbitX, newCenterOfOrbitZ);
    orbitalCamera.setZoomDistance(newZoomDistance);
  };

  var processAzimuthRotation = function(currentTouches, azimuthAngleDelta) {
    var newCenterX, newCenterZ;

    newCenterX = ((orbitalCamera.centerX() - centerOfAction.x) * Math.cos(-azimuthAngleDelta)) - ((orbitalCamera.centerZ() - centerOfAction.z) * Math.sin(-azimuthAngleDelta)) + centerOfAction.x;
    newCenterZ = ((orbitalCamera.centerX() - centerOfAction.x) * Math.sin(-azimuthAngleDelta)) + ((orbitalCamera.centerZ() - centerOfAction.z) * Math.cos(-azimuthAngleDelta)) + centerOfAction.z;

    orbitalCamera.setCenterCoordinates(newCenterX, newCenterZ);
    orbitalCamera.setAzimuthAngle(orbitalCamera.azimuthAngle() + azimuthAngleDelta);
  };

  var determineMultiTouchGesture = function(currentTouches) {
    var screenAngleBetweenTouches = Math.abs(currentTouches.angleBetweenTouches());
    var touchPointsAreHorizontal = screenAngleBetweenTouches >= MIN_TILT_GESTURE_START_ANGLE &&
                                   screenAngleBetweenTouches <= MAX_TILT_GESTURE_START_ANGLE;
    var azimuthAngleDelta;
    var distanceBetweenTouches;

    if (previousTouches.count() !== 2) {
      return undefined;
    }

    if (currentGesture === TILT) {
      return TILT;
    }
    else if (currentGesture === undefined && touchPointsAreHorizontal) {
      return TILT;
    }
    else {
      azimuthAngleDelta = previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches();
      distanceBetweenTouches = currentTouches.distance() - previousTouches.distance();

      if (Math.abs(azimuthAngleDelta) >= MIN_ROTATION_ANGLE) {
        return ROTATE;
      }
      else if (Math.abs(distanceBetweenTouches) >= MIN_ZOOM_DELTA) {
        return PINCH_ZOOM;
      }
      else {
        return PAN;
      }
    }
  };


  var processMultiTouchGestures = function(currentTouches) {
    var yDistanceDelta;
    var distanceBetweenTouches;

    currentGesture = determineMultiTouchGesture(currentTouches);

    if (currentGesture === undefined) {
      return;
    }

    if (currentGesture === TILT) {
      sceneView.centerOfActionMarkerMesh().position.set(0.0, 0.0, 0.0);
      centerOfAction = undefined;
      zoomProperties = undefined;
      yDistanceDelta = currentTouches.touches()[0].screenPixelY() - previousTouches.touches()[0].screenPixelY();
      orbitalCamera.setTiltAngle(orbitalCamera.tiltAngle() + ((yDistanceDelta / 100) * (orbitalCamera.minTiltAngle() - orbitalCamera.maxTiltAngle())));
    }
    else if (currentGesture === ROTATE) {
      zoomProperties = undefined;
      processAzimuthRotation(currentTouches, previousTouches.angleBetweenTouches() - currentTouches.angleBetweenTouches());
    }
    else if (currentGesture === PINCH_ZOOM) {
      distanceBetweenTouches = currentTouches.distance() - previousTouches.distance();
      if (Math.abs(distanceBetweenTouches) >= MIN_ZOOM_DELTA) {
        processZoom(currentTouches, distanceBetweenTouches);
      }
    }
  };

  var processGesture = function(currentTouches) {
    if (currentTouches === undefined) {
      currentGesture = undefined;
      centerOfAction = undefined;
      zoomProperties = undefined;
      orbitalCamera.setIsVelocityEnabled(true);
      sceneView.centerOfActionMarkerMesh().position.set(0.0, 0.0, 0.0);
      sceneView.touchPoint1MarkerMesh().position.set(0.0, 0.0, 0.0);
      sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
    }
    else if (previousTouches !== undefined) {
      orbitalCamera.setIsVelocityEnabled(false);
      if (centerOfAction === undefined) {
        centerOfAction = currentTouches.midpoint();
        sceneView.centerOfActionMarkerMesh().position.set(centerOfAction.x, centerOfAction.y, centerOfAction.z);
      }

      if (currentTouches.count() === 1) {
        currentGesture = PAN;
        zoomProperties = undefined;
        panCamera(currentTouches);

        sceneView.touchPoint1MarkerMesh().position.set(currentTouches.touches()[0].worldX(),
                                                       currentTouches.touches()[0].worldY(),
                                                       currentTouches.touches()[0].worldZ());
        sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
      }
      else if (currentTouches.count() === 2) {
        sceneView.touchPoint1MarkerMesh().position.set(currentTouches.touches()[0].worldX(),
                                                       currentTouches.touches()[0].worldY(),
                                                       currentTouches.touches()[0].worldZ());
        sceneView.touchPoint2MarkerMesh().position.set(currentTouches.touches()[1].worldX(),
                                                       currentTouches.touches()[1].worldY(),
                                                       currentTouches.touches()[1].worldZ());

        processMultiTouchGestures(currentTouches);
      }
    }

    previousTouches = currentTouches;
  };

  return {
    processGesture: processGesture,
    previousTouches: function() { return previousTouches; },
  };
};

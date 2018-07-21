"use strict";

var CityTour = CityTour || {};

CityTour.MapCamera = function(sceneView, orbitalCamera) {
  var centerOfAction;
  var zoomProperties;
  var camera = sceneView.camera();

  var setCenterOfAction = function(newCenterOfAction) {
    centerOfAction = newCenterOfAction;
    zoomProperties = undefined;

    sceneView.centerOfActionMarkerMesh().position.set(centerOfAction.x, centerOfAction.y, centerOfAction.z);
  };

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

  var pan = function(normalizedScreenDragDistance) {
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
  };

  var zoomTowardCenterOfAction = function(zoomDistanceDelta) {
    var newZoomDistance = orbitalCamera.zoomDistance() + zoomDistanceDelta;
    var newCenterOfOrbitX, newCenterOfOrbitZ;

    if (zoomProperties === undefined) {
      calculateZoomProperties();
    }

    if (newZoomDistance < zoomProperties.minZoomDistance) {
      newZoomDistance = zoomProperties.minZoomDistance;
      zoomDistanceDelta = orbitalCamera.zoomDistance() - zoomProperties.minZoomDistance;
    }
    else if (newZoomDistance > orbitalCamera.maxZoomDistance()) {
      newZoomDistance = orbitalCamera.maxZoomDistance();
      zoomDistanceDelta = orbitalCamera.maxZoomDistance() - orbitalCamera.zoomDistance();
    }

    newCenterOfOrbitX = orbitalCamera.centerX() + (zoomDistanceDelta * zoomProperties.centerPointMovementPerOneZoomUnitX);
    newCenterOfOrbitZ = orbitalCamera.centerZ() + (zoomDistanceDelta * zoomProperties.centerPointMovementPerOneZoomUnitZ);

    orbitalCamera.setCenterCoordinates(newCenterOfOrbitX, newCenterOfOrbitZ);
    orbitalCamera.setZoomDistance(newZoomDistance);
  };

  var rotateAzimuthAroundCenterOfAction = function(azimuthAngleDelta) {
    var newCenterX, newCenterZ;
    var distanceX = orbitalCamera.centerX() - centerOfAction.x;
    var distanceZ = orbitalCamera.centerZ() - centerOfAction.z;

    zoomProperties = undefined;

    newCenterX = (distanceX * Math.cos(-azimuthAngleDelta)) - (distanceZ * Math.sin(-azimuthAngleDelta)) + centerOfAction.x;
    newCenterZ = (distanceX * Math.sin(-azimuthAngleDelta)) + (distanceZ * Math.cos(-azimuthAngleDelta)) + centerOfAction.z;

    orbitalCamera.setCenterCoordinates(newCenterX, newCenterZ);
    orbitalCamera.setAzimuthAngle(orbitalCamera.azimuthAngle() + azimuthAngleDelta);
  };

  var tiltCamera = function(tiltAngleDelta) {
    orbitalCamera.setTiltAngle(orbitalCamera.tiltAngle() + tiltAngleDelta)
  };

  var setIsVelocityEnabled = function(newIsVelocityEnabled) {
    orbitalCamera.setIsVelocityEnabled(newIsVelocityEnabled);
  };

  var tickVelocity = function(frameCount) {
    orbitalCamera.tickVelocity(frameCount);
  };

  var syncToCamera = function(camera, terrain) {
    orbitalCamera.syncToCamera(camera, terrain);
  };

  var syncFromCamera = function(camera) {
    orbitalCamera.syncFromCamera(camera);
  };


  setCenterOfAction(new THREE.Vector3(orbitalCamera.centerX(), 0.0, orbitalCamera.centerZ()));


  return {
    centerOfAction: function() { return centerOfAction; },
    setCenterOfAction: setCenterOfAction,
    pan: pan,
    rotateAzimuthAroundCenterOfAction: rotateAzimuthAroundCenterOfAction,
    zoomTowardCenterOfAction: zoomTowardCenterOfAction,
    tiltCamera: tiltCamera,
    isVelocityEnabled: function() { return orbitalCamera.isVelocityEnabled(); },
    setIsVelocityEnabled: setIsVelocityEnabled,
    tickVelocity: tickVelocity,
    syncToCamera: syncToCamera,
    syncFromCamera: syncFromCamera,
    orbitalCamera: function() { return orbitalCamera; },
    azimuthAngle: function() { return orbitalCamera.azimuthAngle(); },
    tiltAngle: function() { return orbitalCamera.tiltAngle(); },
    minTiltAngle: function() { return orbitalCamera.minTiltAngle(); },
    maxTiltAngle: function() { return orbitalCamera.maxTiltAngle(); },
    zoomDistance: function() { return orbitalCamera.zoomDistance(); },
    minZoomDistance: function() { return orbitalCamera.minZoomDistance(); },
    maxZoomDistance: function() { return orbitalCamera.maxZoomDistance(); },
  };
};

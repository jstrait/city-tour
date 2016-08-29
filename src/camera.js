"use strict";

var PathFinder = function(camera) {
  var FORWARD_MOTION_DELTA = 0.2;
  var ROTATION_DELTA = 0.03;
  var HALF_PI = Math.PI / 2.0;
  var THREE_PI_OVER_TWO = (3.0 * Math.PI) / 2.0;

  var targetMapX = 0.0;
  var targetSceneX = 0.0;
  var targetMapZ = 0.0;
  var targetSceneZ = 0.0;
  var deltaX = 0.0;
  var deltaZ = -FORWARD_MOTION_DELTA;
  var targetAngle = 0.0;
  var deltaAngle;

  var determineNextTargetPoint = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;

    while (oldTargetMapX === targetMapX && oldTargetMapZ === targetMapZ) {
      if (deltaX === 0.0) {
        targetMapX = Math.floor(Math.random() * CityConfig.BLOCK_ROWS) - CityConfig.HALF_BLOCK_ROWS;
      }
      else if (deltaZ === 0.0) {
        targetMapZ = Math.floor(Math.random() * CityConfig.BLOCK_COLUMNS) - CityConfig.HALF_BLOCK_COLUMNS;
      }
    }

    targetSceneX = Coordinates.mapXToSceneX(targetMapX);
    targetSceneZ = Coordinates.mapZToSceneZ(targetMapZ);

    deltaX = (deltaX === 0.0) ? FORWARD_MOTION_DELTA : 0.0;
    deltaZ = (deltaZ === 0.0) ? FORWARD_MOTION_DELTA : 0.0;
    deltaX *= (oldTargetMapX > targetMapX) ? -1 : 1;
    deltaZ *= (oldTargetMapZ > targetMapZ) ? -1 : 1;
  };

  var determineRotationAngle = function() {
    var oldTargetAngle = targetAngle;

    if (deltaX < 0) {
      targetAngle = HALF_PI;
    }
    else if (deltaX > 0) {
      targetAngle = THREE_PI_OVER_TWO;
    }
    else if (deltaZ > 0) {
      targetAngle = Math.PI;
    }
    else if (deltaZ < 0) {
      targetAngle = 0;
    }

    // Prevent an extra long turn (i.e. 270deg instead of 90deg)
    if (oldTargetAngle === 0.0 && targetAngle === THREE_PI_OVER_TWO) {
      oldTargetAngle = Math.PI * 2;
      camera.rotation.y = Math.PI * 2;
    }
    else if (oldTargetAngle === THREE_PI_OVER_TWO && targetAngle === 0.0) {
      oldTargetAngle = -HALF_PI;
      camera.rotation.y = -HALF_PI;
    }

    deltaAngle = ROTATION_DELTA;
    deltaAngle *= (targetAngle > oldTargetAngle) ? 1 : -1;
  };

  var pathFinder = {};

  pathFinder.targetSceneX = function() { return targetSceneX; };
  pathFinder.targetMapX = function() { return targetMapX; };
  pathFinder.targetSceneZ = function() { return targetSceneZ; };
  pathFinder.targetMapZ = function() { return targetMapZ; };
  pathFinder.deltaX  = function() { return deltaX; };
  pathFinder.deltaZ  = function() { return deltaZ; };
  pathFinder.targetAngle = function() { return targetAngle; };
  pathFinder.deltaAngle = function() { return deltaAngle; };

  pathFinder.nextTarget = function() {
    determineNextTargetPoint();
    determineRotationAngle();
  };

  return pathFinder;
};

var AnimationManager = function(terrain, renderer, scene, camera) {
  var TARGET_FRAME_WINDOW = 1000 / 60;   // 60 frames per second

  var animationManager = {};
  var animators = [];
  var previousFrameTimestamp;

  var pathFinder = new PathFinder(camera);

  var init = function() {
    var START_X = 0;
    var START_Y = 40;
    var START_Z = CityConfig.HALF_SCENE_DEPTH;

    camera.position.x = START_X;
    camera.position.y = START_Y;
    camera.position.z = START_Z;

    var distanceToCityEdge = Math.abs(START_Z - ((CityConfig.BLOCK_ROWS * CityConfig.BLOCK_AND_STREET_DEPTH) / 2));
    var framesUntilCityEdge = Math.abs(distanceToCityEdge / pathFinder.deltaZ());
    var terrainHeightAtTouchdown = terrain.heightAtCoordinates(0.0, CityConfig.HALF_BLOCK_ROWS) + 0.5;
    var swoopDescentDelta = (START_Y - terrainHeightAtTouchdown) / framesUntilCityEdge;

    var ramp = new rampAnimation(camera, framesUntilCityEdge, -swoopDescentDelta, terrainHeightAtTouchdown + 0.5, 1000000);
    var forward = new forwardAnimation(camera, pathFinder.targetSceneX(), pathFinder.deltaX(), pathFinder.targetSceneZ(), pathFinder.deltaZ());
    animators = [ramp, forward];
  };

  animationManager.animate = function() {
    var currentTimestamp = new Date().getTime();
    var frameCount;

    if (animators.length === 0) {
      init();
    }

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

    for (var i = 0; i < frameCount; i++) {
      var newAnimators = [];

      animators.forEach(function (animator) {
        animator.animate();

        if (animator.finished === true) {
          if (animator instanceof rampAnimation) {
            newAnimators.push(new hoverAnimation(camera));
          }
          else if (animator instanceof forwardAnimation) {
            pathFinder.nextTarget();
            newAnimators.push(new rotationAnimation(camera, pathFinder.targetAngle(), pathFinder.deltaAngle()));
          }
          else if (animator instanceof rotationAnimation) {
            newAnimators.push(new forwardAnimation(camera, pathFinder.targetSceneX(), pathFinder.deltaX(), pathFinder.targetSceneZ(), pathFinder.deltaZ()));
          }
          else if (animator instanceof hoverAnimation) {
            newAnimators.push(new hoverAnimation(camera));
          }
        }
        else {
          newAnimators.push(animator);
        }
      });
      animators = newAnimators;
    }

    var mapX = Coordinates.sceneXToMapX(camera.position.x);
    var mapZ = Coordinates.sceneZToMapZ(camera.position.z);

    var y = terrain.heightAtCoordinates(mapX, mapZ);
    camera.position.y = Math.max(camera.position.y, y + 0.5);

    renderer.render(scene, camera);
    requestAnimFrame(animationManager.animate);
  };

  return animationManager;
};


function forwardAnimation(camera, targetX, deltaX, targetZ, deltaZ) {
  this.camera = camera;
  this.targetX = targetX;
  this.deltaX = deltaX;
  this.targetZ = targetZ;
  this.deltaZ = deltaZ;
  this.finished = false;
}

forwardAnimation.prototype.animate = function() {
  this.camera.position.x += this.deltaX;
  this.camera.position.z += this.deltaZ;

  if ((this.deltaX < 0 && this.camera.position.x < this.targetX) || (this.deltaX > 0 && this.camera.position.x > this.targetX) ||
      (this.deltaZ < 0 && this.camera.position.z < this.targetZ) || (this.deltaZ > 0 && this.camera.position.z > this.targetZ)) {
    this.camera.position.x = this.targetX;
    this.camera.position.z = this.targetZ;

    this.finished = true;
  }
}

function rotationAnimation(camera, targetAngle, deltaAngle) {
  this.camera = camera;
  this.targetAngle = targetAngle;
  this.deltaAngle = deltaAngle;
  this.finished = false;
}

rotationAnimation.prototype.animate = function() {
  this.camera.rotation.y += this.deltaAngle;
  
  if ((this.deltaAngle < 0 && this.camera.rotation.y <= this.targetAngle) || (this.deltaAngle > 0 && this.camera.rotation.y >= this.targetAngle)) {
    if (this.targetAngle >= Math.PI * 2 || this.targetAngle <= Math.PI * -2) {
      this.targetAngle = 0;
    }

    this.camera.rotation.y = this.targetAngle;
    this.finished = true;
  }
}

function rampAnimation(camera, frameDistance, deltaY, minHeight, maxHeight) {
  this.camera = camera;
  this.ticks = 0;
  this.frameDistance = frameDistance;
  this.deltaY = deltaY;
  this.minHeight = minHeight;
  this.maxHeight = maxHeight;
  this.finished = false;
}

rampAnimation.prototype.animate = function() {
  if (this.camera.position.y >= this.minHeight && this.camera.position.y <= this.maxHeight) {
    this.camera.position.y += this.deltaY;
  }
  if (this.camera.position.y < this.minHeight) {
    this.camera.position.y = this.minHeight;
  }  
  if (this.camera.position.y > this.maxHeight) {
    this.camera.position.y = this.maxHeight;
  }

  this.ticks += 1;
  if (this.ticks > this.frameDistance) {
    this.finished = true;
  }
}

function hoverAnimation(camera) {
  var frameDistance = (Math.random() * 300) + 300;
  var deltaY = (camera.position.y > 0.5) ? -0.05 : 0.05;

  this.rampAnimation = new rampAnimation(camera, frameDistance, deltaY, 0.5, 15);
  this.finished = false;
}

hoverAnimation.prototype.animate = function() {
  this.rampAnimation.animate();
  this.finished = this.rampAnimation.finished;
}

function birdsEyeAnimation(camera) {
  this.camera = camera;
  this.maxHeight = 100;
  this.ascentDelta = 2;
  this.rotationDelta = -0.06;
  this.maxRotation = -(Math.PI / 2);

  this.finished = false;
};

birdsEyeAnimation.prototype.animate = function() {
  if (this.camera.position.y < this.maxHeight) {
    this.camera.position.y += this.ascentDelta;
  }
  else {
    this.camera.position.y = this.maxHeight;
    this.finished = true;
  }

  if (this.camera.rotation.x > this.maxRotation) {
    this.camera.rotation.x += this.rotationDelta;
  }
  else {
    this.camera.rotation.x = this.maxRotation;
  }
};

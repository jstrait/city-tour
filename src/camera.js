"use strict";

var PathFinder = function(cameraPole) {
  var FORWARD_MOTION_DELTA = 0.2;
  var ROTATION_DELTA = 0.03;
  var HALF_PI = Math.PI / 2.0;
  var THREE_PI_OVER_TWO = (3.0 * Math.PI) / 2.0;
  var TWO_PI = Math.PI * 2.0;

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
      oldTargetAngle = TWO_PI;
      cameraPole.rotation.y = TWO_PI;
    }
    else if (oldTargetAngle === THREE_PI_OVER_TWO && targetAngle === 0.0) {
      oldTargetAngle = -HALF_PI;
      cameraPole.rotation.y = -HALF_PI;
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

var AnimationManager = function(terrain, roadNetwork, cameraPole, camera) {
  var animationManager = {};
  var animators = [];

  var pathFinder = new PathFinder(cameraPole);

  var init = function() {
    var START_X = 0;
    var START_Y = 40;
    var SWOOP_DISTANCE_IN_BLOCKS = 20;

    var furthestOutIntersection = CityConfig.HALF_BLOCK_ROWS;
    while (!roadNetwork.hasIntersection(0, furthestOutIntersection)) {
      furthestOutIntersection -= 1;
    }

    var startZ = furthestOutIntersection + SWOOP_DISTANCE_IN_BLOCKS;
    var distanceToCityEdge = SWOOP_DISTANCE_IN_BLOCKS * CityConfig.BLOCK_AND_STREET_DEPTH;

    cameraPole.position.x = START_X;
    cameraPole.position.y = START_Y;
    cameraPole.position.z = startZ * CityConfig.BLOCK_AND_STREET_DEPTH;

    var framesUntilCityEdge = Math.abs(distanceToCityEdge / pathFinder.deltaZ());
    var terrainHeightAtTouchdown = terrain.heightAtCoordinates(0.0, furthestOutIntersection) + 0.5;
    var swoopDescentDelta = (START_Y - terrainHeightAtTouchdown) / framesUntilCityEdge;

    //var ramp = new rampAnimation(cameraPole, framesUntilCityEdge, -swoopDescentDelta, terrainHeightAtTouchdown + 0.5, 1000000);
    var vertical = new verticalAnimation(cameraPole, camera, terrainHeightAtTouchdown + 0.5, swoopDescentDelta);
    var forward = new forwardAnimation(cameraPole, pathFinder.targetSceneX(), pathFinder.deltaX(), pathFinder.targetSceneZ(), pathFinder.deltaZ());
    var debugBirdseye = new debugBirdsEyeAnimation(cameraPole, camera);
    animators = [vertical, forward];
    //animators = [debugBirdseye];
  };

  animationManager.animate = function(frameCount) {
    if (animators.length === 0) {
      init();
    }

    for (var i = 0; i < frameCount; i++) {
      var newAnimators = [];

      animators.forEach(function (animator) {
        animator.animate();

        if (animator.finished === true) {
          if (animator instanceof rampAnimation) {
            newAnimators.push(new hoverAnimation(cameraPole));
          }
          else if (animator instanceof forwardAnimation) {
            pathFinder.nextTarget();
            newAnimators.push(new rotationAnimation(cameraPole, pathFinder.targetAngle(), pathFinder.deltaAngle()));
          }
          else if (animator instanceof rotationAnimation) {
            newAnimators.push(new forwardAnimation(cameraPole, pathFinder.targetSceneX(), pathFinder.deltaX(), pathFinder.targetSceneZ(), pathFinder.deltaZ()));
          }
          else if (animator instanceof hoverAnimation) {
            newAnimators.push(new hoverAnimation(cameraPole));
          }
        }
        else {
          newAnimators.push(animator);
        }
      });
      animators = newAnimators;
    }

    var mapX = Coordinates.sceneXToMapX(cameraPole.position.x);
    var mapZ = Coordinates.sceneZToMapZ(cameraPole.position.z);

    var y = terrain.heightAtCoordinates(mapX, mapZ);
    cameraPole.position.y = Math.max(cameraPole.position.y, y + 0.5);
  };

  return animationManager;
};


function verticalAnimation(cameraPole, camera, targetY, yDelta) {
  this.cameraPole = cameraPole;
  this.camera = camera;
  this.targetY = targetY;
  this.yDelta = yDelta;
  this.targetAngle = 0.0;
  this.angleDelta = 0.0155140377955;
  this.framesInCurrentMode = 0;
  this.framesUntilTarget = 1500;
  this.mode = 'driving';
  this.finished = false;
}

verticalAnimation.prototype.animate = function() {
  var step = function(current, target, delta) {
    if (current === target) {
      return target;
    }
    else {
      if (current > target) {
        if ((current - target) < delta) {
          return target;
        }
        else {
          return current - delta;
        }
      }
      else if (current < target) {
        if ((target - current) < delta) {
          return target;
        }
        else {
          return current + delta;
        }
      }
    }
  };

  this.framesInCurrentMode += 1;

  this.cameraPole.position.y = step(this.cameraPole.position.y, this.targetY, this.yDelta);
  this.camera.rotation.x = step(this.camera.rotation.x, this.targetAngle, this.angleDelta);

  if (this.framesInCurrentMode >= this.framesUntilTarget) {
    if (this.mode === 'driving') {
      this.mode = 'birdseye';
      this.targetY = 150;
      this.yDelta = 2;
      this.targetAngle = -(Math.PI / 3);
    }
    else if (this.mode === 'hovering') {
      this.mode = 'driving';
      this.targetY = -100000;
      this.yDelta = 0.05;
      this.targetAngle = 0.0;
    }
    else if (this.mode === 'birdseye') {
      this.mode = 'hovering';
      this.targetY = 15;
      this.yDelta = 2;
      this.targetAngle = 0.0;
    }

    this.framesInCurrentMode = 0;
  }
};


function forwardAnimation(cameraPole, targetX, deltaX, targetZ, deltaZ) {
  this.cameraPole = cameraPole;
  this.targetX = targetX;
  this.deltaX = deltaX;
  this.targetZ = targetZ;
  this.deltaZ = deltaZ;
  this.finished = false;
}

forwardAnimation.prototype.animate = function() {
  this.cameraPole.position.x += this.deltaX;
  this.cameraPole.position.z += this.deltaZ;

  if ((this.deltaX < 0 && this.cameraPole.position.x < this.targetX) || (this.deltaX > 0 && this.cameraPole.position.x > this.targetX) ||
      (this.deltaZ < 0 && this.cameraPole.position.z < this.targetZ) || (this.deltaZ > 0 && this.cameraPole.position.z > this.targetZ)) {
    this.cameraPole.position.x = this.targetX;
    this.cameraPole.position.z = this.targetZ;

    this.finished = true;
  }
};

function rotationAnimation(cameraPole, targetAngle, deltaAngle) {
  this.cameraPole = cameraPole;
  this.targetAngle = targetAngle;
  this.deltaAngle = deltaAngle;
  this.finished = false;
}

rotationAnimation.prototype.animate = function() {
  this.cameraPole.rotation.y += this.deltaAngle;
  
  if ((this.deltaAngle < 0 && this.cameraPole.rotation.y <= this.targetAngle) || (this.deltaAngle > 0 && this.cameraPole.rotation.y >= this.targetAngle)) {
    if (this.targetAngle >= Math.PI * 2 || this.targetAngle <= Math.PI * -2) {
      this.targetAngle = 0;
    }

    this.cameraPole.rotation.y = this.targetAngle;
    this.finished = true;
  }
};

function rampAnimation(cameraPole, frameDistance, deltaY, minHeight, maxHeight) {
  this.cameraPole = cameraPole;
  this.ticks = 0;
  this.frameDistance = frameDistance;
  this.deltaY = deltaY;
  this.minHeight = minHeight;
  this.maxHeight = maxHeight;
  this.finished = false;
}

rampAnimation.prototype.animate = function() {
  if (this.cameraPole.position.y >= this.minHeight && this.cameraPole.position.y <= this.maxHeight) {
    this.cameraPole.position.y += this.deltaY;
  }
  if (this.cameraPole.position.y < this.minHeight) {
    this.cameraPole.position.y = this.minHeight;
  }  
  if (this.cameraPole.position.y > this.maxHeight) {
    this.cameraPole.position.y = this.maxHeight;
  }

  this.ticks += 1;
  if (this.ticks > this.frameDistance) {
    this.finished = true;
  }
};

function hoverAnimation(cameraPole) {
  var frameDistance = (Math.random() * 300) + 300;
  var deltaY = (cameraPole.position.y > 0.5) ? -0.05 : 0.05;

  this.rampAnimation = new rampAnimation(cameraPole, frameDistance, deltaY, 0.5, 15);
  this.finished = false;
}

hoverAnimation.prototype.animate = function() {
  this.rampAnimation.animate();
  this.finished = this.rampAnimation.finished;
};

function birdsEyeAnimation(cameraPole, camera) {
  this.cameraPole = cameraPole;
  this.camera = camera;
  this.maxHeight = 150;
  this.ascentDelta = 2;
  this.rotationDelta = -0.06;
  this.maxRotation = -(Math.PI / 3);

  this.finished = false;
};

birdsEyeAnimation.prototype.animate = function() {
  if (this.cameraPole.position.y < this.maxHeight) {
    this.cameraPole.position.y += this.ascentDelta;
  }
  else {
    this.cameraPole.position.y = this.maxHeight;
    this.finished = true;
  }

  if (this.camera.rotation.x > this.maxRotation) {
    this.camera.rotation.x += this.rotationDelta;
  }
  else {
    this.camera.rotation.x = this.maxRotation;
  }
};

function debugBirdsEyeAnimation(camera) {
  this.camera = camera;
  this.finished = false;
};

debugBirdsEyeAnimation.prototype.animate = function() {
  this.camera.position.x = 0;
  this.camera.position.y = 900;
  this.camera.position.z = 0;
  this.camera.rotation.x = -(Math.PI / 2);
};

"use strict";

var AnimationTimer = function(terrain) {
  var FRAMES_PER_SECONDS = 60;
  var MILLISECONDS_PER_TICK = 1000.0 / FRAMES_PER_SECONDS;

  var masterStartTime;
  var previousTickStartTime;
  var totalTicks = 0;

  var animator = new Animator(terrain);

  var tick = function(timestamp) {
    var tickStartTime = performance.now();

    if (!masterStartTime) {
      masterStartTime = tickStartTime;
    }

    var ticksToProcess = 1;
    var expectedFramesSoFar = Math.floor((tickStartTime - masterStartTime) / MILLISECONDS_PER_TICK);
    if (expectedFramesSoFar > totalTicks) {
      ticksToProcess += (expectedFramesSoFar - totalTicks);
    }

    for (var i = 0; i < ticksToProcess; i++) {
      animator.tick();
      totalTicks += 1;
    }

    renderer.render(scene, camera);

    previousTickStartTime = tickStartTime;

    requestAnimFrame(tick);
  };

  var animationTimer = {};

  animationTimer.start = function() {
    requestAnimFrame(tick);
  };

  return animationTimer;
};


var Animator = function(terrain) {
  var animator = {};

  var xPositionGenerator = new MotionGenerator();
  var zPositionGenerator = new LinearMotionGenerator(2, CityConfig.HALF_SCENE_DEPTH);

  animator.tick = function() {
    camera.position.x += xPositionGenerator.nextValue();
    camera.position.z += -zPositionGenerator.nextValue();

    var mapX = Coordinates.sceneXToMapX(camera.position.x);
    var mapZ = Coordinates.sceneZToMapZ(camera.position.z);

    var y = terrain.heightAtCoordinates(mapX, mapZ);
    camera.position.y = y + 0.5;
  };

  return animator;
};


var MotionGenerator = function() {
  var motionGenerator = {};

  motionGenerator.nextValue = function() {
    return 0.0;
  };

  motionGenerator.isComplete = function() {
    return false;
  };

  motionGenerator.onComplete = function() { };

  return motionGenerator;
};

var LinearMotionGenerator = function(delta, target) {
  var accumulator = 0.0;
  var isComplete = false;

  var linearMotionGenerator = new MotionGenerator();

  linearMotionGenerator.nextValue = function() {
    if (isComplete) {
      return 0.0;
    }

    accumulator += delta;

    if (accumulator <= target) {
      return delta;
    }
    else {
      isComplete = true;
      return (delta - (accumulator - target));
    }
  };

  linearMotionGenerator.isComplete = function() {
    return isComplete;
  };

  linearMotionGenerator.onComplete = function() { };

  return linearMotionGenerator;
};




var AnimationManager = function() {
  var TARGET_FRAME_WINDOW = 1000 / 60;   // 60 frames per second
  var FOWARD_MOTION_DELTA = 0.2;

  var animationManager = {};
  var animators = [];
  var previousFrameTimestamp;

  var deltaX;
  var deltaZ;
  var targetX;
  var targetGridX;
  var targetZ;
  var targetGridZ;
  var targetAngle = 0;
  var deltaAngle;

  var init = function() {
    var START_X = 0;
    var START_Y = 40;
    var START_Z = CityConfig.HALF_SCENE_DEPTH;

    camera.position.x = START_X;
    camera.position.y = START_Y;
    camera.position.z = START_Z;

    targetX = 0;
    targetZ = 0;
    deltaX = 0.0;
    deltaZ = -FOWARD_MOTION_DELTA;

    var distanceToCityEdge = Math.abs(START_Z - ((CityConfig.BLOCK_ROWS * CityConfig.BLOCK_AND_STREET_DEPTH) / 2));
    var framesUntilCityEdge = Math.abs(distanceToCityEdge / deltaZ);
    var terrainHeightAtTouchdown = terrain.heightAtCoordinates(0.0, CityConfig.HALF_BLOCK_ROWS) + 0.5;
    var swoopDescentDelta = (START_Y - terrainHeightAtTouchdown) / framesUntilCityEdge;

    var ramp = new rampAnimation(framesUntilCityEdge, -swoopDescentDelta, terrainHeightAtTouchdown + 0.5, 1000000);
    var forward = new forwardAnimation(targetX, deltaX, targetZ, deltaZ);
    animators = [ramp, forward];
  };

  var determineNextTargetPoint = function() {
    if (targetGridX == undefined || targetGridZ == undefined) {
      targetGridX = 0;
      targetGridZ = -1;
    }
    else {
      var oldTargetGridX = targetGridX;
      var oldTargetGridZ = targetGridZ;

      while (oldTargetGridX == targetGridX && oldTargetGridZ == targetGridZ) {
        if (deltaX == 0) {
          targetGridX = Math.floor(Math.random() * CityConfig.BLOCK_ROWS) - (CityConfig.BLOCK_ROWS / 2);
        }
        else if (deltaZ == 0) {
          targetGridZ = Math.floor(Math.random() * CityConfig.BLOCK_COLUMNS) - (CityConfig.BLOCK_COLUMNS / 2);
        }
      }
    }

    targetX = Coordinates.mapXToSceneX(targetGridX);
    targetZ = Coordinates.mapZToSceneZ(targetGridZ);

    deltaX = (camera.position.x == targetX) ? 0 : FOWARD_MOTION_DELTA;
    deltaZ = (camera.position.z == targetZ) ? 0 : FOWARD_MOTION_DELTA;
    deltaX *= (camera.position.x > targetX) ? -1 : 1;
    deltaZ *= (camera.position.z > targetZ) ? -1 : 1;
  };

  var determineRotationAngle = function() {
    var RIGHT_ANGLE = Math.PI / 2;
    var ROTATION_DELTA = 0.03;

    var oldTargetAngle = targetAngle;
    if (deltaX != 0 && oldTargetAngle == 0) {  // NORTH
      targetAngle = (deltaX < 0) ? targetAngle + RIGHT_ANGLE : targetAngle - RIGHT_ANGLE;
    }
    else if (deltaZ != 0 && (oldTargetAngle == RIGHT_ANGLE || oldTargetAngle == ((-3 * Math.PI) / 2))) {  // EAST
      targetAngle = (deltaZ < 0) ? targetAngle - RIGHT_ANGLE : targetAngle + RIGHT_ANGLE;
    }
    else if (deltaX != 0 && (oldTargetAngle == Math.PI || oldTargetAngle == Math.PI * -1)) {  // SOUTH
      targetAngle = (deltaX < 0) ? targetAngle - RIGHT_ANGLE : targetAngle + RIGHT_ANGLE;
    }
    else if (deltaZ != 0 && (oldTargetAngle == Math.PI / -2 || oldTargetAngle == (Math.PI * 3) / 2)) {  // WEST
      targetAngle = (deltaZ < 0) ? targetAngle + RIGHT_ANGLE : targetAngle - RIGHT_ANGLE;
    }

    deltaAngle = ROTATION_DELTA;
    deltaAngle *= (targetAngle > oldTargetAngle) ? 1 : -1;
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

    var newAnimators = [];
    animators.forEach(function (animator) {
      animator.animate(frameCount);

      if (animator.finished === true) {
        if (animator instanceof rampAnimation) {
          newAnimators.push(new hoverAnimation());
        }
        else if (animator instanceof forwardAnimation) {
          determineNextTargetPoint();
          determineRotationAngle();
          newAnimators.push(new rotationAnimation(targetAngle, deltaAngle));
        }
        else if (animator instanceof rotationAnimation) {
          newAnimators.push(new forwardAnimation(targetX, deltaX, targetZ, deltaZ));
        }
        else if (animator instanceof hoverAnimation) {
          newAnimators.push(new hoverAnimation());
        }
      }
      else {
        newAnimators.push(animator);
      }
    });
    animators = newAnimators;

    var mapX = Coordinates.sceneXToMapX(camera.position.x);
    var mapZ = Coordinates.sceneZToMapZ(camera.position.z);

    var y = terrain.heightAtCoordinates(mapX, mapZ);
    camera.position.y = Math.max(camera.position.y, y + 0.5);

    renderer.render(scene, camera);
    requestAnimFrame(animationManager.animate);
  };

  return animationManager;
};


function forwardAnimation(targetX, deltaX, targetZ, deltaZ) {
  this.targetX = targetX;
  this.deltaX = deltaX;
  this.targetZ = targetZ;
  this.deltaZ = deltaZ;
  this.finished = false;
}

forwardAnimation.prototype.animate = function(frameCount) {
  camera.position.x += this.deltaX * frameCount;
  camera.position.z += this.deltaZ * frameCount;

  if ((this.deltaX < 0 && camera.position.x < this.targetX) || (this.deltaX > 0 && camera.position.x > this.targetX) ||
      (this.deltaZ < 0 && camera.position.z < this.targetZ) || (this.deltaZ > 0 && camera.position.z > this.targetZ)) {
    camera.position.x = this.targetX;
    camera.position.z = this.targetZ;

    this.finished = true;
  }
}

function rotationAnimation(targetAngle, deltaAngle) {
  this.targetAngle = targetAngle;
  this.deltaAngle = deltaAngle;
  this.finished = false;
}

rotationAnimation.prototype.animate = function(frameCount) {
  camera.rotation.y += this.deltaAngle * frameCount;
  
  if ((this.deltaAngle < 0 && camera.rotation.y <= this.targetAngle) || (this.deltaAngle > 0 && camera.rotation.y >= this.targetAngle)) {
    if (this.targetAngle >= Math.PI * 2 || this.targetAngle <= Math.PI * -2) {
      this.targetAngle = 0;
    }

    camera.rotation.y = this.targetAngle;
    this.finished = true;
  }
}

function rampAnimation(frameDistance, deltaY, minHeight, maxHeight) {
  this.ticks = 0;
  this.frameDistance = frameDistance;
  this.deltaY = deltaY;
  this.minHeight = minHeight;
  this.maxHeight = maxHeight;
  this.finished = false;
}

rampAnimation.prototype.animate = function(frameCount) {
  if (camera.position.y >= this.minHeight && camera.position.y <= this.maxHeight) {
    camera.position.y += this.deltaY * frameCount;
  }
  if (camera.position.y < this.minHeight) {
    camera.position.y = this.minHeight;
  }  
  if (camera.position.y > this.maxHeight) {
    camera.position.y = this.maxHeight;
  }

  this.ticks += frameCount;
  if (this.ticks > this.frameDistance) {
    this.finished = true;
  }
}

function hoverAnimation() {
  var frameDistance = (Math.random() * 300) + 300;
  var deltaY = (camera.position.y > 0.5) ? -0.05 : 0.05;

  this.rampAnimation = new rampAnimation(frameDistance, deltaY, 0.5, 15);
  this.finished = false;
}

hoverAnimation.prototype.animate = function(frameCount) {
  this.rampAnimation.animate(frameCount);
  this.finished = this.rampAnimation.finished;
}

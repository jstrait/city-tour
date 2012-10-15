var CAMERA_Z_DELTA = 0.2;
var SWOOP_DESCENT_DELTA = 0.01;

var deltaX = 0.0;
var deltaZ = CAMERA_Z_DELTA;
var rotation_progress = 0.0;
var rotation_target = 0;
var pathIndex = 0;
var targetX;
var targetGridX;
var targetZ;
var targetGridZ;
var targetAngle = 0;
var ROTATION_DELTA = 0.03;
var deltaAngle = ROTATION_DELTA;
var RIGHT_ANGLE = Math.PI / 2;
var TARGET_FRAME_WINDOW = 1000 / 60;   // 60 frames per second

var animator = new swoopAnimation();
var hoverAnimator;
var previousFrameTimestamp;

function animate() {
  var currentTimestamp = new Date().getTime();
  if (previousFrameTimestamp == undefined) {
    frameCount = 1;
  }
  else {
    frameCount = Math.floor((currentTimestamp - previousFrameTimestamp) / TARGET_FRAME_WINDOW);
    if (frameCount < 1) {
      frameCount = 1;
    }
  }
  previousFrameTimestamp = currentTimestamp;

  animator.animate(frameCount);
  if (hoverAnimator != undefined) {
    hoverAnimator.animate(frameCount);
    if (hoverAnimator.finished) {
      hoverAnimator = new hoverAnimation();
    }
  }

  if (animator.finished == true) {
    if (animator instanceof swoopAnimation) {
      animator = new rotationAnimation();
      hoverAnimator = new hoverAnimation();
    }
    else if (animator instanceof forwardAnimation) {
      animator = new rotationAnimation();
    }
    else if (animator instanceof rotationAnimation) {
      animator = new forwardAnimation();
    }
  }

  renderer.render(scene, camera);
  requestAnimFrame(animate);
}

function swoopAnimation() {
  this.finished = false;
}

swoopAnimation.prototype.animate = function(frameCount) {
  camera.position.y -= SWOOP_DESCENT_DELTA * frameCount;
  camera.position.z -= deltaZ * frameCount;

  if (camera.position.z <= (city.HALF_SCENE_DEPTH + (city.STREET_WIDTH / 2))) {
    camera.position.z = city.HALF_SCENE_DEPTH + (city.STREET_WIDTH / 2);

    this.finished = true;
  }
}

function forwardAnimation() {
  this.finished = false;
}

forwardAnimation.prototype.animate = function(frameCount) {
  camera.position.x += deltaX * frameCount;
  camera.position.z += deltaZ * frameCount;

  if ((deltaX < 0 && camera.position.x < targetX) || (deltaX > 0 && camera.position.x > targetX) ||
      (deltaZ < 0 && camera.position.z < targetZ) || (deltaZ > 0 && camera.position.z > targetZ)) {
    camera.position.x = targetX;
    camera.position.z = targetZ;

    this.finished = true;
  }
}

function rotationAnimation() {
  if (targetX == undefined || targetZ == undefined) {
    targetGridX = 0;
    targetGridZ = -1;

    targetX = (targetGridX * city.BLOCK_WIDTH) + (targetGridX * city.STREET_WIDTH);
    targetZ = (targetGridZ * city.BLOCK_WIDTH) + (targetGridZ * city.STREET_WIDTH);
  }
  else {
    var oldTargetGridX = targetGridX;
    var oldTargetGridZ = targetGridZ;

    while (oldTargetGridX == targetGridX && oldTargetGridZ == targetGridZ) {
      if (deltaX == 0) {
        targetGridX = Math.floor(Math.random() * city.BLOCK_ROWS) - (city.BLOCK_ROWS / 2);
      }
      else if (deltaZ == 0) {
        targetGridZ = Math.floor(Math.random() * city.BLOCK_COLUMNS) - (city.BLOCK_COLUMNS / 2);
      }
    }

    targetX = (targetGridX * city.BLOCK_WIDTH) + (targetGridX * city.STREET_WIDTH);
    targetZ = (targetGridZ * city.BLOCK_WIDTH) + (targetGridZ * city.STREET_WIDTH);

  }
  
  deltaX = (camera.position.x == targetX) ? 0 : 0.2;
  deltaZ = (camera.position.z == targetZ) ? 0 : 0.2;
  deltaX *= (camera.position.x > targetX) ? -1 : 1;
  deltaZ *= (camera.position.z > targetZ) ? -1 : 1;

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

  this.finished = false;
}

rotationAnimation.prototype.animate = function(frameCount) {
  camera.rotation.y += deltaAngle * frameCount;
  
  if ((deltaAngle < 0 && camera.rotation.y <= targetAngle) || (deltaAngle > 0 && camera.rotation.y >= targetAngle)) {
    if (targetAngle >= Math.PI * 2 || targetAngle <= Math.PI * -2) {
      targetAngle = 0;
    }

    camera.rotation.y = targetAngle;
    this.finished = true;
  }
}

function hoverAnimation() {
  this.targetDistance = (Math.random() * 300) + 300;
  this.ticks = 0;
  this.deltaY = (camera.position.y > 0.5) ? -0.05 : 0.05;
  this.minHeight = 0.5;
  this.maxHeight = 15;
  this.finished = false;
}

hoverAnimation.prototype.animate = function(frameCount) {
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

  if (this.ticks > this.targetDistance) {
    this.finished = true;
  }
}

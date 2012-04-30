var CAMERA_Z_DELTA = 0.2;
var CAMERA_X_DELTA = 0.2;
var SWOOP_DESCENT_DELTA = 0.01;
var SWOOP_SPEED_DELTA = 0.00003;
var PATH = [[0, -1], [-10, -1], [-10, -8], [10, -8], [10, 8], [14, 8], [14, 11], [0, 11]];

var deltaX = 0.0;
var deltaZ = CAMERA_Z_DELTA;
var rotation_progress = 0.0;
var rotation_target = 0;
var pathIndex = 0;
var targetX;
var targetZ;
var targetAngle = 0;
var ROTATION_DELTA = 0.03;
var deltaAngle = ROTATION_DELTA;
var RIGHT_ANGLE = Math.PI / 2;

var animator = new swoopAnimation();
var hoverAnimator;
function animate() {
  animator.animate();
  if (hoverAnimator != undefined) {
    hoverAnimator.animate();
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

swoopAnimation.prototype.animate = function() {
  camera.position.y -= SWOOP_DESCENT_DELTA;
  camera.position.z -= deltaZ;

  if (camera.position.z <= (HALF_SCENE_DEPTH + (STREET_WIDTH / 2))) {
    camera.position.z = HALF_SCENE_DEPTH + (STREET_WIDTH / 2);
    this.finished = true;
  }
}

function forwardAnimation() {
  this.finished = false;
}

forwardAnimation.prototype.animate = function() {
  camera.position.x += deltaX;
  camera.position.z += deltaZ;

  if ((deltaX < 0 && camera.position.x < targetX) || (deltaX > 0 && camera.position.x > targetX) ||
      (deltaZ < 0 && camera.position.z < targetZ) || (deltaZ > 0 && camera.position.z > targetZ)) {
    pathIndex += 1;
    if (pathIndex >= PATH.length) {
      pathIndex = 0;
    }

    camera.position.x = targetX;
    camera.position.z = targetZ;

    this.finished = true;
  }
}

function rotationAnimation() {
  targetX = (PATH[pathIndex][0] * BLOCK_WIDTH) + (PATH[pathIndex][0] * STREET_WIDTH);
  targetZ = (PATH[pathIndex][1] * BLOCK_WIDTH) + (PATH[pathIndex][1] * STREET_WIDTH);
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

rotationAnimation.prototype.animate = function() {
  camera.rotation.y += deltaAngle;
  
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

hoverAnimation.prototype.animate = function() {
  if (camera.position.y >= this.minHeight && camera.position.y <= this.maxHeight) {
    camera.position.y += this.deltaY;
  }
  if (camera.position.y < this.minHeight) {
    camera.position.y = this.minHeight;
  }  
  if (camera.position.y > this.maxHeight) {
    camera.position.y = this.maxHeight;
  }

  this.ticks += 1;

  if (this.ticks > this.targetDistance) {
    this.finished = true;
  }
}

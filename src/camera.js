"use strict";

var CityTour = CityTour || {};

CityTour.PathFinder = function() {
  var targetMapX = 0.0;
  var targetMapZ = 0.0;
  var deltaX = 0.0;
  var deltaZ = 1.0;

  var determineNextTargetPoint = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;

    while (oldTargetMapX === targetMapX && oldTargetMapZ === targetMapZ) {
      if (deltaX === 0.0) {
        targetMapX = Math.floor(Math.random() * CityTour.Config.BLOCK_ROWS) - CityTour.Config.HALF_BLOCK_ROWS;
      }
      else if (deltaZ === 0.0) {
        targetMapZ = Math.floor(Math.random() * CityTour.Config.BLOCK_COLUMNS) - CityTour.Config.HALF_BLOCK_COLUMNS;
      }
    }

    deltaX = (deltaX === 0.0) ? 1.0 : 0.0;
    deltaZ = (deltaZ === 0.0) ? 1.0 : 0.0;
  };

  var pathFinder = {};

  pathFinder.targetMapX = function() { return targetMapX; };
  pathFinder.targetMapZ = function() { return targetMapZ; };

  pathFinder.nextTarget = function() {
    determineNextTargetPoint();
  };

  return pathFinder;
};

CityTour.DijktrasPathFinder = function(roadNetwork) {
  var subTargetMapX = 0;
  var subTargetMapZ = 0;

  var targetMapX = 0;
  var targetMapZ = 0;

  var chooseNewTarget = function() {
    var newTargetMapX = Number.POSITIVE_INFINITY;
    var newTargetMapZ = Number.POSITIVE_INFINITY;

    while (!roadNetwork.hasIntersection(newTargetMapX, newTargetMapZ)) {
      newTargetMapX = (Math.round(Math.random() * CityTour.Config.BLOCK_COLUMNS)) - CityTour.Config.HALF_BLOCK_COLUMNS;
      newTargetMapZ = (Math.round(Math.random() * CityTour.Config.BLOCK_ROWS)) - CityTour.Config.HALF_BLOCK_ROWS;
    }

    return [newTargetMapX, newTargetMapZ];
  };

  var generatePath = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;

    var newTargetCoordinates = chooseNewTarget();
    var newTargetMapX = newTargetCoordinates[0];
    var newTargetMapZ = newTargetCoordinates[1];

    var Node = function(x, z) {
      return {
        isVisited: false,
        distance:  Number.POSITIVE_INFINITY,
        previous:  null,
        x:         x,
        z:         z,
      };
    };

    var nodes = [];
    var unvisitedSet = new Set();
    var x, z;

    for (x = -CityTour.Config.HALF_BLOCK_COLUMNS; x <= CityTour.Config.HALF_BLOCK_COLUMNS; x++) {
      nodes[x] = [];
      for (z = -CityTour.Config.HALF_BLOCK_ROWS; z <= CityTour.Config.HALF_BLOCK_ROWS; z++) {
        nodes[x][z] = new Node(x, z);
      }
    }

    x = oldTargetMapX;
    z = oldTargetMapZ;
    var currentNode, adjacentNode;
    var shortestLength, shortestIndex;

    currentNode = nodes[x][z];
    currentNode.distance = 0;
    var iterations = 0;

    while((x != newTargetMapX || z != newTargetMapZ) && iterations < 2000) {
      currentNode = nodes[x][z];

      if (roadNetwork.hasEdgeBetween(x, z, x, z + 1)) {
        adjacentNode = nodes[x][z + 1];
        if (!adjacentNode.isVisited) {
          adjacentNode.distance = Math.min(currentNode.distance + 1, adjacentNode.distance);
          adjacentNode.previous = [x, z];
          unvisitedSet.add(adjacentNode);
        }
      }

      if (roadNetwork.hasEdgeBetween(x, z, x + 1, z)) {
        adjacentNode = nodes[x + 1][z];
        if (!adjacentNode.isVisited) {
          adjacentNode.distance = Math.min(currentNode.distance + 1, adjacentNode.distance);
          adjacentNode.previous = [x, z];
          unvisitedSet.add(adjacentNode);
        }
      }

      if (roadNetwork.hasEdgeBetween(x, z, x, z - 1)) {
        adjacentNode = nodes[x][z - 1];
        if (!adjacentNode.isVisited) {
          adjacentNode.distance = Math.min(currentNode.distance + 1, adjacentNode.distance);
          adjacentNode.previous = [x, z];
          unvisitedSet.add(adjacentNode);
        }
      }

      if (roadNetwork.hasEdgeBetween(x, z, x - 1, z)) {
        adjacentNode = nodes[x - 1][z];
        if (!adjacentNode.isVisited) {
          adjacentNode.distance = Math.min(currentNode.distance + 1, adjacentNode.distance);
          adjacentNode.previous = [x, z];
          unvisitedSet.add(adjacentNode);
        }
      }

      currentNode.isVisited = true;
      unvisitedSet.delete(currentNode);

      shortestLength = Number.POSITIVE_INFINITY;
      unvisitedSet.forEach(function(n) {
        if (n.distance < shortestLength) {
          shortestLength = n.distance;
          shortestIndex = [n.x, n.z];
        }
      });

      x = shortestIndex[0];
      z = shortestIndex[1];
      iterations += 1;
    }

    var path = [[x, z]];
    currentNode = nodes[x][z];
    var previous;
    while (currentNode.previous) {
      previous = currentNode.previous;
      path.unshift([previous[0], previous[1]]);
      
      currentNode = nodes[previous[0]][previous[1]];
    }

    return path;
  };

  var path = [];

  var dijktrasPathFinder = {};

  dijktrasPathFinder.targetMapX = function() { return subTargetMapX; };
  dijktrasPathFinder.targetMapZ = function() { return subTargetMapZ; };

  dijktrasPathFinder.nextTarget = function() {
    if (path.length === 0) {
      path = generatePath();
    }

    var nextTargetPoint = path.splice(0, 1);
    subTargetMapX = nextTargetPoint[0][0];
    subTargetMapZ = nextTargetPoint[0][1];
  };

  return dijktrasPathFinder;
};

CityTour.HorizontalAnimationController = function(cameraPole, roadNetwork) {
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

  var pathFinder = new CityTour.DijktrasPathFinder(roadNetwork);

  var determineNextTargetPoint = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;
    
    pathFinder.nextTarget();
    targetMapX = pathFinder.targetMapX();
    targetMapZ = pathFinder.targetMapZ();
    targetSceneX = CityTour.Coordinates.mapXToSceneX(targetMapX);
    targetSceneZ = CityTour.Coordinates.mapZToSceneZ(targetMapZ);

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

  var horizontalAnimationController = {};

  horizontalAnimationController.targetSceneX = function() { return targetSceneX; };
  horizontalAnimationController.targetMapX = function() { return targetMapX; };
  horizontalAnimationController.targetSceneZ = function() { return targetSceneZ; };
  horizontalAnimationController.targetMapZ = function() { return targetMapZ; };
  horizontalAnimationController.deltaX  = function() { return deltaX; };
  horizontalAnimationController.deltaZ  = function() { return deltaZ; };
  horizontalAnimationController.targetAngle = function() { return targetAngle; };
  horizontalAnimationController.deltaAngle = function() { return deltaAngle; };

  horizontalAnimationController.nextTarget = function() {
    determineNextTargetPoint();
    determineRotationAngle();
  };

  return horizontalAnimationController;
};

CityTour.AnimationManager = function(terrain, roadNetwork, cameraPole, camera) {
  var animationManager = {};
  var animators = [];

  var horizontalAnimationController  = new CityTour.HorizontalAnimationController(cameraPole, roadNetwork);

  var init = function() {
    var START_X = 0;
    var START_Y = 40;
    var SWOOP_DISTANCE_IN_BLOCKS = 20;

    var furthestOutIntersection = CityTour.Config.HALF_BLOCK_ROWS;
    while (!roadNetwork.hasIntersection(0, furthestOutIntersection)) {
      furthestOutIntersection -= 1;
    }

    var startZ = furthestOutIntersection + SWOOP_DISTANCE_IN_BLOCKS;
    var distanceToCityEdge = SWOOP_DISTANCE_IN_BLOCKS * CityTour.Config.BLOCK_AND_STREET_DEPTH;

    cameraPole.position.x = START_X;
    cameraPole.position.y = START_Y;
    cameraPole.position.z = startZ * CityTour.Config.BLOCK_AND_STREET_DEPTH;

    var framesUntilCityEdge = Math.abs(distanceToCityEdge / horizontalAnimationController.deltaZ());
    var terrainHeightAtTouchdown = terrain.heightAtCoordinates(0.0, furthestOutIntersection) + 0.5;
    var swoopDescentDelta = (START_Y - terrainHeightAtTouchdown) / framesUntilCityEdge;

    var vertical = new CityTour.verticalAnimation(cameraPole, camera, terrainHeightAtTouchdown + 0.5, swoopDescentDelta);
    var forward = new CityTour.forwardAnimation(cameraPole, horizontalAnimationController.targetSceneX(), horizontalAnimationController.deltaX(), horizontalAnimationController.targetSceneZ(), horizontalAnimationController.deltaZ());
    var debugBirdseye = new CityTour.debugBirdsEyeAnimation(cameraPole, camera);
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
          if (animator instanceof CityTour.forwardAnimation) {
            horizontalAnimationController.nextTarget();
            newAnimators.push(new CityTour.rotationAnimation(cameraPole, horizontalAnimationController.targetAngle(), horizontalAnimationController.deltaAngle()));
          }
          else if (animator instanceof CityTour.rotationAnimation) {
            newAnimators.push(new CityTour.forwardAnimation(cameraPole, horizontalAnimationController.targetSceneX(), horizontalAnimationController.deltaX(), horizontalAnimationController.targetSceneZ(), horizontalAnimationController.deltaZ()));
          }
        }
        else {
          newAnimators.push(animator);
        }
      });
      animators = newAnimators;
    }

    var mapX = CityTour.Coordinates.sceneXToMapX(cameraPole.position.x);
    var mapZ = CityTour.Coordinates.sceneZToMapZ(cameraPole.position.z);

    var y = terrain.heightAtCoordinates(mapX, mapZ);
    cameraPole.position.y = Math.max(cameraPole.position.y, y + 0.5);
  };

  return animationManager;
};


CityTour.verticalAnimation = function(cameraPole, camera, targetY, yDelta) {
  this.cameraPole = cameraPole;
  this.camera = camera;
  this.targetY = targetY;
  this.yDelta = yDelta;
  this.targetAngle = 0.0;
  this.angleDelta = 0.0155140377955;
  this.framesInCurrentMode = 0;
  this.framesUntilTarget = 1500;
  this.mode = 'initial_swoop';
  this.finished = false;
}

CityTour.verticalAnimation.prototype.animate = function() {
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
    else if (this.mode === 'hovering' || this.mode === 'initial_swoop') {
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


CityTour.forwardAnimation = function(cameraPole, targetX, deltaX, targetZ, deltaZ) {
  this.cameraPole = cameraPole;
  this.targetX = targetX;
  this.deltaX = deltaX;
  this.targetZ = targetZ;
  this.deltaZ = deltaZ;
  this.finished = false;
}

CityTour.forwardAnimation.prototype.animate = function() {
  this.cameraPole.position.x += this.deltaX;
  this.cameraPole.position.z += this.deltaZ;

  if ((this.deltaX < 0 && this.cameraPole.position.x < this.targetX) || (this.deltaX > 0 && this.cameraPole.position.x > this.targetX) ||
      (this.deltaZ < 0 && this.cameraPole.position.z < this.targetZ) || (this.deltaZ > 0 && this.cameraPole.position.z > this.targetZ)) {
    this.cameraPole.position.x = this.targetX;
    this.cameraPole.position.z = this.targetZ;

    this.finished = true;
  }
};

CityTour.rotationAnimation = function(cameraPole, targetAngle, deltaAngle) {
  this.cameraPole = cameraPole;
  this.targetAngle = targetAngle;
  this.deltaAngle = deltaAngle;
  this.finished = false;
}

CityTour.rotationAnimation.prototype.animate = function() {
  this.cameraPole.rotation.y += this.deltaAngle;
  
  if ((this.deltaAngle < 0 && this.cameraPole.rotation.y <= this.targetAngle) || (this.deltaAngle > 0 && this.cameraPole.rotation.y >= this.targetAngle)) {
    if (this.targetAngle >= Math.PI * 2 || this.targetAngle <= Math.PI * -2) {
      this.targetAngle = 0;
    }

    this.cameraPole.rotation.y = this.targetAngle;
    this.finished = true;
  }
};

CityTour.debugBirdsEyeAnimation = function(camera) {
  this.camera = camera;
  this.finished = false;
};

CityTour.debugBirdsEyeAnimation.prototype.animate = function() {
  this.camera.position.x = 0;
  this.camera.position.y = 900;
  this.camera.position.z = 0;
  this.camera.rotation.x = -(Math.PI / 2);
};

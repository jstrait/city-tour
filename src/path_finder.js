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
  var Node = function(x, z) {
    return {
      isVisited: false,
      distance:  Number.POSITIVE_INFINITY,
      previous:  null,
      x:         x,
      z:         z,
    };
  };

  var chooseNewTarget = function() {
    var newTargetMapX = Number.POSITIVE_INFINITY;
    var newTargetMapZ = Number.POSITIVE_INFINITY;

    while (!roadNetwork.hasIntersection(newTargetMapX, newTargetMapZ)) {
      newTargetMapX = (Math.round(Math.random() * CityTour.Config.BLOCK_COLUMNS)) - CityTour.Config.HALF_BLOCK_COLUMNS;
      newTargetMapZ = (Math.round(Math.random() * CityTour.Config.BLOCK_ROWS)) - CityTour.Config.HALF_BLOCK_ROWS;
    }

    return [newTargetMapX, newTargetMapZ];
  };

  var extractShortestPath = function(nodes, endX, endZ) {
    var path = [];
    var currentNode = nodes[endX][endZ];
    var previous;

    while (currentNode.previous) {
      path.unshift([currentNode.x, currentNode.z]);

      previous = currentNode.previous;
      currentNode = nodes[previous[0]][previous[1]];
    }

    return path;
  };

  var evaluateNodeConnections = function(currentNode, nodes, unvisitedSet) {
    var x = currentNode.x;
    var z = currentNode.z;
    var adjacentNode, candidateDistance;

    if (roadNetwork.hasEdgeBetween(x, z, x, z + 1)) {
      adjacentNode = nodes[x][z + 1];

      if (!adjacentNode) {
        adjacentNode = new Node(x, z + 1);
        nodes[x][z + 1] = adjacentNode;
        unvisitedSet.add(adjacentNode);
      }
      if (!adjacentNode.isVisited) {
        candidateDistance = currentNode.distance + 1;
        if (candidateDistance < adjacentNode.distance) {
          adjacentNode.distance = candidateDistance;
          adjacentNode.previous = [x, z];
        }
      }
    }

    if (roadNetwork.hasEdgeBetween(x, z, x + 1, z)) {
      adjacentNode = nodes[x + 1][z];

      if (!adjacentNode) {
        adjacentNode = new Node(x + 1, z);
        nodes[x + 1][z] = adjacentNode;
        unvisitedSet.add(adjacentNode);
      }
      if (!adjacentNode.isVisited) {
        candidateDistance = currentNode.distance + 1;
        if (candidateDistance < adjacentNode.distance) {
          adjacentNode.distance = candidateDistance;
          adjacentNode.previous = [x, z];
        }
      }
    }

    if (roadNetwork.hasEdgeBetween(x, z, x, z - 1)) {
      adjacentNode = nodes[x][z - 1];

      if (!adjacentNode) {
        adjacentNode = new Node(x, z - 1);
        nodes[x][z - 1] = adjacentNode;
        unvisitedSet.add(adjacentNode);
      }
      if (!adjacentNode.isVisited) {
        candidateDistance = currentNode.distance + 1;
        if (candidateDistance < adjacentNode.distance) {
          adjacentNode.distance = candidateDistance;
          adjacentNode.previous = [x, z];
        }
      }
    }

    if (roadNetwork.hasEdgeBetween(x, z, x - 1, z)) {
      adjacentNode = nodes[x - 1][z];

      if (!adjacentNode) {
        adjacentNode = new Node(x - 1, z);
        nodes[x - 1][z] = adjacentNode;
        unvisitedSet.add(adjacentNode);
      }
      if (!adjacentNode.isVisited) {
        candidateDistance = currentNode.distance + 1;
        if (candidateDistance < adjacentNode.distance) {
          adjacentNode.distance = candidateDistance;
          adjacentNode.previous = [x, z];
        }
      }
    }

    currentNode.isVisited = true;
  };

  var unvisitedNodeWithShortestLength = function(unvisitedSet) {
    var shortestLength = Number.POSITIVE_INFINITY;
    var shortestLengthNode = null;

    unvisitedSet.forEach(function(node) {
      if (node.distance < shortestLength) {
        shortestLength = node.distance;
        shortestLengthNode = node;
      }
    });

    return shortestLengthNode;
  };

  var findShortestPath = function(startX, startZ, endX, endZ) {
    var nodes = [];
    var unvisitedSet = new Set();
    var x;

    for (x = -CityTour.Config.HALF_BLOCK_COLUMNS; x <= CityTour.Config.HALF_BLOCK_COLUMNS; x++) {
      nodes[x] = [];
    }

    var currentNode;

    nodes[startX][startZ] = new Node(startX, startZ);
    currentNode = nodes[startX][startZ];
    currentNode.distance = 0;
    var iterations = 0;

    while((currentNode.x != endX || currentNode.z != endZ) && iterations < 2000) {
      evaluateNodeConnections(currentNode, nodes, unvisitedSet); 
      unvisitedSet.delete(currentNode);

      currentNode = unvisitedNodeWithShortestLength(unvisitedSet);
      iterations += 1;
    }

    var path = extractShortestPath(nodes, endX, endZ);

    return path;
  };

  var targetMapX = 0;
  var targetMapZ = 0;
  var subTargetMapX = 0;
  var subTargetMapZ = 0;

  var path = [];

  var dijktrasPathFinder = {};

  dijktrasPathFinder.targetMapX = function() { return subTargetMapX; };
  dijktrasPathFinder.targetMapZ = function() { return subTargetMapZ; };

  dijktrasPathFinder.nextTarget = function() {
    if (path.length === 0) {
      var newTargetCoordinates = chooseNewTarget();
      path = findShortestPath(targetMapX, targetMapZ, newTargetCoordinates[0], newTargetCoordinates[1]);

      targetMapX = newTargetCoordinates[0];
      targetMapZ = newTargetCoordinates[1];
    }

    var nextTargetPoint = path.splice(0, 1);
    subTargetMapX = nextTargetPoint[0][0];
    subTargetMapZ = nextTargetPoint[0][1];
  };

  return dijktrasPathFinder;
};

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
    var adjacentNode;

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
  };

  var unvisitedNodeWithShortestLength = function(unvisitedSet) {
    var shortestLength = Number.POSITIVE_INFINITY;
    var shortestIndex = null;

    unvisitedSet.forEach(function(node) {
      if (node.distance < shortestLength) {
        shortestLength = node.distance;
        shortestIndex = [node.x, node.z];
      }
    });

    return shortestIndex;
  };

  var generatePath = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;

    var newTargetCoordinates = chooseNewTarget();
    targetMapX = newTargetCoordinates[0];
    targetMapZ = newTargetCoordinates[1];

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

    while((x != targetMapX || z != targetMapZ) && iterations < 2000) {
      currentNode = nodes[x][z];

      evaluateNodeConnections(currentNode, nodes, unvisitedSet); 
      unvisitedSet.delete(currentNode);

      shortestIndex = unvisitedNodeWithShortestLength(unvisitedSet);
      x = shortestIndex[0];
      z = shortestIndex[1];
      iterations += 1;
    }

    var path = extractShortestPath(nodes, targetMapX, targetMapZ);

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
      path = generatePath();
    }

    var nextTargetPoint = path.splice(0, 1);
    subTargetMapX = nextTargetPoint[0][0];
    subTargetMapZ = nextTargetPoint[0][1];
  };

  return dijktrasPathFinder;
};

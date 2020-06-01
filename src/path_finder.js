"use strict";

/*
   Finds shortest path between intersections in the road network,
   using Dijkstra's Algorithm.
*/
var PathFinder = function(roadNetwork) {
  var Node = function(x, z) {
    return {
      isVisited: false,
      distance:  Number.POSITIVE_INFINITY,
      previous:  undefined,
      x:         x,
      z:         z,
    };
  };

  var extractShortestPath = function(nodes, endX, endZ) {
    var path = [];
    var currentNode = nodes[endX][endZ];
    var previous;

    while (currentNode.previous !== undefined) {
      path.unshift({x: currentNode.x, z: currentNode.z});

      previous = currentNode.previous;
      currentNode = nodes[previous[0]][previous[1]];
    }

    return path;
  };

  var evaluateNodeConnections = function(currentNode, nodes, unvisitedSet) {
    var i;
    var x = currentNode.x;
    var z = currentNode.z;
    var edgesFromNode = roadNetwork.edgesFrom(x, z);
    var adjacentX, adjacentZ, adjacentEdge;
    var adjacentNode, candidateDistance;

    for (i = 0; i < edgesFromNode.length; i++) {
      adjacentX = edgesFromNode[i].destinationX;
      adjacentZ = edgesFromNode[i].destinationZ;
      adjacentEdge = edgesFromNode[i].edge;
      adjacentNode = nodes[adjacentX][adjacentZ];

      if (adjacentNode === undefined) {
        adjacentNode = new Node(adjacentX, adjacentZ);
        nodes[adjacentX][adjacentZ] = adjacentNode;
        unvisitedSet.add(adjacentNode);
      }

      if (!adjacentNode.isVisited) {
        candidateDistance = currentNode.distance + adjacentEdge.distance;
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
    var shortestLengthNode = undefined;

    unvisitedSet.forEach(function(node) {
      if (node.distance < shortestLength) {
        shortestLength = node.distance;
        shortestLengthNode = node;
      }
    });

    return shortestLengthNode;
  };

  var shortestPath = function(startX, startZ, endX, endZ, targetPredicate) {
    var nodes = [];
    var currentNode;
    var unvisitedSet = new Set();
    var x;

    if (!roadNetwork.hasIntersection(startX, startZ)) {
      return undefined;
    }

    if (targetPredicate === undefined) {
      targetPredicate = function(x, z) {
        return x === endX && z === endZ;
      };
    }

    for (x = roadNetwork.minBoundingX(); x <= roadNetwork.maxBoundingX(); x++) {
      nodes[x] = [];
    }

    nodes[startX][startZ] = new Node(startX, startZ);
    currentNode = nodes[startX][startZ];
    currentNode.distance = 0;

    while(!targetPredicate(currentNode.x, currentNode.z)) {
      evaluateNodeConnections(currentNode, nodes, unvisitedSet);
      unvisitedSet.delete(currentNode);

      currentNode = unvisitedNodeWithShortestLength(unvisitedSet);
      if (currentNode === undefined) {
        return undefined;
      }
    }

    return extractShortestPath(nodes, currentNode.x, currentNode.z);
  };


  return {
    shortestPath: shortestPath,
  };
};

export { PathFinder };

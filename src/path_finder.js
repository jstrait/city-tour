"use strict";

var CityTour = CityTour || {};


/*
   Finds shortest path between intersections in the road network,
   using Dijkstra's Algorithm.
*/
CityTour.PathFinder = function(roadNetwork) {
  var Node = function(x, z) {
    return {
      isVisited: false,
      distance:  Number.POSITIVE_INFINITY,
      previous:  null,
      x:         x,
      z:         z,
    };
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

    var evaluateAdjacentNode = function(adjacentX, adjacentZ) {
      var adjacentNode, candidateDistance;
    
      if (roadNetwork.hasEdgeBetween(x, z, adjacentX, adjacentZ)) {
        adjacentNode = nodes[adjacentX][adjacentZ];

        if (!adjacentNode) {
          adjacentNode = new Node(adjacentX, adjacentZ);
          nodes[adjacentX][adjacentZ] = adjacentNode;
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
    };

    evaluateAdjacentNode(x - 1, z);
    evaluateAdjacentNode(x + 1, z);
    evaluateAdjacentNode(x, z - 1);
    evaluateAdjacentNode(x, z + 1);

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

  var shortestPath = function(startX, startZ, endX, endZ) {
    var nodes = [];
    var unvisitedSet = new Set();
    var x;

    for (x = roadNetwork.minColumn(); x <= roadNetwork.maxColumn(); x++) {
      nodes[x] = [];
    }

    var currentNode;

    nodes[startX][startZ] = new Node(startX, startZ);
    currentNode = nodes[startX][startZ];
    currentNode.distance = 0;

    while(currentNode.x != endX || currentNode.z != endZ) {
      evaluateNodeConnections(currentNode, nodes, unvisitedSet); 
      unvisitedSet.delete(currentNode);

      currentNode = unvisitedNodeWithShortestLength(unvisitedSet);
    }

    return extractShortestPath(nodes, endX, endZ);
  };


  var pathFinder = {};

  pathFinder.shortestPath = shortestPath;

  return pathFinder;
};

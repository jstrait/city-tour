"use strict";

var RoadIntersection = function(mapX, mapZ) {
  var edges = [];

  var indexOfEdge = function(mapX, mapZ) {
    var i;

    for (i = 0; i < edges.length; i++) {
      if (edges[i][0] === mapX && edges[i][1] === mapZ) {
        return i;
      }
    }

    return -1;
  };

  var roadIntersection = {};

  roadIntersection.addEdge = function(mapX, mapZ) {
    if (indexOfEdge(mapX, mapZ) === -1) {
      edges.push([mapX, mapZ]);
    }
  };

  roadIntersection.removeEdge = function(mapX, mapZ) {
    var index = indexOfEdge(mapX, mapZ);

    if (index !== -1) {
      edges.splice(index, 1);
    }
  };

  roadIntersection.hasPathTo = function(mapX, mapZ) {
    return indexOfEdge(mapX, mapZ) > -1;
  };

  roadIntersection.isEmpty = function() {
    return edges.length === 0;
  };

  return roadIntersection;
};


var BaseRoadNetwork = function() {
  var network = [];

  var roadNetwork = {};

  roadNetwork.hasIntersection = function(mapX, mapZ) {
    return network[[mapX, mapZ]] != null;
  };

  roadNetwork.setIntersectionAt = function(mapX, mapZ, roadIntersection) {
    network[[mapX, mapZ]] = roadIntersection;
  };

  roadNetwork.intersectionAt = function(mapX, mapZ) {
    return network[[mapX, mapZ]];
  };

  roadNetwork.hasEdgeBetween = function(mapX1, mapZ1, mapX2, mapZ2) {
    var roadIntersection1, roadIntersection2;

    roadIntersection1 = network[[mapX1, mapZ1]];
    roadIntersection2 = network[[mapX2, mapZ2]];

    return roadIntersection1 && roadIntersection2 &&
           roadIntersection1.hasPathTo(mapX2, mapZ2) && roadIntersection2.hasPathTo(mapX1, mapZ1);
  };

  return roadNetwork;
};


var AdditiveRoadNetwork = function(terrain, minColumn, maxColumn, minRow, maxRow) {
  var baseRoadNetwork = new BaseRoadNetwork();

  var init = function() {
    var roadIntersection = new RoadIntersection(0, 0);
    baseRoadNetwork.setIntersectionAt(0, 0, roadIntersection);
    branchFromIntersection(0, 0);
  };

  var calculateBlockProbabilityOfBranching = function(mapX, mapZ) {
    var PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS = 0.4;
    
    var distanceToCityEdge = Math.min(CityConfig.HALF_BLOCK_COLUMNS, CityConfig.HALF_BLOCK_ROWS);
    var distanceFromCenter = Math.sqrt((mapX * mapX) + (mapZ * mapZ));
    var percentageFromCenter = (distanceFromCenter / distanceToCityEdge);
    var normalizedPercentageFromCenter;

    if (percentageFromCenter >= PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS) {
      var safeFromDecayDistance = distanceToCityEdge * PERCENTAGE_DISTANCE_THAT_DECAY_BEGINS;
      normalizedPercentageFromCenter = (distanceFromCenter - safeFromDecayDistance) / (distanceToCityEdge - safeFromDecayDistance);
    }
    else {
      normalizedPercentageFromCenter = 0.0;
    }

    return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
  };

  var branchFromIntersection = function(mapX, mapZ) {
    var targetMapX, targetMapZ;
    var roadIntersection = baseRoadNetwork.intersectionAt(mapX, mapZ);

    targetMapX = mapX - 1;
    targetMapZ = mapZ;
    connectIntersections(roadIntersection, mapX, mapZ, targetMapX, targetMapZ);

    targetMapX = mapX;
    targetMapZ = mapZ - 1;
    connectIntersections(roadIntersection, mapX, mapZ, targetMapX, targetMapZ);

    targetMapX = mapX + 1;
    targetMapZ = mapZ;
    connectIntersections(roadIntersection, mapX, mapZ, targetMapX, targetMapZ);

    targetMapX = mapX;
    targetMapZ = mapZ + 1;
    connectIntersections(roadIntersection, mapX, mapZ, targetMapX, targetMapZ);
  };

  var connectIntersections = function(roadIntersection, mapX, mapZ, targetMapX, targetMapZ) {
    var MAX_STEEPNESS = Math.PI / 6;
    var PROBABILITY = calculateBlockProbabilityOfBranching(mapX, mapZ);

    var heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
    var heightAtPoint2 = terrain.heightAtCoordinates(targetMapX, targetMapZ);
    var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityConfig.BLOCK_DEPTH);
    var terrainTooSteep = (Math.abs(angle) > MAX_STEEPNESS);

    var random = Math.random();

    if (random < PROBABILITY && !terrainTooSteep) {
      if (roadNetwork.hasIntersection(targetMapX, targetMapZ)) {
        roadIntersection.addEdge(targetMapX, targetMapZ);
        roadNetwork.intersectionAt(targetMapX, targetMapZ).addEdge(mapX, mapZ);
      }
      else {
        baseRoadNetwork.setIntersectionAt(targetMapX, targetMapZ, new RoadIntersection(targetMapX, targetMapZ));
        roadIntersection.addEdge(targetMapX, targetMapZ);
        roadNetwork.intersectionAt(targetMapX, targetMapZ).addEdge(mapX, mapZ);
        branchFromIntersection(targetMapX, targetMapZ);
      }
    }
  };

  var roadNetwork = {};

  roadNetwork.hasIntersection = baseRoadNetwork.hasIntersection;
  roadNetwork.intersectionAt = baseRoadNetwork.intersectionAt;
  roadNetwork.hasEdgeBetween = baseRoadNetwork.hasEdgeBetween;

  roadNetwork.pruneSteepEdges = function(terrain) { };
  roadNetwork.pruneHorizontalEdgesWithNoBuildings = function(buildings) { };
  roadNetwork.pruneVerticalEdgesWithNoBuildings = function(buildings) { };

  init();

  return roadNetwork;
};



var SubtractiveRoadNetwork = function(terrain, minColumn, maxColumn, minRow, maxRow) {
  var baseRoadNetwork = new BaseRoadNetwork();

  var init = function() {
    var x, z, roadIntersection;

    for (x = minColumn; x <= maxColumn; x++) {
      for (z = minRow; z <= maxRow; z++) {
        roadIntersection = new RoadIntersection(x, z);

        if (x > minColumn) {
          roadIntersection.addEdge(x - 1, z);
        }
        if (x < maxColumn) {
          roadIntersection.addEdge(x + 1, z);
        }
        if (z > minRow) {
          roadIntersection.addEdge(x, z - 1);
        }
        if (z < maxRow) {
          roadIntersection.addEdge(x, z + 1);
        }

        baseRoadNetwork.setIntersectionAt(x, z, roadIntersection);
      }
    }
  };

  init();

  var removeEdge = function(mapX1, mapZ1, mapX2, mapZ2) {
    var roadIntersection;

    roadIntersection = baseRoadNetwork.intersectionAt(mapX1, mapZ1);
    if (roadIntersection) {
      roadIntersection.removeEdge(mapX2, mapZ2);

      if (roadIntersection.isEmpty()) {
        baseRoadNetwork.setIntersectionAt(mapX1, mapZ1, null);
      }
    }

    roadIntersection = baseRoadNetwork.intersectionAt(mapX2, mapZ2);
    if (roadIntersection) {
      roadIntersection.removeEdge(mapX1, mapZ1);

      if (roadIntersection.isEmpty()) {
        baseRoadNetwork.setIntersectionAt(mapX2, mapZ2, null);
      }
    }
  };

  var roadNetwork = {};

  roadNetwork.hasIntersection = baseRoadNetwork.hasIntersection;
  roadNetwork.intersectionAt = baseRoadNetwork.intersectionAt;
  roadNetwork.hasEdgeBetween = baseRoadNetwork.hasEdgeBetween;

  roadNetwork.removeEdge = removeEdge;

  roadNetwork.pruneSteepEdges = function(terrain) {
    var mapX, mapZ;
    var roadIntersection;
    var heightAtPoint1, heightAtPoint2, angle;
    var MAX_STEEPNESS = Math.PI / 6;

    for (mapX = minColumn; mapX <= maxColumn; mapX++) {
      for (mapZ = minRow; mapZ <= maxRow; mapZ++) {
        heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
        heightAtPoint2 = terrain.heightAtCoordinates(mapX, mapZ - 1);
        angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityConfig.BLOCK_DEPTH);
        if (Math.abs(angle) > MAX_STEEPNESS) {
          removeEdge(mapX, mapZ, mapX, mapZ - 1);
        }

        heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
        heightAtPoint2 = terrain.heightAtCoordinates(mapX, mapZ + 1);
        angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityConfig.BLOCK_DEPTH);
        if (Math.abs(angle) > MAX_STEEPNESS) {
          removeEdge(mapX, mapZ, mapX, mapZ + 1);
        }

        heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
        heightAtPoint2 = terrain.heightAtCoordinates(mapX - 1, mapZ);
        angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityConfig.BLOCK_DEPTH);
        if (Math.abs(angle) > MAX_STEEPNESS) {
          removeEdge(mapX, mapZ, mapX - 1, mapZ);
        }

        heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
        heightAtPoint2 = terrain.heightAtCoordinates(mapX + 1, mapZ);
        angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityConfig.BLOCK_DEPTH);
        if (Math.abs(angle) > MAX_STEEPNESS) {
          removeEdge(mapX, mapZ, mapX + 1, mapZ);
        }
      }
    }
  };

  roadNetwork.pruneHorizontalEdgesWithNoBuildings = function(buildings) {
    var mapX, mapZ;
    var edgeHasBuildings;
    var blockAbove, blockBelow;
    var blockAboveHasBuildings, blockBelowHasBuildings;
    var roadIntersection;

    for (mapZ = minRow; mapZ <= maxRow; mapZ++) {
      mapX = minColumn;
      edgeHasBuildings = false;

      while (mapX < maxColumn && !edgeHasBuildings) {
        blockAboveHasBuildings = false;
        if (mapZ > minRow) {
          blockAbove = buildings.blockAtCoordinates(mapX, mapZ - 1);
          blockAbove.forEach(function(building) {
            if (building.bottom === 1.0) {
              blockAboveHasBuildings = true;
            }
          });
        }

        blockBelowHasBuildings = false;
        if (mapZ < maxRow) {
          blockBelow = buildings.blockAtCoordinates(mapX, mapZ);
          blockBelow.forEach(function(building) {
            if (building.top === 0.0) {
              blockBelowHasBuildings = true;
            }
          });
        }

        edgeHasBuildings = blockAboveHasBuildings || blockBelowHasBuildings;

        if (!edgeHasBuildings) {
          removeEdge(mapX, mapZ, mapX + 1, mapZ);
        }

        mapX += 1;
      }

      mapX = maxColumn;
      edgeHasBuildings = false;

      while (mapX > minColumn && !edgeHasBuildings) {
        blockAboveHasBuildings = false;
        if (mapZ > minRow) {
          blockAbove = buildings.blockAtCoordinates(mapX - 1, mapZ - 1);
          blockAbove.forEach(function(building) {
            if (building.bottom === 1.0) {
              blockAboveHasBuildings = true;
            }
          });
        }

        blockBelowHasBuildings = false;
        if (mapZ < maxRow) {
          blockBelow = buildings.blockAtCoordinates(mapX - 1, mapZ);
          blockBelow.forEach(function(building) {
            if (building.top === 0.0) {
              blockBelowHasBuildings = true;
            }
          });
        }

        edgeHasBuildings = blockAboveHasBuildings || blockBelowHasBuildings;

        if (!edgeHasBuildings) {
          removeEdge(mapX, mapZ, mapX - 1, mapZ);
        }

        mapX -= 1;
      }
    }
  };

  roadNetwork.pruneVerticalEdgesWithNoBuildings = function(buildings) {
    var mapX, mapZ;
    var edgeHasBuildings;
    var blockLeft, blockRight;
    var blockLeftHasBuildings, blockRightHasBuildings;
    var roadIntersection;

    for (mapX = minColumn; mapX <= maxColumn; mapX++) {
      mapZ = minRow;
      edgeHasBuildings = false;

      while (mapZ < maxRow && !edgeHasBuildings) {
        blockLeftHasBuildings = false;
        if (mapX > minColumn) {
          blockLeft = buildings.blockAtCoordinates(mapX - 1, mapZ);
          blockLeft.forEach(function(building) {
            if (building.right === 1.0) {
              blockLeftHasBuildings = true;
            }
          });
        }

        blockRightHasBuildings = false;
        if (mapX < maxColumn) {
          blockRight = buildings.blockAtCoordinates(mapX, mapZ);
          blockRight.forEach(function(building) {
            if (building.left === 0.0) {
              blockRightHasBuildings = true;
            }
          });
        }

        edgeHasBuildings = blockLeftHasBuildings || blockRightHasBuildings;

        if (!edgeHasBuildings) {
          removeEdge(mapX, mapZ, mapX, mapZ + 1);
        }

        mapZ += 1;
      }

      mapZ = maxRow - 1;
      edgeHasBuildings = false;

      while (mapZ > minRow && !edgeHasBuildings) {
        blockLeftHasBuildings = false;
        if (mapX > minColumn) {
          blockLeft = buildings.blockAtCoordinates(mapX - 1, mapZ);
          blockLeft.forEach(function(building) {
            if (building.right === 1.0) {
              blockLeftHasBuildings = true;
            }
          });
        }

        blockRightHasBuildings = false;
        if (mapX < maxColumn) {
          blockRight = buildings.blockAtCoordinates(mapX, mapZ);
          blockRight.forEach(function(building) {
            if (building.left === 0.0) {
              blockRightHasBuildings = true;
            }
          });
        }

        edgeHasBuildings = blockLeftHasBuildings || blockRightHasBuildings;

        if (!edgeHasBuildings) {
          removeEdge(mapX, mapZ, mapX, mapZ + 1);
        }

        mapZ -= 1;
      }
    }
  };

  return roadNetwork;
};

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


var RoadNetwork = function(minColumn, maxColumn, minRow, maxRow) {
  var network = [];

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

        network[[x, z]] = roadIntersection;
      }
    }
  };

  init();

  var removeEdge = function(mapX1, mapZ1, mapX2, mapZ2) {
    var roadIntersection;

    roadIntersection = network[[mapX1, mapZ1]]
    if (roadIntersection) {
      roadIntersection.removeEdge(mapX2, mapZ2);

      if (roadIntersection.isEmpty()) {
        network[[mapX1, mapZ1]] = null;
      }
    }

    roadIntersection = network[[mapX2, mapZ2]];
    if (roadIntersection) {
      roadIntersection.removeEdge(mapX1, mapZ1);

      if (roadIntersection.isEmpty()) {
        network[[mapX2, mapZ2]] = null;
      }
    }
  };

  var roadNetwork = {};

  roadNetwork.hasIntersection = function(mapX, mapZ) {
    return network[[mapX, mapZ]] != null;
  };

  roadNetwork.intersectionAt = function(mapX, mapZ) {
    return network[[mapX, mapZ]];
  };

  roadNetwork.hasEdgeBetween = function(mapX1, mapZ1, mapX2, mapZ2) {
    var roadIntersection1, roadIntersection2;

    roadIntersection1 = network[[mapX1, mapZ1]];
    roadIntersection2 = network[[mapX2, mapZ2]];

    return roadIntersection1.hasPathTo(mapX2, mapZ2) && roadIntersection2.hasPathTo(mapX1, mapZ1);
  };

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

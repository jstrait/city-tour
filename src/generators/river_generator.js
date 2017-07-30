"use strict";

var CityTour = CityTour || {};

CityTour.RiverGenerator = (function() {
  var generateRiverCurves = function(middleRow, columnsToGenerate) {
    var SUB_DIVISIONS = 1;
    var MIN_RIVER_BENDS = 3;
    var MAX_RIVER_BENDS = 8;
    var MAX_BEND_AMOUNT = 20 * SUB_DIVISIONS;
    var TOP_BANK_OFFSET = 4 * SUB_DIVISIONS;
    var BOTTOM_BANK_OFFSET = 12 * SUB_DIVISIONS;
    var TOP_BANK_MAX_JITTER = 6 * SUB_DIVISIONS;
    var HALF_TOP_BANK_MAX_JITTER = TOP_BANK_MAX_JITTER / 2;
    var BOTTOM_BANK_MAX_JITTER = 6 * SUB_DIVISIONS;
    var HALF_BOTTOM_BANK_MAX_JITTER = BOTTOM_BANK_MAX_JITTER / 2;

    var i;
    var baseCurvePoints, topCurvePoints, bottomCurvePoints;
    var randomJitter;
    var baseCurve, topCurve, bottomCurve;

    var riverSubDivisions = Math.round((Math.random() * (MAX_RIVER_BENDS - MIN_RIVER_BENDS))) + MIN_RIVER_BENDS;
    baseCurvePoints = [new THREE.Vector2(0, middleRow)];
    for (i = 1; i <= riverSubDivisions; i++) {
      var column = columnsToGenerate * i * (1 / riverSubDivisions);
      baseCurvePoints.push(new THREE.Vector2(column, middleRow + ((Math.random() * MAX_BEND_AMOUNT) - (MAX_BEND_AMOUNT / 2))));
    }
    baseCurve = new THREE.SplineCurve(baseCurvePoints);

    topCurvePoints = [];
    bottomCurvePoints = [];
    for (i = 0; i < baseCurvePoints.length; i++) {
      randomJitter = Math.round(((Math.random() * TOP_BANK_MAX_JITTER) - HALF_TOP_BANK_MAX_JITTER));
      topCurvePoints.push(new THREE.Vector2(baseCurvePoints[i].x, baseCurvePoints[i].y + TOP_BANK_OFFSET + randomJitter));

      randomJitter = Math.round(((Math.random() * BOTTOM_BANK_MAX_JITTER) - HALF_BOTTOM_BANK_MAX_JITTER));
      bottomCurvePoints.push(new THREE.Vector2(baseCurvePoints[i].x, baseCurvePoints[i].y + BOTTOM_BANK_OFFSET + randomJitter));
    }

    topCurve = new THREE.SplineCurve(topCurvePoints);
    bottomCurve = new THREE.SplineCurve(bottomCurvePoints);

    return { topCurve: topCurve, bottomCurve: bottomCurve, };
  };


  var addRiver = function(terrainCoordinates, middleRow, columnsToGenerate) {
    var x, z, xStep;
    var xCoordinate, zCoordinate;
    var minimumRiverBankHeight;
    var vector, topVector, bottomVector;

    var riverCurves = generateRiverCurves(middleRow, columnsToGenerate);
    var topCurve = riverCurves.topCurve;
    var bottomCurve = riverCurves.bottomCurve;

    xStep = 1 / columnsToGenerate;

    // Find the lowest point on the north river bank
    minimumRiverBankHeight = Number.POSITIVE_INFINITY;
    for (x = 0.0; x <= 1.0; x += xStep) {
      vector = topCurve.getPointAt(x);
      xCoordinate = Math.round(vector.x);
      zCoordinate = Math.round(vector.y);

      if (terrainCoordinates[xCoordinate][zCoordinate].height < minimumRiverBankHeight) {
        minimumRiverBankHeight = terrainCoordinates[xCoordinate][zCoordinate].height;
      }
    }
    // Find the lowest point on the south river bank
    for (x = 0.0; x <= 1.0; x += xStep) {
      vector = bottomCurve.getPointAt(x);
      xCoordinate = Math.round(vector.x);
      zCoordinate = Math.round(vector.y);

      if (terrainCoordinates[xCoordinate][zCoordinate].height < minimumRiverBankHeight) {
        minimumRiverBankHeight = terrainCoordinates[xCoordinate][zCoordinate].height;
      }
    }
    // Set every terrain point between the two river banks to same height as the lowest point
    for (x = 0.0; x <= 1.0; x += xStep / 2) {
      topVector = topCurve.getPointAt(x);
      bottomVector = bottomCurve.getPointAt(x);
      xCoordinate = Math.round(topVector.x);

      for (z = Math.ceil(topVector.y); z < bottomVector.y; z++) {
        terrainCoordinates[xCoordinate][z].height = minimumRiverBankHeight;
      }
    }
    // Fill the river with water
    floodFill(terrainCoordinates, 0, topCurve.getPointAt(0.0).y, minimumRiverBankHeight, CityTour.Terrain.WATER);

    erodeNorthRiverBank(terrainCoordinates, topCurve, minimumRiverBankHeight, xStep);
  };


  var erodeNorthRiverBank = function(terrainCoordinates, riverBankCurve, riverBankHeight, xStep) {
    var MAX_HEIGHT_INCREASE = 1.0;
    var MAX_HEIGHT_DECREASE = -0.5;
    var MIN_EROSION_DISTANCE_AWAY_FROM_RIVERBANK = 16;
    var MIN_EROSION_DISTANCE_AWAY_FROM_RIVERBANK = 25;

    var i, x;
    var xCoordinate, zCoordinate;
    var vector;
    var baseHeight;
    var newHeight;
    var depth;
    var heightIncreaseAmount;
    var previousX = -1;

    baseHeight = riverBankHeight;
    depth = Math.round(CityTour.Math.lerp(MIN_EROSION_DISTANCE_AWAY_FROM_RIVERBANK,
                                          MIN_EROSION_DISTANCE_AWAY_FROM_RIVERBANK,
                                          Math.random()));
    for (i = 1; i < depth; i++) {
      heightIncreaseAmount = CityTour.Math.lerp(0.0, MAX_HEIGHT_INCREASE, Math.random());
      baseHeight += heightIncreaseAmount;
      previousX = -1;

      for (x = 0.0; x <= 1.0; x += xStep / 2) {
        vector = riverBankCurve.getPointAt(x);
        xCoordinate = Math.round(vector.x);

        if (xCoordinate > previousX) {
          zCoordinate = Math.ceil(vector.y) - i;

          newHeight = baseHeight + heightIncreaseAmount + CityTour.Math.lerp(MAX_HEIGHT_DECREASE, MAX_HEIGHT_INCREASE, Math.random());

          if (newHeight < terrainCoordinates[xCoordinate][zCoordinate].height) {
            terrainCoordinates[xCoordinate][zCoordinate].height = newHeight;
          }
        }
      }

      previousX = xCoordinate;
    }
  };


  var floodFill = function(terrainCoordinates, x, z, height, material) {
    terrainCoordinates[x][z].height = height;
    terrainCoordinates[x][z].material = material;

    if (terrainCoordinates[x - 1] &&
        terrainCoordinates[x - 1][z] &&
        terrainCoordinates[x - 1][z].height <= height &&
        terrainCoordinates[x - 1][z].material != material) {
      floodFill(terrainCoordinates, x - 1, z, height, material);
    }
    if (terrainCoordinates[x + 1] &&
        terrainCoordinates[x + 1][z] &&
        terrainCoordinates[x + 1][z].height <= height &&
        terrainCoordinates[x + 1][z].material != material) {
      floodFill(terrainCoordinates, x + 1, z, height, material);
    }
    if (terrainCoordinates[x] &&
        terrainCoordinates[x][z - 1] &&
        terrainCoordinates[x][z - 1].height <= height &&
        terrainCoordinates[x][z - 1].material != material) {
      floodFill(terrainCoordinates, x, z - 1, height, material);
    }
    if (terrainCoordinates[x] &&
        terrainCoordinates[x][z + 1] &&
        terrainCoordinates[x][z + 1].height <= height &&
        terrainCoordinates[x][z + 1].material != material) {
      floodFill(terrainCoordinates, x, z + 1, height, material);
    }
  };


  return {
    addRiver: addRiver,
  };
})();

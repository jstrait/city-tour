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
    var topCurve, bottomCurve;

    var riverSubDivisions = Math.round((Math.random() * (MAX_RIVER_BENDS - MIN_RIVER_BENDS))) + MIN_RIVER_BENDS;
    baseCurvePoints = [new THREE.Vector2(0, middleRow)];
    for (i = 1; i <= riverSubDivisions; i++) {
      var column = columnsToGenerate * i * (1 / riverSubDivisions);
      baseCurvePoints.push(new THREE.Vector2(column, middleRow + ((Math.random() * MAX_BEND_AMOUNT) - (MAX_BEND_AMOUNT / 2))));
    }

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
    var WATER_HEIGHT = 5.0;

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

      if (terrainCoordinates[xCoordinate][zCoordinate].landHeight < minimumRiverBankHeight) {
        minimumRiverBankHeight = terrainCoordinates[xCoordinate][zCoordinate].landHeight;
      }
    }
    // Find the lowest point on the south river bank
    for (x = 0.0; x <= 1.0; x += xStep) {
      vector = bottomCurve.getPointAt(x);
      xCoordinate = Math.round(vector.x);
      zCoordinate = Math.round(vector.y);

      if (terrainCoordinates[xCoordinate][zCoordinate].landHeight < minimumRiverBankHeight) {
        minimumRiverBankHeight = terrainCoordinates[xCoordinate][zCoordinate].landHeight;
      }
    }
    // Set every terrain point between the two river banks to same height as the lowest point
    for (x = 0.0; x <= 1.0; x += xStep / 2) {
      topVector = topCurve.getPointAt(x);
      bottomVector = bottomCurve.getPointAt(x);
      xCoordinate = Math.round(topVector.x);

      for (z = Math.ceil(topVector.y); z < bottomVector.y; z++) {
        terrainCoordinates[xCoordinate][z].landHeight = minimumRiverBankHeight - WATER_HEIGHT;
        terrainCoordinates[xCoordinate][z].waterHeight = WATER_HEIGHT;
      }
    }
  };

  var floodFill = function(terrainCoordinates, x, z, height, material) {
    terrainCoordinates[x][z].landHeight = height;
    terrainCoordinates[x][z].material = material;

    if (terrainCoordinates[x - 1] &&
        terrainCoordinates[x - 1][z] &&
        terrainCoordinates[x - 1][z].landHeight <= height &&
        terrainCoordinates[x - 1][z].material != material) {
      floodFill(terrainCoordinates, x - 1, z, height, material);
    }
    if (terrainCoordinates[x + 1] &&
        terrainCoordinates[x + 1][z] &&
        terrainCoordinates[x + 1][z].landHeight <= height &&
        terrainCoordinates[x + 1][z].material != material) {
      floodFill(terrainCoordinates, x + 1, z, height, material);
    }
    if (terrainCoordinates[x] &&
        terrainCoordinates[x][z - 1] &&
        terrainCoordinates[x][z - 1].landHeight <= height &&
        terrainCoordinates[x][z - 1].material != material) {
      floodFill(terrainCoordinates, x, z - 1, height, material);
    }
    if (terrainCoordinates[x] &&
        terrainCoordinates[x][z + 1] &&
        terrainCoordinates[x][z + 1].landHeight <= height &&
        terrainCoordinates[x][z + 1].material != material) {
      floodFill(terrainCoordinates, x, z + 1, height, material);
    }
  };


  return {
    addRiver: addRiver,
  };
})();

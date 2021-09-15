"use strict";

import * as THREE from "three";

import { CityTourMath } from "./../../math";

var RiverGenerator = (function() {
  var SUB_DIVISIONS = 1;
  var MIN_RIVER_BENDS = 2;
  var MAX_RIVER_BENDS = 7;
  var MAX_BEND_AMOUNT = 20 * SUB_DIVISIONS;
  var TOP_BANK_OFFSET = 4 * SUB_DIVISIONS;
  var BOTTOM_BANK_OFFSET = 12 * SUB_DIVISIONS;
  var TOP_BANK_MAX_JITTER = 6 * SUB_DIVISIONS;
  var BOTTOM_BANK_MAX_JITTER = 6 * SUB_DIVISIONS;
  var WATER_HEIGHT = 0.416666666666667;

  var generateBaseRiverCurvePoints = function(middleRow, columnsToGenerate) {
    var riverBendCount = CityTourMath.randomInteger(MIN_RIVER_BENDS, MAX_RIVER_BENDS);
    var columnsBetweenBends = columnsToGenerate / (riverBendCount + 1);
    var column, row;
    var i;

    var baseCurvePoints = [new THREE.Vector2(0, middleRow)];

    for (i = 1; i <= riverBendCount + 1; i++) {
      column = i * columnsBetweenBends;
      row = middleRow + ((Math.random() * MAX_BEND_AMOUNT) - (MAX_BEND_AMOUNT / 2));
      baseCurvePoints.push(new THREE.Vector2(column, row));
    }

    return baseCurvePoints;
  };

  var generateOffsetCurvePoints = function(baseCurvePoints, offset, maxJitter) {
    var i;
    var randomJitter;
    var halfMaxJitter = maxJitter / 2;
    var offsetCurvePoints = [];

    for (i = 0; i < baseCurvePoints.length; i++) {
      randomJitter = Math.round(((Math.random() * maxJitter) - halfMaxJitter));
      offsetCurvePoints.push(new THREE.Vector2(baseCurvePoints[i].x, baseCurvePoints[i].y + offset + randomJitter));
    }

    return offsetCurvePoints;
  };

  var generateRiverCurves = function(middleRow, columnsToGenerate) {
    var baseCurvePoints, topCurvePoints, bottomCurvePoints;
    var topCurve, bottomCurve;

    // Generate reference curve representing the middle of the river
    baseCurvePoints = generateBaseRiverCurvePoints(middleRow, columnsToGenerate);

    // Generate top/bottom river banks offset from this curve, with random jitter
    topCurvePoints = generateOffsetCurvePoints(baseCurvePoints, TOP_BANK_OFFSET, TOP_BANK_MAX_JITTER);
    bottomCurvePoints = generateOffsetCurvePoints(baseCurvePoints, BOTTOM_BANK_OFFSET, BOTTOM_BANK_MAX_JITTER);

    // Convert control points into splines
    topCurve = new THREE.SplineCurve(topCurvePoints);
    bottomCurve = new THREE.SplineCurve(bottomCurvePoints);

    return { topCurve: topCurve, bottomCurve: bottomCurve, };
  };

  var lowestHeightOnRiverBank = function(riverBankCurve, terrainCoordinates, xStep) {
    var vector;
    var x, xCoordinate, zCoordinate;
    var minimumRiverBankHeight = Number.POSITIVE_INFINITY;

    for (x = 0.0; x <= 1.0; x += xStep) {
      vector = riverBankCurve.getPointAt(x);
      xCoordinate = Math.round(vector.x);
      zCoordinate = Math.round(vector.y);

      if (terrainCoordinates[xCoordinate][zCoordinate].landHeight < minimumRiverBankHeight) {
        minimumRiverBankHeight = terrainCoordinates[xCoordinate][zCoordinate].landHeight;
      }
    }

    return minimumRiverBankHeight;
  };

  var addRiver = function(terrainCoordinates, middleRow, columnsToGenerate) {
    var x, z, xCoordinate;
    var topVector, bottomVector;
    var xStep = 1 / columnsToGenerate;

    var riverCurves = generateRiverCurves(middleRow, columnsToGenerate);
    var topCurve = riverCurves.topCurve;
    var bottomCurve = riverCurves.bottomCurve;

    var minimumRiverBankHeight = Math.min(lowestHeightOnRiverBank(topCurve, terrainCoordinates, xStep),
                                          lowestHeightOnRiverBank(bottomCurve, terrainCoordinates, xStep));

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


  return {
    addRiver: addRiver,
  };
})();

export { RiverGenerator };

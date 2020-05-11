"use strict";

var DiamondSquareGenerator = (function() {
  // As described at https://en.wikipedia.org/wiki/Diamond-square_algorithm and http://stevelosh.com/blog/2016/06/diamond-square/
  var generate = function(terrainCoordinates, jitterAmount, jitterDecay, top, right, bottom, left) {
    var x, y, startX = 0;
    var jitter;
    var halfJitterAmount = jitterAmount / 2;
    var terms;

    var leftDiamondHeight, topDiamondHeight, rightDiamondHeight, bottomDiamondHeight;

    var width = right - left;
    var height = bottom - top;
    var halfWidth = width / 2;
    var halfHeight = height / 2;

    while(width >= 2) {
      // Square step
      for (x = left; x < right; x += width) {
        for (y = top; y < bottom; y += height) {
          jitter = (Math.random() * jitterAmount) - halfJitterAmount;
          terrainCoordinates[x + halfWidth][y + halfHeight].landHeight = ((terrainCoordinates[x][y].landHeight +
                                                                         terrainCoordinates[x + width][y].landHeight +
                                                                         terrainCoordinates[x][y + height].landHeight +
                                                                         terrainCoordinates[x + width][y + height].landHeight) / 4) + jitter;
        }
      }

      startX = 0;

      // Diamond step
      for (y = top; y <= bottom; y += halfHeight) {
        if (startX === 0) {
          startX = halfWidth;
        }
        else {
          startX = 0;
        }

        for (x = startX; x <= right; x += width) {
          terms = 4;

          if (x === left) {
            leftDiamondHeight = 0;
            terms -= 1;
          }
          else {
            leftDiamondHeight = terrainCoordinates[x - halfWidth][y].landHeight;
          }

          if (y === top) {
            topDiamondHeight = 0;
            terms -= 1;
          }
          else {
            topDiamondHeight = terrainCoordinates[x][y - halfHeight].landHeight;
          }

          if (x === right) {
            rightDiamondHeight = 0;
            terms -= 1;
          }
          else {
            rightDiamondHeight = terrainCoordinates[x + halfWidth][y].landHeight;
          }

          if (y === bottom) {
            bottomDiamondHeight = 0;
            terms -= 1;
          }
          else {
            bottomDiamondHeight = terrainCoordinates[x][y + halfHeight].landHeight;
          }

          jitter = (Math.random() * jitterAmount) - halfJitterAmount;
          terrainCoordinates[x][y].landHeight = ((leftDiamondHeight + topDiamondHeight + rightDiamondHeight + bottomDiamondHeight) / terms) + jitter;
        }
      }

      width /= 2;
      halfWidth = width / 2;
      height /= 2;
      halfHeight = height / 2;
      jitterAmount *= jitterDecay;
      halfJitterAmount = jitterAmount / 2;
    }
  };


  return {
    generate: generate,
  };
})();

export { DiamondSquareGenerator };

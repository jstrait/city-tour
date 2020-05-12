"use strict";

import { CityTourMath } from "./../src/math";

describe("CityTourMath", function() {
  describe(".lerp()", function() {
    it("returns the correct results when min/max are in standard order, and percentage is in range", function() {
      expect(CityTourMath.lerp(1, 3, 0.0)).toBe(1);
      expect(CityTourMath.lerp(1, 3, 0.5)).toBe(2);
      expect(CityTourMath.lerp(1, 3, 1.0)).toBe(3);
      expect(CityTourMath.lerp(1, 4, 0.5)).toBe(2.5);
      expect(CityTourMath.lerp(-2, 2, 0.5)).toBe(0);
      expect(CityTourMath.lerp(2, 2, 0.0)).toBe(2);
      expect(CityTourMath.lerp(2, 2, 0.5)).toBe(2);
      expect(CityTourMath.lerp(2, 2, 1.0)).toBe(2);
      expect(CityTourMath.lerp(-10, -5, 0.0)).toBe(-10);
      expect(CityTourMath.lerp(-10, -5, 0.5)).toBe(-7.5);
      expect(CityTourMath.lerp(-10, -5, 1.0)).toBe(-5);
    });

    // Although taking advantage of this will possibly make code confusing,
    // the value of 'min' can be greater than 'max' and the interpolation
    // will still work.
    it("returns the correct results when min/max are switched", function() {
      expect(CityTourMath.lerp(3, 1, 0.0)).toBe(3);
      expect(CityTourMath.lerp(3, 1, 0.5)).toBe(2);
      expect(CityTourMath.lerp(3, 1, 1.0)).toBe(1);
      expect(CityTourMath.lerp(4, 1, 0.5)).toBe(2.5);
      expect(CityTourMath.lerp(2, -2, 0.5)).toBe(0);
      expect(CityTourMath.lerp(-5, -10, 0.0)).toBe(-5);
      expect(CityTourMath.lerp(-5, -10, 0.5)).toBe(-7.5);
      expect(CityTourMath.lerp(-5, -10, 1.0)).toBe(-10);
    });
  });

  describe(".distanceBetweenPoints", function() {
    it("returns the correct value for a horizontal segment", function() {
      expect(CityTourMath.distanceBetweenPoints(2, 3, 14, 3)).toBe(12);
      expect(CityTourMath.distanceBetweenPoints(14, 3, 2, 3)).toBe(12);
      expect(CityTourMath.distanceBetweenPoints(2, 3, -10, 3)).toBe(12);
      expect(CityTourMath.distanceBetweenPoints(-2, 3, 10, 3)).toBe(12);
      expect(CityTourMath.distanceBetweenPoints(-2, 3, -14, 3)).toBe(12);
      expect(CityTourMath.distanceBetweenPoints(-14, 3, -2, 3)).toBe(12);
    });

    it("returns the correct value for a vertical segment", function() {
      expect(CityTourMath.distanceBetweenPoints(2, 3, 2, 15)).toBe(12);
      expect(CityTourMath.distanceBetweenPoints(2, 15, 2, 3)).toBe(12);
      expect(CityTourMath.distanceBetweenPoints(2, 3, 2, -9)).toBe(12);
      expect(CityTourMath.distanceBetweenPoints(2, -3, 2, 9)).toBe(12);
      expect(CityTourMath.distanceBetweenPoints(2, -3, 2, -15)).toBe(12);
      expect(CityTourMath.distanceBetweenPoints(2, -15, 2, -3)).toBe(12);
    });

    it("returns 0 if both points are the same", function() {
      expect(CityTourMath.distanceBetweenPoints(2, 3, 2, 3)).toBe(0);
      expect(CityTourMath.distanceBetweenPoints(-2, -3, -2, -3)).toBe(0);
    });

    it("returns the correct value for a non-level segment", function() {
      expect(CityTourMath.distanceBetweenPoints(0, 0, 1, 1)).toBe(Math.sqrt(2));
    });
  });
});

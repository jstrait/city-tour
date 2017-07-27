"use strict";

describe("CityTour.ClampedLinearMotionGenerator", function() {
  describe("upward motion", function() {
    it("target is larger than start, no clamping", function() {
      var clampedLinearMotionGenerator = new CityTour.ClampedLinearMotionGenerator(10, 30, 5);

      expect(clampedLinearMotionGenerator.next()).toBe(15);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(20);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(25);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(30);
      expect(clampedLinearMotionGenerator.finished()).toBe(true);

      expect(clampedLinearMotionGenerator.next()).toBe(30);
      expect(clampedLinearMotionGenerator.finished()).toBe(true);
    });

    it("target is larger than start, final value is clamped", function() {
      var clampedLinearMotionGenerator = new CityTour.ClampedLinearMotionGenerator(10, 30, 12);

      expect(clampedLinearMotionGenerator.next()).toBe(22);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(30);
      expect(clampedLinearMotionGenerator.finished()).toBe(true);

      expect(clampedLinearMotionGenerator.next()).toBe(30);
      expect(clampedLinearMotionGenerator.finished()).toBe(true);
    });

    it("target is Infinity, can never be reached", function() {
      var clampedLinearMotionGenerator = new CityTour.ClampedLinearMotionGenerator(10, Number.POSITIVE_INFINITY, 5);

      expect(clampedLinearMotionGenerator.next()).toBe(15);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(20);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(25);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(30);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(35);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(40);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(45);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);
    });
  });

  describe("downward motion", function() {
    it("target is smaller than start, no clamping", function() {
      var clampedLinearMotionGenerator = new CityTour.ClampedLinearMotionGenerator(30, 10, 5);

      expect(clampedLinearMotionGenerator.next()).toBe(25);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(20);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(15);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(10);
      expect(clampedLinearMotionGenerator.finished()).toBe(true);

      expect(clampedLinearMotionGenerator.next()).toBe(10);
      expect(clampedLinearMotionGenerator.finished()).toBe(true);
    });

    it("target is smaller than start, final value is clamped", function() {
      var clampedLinearMotionGenerator = new CityTour.ClampedLinearMotionGenerator(30, 10, 12);

      expect(clampedLinearMotionGenerator.next()).toBe(18);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(10);
      expect(clampedLinearMotionGenerator.finished()).toBe(true);

      expect(clampedLinearMotionGenerator.next()).toBe(10);
      expect(clampedLinearMotionGenerator.finished()).toBe(true);
    });

    it("target is negative Infinity, can never be reached", function() {
      var clampedLinearMotionGenerator = new CityTour.ClampedLinearMotionGenerator(30, Number.NEGATIVE_INFINITY, 5);

      expect(clampedLinearMotionGenerator.next()).toBe(25);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(20);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(15);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(10);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(5);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(0);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(-5);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);
    });
  });


  describe("confusing/unexpected behavior", function() {
    // This test captures the existing behavior, which is not necessarily ideal
    it("non-Integer delta causes target to be reached later than expected", function() {
      var clampedLinearMotionGenerator = new CityTour.ClampedLinearMotionGenerator(4, 5, (1 / 3));

      expect(clampedLinearMotionGenerator.next()).toBe(4.333333333333333);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(4.666666666666666);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      // This would be expected to be 5, but instead it's very close to 5
      expect(clampedLinearMotionGenerator.next()).toBe(4.999999999999999);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(5);
      expect(clampedLinearMotionGenerator.finished()).toBe(true);

      expect(clampedLinearMotionGenerator.next()).toBe(5);
      expect(clampedLinearMotionGenerator.finished()).toBe(true);
    });

    // When going from a smaller start to a larger target, a negative delta will cause
    // the motion to move "backwards" and never reach the target. This seems generally not
    // surprising, but it's not ideal that the function lets you pass in data like this.
    it("negative delta means target is never reached", function() {
      var clampedLinearMotionGenerator = new CityTour.ClampedLinearMotionGenerator(5, 10, -2);

      expect(clampedLinearMotionGenerator.next()).toBe(3);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(1);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(-1);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(-3);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);
    });

    // When going from a larger start to a smaller target, a negative delta will cause
    // the motion to _up_ and never reach the target. This seems very counterintuitive,
    // and not ideal behavior.
    it("negative delta means target is never reached", function() {
      var clampedLinearMotionGenerator = new CityTour.ClampedLinearMotionGenerator(10, 5, -2);

      expect(clampedLinearMotionGenerator.next()).toBe(12);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(14);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(16);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);

      expect(clampedLinearMotionGenerator.next()).toBe(18);
      expect(clampedLinearMotionGenerator.finished()).toBe(false);
    });
  });
});

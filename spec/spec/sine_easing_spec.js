"use strict";


describe("CityTour.SineEasing", function() {
  it("number of frames is a positive integer; moving forward through range", function() {
    var sineEasing = new CityTour.SineEasing(4, 0, Math.PI);

    // PI / 4
    expect(sineEasing.next()).toBe(0.7071067811865475);
    expect(sineEasing.finished()).toBe(false);

    // PI / 2
    expect(sineEasing.next()).toBe(1.0);
    expect(sineEasing.finished()).toBe(false);

    // 3PI / 4
    expect(sineEasing.next()).toBe(0.7071067811865476);
    expect(sineEasing.finished()).toBe(false);

    // PI
    expect(sineEasing.next()).toBeCloseTo(0.0);
    expect(sineEasing.finished()).toBe(true);

    // PI
    expect(sineEasing.next()).toBeCloseTo(0.0);
    expect(sineEasing.finished()).toBe(true);

    // PI
    expect(sineEasing.next()).toBeCloseTo(0.0);
    expect(sineEasing.finished()).toBe(true);
  });

  it("number of frames is a positive integer; moving backwards through range", function() {
    var sineEasing = new CityTour.SineEasing(4, (3 * Math.PI) / 2, Math.PI / 2);

    // 5PI / 4
    expect(sineEasing.next()).toBe(-0.7071067811865475);
    expect(sineEasing.finished()).toBe(false);

    // PI
    expect(sineEasing.next()).toBeCloseTo(0.0);
    expect(sineEasing.finished()).toBe(false);

    // 3PI / 4
    expect(sineEasing.next()).toBe(0.7071067811865476);
    expect(sineEasing.finished()).toBe(false);

    // PI / 2
    expect(sineEasing.next()).toBe(1.0);
    expect(sineEasing.finished()).toBe(true);

    // PI / 2
    expect(sineEasing.next()).toBe(1.0);
    expect(sineEasing.finished()).toBe(true);

    // PI / 2
    expect(sineEasing.next()).toBe(1.0);
    expect(sineEasing.finished()).toBe(true);
  });

  it("number of frames is zero", function() {
    var sineEasing = new CityTour.LinearEasing(0, 0, Math.PI / 2);

    expect(sineEasing.next()).toBe(1.0);
    expect(sineEasing.finished()).toBe(true);

    expect(sineEasing.next()).toBe(1.0);
    expect(sineEasing.finished()).toBe(true);

    expect(sineEasing.next()).toBe(1.0);
    expect(sineEasing.finished()).toBe(true);
  });
});

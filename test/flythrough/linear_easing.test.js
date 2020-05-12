"use strict";

import { LinearEasing } from "./../../src/flythrough/easing";

describe("LinearEasing", function() {
  it("number of frames is a positive integer", function() {
    var linearEasing = new LinearEasing(5);

    expect(linearEasing.next()).toBe(0.2);
    expect(linearEasing.finished()).toBe(false);

    expect(linearEasing.next()).toBe(0.4);
    expect(linearEasing.finished()).toBe(false);

    expect(linearEasing.next()).toBeCloseTo(0.6);
    expect(linearEasing.finished()).toBe(false);

    expect(linearEasing.next()).toBe(0.8);
    expect(linearEasing.finished()).toBe(false);

    expect(linearEasing.next()).toBe(1.0);
    expect(linearEasing.finished()).toBe(true);

    expect(linearEasing.next()).toBe(1.0);
    expect(linearEasing.finished()).toBe(true);

    expect(linearEasing.next()).toBe(1.0);
    expect(linearEasing.finished()).toBe(true);
  });

  it("number of frames is zero", function() {
    var linearEasing = new LinearEasing(0);

    expect(linearEasing.next()).toBe(1.0);
    expect(linearEasing.finished()).toBe(true);

    expect(linearEasing.next()).toBe(1.0);
    expect(linearEasing.finished()).toBe(true);

    expect(linearEasing.next()).toBe(1.0);
    expect(linearEasing.finished()).toBe(true);
  });
});

"use strict";

import { LinearEasing } from "./../../src/flythrough/easing";
import { MotionGenerator } from "./../../src/flythrough/motion_generator";

describe("MotionGenerator", function() {
  it("target is larger than start", function() {
    var linearEasing = new LinearEasing(5);
    var motionGenerator = new MotionGenerator(10, 20, linearEasing);

    expect(motionGenerator.next()).toBe(12);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(14);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(16);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(18);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(20);
    expect(motionGenerator.finished()).toBe(true);

    expect(motionGenerator.next()).toBe(20);
    expect(motionGenerator.finished()).toBe(true);

    expect(motionGenerator.next()).toBe(20);
    expect(motionGenerator.finished()).toBe(true);
  });

  it("target is smaller than start", function() {
    var linearEasing = new LinearEasing(5);
    var motionGenerator = new MotionGenerator(20, 10, linearEasing);

    expect(motionGenerator.next()).toBe(18);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(16);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(14);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(12);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(10);
    expect(motionGenerator.finished()).toBe(true);

    expect(motionGenerator.next()).toBe(10);
    expect(motionGenerator.finished()).toBe(true);

    expect(motionGenerator.next()).toBe(10);
    expect(motionGenerator.finished()).toBe(true);
  });

  it("start and target are the same", function() {
    var linearEasing = new LinearEasing(5);
    var motionGenerator = new MotionGenerator(15, 15, linearEasing);

    expect(motionGenerator.next()).toBe(15);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(15);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(15);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(15);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(15);
    expect(motionGenerator.finished()).toBe(true);

    expect(motionGenerator.next()).toBe(15);
    expect(motionGenerator.finished()).toBe(true);

    expect(motionGenerator.next()).toBe(15);
    expect(motionGenerator.finished()).toBe(true);
  });

  it("start and target are extremely close together", function() {
    var linearEasing = new LinearEasing(5);
    var motionGenerator = new MotionGenerator(64.67822843642034, 64.67822843642035, linearEasing);

    expect(motionGenerator.next()).toBe(64.67822843642034);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(64.67822843642034);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(64.67822843642035);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(64.67822843642035);
    expect(motionGenerator.finished()).toBe(false);

    expect(motionGenerator.next()).toBe(64.67822843642035);
    expect(motionGenerator.finished()).toBe(true);

    expect(motionGenerator.next()).toBe(64.67822843642035);
    expect(motionGenerator.finished()).toBe(true);

    expect(motionGenerator.next()).toBe(64.67822843642035);
    expect(motionGenerator.finished()).toBe(true);
  });
});

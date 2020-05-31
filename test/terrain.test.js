"use strict";

import { Terrain } from "./../src/terrain";

describe("Terrain", function() {
  var terrainMesh = [
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 2.0, waterHeight: 3.0},
      {landHeight: 3.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 4.3, waterHeight: 0.0},
      {landHeight: 5.2, waterHeight: 1.3},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 6.4, waterHeight: 0.4},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
  ];


  describe("size bounds", function() {
    it("returns the correct size bounds at default scale", function() {
      var terrain = new Terrain(terrainMesh, 1);

      expect(terrain.minX()).toBe(-2);
      expect(terrain.maxX()).toBe(2);
      expect(terrain.minZ()).toBe(-2);
      expect(terrain.maxZ()).toBe(2);
    });

    it("returns the correct size bounds at half scale", function() {
      var terrain = new Terrain(terrainMesh, 0.5);

      expect(terrain.minX()).toBe(-1);
      expect(terrain.maxX()).toBe(1);
      expect(terrain.minZ()).toBe(-1);
      expect(terrain.maxZ()).toBe(1);
    });

    it("returns the correct size bounds at quarter scale", function() {
      var terrain = new Terrain(terrainMesh, 0.25);

      expect(terrain.minX()).toBe(-0.5);
      expect(terrain.maxX()).toBe(0.5);
      expect(terrain.minZ()).toBe(-0.5);
      expect(terrain.maxZ()).toBe(0.5);
    });

    it("returns the correct size bounds at quarter scale", function() {
      var terrain = new Terrain(terrainMesh, 2);

      expect(terrain.minX()).toBe(-4);
      expect(terrain.maxX()).toBe(4);
      expect(terrain.minZ()).toBe(-4);
      expect(terrain.maxZ()).toBe(4);
    });
  });


  describe(".landHeightAt", function() {
    describe("default scale", function() {
      var terrain = new Terrain(terrainMesh, 1);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.landHeightAt(-2.0, -2.0)).toBe(0.0);
        expect(terrain.landHeightAt(-1.0, 1.0)).toBe(5.2);
        expect(terrain.landHeightAt(-2.0, 0.0)).toBe(2.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.landHeightAt(-1.0, 0.4)).toBe(4.66);
        expect(terrain.landHeightAt(-0.6, 0.0)).toBe(5.14);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.landHeightAt(10000, 0)).toBeUndefined();
        expect(terrain.landHeightAt(-10000, 0)).toBeUndefined();
        expect(terrain.landHeightAt(0, 10000)).toBeUndefined();
        expect(terrain.landHeightAt(0, -10000)).toBeUndefined();
        expect(terrain.landHeightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.landHeightAt(2.01, 0)).toBeUndefined();
        expect(terrain.landHeightAt(-2.01, 0)).toBeUndefined();
        expect(terrain.landHeightAt(0, 2.01)).toBeUndefined();
        expect(terrain.landHeightAt(0, -2.01)).toBeUndefined();
      });
    });

    describe("half scale", function() {
      var terrain = new Terrain(terrainMesh, 0.5);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.landHeightAt(-1.0, -1.0)).toBe(0.0);
        expect(terrain.landHeightAt(-0.5, 0.5)).toBe(5.2);
        expect(terrain.landHeightAt(-1.0, 0.0)).toBe(2.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.landHeightAt(-0.5, 0.2)).toBe(4.66);
        expect(terrain.landHeightAt(-0.3, 0.0)).toBe(5.14);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.landHeightAt(10000, 0)).toBeUndefined();
        expect(terrain.landHeightAt(-10000, 0)).toBeUndefined();
        expect(terrain.landHeightAt(0, 10000)).toBeUndefined();
        expect(terrain.landHeightAt(0, -10000)).toBeUndefined();
        expect(terrain.landHeightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.landHeightAt(1.01, 0)).toBeUndefined();
        expect(terrain.landHeightAt(-1.01, 0)).toBeUndefined();
        expect(terrain.landHeightAt(0, 1.01)).toBeUndefined();
        expect(terrain.landHeightAt(0, -1.01)).toBeUndefined();
      });
    });

    describe("quarter scale", function() {
      var terrain = new Terrain(terrainMesh, 0.25);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.landHeightAt(-0.5, -0.5)).toBe(0.0);
        expect(terrain.landHeightAt(-0.25, 0.25)).toBe(5.2);
        expect(terrain.landHeightAt(-0.5, 0.0)).toBe(2.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.landHeightAt(-0.25, 0.1)).toBe(4.66);
        expect(terrain.landHeightAt(-0.15, 0.0)).toBe(5.14);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.landHeightAt(10000, 0)).toBeUndefined();
        expect(terrain.landHeightAt(-10000, 0)).toBeUndefined();
        expect(terrain.landHeightAt(0, 10000)).toBeUndefined();
        expect(terrain.landHeightAt(0, -10000)).toBeUndefined();
        expect(terrain.landHeightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.landHeightAt(0.51, 0)).toBeUndefined();
        expect(terrain.landHeightAt(-0.51, 0)).toBeUndefined();
        expect(terrain.landHeightAt(0, 0.51)).toBeUndefined();
        expect(terrain.landHeightAt(0, -0.51)).toBeUndefined();
      });
    });

    describe("two times scale", function() {
      var terrain = new Terrain(terrainMesh, 2);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.landHeightAt(-4.0, -4.0)).toBe(0.0);
        expect(terrain.landHeightAt(-2.0, 2.0)).toBe(5.2);
        expect(terrain.landHeightAt(-4.0, 0.0)).toBe(2.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.landHeightAt(-2.0, 0.8)).toBe(4.66);
        expect(terrain.landHeightAt(-1.2, 0.0)).toBe(5.14);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.landHeightAt(10000, 0)).toBeUndefined();
        expect(terrain.landHeightAt(-10000, 0)).toBeUndefined();
        expect(terrain.landHeightAt(0, 10000)).toBeUndefined();
        expect(terrain.landHeightAt(0, -10000)).toBeUndefined();
        expect(terrain.landHeightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.landHeightAt(4.01, 0)).toBeUndefined();
        expect(terrain.landHeightAt(-4.01, 0)).toBeUndefined();
        expect(terrain.landHeightAt(0, 4.01)).toBeUndefined();
        expect(terrain.landHeightAt(0, -4.01)).toBeUndefined();
      });
    });
  });


  describe(".waterHeightAt", function() {
    describe("default scale", function() {
      var terrain = new Terrain(terrainMesh, 1);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.waterHeightAt(-2.0, -2.0)).toBe(0.0);
        expect(terrain.waterHeightAt(-1.0, 1.0)).toBe(1.3);
        expect(terrain.waterHeightAt(-2.0, 0.0)).toBe(3.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.waterHeightAt(-1.0, 0.4)).toBeCloseTo(0.52);
        expect(terrain.waterHeightAt(-0.6, 0.0)).toBeCloseTo(0.16);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.waterHeightAt(10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(-10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(0, 10000)).toBeUndefined();
        expect(terrain.waterHeightAt(0, -10000)).toBeUndefined();
        expect(terrain.waterHeightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.waterHeightAt(2.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(-2.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(0, 2.01)).toBeUndefined();
        expect(terrain.waterHeightAt(0, -2.01)).toBeUndefined();
      });
    });

    describe("half scale", function() {
      var terrain = new Terrain(terrainMesh, 0.5);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.waterHeightAt(-1.0, -1.0)).toBe(0.0);
        expect(terrain.waterHeightAt(-0.5, 0.5)).toBe(1.3);
        expect(terrain.waterHeightAt(-1.0, 0.0)).toBe(3.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.waterHeightAt(-0.5, 0.2)).toBeCloseTo(0.52);
        expect(terrain.waterHeightAt(-0.3, 0.0)).toBeCloseTo(0.16);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.waterHeightAt(10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(-10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(0, 10000)).toBeUndefined();
        expect(terrain.waterHeightAt(0, -10000)).toBeUndefined();
        expect(terrain.waterHeightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.waterHeightAt(1.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(-1.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(0, 1.01)).toBeUndefined();
        expect(terrain.waterHeightAt(0, -1.01)).toBeUndefined();
      });
    });

    describe("quarter scale", function() {
      var terrain = new Terrain(terrainMesh, 0.25);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.waterHeightAt(-0.5, -0.5)).toBe(0.0);
        expect(terrain.waterHeightAt(-0.25, 0.25)).toBe(1.3);
        expect(terrain.waterHeightAt(-0.5, 0.0)).toBe(3.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.waterHeightAt(-0.25, 0.1)).toBeCloseTo(0.52);
        expect(terrain.waterHeightAt(-0.15, 0.0)).toBeCloseTo(0.16);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.waterHeightAt(10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(-10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(0, 10000)).toBeUndefined();
        expect(terrain.waterHeightAt(0, -10000)).toBeUndefined();
        expect(terrain.waterHeightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.waterHeightAt(0.51, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(-0.51, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(0, 0.51)).toBeUndefined();
        expect(terrain.waterHeightAt(0, -0.51)).toBeUndefined();
      });
    });

    describe("two times scale", function() {
      var terrain = new Terrain(terrainMesh, 2);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.waterHeightAt(-4.0, -4.0)).toBe(0.0);
        expect(terrain.waterHeightAt(-2.0, 2.0)).toBe(1.3);
        expect(terrain.waterHeightAt(-4.0, 0.0)).toBe(3.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.waterHeightAt(-2.0, 0.8)).toBeCloseTo(0.52);
        expect(terrain.waterHeightAt(-1.2, 0.0)).toBeCloseTo(0.16);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.waterHeightAt(10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(-10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(0, 10000)).toBeUndefined();
        expect(terrain.waterHeightAt(0, -10000)).toBeUndefined();
        expect(terrain.waterHeightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.waterHeightAt(4.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(-4.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAt(0, 4.01)).toBeUndefined();
        expect(terrain.waterHeightAt(0, -4.01)).toBeUndefined();
      });
    });
  });


  describe(".heightAt", function() {
    describe("default scale", function() {
      var terrain = new Terrain(terrainMesh, 1);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.heightAt(-2.0, -2.0)).toBe(0.0);
        expect(terrain.heightAt(-1.0, 1.0)).toBe(6.5);
        expect(terrain.heightAt(-2.0, 0.0)).toBe(5.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.heightAt(-1.0, 0.4)).toBe(5.18);
        expect(terrain.heightAt(-0.6, 0.0)).toBe(5.3);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.heightAt(10000, 0)).toBeUndefined();
        expect(terrain.heightAt(-10000, 0)).toBeUndefined();
        expect(terrain.heightAt(0, 10000)).toBeUndefined();
        expect(terrain.heightAt(0, -10000)).toBeUndefined();
        expect(terrain.heightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.heightAt(2.01, 0)).toBeUndefined();
        expect(terrain.heightAt(-2.01, 0)).toBeUndefined();
        expect(terrain.heightAt(0, 2.01)).toBeUndefined();
        expect(terrain.heightAt(0, -2.01)).toBeUndefined();
      });
    });

    describe("half scale", function() {
      var terrain = new Terrain(terrainMesh, 0.5);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.heightAt(-1.0, -1.0)).toBe(0.0);
        expect(terrain.heightAt(-0.5, 0.5)).toBe(6.5);
        expect(terrain.heightAt(-1.0, 0.0)).toBe(5.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.heightAt(-0.5, 0.2)).toBe(5.18);
        expect(terrain.heightAt(-0.3, 0.0)).toBe(5.3);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.heightAt(10000, 0)).toBeUndefined();
        expect(terrain.heightAt(-10000, 0)).toBeUndefined();
        expect(terrain.heightAt(0, 10000)).toBeUndefined();
        expect(terrain.heightAt(0, -10000)).toBeUndefined();
        expect(terrain.heightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.heightAt(1.01, 0)).toBeUndefined();
        expect(terrain.heightAt(-1.01, 0)).toBeUndefined();
        expect(terrain.heightAt(0, 1.01)).toBeUndefined();
        expect(terrain.heightAt(0, -1.01)).toBeUndefined();
      });
    });

    describe("quarter scale", function() {
      var terrain = new Terrain(terrainMesh, 0.25);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.heightAt(-0.5, -0.5)).toBe(0.0);
        expect(terrain.heightAt(-0.25, 0.25)).toBe(6.5);
        expect(terrain.heightAt(-0.5, 0.0)).toBe(5.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.heightAt(-0.25, 0.1)).toBe(5.18);
        expect(terrain.heightAt(-0.15, 0.0)).toBe(5.3);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.heightAt(10000, 0)).toBeUndefined();
        expect(terrain.heightAt(-10000, 0)).toBeUndefined();
        expect(terrain.heightAt(0, 10000)).toBeUndefined();
        expect(terrain.heightAt(0, -10000)).toBeUndefined();
        expect(terrain.heightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.heightAt(0.51, 0)).toBeUndefined();
        expect(terrain.heightAt(-0.51, 0)).toBeUndefined();
        expect(terrain.heightAt(0, 0.51)).toBeUndefined();
        expect(terrain.heightAt(0, -0.51)).toBeUndefined();
      });
    });

    describe("two times scale", function() {
      var terrain = new Terrain(terrainMesh, 2);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.heightAt(-4.0, -4.0)).toBe(0.0);
        expect(terrain.heightAt(-2.0, 2.0)).toBe(6.5);
        expect(terrain.heightAt(-4.0, 0.0)).toBe(5.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.heightAt(-2.0, 0.8)).toBe(5.18);
        expect(terrain.heightAt(-1.2, 0.0)).toBe(5.3);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.heightAt(10000, 0)).toBeUndefined();
        expect(terrain.heightAt(-10000, 0)).toBeUndefined();
        expect(terrain.heightAt(0, 10000)).toBeUndefined();
        expect(terrain.heightAt(0, -10000)).toBeUndefined();
        expect(terrain.heightAt(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.heightAt(4.01, 0)).toBeUndefined();
        expect(terrain.heightAt(-4.01, 0)).toBeUndefined();
        expect(terrain.heightAt(0, 4.01)).toBeUndefined();
        expect(terrain.heightAt(0, -4.01)).toBeUndefined();
      });
    });
  });


  describe(".isPointInBounds", function() {
    var terrain = new Terrain(terrainMesh, 1);

    expect(terrain.isPointInBounds(0.0, 0.0)).toBe(true);
    expect(terrain.isPointInBounds(-2.0, 0.0)).toBe(true);
    expect(terrain.isPointInBounds(2.0, 0.0)).toBe(true);
    expect(terrain.isPointInBounds(0.0, -2.0)).toBe(true);
    expect(terrain.isPointInBounds(0.0, 2.0)).toBe(true);
    expect(terrain.isPointInBounds(-2.0, -2.0)).toBe(true);
    expect(terrain.isPointInBounds(2.0, -2.0)).toBe(true);
    expect(terrain.isPointInBounds(-2.0, 2.0)).toBe(true);
    expect(terrain.isPointInBounds(2.0, 2.0)).toBe(true);

    expect(terrain.isPointInBounds(-2.01, 0.0)).toBe(false);
    expect(terrain.isPointInBounds(2.01, 0.0)).toBe(false);
    expect(terrain.isPointInBounds(0.0, -2.01)).toBe(false);
    expect(terrain.isPointInBounds(0.0, 2.01)).toBe(false);
    expect(terrain.isPointInBounds(-2.01, -2.01)).toBe(false);
    expect(terrain.isPointInBounds(2.01, -2.01)).toBe(false);
    expect(terrain.isPointInBounds(-2.01, 2.01)).toBe(false);
    expect(terrain.isPointInBounds(2.01, 2.01)).toBe(false);
  });
});

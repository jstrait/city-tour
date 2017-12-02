"use strict";

describe("CityTour.Terrain", function() {
  var LAND = CityTour.Terrain.LAND;

  var terrainMesh = {
    0: {
      0: {height: 0.0, waterHeight: 0.0},
      1: {height: 0.0, waterHeight: 0.0},
      2: {height: 2.0, waterHeight: 0.0},
      3: {height: 3.0, waterHeight: 0.0},
    },
    1: {
      0: {height: 0.0, waterHeight: 0.0},
      1: {height: 0.0, waterHeight: 0.0},
      2: {height: 4.3, waterHeight: 0.0},
      3: {height: 5.2, waterHeight: 0.0},
    },
    2: {
      0: {height: 0.0, waterHeight: 0.0},
      1: {height: 0.0, waterHeight: 0.0},
      2: {height: 6.4, waterHeight: 0.0},
      3: {height: 0.0, waterHeight: 0.0},
    },
    3: {
      0: {height: 0.0, waterHeight: 0.0},
      1: {height: 0.0, waterHeight: 0.0},
      2: {height: 0.0, waterHeight: 0.0},
      3: {height: 0.0, waterHeight: 0.0},
    },
  };

  var terrain = new CityTour.Terrain(terrainMesh, 1);

  describe(".heightAtCoordinates", function() {
    it("returns the correct height for coordinates on an intersection", function() {
      expect(terrain.heightAtCoordinates(0, 0)).toBe(0.0);
      expect(terrain.heightAtCoordinates(0.0, 0.0)).toBe(0.0);

      expect(terrain.heightAtCoordinates(1, 3.0)).toBe(5.2);
      expect(terrain.heightAtCoordinates(1.0, 3.0)).toBe(5.2);

      expect(terrain.heightAtCoordinates(0, 2)).toBe(2.0);
      expect(terrain.heightAtCoordinates(0.0, 2.0)).toBe(2.0);
    });

    it("returns the correct height for coordinates along an edge", function() {
      expect(terrain.heightAtCoordinates(1, 2.4)).toBe(4.66);
      expect(terrain.heightAtCoordinates(1.0, 2.4)).toBe(4.66);

      expect(terrain.heightAtCoordinates(1.4, 2)).toBe(5.14);
      expect(terrain.heightAtCoordinates(1.4, 2.0)).toBe(5.14);
    });

    it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
      // Way out of bounds
      expect(terrain.heightAtCoordinates(10000, 0)).toBeUndefined();
      expect(terrain.heightAtCoordinates(-10000, 0)).toBeUndefined();
      expect(terrain.heightAtCoordinates(0, 10000)).toBeUndefined();
      expect(terrain.heightAtCoordinates(0, -10000)).toBeUndefined();
      expect(terrain.heightAtCoordinates(10000, 10000)).toBeUndefined();

      // Almost in bounds
      expect(terrain.heightAtCoordinates(3.01, 0)).toBeUndefined();
      expect(terrain.heightAtCoordinates(-0.01, 0)).toBeUndefined();
      expect(terrain.heightAtCoordinates(0, 3.01)).toBeUndefined();
      expect(terrain.heightAtCoordinates(0, -0.01)).toBeUndefined();
    });
  });
});

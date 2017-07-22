"use strict";

describe("CityTour.Terrain", function() {
  var LAND = CityTour.Terrain.LAND;

  var terrainMesh = {
    0: {
      0: {material: LAND, height: 0.0 },
      1: {material: LAND, height: 0.0 },
      2: {material: LAND, height: 2.0 },
      3: {material: LAND, height: 3.0 },
    },
    1: {
      0: {material: LAND, height: 0.0 },
      1: {material: LAND, height: 0.0 },
      2: {material: LAND, height: 4.3 },
      3: {material: LAND, height: 5.2 },
    },
    2: {
      0: {material: LAND, height: 0.0 },
      1: {material: LAND, height: 0.0 },
      2: {material: LAND, height: 6.4 },
      3: {material: LAND, height: 0.0 },
    },
    3: {
      0: {material: LAND, height: 0.0 },
      1: {material: LAND, height: 0.0 },
      2: {material: LAND, height: 0.0 },
      3: {material: LAND, height: 0.0 },
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

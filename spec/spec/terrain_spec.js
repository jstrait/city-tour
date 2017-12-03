"use strict";

describe("CityTour.Terrain", function() {
  var terrainMesh = [
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 2.0, waterHeight: 0.0},
      {landHeight: 3.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 4.3, waterHeight: 0.0},
      {landHeight: 5.2, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 6.4, waterHeight: 0.0},
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

  var terrain = new CityTour.Terrain(terrainMesh, 1);

  describe(".heightAtCoordinates", function() {
    it("returns the correct height for coordinates on an intersection", function() {
      expect(terrain.heightAtCoordinates(-2, -2)).toBe(0.0);
      expect(terrain.heightAtCoordinates(-2.0, -2.0)).toBe(0.0);

      expect(terrain.heightAtCoordinates(-1, 1.0)).toBe(5.2);
      expect(terrain.heightAtCoordinates(-1.0, 1.0)).toBe(5.2);

      expect(terrain.heightAtCoordinates(-2, 0)).toBe(2.0);
      expect(terrain.heightAtCoordinates(-2.0, 0.0)).toBe(2.0);
    });

    it("returns the correct height for coordinates along an edge", function() {
      expect(terrain.heightAtCoordinates(-1, 0.4)).toBe(4.66);
      expect(terrain.heightAtCoordinates(-1.0, 0.4)).toBe(4.66);

      expect(terrain.heightAtCoordinates(-0.6, 0)).toBe(5.14);
      expect(terrain.heightAtCoordinates(-0.6, 0.0)).toBe(5.14);
    });

    it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
      // Way out of bounds
      expect(terrain.heightAtCoordinates(10000, 0)).toBeUndefined();
      expect(terrain.heightAtCoordinates(-10000, 0)).toBeUndefined();
      expect(terrain.heightAtCoordinates(0, 10000)).toBeUndefined();
      expect(terrain.heightAtCoordinates(0, -10000)).toBeUndefined();
      expect(terrain.heightAtCoordinates(10000, 10000)).toBeUndefined();

      // Almost in bounds
      expect(terrain.heightAtCoordinates(2.01, 0)).toBeUndefined();
      expect(terrain.heightAtCoordinates(-2.01, 0)).toBeUndefined();
      expect(terrain.heightAtCoordinates(0, 2.01)).toBeUndefined();
      expect(terrain.heightAtCoordinates(0, -2.01)).toBeUndefined();
    });
  });
});

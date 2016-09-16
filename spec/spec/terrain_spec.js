"use strict";

describe("CityTour.Terrain", function() {
  var terrainMesh = {
    0: {
      0: 0.0,
      1: 0.0,
      2: 2.0,
      3: 3.0,
    },
    1: {
      0: 0.0,
      1: 0.0,
      2: 4.3,
      3: 5.2,
    },
    2: {
      0: 0.0,
      1: 0.0,
      2: 6.4,
      3: 0.0,
    },
    3: {
      0: 0.0,
      1: 0.0,
      2: 0.0,
      3: 0.0,
    },
  };

  var terrain = new CityTour.Terrain(terrainMesh);

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
  });
});

"use strict";

describe("CityTour.Terrain", function() {
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
      var terrain = new CityTour.Terrain(terrainMesh, 1);

      expect(terrain.minMapX()).toBe(-2);
      expect(terrain.maxMapX()).toBe(2);
      expect(terrain.minMapZ()).toBe(-2);
      expect(terrain.maxMapZ()).toBe(2);
    });

    it("returns the correct size bounds at half scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 0.5);

      expect(terrain.minMapX()).toBe(-1);
      expect(terrain.maxMapX()).toBe(1);
      expect(terrain.minMapZ()).toBe(-1);
      expect(terrain.maxMapZ()).toBe(1);
    });

    it("returns the correct size bounds at quarter scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 0.25);

      expect(terrain.minMapX()).toBe(-0.5);
      expect(terrain.maxMapX()).toBe(0.5);
      expect(terrain.minMapZ()).toBe(-0.5);
      expect(terrain.maxMapZ()).toBe(0.5);
    });

    it("returns the correct size bounds at quarter scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 2);

      expect(terrain.minMapX()).toBe(-4);
      expect(terrain.maxMapX()).toBe(4);
      expect(terrain.minMapZ()).toBe(-4);
      expect(terrain.maxMapZ()).toBe(4);
    });
  });


  describe(".landHeightAtCoordinates", function() {
    describe("default scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 1);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.landHeightAtCoordinates(-2.0, -2.0)).toBe(0.0);
        expect(terrain.landHeightAtCoordinates(-1.0, 1.0)).toBe(5.2);
        expect(terrain.landHeightAtCoordinates(-2.0, 0.0)).toBe(2.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.landHeightAtCoordinates(-1.0, 0.4)).toBe(4.66);
        expect(terrain.landHeightAtCoordinates(-0.6, 0.0)).toBe(5.14);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.landHeightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.landHeightAtCoordinates(2.01, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(-2.01, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, 2.01)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, -2.01)).toBeUndefined();
      });
    });

    describe("half scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 0.5);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.landHeightAtCoordinates(-1.0, -1.0)).toBe(0.0);
        expect(terrain.landHeightAtCoordinates(-0.5, 0.5)).toBe(5.2);
        expect(terrain.landHeightAtCoordinates(-1.0, 0.0)).toBe(2.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.landHeightAtCoordinates(-0.5, 0.2)).toBe(4.66);
        expect(terrain.landHeightAtCoordinates(-0.3, 0.0)).toBe(5.14);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.landHeightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.landHeightAtCoordinates(1.01, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(-1.01, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, 1.01)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, -1.01)).toBeUndefined();
      });
    });

    describe("quarter scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 0.25);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.landHeightAtCoordinates(-0.5, -0.5)).toBe(0.0);
        expect(terrain.landHeightAtCoordinates(-0.25, 0.25)).toBe(5.2);
        expect(terrain.landHeightAtCoordinates(-0.5, 0.0)).toBe(2.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.landHeightAtCoordinates(-0.25, 0.1)).toBe(4.66);
        expect(terrain.landHeightAtCoordinates(-0.15, 0.0)).toBe(5.14);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.landHeightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.landHeightAtCoordinates(0.51, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(-0.51, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, 0.51)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, -0.51)).toBeUndefined();
      });
    });

    describe("two times scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 2);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.landHeightAtCoordinates(-4.0, -4.0)).toBe(0.0);
        expect(terrain.landHeightAtCoordinates(-2.0, 2.0)).toBe(5.2);
        expect(terrain.landHeightAtCoordinates(-4.0, 0.0)).toBe(2.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.landHeightAtCoordinates(-2.0, 0.8)).toBe(4.66);
        expect(terrain.landHeightAtCoordinates(-1.2, 0.0)).toBe(5.14);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.landHeightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.landHeightAtCoordinates(4.01, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(-4.01, 0)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, 4.01)).toBeUndefined();
        expect(terrain.landHeightAtCoordinates(0, -4.01)).toBeUndefined();
      });
    });
  });


  describe(".waterHeightAtCoordinates", function() {
    describe("default scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 1);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.waterHeightAtCoordinates(-2.0, -2.0)).toBe(0.0);
        expect(terrain.waterHeightAtCoordinates(-1.0, 1.0)).toBe(1.3);
        expect(terrain.waterHeightAtCoordinates(-2.0, 0.0)).toBe(3.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.waterHeightAtCoordinates(-1.0, 0.4)).toBeCloseTo(0.52);
        expect(terrain.waterHeightAtCoordinates(-0.6, 0.0)).toBeCloseTo(0.16);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.waterHeightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.waterHeightAtCoordinates(2.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(-2.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, 2.01)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, -2.01)).toBeUndefined();
      });
    });

    describe("half scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 0.5);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.waterHeightAtCoordinates(-1.0, -1.0)).toBe(0.0);
        expect(terrain.waterHeightAtCoordinates(-0.5, 0.5)).toBe(1.3);
        expect(terrain.waterHeightAtCoordinates(-1.0, 0.0)).toBe(3.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.waterHeightAtCoordinates(-0.5, 0.2)).toBeCloseTo(0.52);
        expect(terrain.waterHeightAtCoordinates(-0.3, 0.0)).toBeCloseTo(0.16);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.waterHeightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.waterHeightAtCoordinates(1.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(-1.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, 1.01)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, -1.01)).toBeUndefined();
      });
    });

    describe("quarter scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 0.25);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.waterHeightAtCoordinates(-0.5, -0.5)).toBe(0.0);
        expect(terrain.waterHeightAtCoordinates(-0.25, 0.25)).toBe(1.3);
        expect(terrain.waterHeightAtCoordinates(-0.5, 0.0)).toBe(3.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.waterHeightAtCoordinates(-0.25, 0.1)).toBeCloseTo(0.52);
        expect(terrain.waterHeightAtCoordinates(-0.15, 0.0)).toBeCloseTo(0.16);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.waterHeightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.waterHeightAtCoordinates(0.51, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(-0.51, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, 0.51)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, -0.51)).toBeUndefined();
      });
    });

    describe("two times scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 2);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.waterHeightAtCoordinates(-4.0, -4.0)).toBe(0.0);
        expect(terrain.waterHeightAtCoordinates(-2.0, 2.0)).toBe(1.3);
        expect(terrain.waterHeightAtCoordinates(-4.0, 0.0)).toBe(3.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.waterHeightAtCoordinates(-2.0, 0.8)).toBeCloseTo(0.52);
        expect(terrain.waterHeightAtCoordinates(-1.2, 0.0)).toBeCloseTo(0.16);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.waterHeightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.waterHeightAtCoordinates(4.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(-4.01, 0)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, 4.01)).toBeUndefined();
        expect(terrain.waterHeightAtCoordinates(0, -4.01)).toBeUndefined();
      });
    });
  });


  describe(".heightAtCoordinates", function() {
    describe("default scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 1);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.heightAtCoordinates(-2.0, -2.0)).toBe(0.0);
        expect(terrain.heightAtCoordinates(-1.0, 1.0)).toBe(6.5);
        expect(terrain.heightAtCoordinates(-2.0, 0.0)).toBe(5.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.heightAtCoordinates(-1.0, 0.4)).toBe(5.18);
        expect(terrain.heightAtCoordinates(-0.6, 0.0)).toBe(5.3);
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

    describe("half scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 0.5);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.heightAtCoordinates(-1.0, -1.0)).toBe(0.0);
        expect(terrain.heightAtCoordinates(-0.5, 0.5)).toBe(6.5);
        expect(terrain.heightAtCoordinates(-1.0, 0.0)).toBe(5.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.heightAtCoordinates(-0.5, 0.2)).toBe(5.18);
        expect(terrain.heightAtCoordinates(-0.3, 0.0)).toBe(5.3);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.heightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.heightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.heightAtCoordinates(1.01, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(-1.01, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, 1.01)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, -1.01)).toBeUndefined();
      });
    });

    describe("quarter scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 0.25);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.heightAtCoordinates(-0.5, -0.5)).toBe(0.0);
        expect(terrain.heightAtCoordinates(-0.25, 0.25)).toBe(6.5);
        expect(terrain.heightAtCoordinates(-0.5, 0.0)).toBe(5.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.heightAtCoordinates(-0.25, 0.1)).toBe(5.18);
        expect(terrain.heightAtCoordinates(-0.15, 0.0)).toBe(5.3);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.heightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.heightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.heightAtCoordinates(0.51, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(-0.51, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, 0.51)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, -0.51)).toBeUndefined();
      });
    });

    describe("two times scale", function() {
      var terrain = new CityTour.Terrain(terrainMesh, 2);

      it("returns the correct height for coordinates on an intersection", function() {
        expect(terrain.heightAtCoordinates(-4.0, -4.0)).toBe(0.0);
        expect(terrain.heightAtCoordinates(-2.0, 2.0)).toBe(6.5);
        expect(terrain.heightAtCoordinates(-4.0, 0.0)).toBe(5.0);
      });

      it("returns the correct height for coordinates along an edge", function() {
        expect(terrain.heightAtCoordinates(-2.0, 0.8)).toBe(5.18);
        expect(terrain.heightAtCoordinates(-1.2, 0.0)).toBe(5.3);
      });

      it("returns `undefined` for coordinates outside the bounds of the terrain", function() {
        // Way out of bounds
        expect(terrain.heightAtCoordinates(10000, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(-10000, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, 10000)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, -10000)).toBeUndefined();
        expect(terrain.heightAtCoordinates(10000, 10000)).toBeUndefined();

        // Almost in bounds
        expect(terrain.heightAtCoordinates(4.01, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(-4.01, 0)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, 4.01)).toBeUndefined();
        expect(terrain.heightAtCoordinates(0, -4.01)).toBeUndefined();
      });
    });
  });
});

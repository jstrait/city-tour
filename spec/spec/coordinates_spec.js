"use strict";

describe("CityTour.Coordinates", function() {
  describe(".mapXToSceneX", function() {
    it("returns the correct value for 0", function() {
      expect(CityTour.Coordinates.mapXToSceneX(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(CityTour.Coordinates.mapXToSceneX(1.0)).toBe(1.0);
      expect(CityTour.Coordinates.mapXToSceneX(2.1)).toBeCloseTo(2.1);
      expect(CityTour.Coordinates.mapXToSceneX(5)).toBe(5);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(CityTour.Coordinates.mapXToSceneX(-1.0)).toBe(-1.0);
      expect(CityTour.Coordinates.mapXToSceneX(-2.1)).toBeCloseTo(-2.1);
      expect(CityTour.Coordinates.mapXToSceneX(-5)).toBe(-5);
    });
  });

  describe(".mapZToSceneZ", function() {
    it("returns the correct value for 0", function() {
      expect(CityTour.Coordinates.mapZToSceneZ(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(CityTour.Coordinates.mapZToSceneZ(1.0)).toBe(1.0);
      expect(CityTour.Coordinates.mapZToSceneZ(2.1)).toBeCloseTo(2.1);
      expect(CityTour.Coordinates.mapZToSceneZ(5)).toBe(5);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(CityTour.Coordinates.mapZToSceneZ(-1.0)).toBe(-1.0);
      expect(CityTour.Coordinates.mapZToSceneZ(-2.1)).toBeCloseTo(-2.1);
      expect(CityTour.Coordinates.mapZToSceneZ(-5)).toBe(-5);
    });
  });

  describe(".sceneXToMapX", function() {
    it("returns the correct value for 0", function() {
      expect(CityTour.Coordinates.sceneXToMapX(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(CityTour.Coordinates.sceneXToMapX(12)).toBe(12);
      expect(CityTour.Coordinates.sceneXToMapX(25.2)).toBe(25.2);
      expect(CityTour.Coordinates.sceneXToMapX(60)).toBe(60);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(CityTour.Coordinates.sceneXToMapX(-12)).toBe(-12);
      expect(CityTour.Coordinates.sceneXToMapX(-25.2)).toBe(-25.2);
      expect(CityTour.Coordinates.sceneXToMapX(-60)).toBe(-60);
    });
  });

  describe(".sceneZToMapZ", function() {
    it("returns the correct value for 0", function() {
      expect(CityTour.Coordinates.sceneZToMapZ(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(CityTour.Coordinates.sceneZToMapZ(12)).toBe(12);
      expect(CityTour.Coordinates.sceneZToMapZ(25.2)).toBe(25.2);
      expect(CityTour.Coordinates.sceneZToMapZ(60)).toBe(60);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(CityTour.Coordinates.sceneZToMapZ(-12)).toBe(-12);
      expect(CityTour.Coordinates.sceneZToMapZ(-25.2)).toBe(-25.2);
      expect(CityTour.Coordinates.sceneZToMapZ(-60)).toBe(-60);
    });
  });
});

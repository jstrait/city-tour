"use strict";

describe("CityTour.Coordinates", function() {
  describe(".mapXToSceneX", function() {
    it("returns the correct value for 0", function() {
      expect(CityTour.Coordinates.mapXToSceneX(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(CityTour.Coordinates.mapXToSceneX(1.0)).toBe(11);
      expect(CityTour.Coordinates.mapXToSceneX(2.1)).toBe(23.1);
      expect(CityTour.Coordinates.mapXToSceneX(5)).toBe(55);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(CityTour.Coordinates.mapXToSceneX(-1.0)).toBe(-11);
      expect(CityTour.Coordinates.mapXToSceneX(-2.1)).toBe(-23.1);
      expect(CityTour.Coordinates.mapXToSceneX(-5)).toBe(-55);
    });
  });

  describe(".mapZToSceneZ", function() {
    it("returns the correct value for 0", function() {
      expect(CityTour.Coordinates.mapZToSceneZ(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(CityTour.Coordinates.mapZToSceneZ(1.0)).toBe(11);
      expect(CityTour.Coordinates.mapZToSceneZ(2.1)).toBe(23.1);
      expect(CityTour.Coordinates.mapZToSceneZ(5)).toBe(55);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(CityTour.Coordinates.mapZToSceneZ(-1.0)).toBe(-11);
      expect(CityTour.Coordinates.mapZToSceneZ(-2.1)).toBe(-23.1);
      expect(CityTour.Coordinates.mapZToSceneZ(-5)).toBe(-55);
    });
  });

  describe(".sceneXToMapX", function() {
    it("returns the correct value for 0", function() {
      expect(CityTour.Coordinates.sceneXToMapX(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(CityTour.Coordinates.sceneXToMapX(11)).toBe(1);
      expect(CityTour.Coordinates.sceneXToMapX(23.1)).toBe(2.1);
      expect(CityTour.Coordinates.sceneXToMapX(55)).toBe(5);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(CityTour.Coordinates.sceneXToMapX(-11)).toBe(-1);
      expect(CityTour.Coordinates.sceneXToMapX(-23.1)).toBe(-2.1);
      expect(CityTour.Coordinates.sceneXToMapX(-55)).toBe(-5);
    });
  });

  describe(".sceneZToMapZ", function() {
    it("returns the correct value for 0", function() {
      expect(CityTour.Coordinates.sceneZToMapZ(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(CityTour.Coordinates.sceneZToMapZ(11)).toBe(1);
      expect(CityTour.Coordinates.sceneZToMapZ(23.1)).toBe(2.1);
      expect(CityTour.Coordinates.sceneZToMapZ(55)).toBe(5);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(CityTour.Coordinates.sceneZToMapZ(-11)).toBe(-1);
      expect(CityTour.Coordinates.sceneZToMapZ(-23.1)).toBe(-2.1);
      expect(CityTour.Coordinates.sceneZToMapZ(-55)).toBe(-5);
    });
  });
});

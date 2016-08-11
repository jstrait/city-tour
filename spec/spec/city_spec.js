"use strict";

describe("Coordinates", function() {
  describe(".mapXToSceneX", function() {
    it("returns the correct value for 0", function() {
      expect(Coordinates.mapXToSceneX(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(Coordinates.mapXToSceneX(1.0)).toBe(11);
      expect(Coordinates.mapXToSceneX(2.1)).toBe(23.1);
      expect(Coordinates.mapXToSceneX(5)).toBe(55);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(Coordinates.mapXToSceneX(-1.0)).toBe(-11);
      expect(Coordinates.mapXToSceneX(-2.1)).toBe(-23.1);
      expect(Coordinates.mapXToSceneX(-5)).toBe(-55);
    });
  });

  describe(".mapZToSceneZ", function() {
    it("returns the correct value for 0", function() {
      expect(Coordinates.mapZToSceneZ(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(Coordinates.mapZToSceneZ(1.0)).toBe(11);
      expect(Coordinates.mapZToSceneZ(2.1)).toBe(23.1);
      expect(Coordinates.mapZToSceneZ(5)).toBe(55);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(Coordinates.mapZToSceneZ(-1.0)).toBe(-11);
      expect(Coordinates.mapZToSceneZ(-2.1)).toBe(-23.1);
      expect(Coordinates.mapZToSceneZ(-5)).toBe(-55);
    });
  });

  describe(".sceneXToMapX", function() {
    it("returns the correct value for 0", function() {
      expect(Coordinates.sceneXToMapX(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(Coordinates.sceneXToMapX(11)).toBe(1);
      expect(Coordinates.sceneXToMapX(23.1)).toBe(2.1);
      expect(Coordinates.sceneXToMapX(55)).toBe(5);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(Coordinates.sceneXToMapX(-11)).toBe(-1);
      expect(Coordinates.sceneXToMapX(-23.1)).toBe(-2.1);
      expect(Coordinates.sceneXToMapX(-55)).toBe(-5);
    });
  });

  describe(".sceneZToMapZ", function() {
    it("returns the correct value for 0", function() {
      expect(Coordinates.sceneZToMapZ(0)).toBe(0);
    });

    it("returns the correct value for positive coordinates", function() {
      expect(Coordinates.sceneZToMapZ(11)).toBe(1);
      expect(Coordinates.sceneZToMapZ(23.1)).toBe(2.1);
      expect(Coordinates.sceneZToMapZ(55)).toBe(5);
    });

    it("returns the correct value for negative coordinates", function() {
      expect(Coordinates.sceneZToMapZ(-11)).toBe(-1);
      expect(Coordinates.sceneZToMapZ(-23.1)).toBe(-2.1);
      expect(Coordinates.sceneZToMapZ(-55)).toBe(-5);
    });
  });
});

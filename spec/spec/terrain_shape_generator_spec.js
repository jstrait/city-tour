"use strict";

describe("CityTour.TerrainShapeGenerator", function() {
  var flatTerrainCoordinates = [
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
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
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
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
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
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
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
  ];

  describe(".addPyramid", function() {
    it("generates a correct pyramid", function() {
      CityTour.TerrainShapeGenerator.addPyramid(flatTerrainCoordinates, 3, 3, 4, 10);

      expect(flatTerrainCoordinates[0]).toEqual([
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
      ]);

      expect(flatTerrainCoordinates[1]).toEqual([
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
      ]);

      expect(flatTerrainCoordinates[2]).toEqual([
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 5.0, waterHeight: 0.0},
        {landHeight: 5.0, waterHeight: 0.0},
        {landHeight: 5.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
      ]);

      expect(flatTerrainCoordinates[3]).toEqual([
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 5.0, waterHeight: 0.0},
        {landHeight: 10.0, waterHeight: 0.0},
        {landHeight: 5.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
      ]);

      expect(flatTerrainCoordinates[4]).toEqual([
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 5.0, waterHeight: 0.0},
        {landHeight: 5.0, waterHeight: 0.0},
        {landHeight: 5.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
      ]);

      expect(flatTerrainCoordinates[5]).toEqual([
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
      ]);

      expect(flatTerrainCoordinates[6]).toEqual([
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
        {landHeight: 0.0, waterHeight: 0.0},
      ]);
    });
  });
});

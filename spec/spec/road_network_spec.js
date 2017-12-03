"use strict";

describe("CityTour.RoadNetwork", function() {
  var TERRAIN_MESH = [
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

  var terrain = new CityTour.Terrain(TERRAIN_MESH, 1);

  it(".hasIntersection", function() {
    var roadNetwork = new CityTour.RoadNetwork(terrain);

    expect(roadNetwork.hasIntersection(-1, 0)).toBe(false);
    expect(roadNetwork.hasIntersection(1, 2)).toBe(false);
    expect(roadNetwork.hasIntersection(3, 4)).toBe(false);

    roadNetwork.addEdge(-1, 0, 1, 2, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);

    expect(roadNetwork.hasIntersection(-1, 0)).toBe(true);
    expect(roadNetwork.hasIntersection(1, 2)).toBe(true);
    expect(roadNetwork.hasIntersection(3, 4)).toBe(false);

    expect(roadNetwork.hasIntersection(3.5, 4)).toBe(false);
    expect(roadNetwork.hasIntersection(3, 4.2)).toBe(false);
    expect(roadNetwork.hasIntersection(3.5, 4.2)).toBe(false);
    expect(roadNetwork.hasIntersection("a", "b")).toBe(false);
  });

  it(".hasEdgeBetween", function() {
    var roadNetwork = new CityTour.RoadNetwork(terrain);

    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 2, 1)).toBe(false);

    roadNetwork.addEdge(-1, 0, 1, 2, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);

    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 2, 1)).toBe(false);

    roadNetwork.addEdge(-1, 0, -2, 1, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);

    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 2, 1)).toBe(false);

    // Out of bounds coordinates
    expect(roadNetwork.hasEdgeBetween(-3, 0, -2, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(3, 0, 2, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, -3, 0, -2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 0, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 0, -3, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(2, 0, 3, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, -2, 0, -3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 2, 0, 3)).toBe(false);
  });
});

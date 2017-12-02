"use strict";

describe("CityTour.RoadNetwork", function() {
  var LAND = CityTour.Terrain.LAND;
  var TERRAIN_MESH = {
    0: {
      0: { landHeight: 0.0, waterHeight: 0.0 },
      1: { landHeight: 0.0, waterHeight: 0.0 },
      2: { landHeight: 2.0, waterHeight: 0.0 },
      3: { landHeight: 3.0, waterHeight: 0.0 },
      4: { landHeight: 0.0, waterHeight: 0.0 },
    },
    1: {
      0: { landHeight: 0.0, waterHeight: 0.0 },
      1: { landHeight: 0.0, waterHeight: 0.0 },
      2: { landHeight: 4.3, waterHeight: 0.0 },
      3: { landHeight: 5.2, waterHeight: 0.0 },
      4: { landHeight: 0.0, waterHeight: 0.0 },
    },
    2: {
      0: { landHeight: 0.0, waterHeight: 0.0 },
      1: { landHeight: 0.0, waterHeight: 0.0 },
      2: { landHeight: 6.4, waterHeight: 0.0 },
      3: { landHeight: 0.0, waterHeight: 0.0 },
      4: { landHeight: 0.0, waterHeight: 0.0 },
    },
    3: {
      0: { landHeight: 0.0, waterHeight: 0.0 },
      1: { landHeight: 0.0, waterHeight: 0.0 },
      2: { landHeight: 0.0, waterHeight: 0.0 },
      3: { landHeight: 0.0, waterHeight: 0.0 },
      4: { landHeight: 0.0, waterHeight: 0.0 },
    },
    4: {
      0: { landHeight: 0.0, waterHeight: 0.0 },
      1: { landHeight: 0.0, waterHeight: 0.0 },
      2: { landHeight: 0.0, waterHeight: 0.0 },
      3: { landHeight: 0.0, waterHeight: 0.0 },
      4: { landHeight: 0.0, waterHeight: 0.0 },
    },
  };

  var terrain = new CityTour.Terrain(TERRAIN_MESH, 1);

  it(".hasIntersection", function() {
    var roadNetwork = new CityTour.RoadNetwork(terrain);

    expect(roadNetwork.hasIntersection(1, 2)).toBe(false);
    expect(roadNetwork.hasIntersection(3, 4)).toBe(false);
    expect(roadNetwork.hasIntersection(5, 6)).toBe(false);

    roadNetwork.addEdge(1, 2, 3, 4, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);

    expect(roadNetwork.hasIntersection(1, 2)).toBe(true);
    expect(roadNetwork.hasIntersection(3, 4)).toBe(true);
    expect(roadNetwork.hasIntersection(5, 6)).toBe(false);

    expect(roadNetwork.hasIntersection(5.5, 6)).toBe(false);
    expect(roadNetwork.hasIntersection(5, 6.2)).toBe(false);
    expect(roadNetwork.hasIntersection(5.5, 6.2)).toBe(false);
    expect(roadNetwork.hasIntersection("a", "b")).toBe(false);
  });

  it(".hasEdgeBetween", function() {
    var roadNetwork = new CityTour.RoadNetwork(terrain);

    expect(roadNetwork.hasEdgeBetween(1, 2, 3, 4)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(3, 4, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, 0, 3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(3, 4, 0, 3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 3, 4)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, 4, 3)).toBe(false);

    roadNetwork.addEdge(1, 2, 3, 4, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);

    expect(roadNetwork.hasEdgeBetween(1, 2, 3, 4)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(3, 4, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, 0, 3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(3, 4, 0, 3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 3, 4)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, 4, 3)).toBe(false);

    roadNetwork.addEdge(1, 2, 0, 3, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);

    expect(roadNetwork.hasEdgeBetween(1, 2, 3, 4)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(3, 4, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, 0, 3)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(0, 3, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(3, 4, 0, 3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 3, 4)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, 4, 3)).toBe(false);
  });
});

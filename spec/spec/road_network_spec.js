"use strict";

describe("CityTour.RoadNetwork", function() {
  it(".hasIntersection", function() {
    var roadNetwork = new CityTour.RoadNetwork();

    expect(roadNetwork.hasIntersection(1, 2)).toBe(false);
    expect(roadNetwork.hasIntersection(3, 4)).toBe(false);
    expect(roadNetwork.hasIntersection(5, 6)).toBe(false);

    roadNetwork.addEdge(1, 2, 3, 4);

    expect(roadNetwork.hasIntersection(1, 2)).toBe(true);
    expect(roadNetwork.hasIntersection(3, 4)).toBe(true);
    expect(roadNetwork.hasIntersection(5, 6)).toBe(false);
  });

  it(".hasEdgeBetween", function() {
    var roadNetwork = new CityTour.RoadNetwork();

    expect(roadNetwork.hasEdgeBetween(1, 2, 3, 4)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(3, 4, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, 0, 3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(3, 4, 0, 3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 3, 4)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, 4, 3)).toBe(false);

    roadNetwork.addEdge(1, 2, 3, 4);

    expect(roadNetwork.hasEdgeBetween(1, 2, 3, 4)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(3, 4, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, 0, 3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(3, 4, 0, 3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 3, 4)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, 4, 3)).toBe(false);

    roadNetwork.addEdge(1, 2, 0, 3);

    expect(roadNetwork.hasEdgeBetween(1, 2, 3, 4)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(3, 4, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, 0, 3)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(0, 3, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(3, 4, 0, 3)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(0, 3, 3, 4)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, 4, 3)).toBe(false);
  });
});

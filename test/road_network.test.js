"use strict";

import { RoadNetwork } from "./../src/road_network";
import { Terrain } from "./../src/terrain";

describe("RoadNetwork", function() {
  var TERRAIN_MESH = [
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
      {landHeight: 2.0, waterHeight: 0.0},
      {landHeight: 3.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 4.3, waterHeight: 0.0},
      {landHeight: 5.2, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 6.4, waterHeight: 0.0},
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

  var terrain = new Terrain(TERRAIN_MESH, 1);

  it(".hasIntersection", function() {
    var roadNetwork = new RoadNetwork(terrain);

    expect(roadNetwork.hasIntersection(-1, 0)).toBe(false);
    expect(roadNetwork.hasIntersection(1, 2)).toBe(false);
    expect(roadNetwork.hasIntersection(3, 4)).toBe(false);

    roadNetwork.addEdge(-1, 0, 1, 2, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);

    expect(roadNetwork.hasIntersection(-1, 0)).toBe(true);
    expect(roadNetwork.hasIntersection(1, 2)).toBe(true);
    expect(roadNetwork.hasIntersection(3, 4)).toBe(false);

    expect(roadNetwork.hasIntersection(3.5, 4)).toBe(false);
    expect(roadNetwork.hasIntersection(3, 4.2)).toBe(false);
    expect(roadNetwork.hasIntersection(3.5, 4.2)).toBe(false);
    expect(roadNetwork.hasIntersection("a", "b")).toBe(false);
  });

  describe(".getRoadHeight", function() {
    var roadNetwork = new RoadNetwork(terrain);

    roadNetwork.addEdge(-1, 0, 0, 0, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
    roadNetwork.addEdge(-1, 0, -1, -1, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
    roadNetwork.addEdge(-1, -1, -1, -2, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);

    it("returns `undefined` for coordinates not on a road edge", function() {
      expect(roadNetwork.getRoadHeight(1, 0)).toBe(undefined);
      expect(roadNetwork.getRoadHeight(0.5, 0)).toBe(undefined);
      expect(roadNetwork.getRoadHeight(0, 0.5)).toBe(undefined);
    });

    it("returns the correct heights for an X-axis road edge", function() {
      // {-1,0} -> {0,0}
      expect(roadNetwork.getRoadHeight(-1, 0)).toBe(4.3);
      expect(roadNetwork.getRoadHeight(-0.95, 0)).toBe(4.3);
      expect(roadNetwork.getRoadHeight(-(5 / 6), 0)).toBe(4.3);
      expect(roadNetwork.getRoadHeight(-0.75, 0)).toBe(4.5625);
      expect(roadNetwork.getRoadHeight(-0.5, 0)).toBe(5.35);
      expect(roadNetwork.getRoadHeight(-0.25, 0)).toBe(6.1375);
      expect(roadNetwork.getRoadHeight(-(1 / 6), 0)).toBe(6.4);
      expect(roadNetwork.getRoadHeight(-0.05, 0)).toBe(6.4);
      expect(roadNetwork.getRoadHeight(0, 0)).toBe(6.4);
    });

    it("returns the correct heights for a Z-axis road edge", function() {
      // {-1,0} -> {-1,-1}
      expect(roadNetwork.getRoadHeight(-1, 0)).toBe(4.3);
      expect(roadNetwork.getRoadHeight(-1, -0.05)).toBe(4.3);
      expect(roadNetwork.getRoadHeight(-1, -(1 / 6))).toBe(4.3);
      expect(roadNetwork.getRoadHeight(-1, -0.25)).toBe(3.7624999999999997);
      expect(roadNetwork.getRoadHeight(-1, -0.5)).toBe(2.15);
      expect(roadNetwork.getRoadHeight(-1, -0.75)).toBe(0.5375);
      expect(roadNetwork.getRoadHeight(-1, -(5 / 6))).toBe(0);
      expect(roadNetwork.getRoadHeight(-1, -0.95)).toBe(0);
      expect(roadNetwork.getRoadHeight(-1, -1)).toBe(0);
    });

    it("returns the correct heights for a flat road edge", function() {
      // {-1,-1} -> {-1,-2}
      expect(roadNetwork.getRoadHeight(-1, -1)).toBe(0.0);
      expect(roadNetwork.getRoadHeight(-1, -1.05)).toBe(0.0);
      expect(roadNetwork.getRoadHeight(-1, -(7 / 6))).toBe(0.0);
      expect(roadNetwork.getRoadHeight(-1, -1.25)).toBe(0.0);
      expect(roadNetwork.getRoadHeight(-1, -1.5)).toBe(0.0);
      expect(roadNetwork.getRoadHeight(-1, -1.75)).toBe(0.0);
      expect(roadNetwork.getRoadHeight(-1, -(11 / 6))).toBe(0.0);
      expect(roadNetwork.getRoadHeight(-1, -1.95)).toBe(0.0);
      expect(roadNetwork.getRoadHeight(-1, -2)).toBe(0.0);
    });
  });

  it(".hasEdgeBetween", function() {
    var roadNetwork = new RoadNetwork(terrain);

    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 2, 1)).toBe(false);

    roadNetwork.addEdge(-1, 0, 1, 2, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);

    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2, RoadNetwork.SURFACE_GRADE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2, RoadNetwork.BRIDGE_GRADE)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0, RoadNetwork.SURFACE_GRADE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0, RoadNetwork.BRIDGE_GRADE)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 2, 1)).toBe(false);

    roadNetwork.addEdge(-1, 0, -2, 1, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);

    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2, RoadNetwork.SURFACE_GRADE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2, RoadNetwork.BRIDGE_GRADE)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0, RoadNetwork.SURFACE_GRADE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0, RoadNetwork.BRIDGE_GRADE)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1, RoadNetwork.SURFACE_GRADE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1, RoadNetwork.BRIDGE_GRADE)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0, RoadNetwork.SURFACE_GRADE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0, RoadNetwork.BRIDGE_GRADE)).toBe(false);
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

  it(".edgeBetween", function() {
    var roadNetwork = new RoadNetwork(terrain);

    // Edge is in bounds of terrain, but doesn't exist
    expect(roadNetwork.edgeBetween(0, 0, 1, 0)).toBe(undefined);

    // Both intersections are out of bounds of terrain (and so edge implicitly doesn't exist)
    expect(roadNetwork.edgeBetween(10000, 0, 10001, 0)).toBe(undefined);

    // One intersection is in bounds of terrain, one intersection is not (so edge implicitly doesn't exist)
    expect(roadNetwork.edgeBetween(-2, 0, -3, 0)).toBe(undefined);

    // Edge exists
    roadNetwork.addEdge(0, 0, 1, 0, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
    expect(roadNetwork.edgeBetween(0, 0, 1, 0)).toEqual({ distance: 1.0, gradeType: RoadNetwork.SURFACE_GRADE });

    expect(roadNetwork.edgeBetween(1, 0, 2, 0)).toBe(undefined);
  });


  describe(".addEdge", function() {
    var roadNetwork = new RoadNetwork(terrain);

    it("allows adding an edge in a valid location", function() {
      expect(roadNetwork.hasEdgeBetween(0, 0, 1, 0)).toBe(false);
      expect(roadNetwork.getRoadHeight(0, 0)).toBe(undefined);
      expect(roadNetwork.getRoadHeight(1, 0)).toBe(undefined);
      expect(roadNetwork.getIntersectionGradeType(0, 0)).toBe(false);
      expect(roadNetwork.getIntersectionGradeType(1, 0)).toBe(false);

      roadNetwork.addEdge(0, 0, 1, 0, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);

      expect(roadNetwork.hasEdgeBetween(0, 0, 1, 0)).toBe(true);
      expect(roadNetwork.getRoadHeight(0, 0)).toBe(6.4);
      expect(roadNetwork.getRoadHeight(1, 0)).toBe(0.0);
      expect(roadNetwork.getIntersectionGradeType(0, 0)).toBe(RoadNetwork.SURFACE_GRADE);
      expect(roadNetwork.getIntersectionGradeType(1, 0)).toBe(RoadNetwork.SURFACE_GRADE);
    });

    it("allows adding an edge up to the valid bounds", function() {
      roadNetwork.addEdge(-1, 0, -2, 0, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
      roadNetwork.addEdge(1, 0, 2, 0, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
      roadNetwork.addEdge(0, -1, 0, -2, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
      roadNetwork.addEdge(0, 1, 0, 2, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);

      expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 0)).toBe(true);
      expect(roadNetwork.hasEdgeBetween(1, 0, 2, 0)).toBe(true);
      expect(roadNetwork.hasEdgeBetween(0, -1, 0, -2)).toBe(true);
      expect(roadNetwork.hasEdgeBetween(0, 1, 0, 2)).toBe(true);
    });

    it("raises an error if adding an edge outside the allowed bounds", function() {
      expect(function() { roadNetwork.addEdge(-2, 0, -3, 0, 0.0, 1.0, RoadNetwork.SURFACE_GRADE) }).toThrowError(Error);
      expect(function() { roadNetwork.addEdge(2, 0, 3, 0, 0.0, 1.0, RoadNetwork.SURFACE_GRADE) }).toThrowError(Error);
      expect(function() { roadNetwork.addEdge(0, -2, 0, -3, 0.0, 1.0, RoadNetwork.SURFACE_GRADE) }).toThrowError(Error);
      expect(function() { roadNetwork.addEdge(0, 2, 0, 3, 0.0, 1.0, RoadNetwork.SURFACE_GRADE) }).toThrowError(Error);

      expect(roadNetwork.hasEdgeBetween(-2, 0, -3, 0)).toBe(false);
      expect(roadNetwork.hasEdgeBetween(2, 0, 3, 0)).toBe(false);
      expect(roadNetwork.hasEdgeBetween(0, -2, 0, -3)).toBe(false);
      expect(roadNetwork.hasEdgeBetween(0, 2, 0, 3)).toBe(false);
    });
  });


  describe(".removeEdge", function() {
    var roadNetwork = new RoadNetwork(terrain);

    it("allows removing an existing edge", function() {
      // Remove an existing edge
      expect(roadNetwork.hasEdgeBetween(0, 0, 1, 0)).toBe(false);
      roadNetwork.addEdge(0, 0, 1, 0, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
      expect(roadNetwork.hasEdgeBetween(0, 0, 1, 0)).toBe(true);
      roadNetwork.removeEdge(0, 0, 1, 0);
      expect(roadNetwork.hasEdgeBetween(0, 0, 1, 0)).toBe(false);
    });

    it("doesn't blow up when removing a non-existent edge between two intersections inside terrain bounds", function() {
      expect(roadNetwork.hasEdgeBetween(1, 1, 1, 2)).toBe(false);
      roadNetwork.removeEdge(1, 1, 1, 2);
      expect(roadNetwork.hasEdgeBetween(1, 1, 1, 2)).toBe(false);
    });

    it("doesn't blow up when removing a non-existent edge between two intersections outside terrain bounds", function() {
      expect(roadNetwork.hasEdgeBetween(10000, 0, 10001, 0)).toBe(false);
      roadNetwork.removeEdge(10000, 0, 10001, 0);
      expect(roadNetwork.hasEdgeBetween(10000, 0, 10001, 0)).toBe(false);
    });

    it("doesn't blow up when removing a non-existent edge between one intersection inside terrain bounds, and one outside", function() {
      expect(roadNetwork.hasEdgeBetween(2, 0, 3, 0)).toBe(false);
      roadNetwork.removeEdge(2, 0, 3, 0);
      expect(roadNetwork.hasEdgeBetween(2, 0, 3, 0)).toBe(false);
    });

    it("doesn't blow up when removing a non-existent edge between one intersection that exists, and another that doesn't", function() {
      expect(roadNetwork.hasEdgeBetween(2, 0, 3, 0)).toBe(false);
      roadNetwork.addEdge(1, 0, 2, 0, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
      roadNetwork.removeEdge(2, 0, 3, 0);
      expect(roadNetwork.hasEdgeBetween(2, 0, 3, 0)).toBe(false);
    });

    it("removes an intersection if it no longer has any connected edges", function() {
      roadNetwork.addEdge(0, 0, 0, 1, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);
      roadNetwork.addEdge(0, 1, 1, 1, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);

      expect(roadNetwork.hasEdgeBetween(0, 0, 0, 1)).toBe(true);
      expect(roadNetwork.hasEdgeBetween(0, 1, 1, 1)).toBe(true);
      expect(roadNetwork.hasIntersection(0, 0)).toBe(true);
      expect(roadNetwork.hasIntersection(0, 1)).toBe(true);
      expect(roadNetwork.hasIntersection(1, 1)).toBe(true);

      roadNetwork.removeEdge(0, 0, 0, 1);

      expect(roadNetwork.hasEdgeBetween(0, 0, 0, 1)).toBe(false);
      expect(roadNetwork.hasEdgeBetween(0, 1, 1, 1)).toBe(true);
      expect(roadNetwork.hasIntersection(0, 0)).toBe(false);
      expect(roadNetwork.hasIntersection(0, 1)).toBe(true);
      expect(roadNetwork.hasIntersection(1, 1)).toBe(true);

      roadNetwork.removeEdge(0, 1, 1, 1);

      expect(roadNetwork.hasEdgeBetween(0, 0, 0, 1)).toBe(false);
      expect(roadNetwork.hasEdgeBetween(0, 1, 1, 1)).toBe(false);
      expect(roadNetwork.hasIntersection(0, 0)).toBe(false);
      expect(roadNetwork.hasIntersection(0, 1)).toBe(false);
      expect(roadNetwork.hasIntersection(1, 1)).toBe(false);

      roadNetwork.addEdge(0, 1, 1, 1, 0.0, 1.0, RoadNetwork.SURFACE_GRADE);

      expect(roadNetwork.hasEdgeBetween(0, 0, 0, 1)).toBe(false);
      expect(roadNetwork.hasEdgeBetween(0, 1, 1, 1)).toBe(true);
      expect(roadNetwork.hasIntersection(0, 0)).toBe(false);
      expect(roadNetwork.hasIntersection(0, 1)).toBe(true);
      expect(roadNetwork.hasIntersection(1, 1)).toBe(true);
    });
  });
});

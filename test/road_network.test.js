"use strict";

import { RoadNetwork } from "./../src/road_network";
import { Terrain } from "./../src/terrain";

describe("RoadNetwork", function() {
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

  var terrain = new Terrain(TERRAIN_MESH, 1);

  it(".hasIntersection", function() {
    var roadNetwork = new RoadNetwork(terrain);

    expect(roadNetwork.hasIntersection(-1, 0)).toBe(false);
    expect(roadNetwork.hasIntersection(1, 2)).toBe(false);
    expect(roadNetwork.hasIntersection(3, 4)).toBe(false);

    roadNetwork.addEdge(-1, 0, 1, 2, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);

    expect(roadNetwork.hasIntersection(-1, 0)).toBe(true);
    expect(roadNetwork.hasIntersection(1, 2)).toBe(true);
    expect(roadNetwork.hasIntersection(3, 4)).toBe(false);

    expect(roadNetwork.hasIntersection(3.5, 4)).toBe(false);
    expect(roadNetwork.hasIntersection(3, 4.2)).toBe(false);
    expect(roadNetwork.hasIntersection(3.5, 4.2)).toBe(false);
    expect(roadNetwork.hasIntersection("a", "b")).toBe(false);
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

    roadNetwork.addEdge(-1, 0, 1, 2, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);

    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2, RoadNetwork.TERRAIN_SURFACE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2, RoadNetwork.BRIDGE_SURFACE)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0, RoadNetwork.TERRAIN_SURFACE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0, RoadNetwork.BRIDGE_SURFACE)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -2, 1)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, 1, 2)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 2, 1)).toBe(false);

    roadNetwork.addEdge(-1, 0, -2, 1, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);

    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2, RoadNetwork.TERRAIN_SURFACE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, 1, 2, RoadNetwork.BRIDGE_SURFACE)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0, RoadNetwork.TERRAIN_SURFACE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(1, 2, -1, 0, RoadNetwork.BRIDGE_SURFACE)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1, RoadNetwork.TERRAIN_SURFACE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-1, 0, -2, 1, RoadNetwork.BRIDGE_SURFACE)).toBe(false);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0, RoadNetwork.TERRAIN_SURFACE)).toBe(true);
    expect(roadNetwork.hasEdgeBetween(-2, 1, -1, 0, RoadNetwork.BRIDGE_SURFACE)).toBe(false);
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
    roadNetwork.addEdge(0, 0, 1, 0, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
    expect(roadNetwork.edgeBetween(0, 0, 1, 0)).toEqual({ distance: 1.0, surfaceType: RoadNetwork.TERRAIN_SURFACE });

    expect(roadNetwork.edgeBetween(1, 0, 2, 0)).toBe(undefined);
  });


  describe(".removeEdge", function() {
    var roadNetwork = new RoadNetwork(terrain);

    it("allows removing an existing edge", function() {
      // Remove an existing edge
      expect(roadNetwork.hasEdgeBetween(0, 0, 1, 0)).toBe(false);
      roadNetwork.addEdge(0, 0, 1, 0, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
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
      roadNetwork.addEdge(1, 0, 2, 0, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
      roadNetwork.removeEdge(2, 0, 3, 0);
      expect(roadNetwork.hasEdgeBetween(2, 0, 3, 0)).toBe(false);
    });

    it("removes an intersection if it no longer has any connected edges", function() {
      roadNetwork.addEdge(0, 0, 0, 1, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
      roadNetwork.addEdge(0, 1, 1, 1, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);

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

      roadNetwork.addEdge(0, 1, 1, 1, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);

      expect(roadNetwork.hasEdgeBetween(0, 0, 0, 1)).toBe(false);
      expect(roadNetwork.hasEdgeBetween(0, 1, 1, 1)).toBe(true);
      expect(roadNetwork.hasIntersection(0, 0)).toBe(false);
      expect(roadNetwork.hasIntersection(0, 1)).toBe(true);
      expect(roadNetwork.hasIntersection(1, 1)).toBe(true);
    });
  });
});

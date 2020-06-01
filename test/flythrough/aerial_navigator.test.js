"use strict";

import { RoadNetwork } from "./../../src/road_network";
import { Terrain } from "./../../src/terrain";
import { AerialNavigator } from "./../../src/flythrough/aerial_navigator";

describe("AerialNavigator", function() {
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

  var terrain = new Terrain(TERRAIN_MESH, 1);


  describe("road network is empty", function() {
    var roadNetwork, aerialNavigator;

    roadNetwork = new RoadNetwork(terrain);
    aerialNavigator = new AerialNavigator(roadNetwork, 1, 2);

    it("is a no-op if road network is empty", function() {
      expect(aerialNavigator.targetX()).toBe(1);
      expect(aerialNavigator.targetZ()).toBe(2);

      // This should not result in an infinite loop,
      aerialNavigator.nextTarget();

      expect(aerialNavigator.targetX()).toBe(1);
      expect(aerialNavigator.targetZ()).toBe(2);
    });
  });


  describe("road network doesn't fully cover terrain", function() {
    var roadNetwork, aerialNavigator;

    roadNetwork = new RoadNetwork(terrain);

    // Road network in the shape of a plus sign
    roadNetwork.addEdge(-2, 0,  -1,  0, 0.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge(-1, 0,   0,  0, 0.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 0, 0,   1,  0, 0.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 1, 0,   2,  0, 0.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 0, -2,  0, -1, 0.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 0, -1,  0,  0, 0.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 0, 0,   0,  1, 0.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 0, 1,   0,  2, 0.0, RoadNetwork.TERRAIN_SURFACE);

    aerialNavigator = new AerialNavigator(roadNetwork, 0, 0);

    it("chooses intersection on opposing axis when no road intersection on the movement axis is available", function() {
      var previousTargetX;

      expect(aerialNavigator.targetX()).toBe(0);
      expect(aerialNavigator.targetZ()).toBe(0);

      aerialNavigator.nextTarget();

      expect(aerialNavigator.targetX()).not.toBe(0);
      expect(aerialNavigator.targetZ()).toBe(0);

      previousTargetX = aerialNavigator.targetX();

      // Since there's no valid intersection on the Z-Axis to move to, an intersection
      // on the X-axis should be chosen instead.
      aerialNavigator.nextTarget();
      expect(aerialNavigator.targetX()).not.toBe(previousTargetX);
      expect(aerialNavigator.targetZ()).toBe(0);
    });


  });
});


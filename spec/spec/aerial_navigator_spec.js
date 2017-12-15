"use strict";

describe("CityTour.AerialNavigator", function() {
  var TERRAIN_MESH = [
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
    [
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
      {landHeight: 0.0, waterHeight: 0.0},
    ],
  ];

  var terrain = new CityTour.Terrain(TERRAIN_MESH, 1);

  describe("road network doesn't fully cover terrain", function() {
    var roadNetwork, aerialNavigator;

    roadNetwork = new CityTour.RoadNetwork(terrain);

    // Road network in the shape of a plus sign
    roadNetwork.addEdge(-2, 0,  -1,  0, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge(-1, 0,   0,  0, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 0, 0,   1,  0, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 1, 0,   2,  0, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 0, -2,  0, -1, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 0, -1,  0,  0, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 0, 0,   0,  1, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge( 0, 1,   0,  2, 0.0, CityTour.RoadNetwork.TERRAIN_SURFACE);

    aerialNavigator = new CityTour.AerialNavigator(roadNetwork, 0, 0);

    it("avoids an infinite loop when no road intersection on the movement axis is available", function() {
      var previousTargetMapX;

      expect(aerialNavigator.targetMapX()).toBe(0);
      expect(aerialNavigator.targetMapZ()).toBe(0);

      aerialNavigator.nextTarget();

      expect(aerialNavigator.targetMapX()).not.toBe(0);
      expect(aerialNavigator.targetMapZ()).toBe(0);

      previousTargetMapX = aerialNavigator.targetMapX();

      // Since there's no valid intersection on the Z-Axis to move to, an intersection
      // on the X-axis should be chosen instead.
      aerialNavigator.nextTarget();
      expect(aerialNavigator.targetMapX()).not.toBe(previousTargetMapX);
      expect(aerialNavigator.targetMapZ()).toBe(0);
    });


  });
});


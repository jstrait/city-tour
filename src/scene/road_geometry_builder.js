"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.RoadGeometryBuilder = function() {
  var COLOR_ROAD = 0xaaaaaa;

  var calculateRoadSegment = function(heightAtPoint1, heightAtPoint2, mapLength) {
    var midpointHeight = (heightAtPoint1 + heightAtPoint2) / 2;
    var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), mapLength);
    var length = Math.sqrt(Math.pow((heightAtPoint2 - heightAtPoint1), 2) + Math.pow(mapLength, 2));
  
    return {
      angle: angle,
      midpointHeight: midpointHeight,
      length: length,
    }
  };

  var roadGeometryBuilder = {};

  roadGeometryBuilder.build = function(terrain, roadNetwork) {
    var mapX, mapZ, sceneX, sceneZ;

    var roadMaterial = new THREE.MeshBasicMaterial({ color: COLOR_ROAD, });
    var roadGeometry = new THREE.Geometry();
    var roadSegmentMesh;
    var roadIntersection;
    var roadSegment;

    var reusableIntersectionMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.STREET_WIDTH, CityTour.Config.STREET_DEPTH), roadMaterial);
    reusableIntersectionMesh.rotation.x = -(Math.PI / 2);

    for (mapX = -CityTour.Config.HALF_BLOCK_COLUMNS; mapX <= CityTour.Config.HALF_BLOCK_COLUMNS; mapX++) {
      sceneX = CityTour.Coordinates.mapXToSceneX(mapX);

      for (mapZ = -CityTour.Config.HALF_BLOCK_ROWS; mapZ <= CityTour.Config.HALF_BLOCK_ROWS; mapZ++) { 
        sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ);

        if (roadNetwork.hasIntersection(mapX, mapZ)) {
          // Road intersection
          roadSegmentMesh = reusableIntersectionMesh;
          roadSegmentMesh.position.x = sceneX;
          roadSegmentMesh.position.y = terrain.heightAtCoordinates(mapX, mapZ);
          roadSegmentMesh.position.z = sceneZ;
          roadSegmentMesh.updateMatrix();
          roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);

          // North/South road segment
          if (roadNetwork.hasEdgeBetween(mapX, mapZ, mapX, mapZ + 1)) {
            roadSegment = calculateRoadSegment(terrain.heightAtCoordinates(mapX, mapZ),
                                               terrain.heightAtCoordinates(mapX, mapZ + 1),
                                               CityTour.Config.BLOCK_DEPTH);

            roadSegmentMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.STREET_WIDTH, roadSegment.length), roadMaterial);
            roadSegmentMesh.position.x = sceneX;
            roadSegmentMesh.rotation.x = roadSegment.angle - (Math.PI / 2);
            roadSegmentMesh.position.y = roadSegment.midpointHeight;
            roadSegmentMesh.position.z = sceneZ + (CityTour.Config.BLOCK_AND_STREET_DEPTH / 2);
            roadSegmentMesh.updateMatrix();
            roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);
          }

          // East/West road segment
          if (roadNetwork.hasEdgeBetween(mapX, mapZ, mapX + 1, mapZ)) {
            roadSegment = calculateRoadSegment(terrain.heightAtCoordinates(mapX, mapZ),
                                               terrain.heightAtCoordinates(mapX + 1, mapZ),
                                               CityTour.Config.BLOCK_WIDTH);

            roadSegmentMesh = new THREE.Mesh(new THREE.PlaneGeometry(roadSegment.length, CityTour.Config.STREET_WIDTH), roadMaterial);
            roadSegmentMesh.position.x = sceneX + (CityTour.Config.BLOCK_AND_STREET_WIDTH / 2);
            roadSegmentMesh.rotation.x = -(Math.PI / 2);
            roadSegmentMesh.position.y = roadSegment.midpointHeight;
            roadSegmentMesh.rotation.y = roadSegment.angle;
            roadSegmentMesh.position.z = sceneZ;
            roadSegmentMesh.updateMatrix();
            roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);
          }
        }
      }
    }

    return new THREE.Mesh(roadGeometry, roadMaterial);
  };

  return roadGeometryBuilder;
};

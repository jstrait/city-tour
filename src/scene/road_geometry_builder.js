"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.RoadGeometryBuilder = function() {
  var COLOR_ROAD = 0xaaaaaa;

  var roadGeometryBuilder = {};

  roadGeometryBuilder.build = function(terrain, roadNetwork) {
    var mapX, mapZ, sceneX, sceneZ;

    var roadMaterial = new THREE.MeshBasicMaterial({ color: COLOR_ROAD, });
    var roadGeometry = new THREE.Geometry();
    var roadSegment;
    var heightAtPoint1, heightAtPoint2;
    var midpointHeight, angle, segmentLength;
    var roadIntersection;

    var reusableIntersectionMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.STREET_WIDTH, CityTour.Config.STREET_DEPTH), roadMaterial);
    reusableIntersectionMesh.rotation.x = -(Math.PI / 2);

    for (mapX = -CityTour.Config.HALF_BLOCK_COLUMNS; mapX <= CityTour.Config.HALF_BLOCK_COLUMNS; mapX++) {
      sceneX = CityTour.Coordinates.mapXToSceneX(mapX);

      for (mapZ = -CityTour.Config.HALF_BLOCK_ROWS; mapZ <= CityTour.Config.HALF_BLOCK_ROWS; mapZ++) { 
        sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ);

        roadIntersection = roadNetwork.intersectionAt(mapX, mapZ);

        if (roadIntersection) {
          // Road intersection
          roadSegment = reusableIntersectionMesh;
          roadSegment.position.x = sceneX;
          roadSegment.position.y = terrain.heightAtCoordinates(mapX, mapZ);
          roadSegment.position.z = sceneZ;
          roadSegment.updateMatrix();
          roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);

          // North/South road segment
          if (roadIntersection.hasPathTo(mapX, mapZ + 1)) {
            if (mapZ < CityTour.Config.HALF_BLOCK_ROWS) {
              heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
              heightAtPoint2 = terrain.heightAtCoordinates(mapX, mapZ + 1);
              midpointHeight = (heightAtPoint1 + heightAtPoint2) / 2;
              angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_DEPTH);

              segmentLength = Math.sqrt(Math.pow((heightAtPoint2 - heightAtPoint1), 2) + Math.pow(CityTour.Config.BLOCK_DEPTH, 2));

              roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.STREET_WIDTH, segmentLength), roadMaterial);
              roadSegment.position.x = sceneX;
              roadSegment.rotation.x = angle - (Math.PI / 2);
              roadSegment.position.y = midpointHeight;
              roadSegment.position.z = sceneZ + (CityTour.Config.BLOCK_AND_STREET_DEPTH / 2);
              roadSegment.updateMatrix();
              roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);
            }
          }

          // East/West road segment
          if (roadIntersection.hasPathTo(mapX + 1, mapZ)) {
            if (mapX < CityTour.Config.HALF_BLOCK_COLUMNS) {
              heightAtPoint1 = terrain.heightAtCoordinates(mapX, mapZ);
              heightAtPoint2 = terrain.heightAtCoordinates(mapX + 1, mapZ);
              midpointHeight = (heightAtPoint1 + heightAtPoint2) / 2;
              angle = Math.atan2((heightAtPoint1 - heightAtPoint2), CityTour.Config.BLOCK_WIDTH);

              segmentLength = Math.sqrt(Math.pow((heightAtPoint2 - heightAtPoint1), 2) + Math.pow(CityTour.Config.BLOCK_WIDTH, 2));

              roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(segmentLength, CityTour.Config.STREET_WIDTH), roadMaterial);
              roadSegment.position.x = sceneX + (CityTour.Config.BLOCK_AND_STREET_WIDTH / 2);
              roadSegment.rotation.x = -(Math.PI / 2);
              roadSegment.position.y = midpointHeight;
              roadSegment.rotation.y = angle;
              roadSegment.position.z = sceneZ;
              roadSegment.updateMatrix();
              roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);
            }
          }
        }
      }
    }

    return new THREE.Mesh(roadGeometry, roadMaterial);
  };

  return roadGeometryBuilder;
};

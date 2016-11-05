"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.RoadGeometryBuilder = function() {
  var COLOR_ROAD = 0xaaaaaa;
  var COLOR_SIDEWALK = 0xffffff;

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
    var HALF_PI = Math.PI / 2;
    var HALF_BLOCK_AND_STREET_WIDTH = CityTour.Config.BLOCK_AND_STREET_WIDTH / 2;
    var HALF_BLOCK_AND_STREET_DEPTH = CityTour.Config.BLOCK_AND_STREET_DEPTH / 2;
    
    var mapX, mapZ, sceneX, sceneZ;

    var roadSegment;

    var roadMaterial = new THREE.MeshBasicMaterial({ color: COLOR_ROAD, });
    var roadGeometry = new THREE.Geometry();
    var roadSegmentMesh;

    var sidewalkMaterial = new THREE.MeshBasicMaterial({ color: COLOR_SIDEWALK, });
    var sidewalkGeometry = new THREE.Geometry();
    var sidewalkSegmentMesh;

    var reusableIntersectionMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.STREET_WIDTH, CityTour.Config.STREET_DEPTH), roadMaterial);
    reusableIntersectionMesh.rotation.x = -HALF_PI;

    var reusableIntersectionSidewalkCornerMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.SIDEWALK_WIDTH, CityTour.Config.SIDEWALK_DEPTH), sidewalkMaterial);
    reusableIntersectionSidewalkCornerMesh.rotation.x = -HALF_PI;

    var reusableIntersectionSidewalkFullNorthSouthMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.SIDEWALK_WIDTH, CityTour.Config.STREET_DEPTH * 0.5), sidewalkMaterial);
    reusableIntersectionSidewalkFullNorthSouthMesh.rotation.x = -HALF_PI;

    var reusableIntersectionSidewalkFullEastWestMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.STREET_WIDTH * 0.5, CityTour.Config.SIDEWALK_DEPTH), sidewalkMaterial);
    reusableIntersectionSidewalkFullEastWestMesh.rotation.x = -HALF_PI;

    var reusableNorthSouthMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.STREET_WIDTH, 1.0), roadMaterial);
    var reusableEastWestMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, CityTour.Config.STREET_DEPTH), roadMaterial);

    var reusableNorthSouthSidewalkMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.SIDEWALK_WIDTH, 1.0), sidewalkMaterial);
    var reusableEastWestSidewalkMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, CityTour.Config.SIDEWALK_DEPTH), sidewalkMaterial);

    for (mapX = roadNetwork.minColumn(); mapX <= roadNetwork.maxColumn(); mapX++) {
      sceneX = CityTour.Coordinates.mapXToSceneX(mapX);

      for (mapZ = roadNetwork.minRow(); mapZ <= roadNetwork.maxRow(); mapZ++) { 
        sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ);

        if (roadNetwork.hasIntersection(mapX, mapZ)) {
          // Road intersection
          roadSegmentMesh = reusableIntersectionMesh;
          roadSegmentMesh.position.x = sceneX;
          roadSegmentMesh.position.y = terrain.heightAtCoordinates(mapX, mapZ);
          roadSegmentMesh.position.z = sceneZ;
          roadSegmentMesh.updateMatrix();
          roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);

          sidewalkSegmentMesh = reusableIntersectionSidewalkCornerMesh;
          sidewalkSegmentMesh.position.y = terrain.heightAtCoordinates(mapX, mapZ);

          // Upper left sidewalk
          sidewalkSegmentMesh.position.x = sceneX - (CityTour.Config.STREET_WIDTH * 0.375);
          sidewalkSegmentMesh.position.z = sceneZ - (CityTour.Config.STREET_DEPTH * 0.375);
          sidewalkSegmentMesh.updateMatrix();
          sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

          // Upper right sidewalk
          sidewalkSegmentMesh.position.x = sceneX + (CityTour.Config.STREET_WIDTH * 0.375);
          sidewalkSegmentMesh.position.z = sceneZ - (CityTour.Config.STREET_DEPTH * 0.375);
          sidewalkSegmentMesh.updateMatrix();
          sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

          // Lower left sidewalk
          sidewalkSegmentMesh.position.x = sceneX - (CityTour.Config.STREET_WIDTH * 0.375);
          sidewalkSegmentMesh.position.z = sceneZ + (CityTour.Config.STREET_DEPTH * 0.375);
          sidewalkSegmentMesh.updateMatrix();
          sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

          // Lower right sidewalk
          sidewalkSegmentMesh.position.x = sceneX + (CityTour.Config.STREET_WIDTH * 0.375);
          sidewalkSegmentMesh.position.z = sceneZ + (CityTour.Config.STREET_DEPTH * 0.375);
          sidewalkSegmentMesh.updateMatrix();
          sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

          if (!roadNetwork.hasEdgeBetween(mapX, mapZ, mapX, mapZ - 1)) {
            sidewalkSegmentMesh = reusableIntersectionSidewalkFullEastWestMesh;
            sidewalkSegmentMesh.position.y = terrain.heightAtCoordinates(mapX, mapZ);
            sidewalkSegmentMesh.position.x = sceneX;
            sidewalkSegmentMesh.position.z = sceneZ - (CityTour.Config.STREET_DEPTH * 0.375);
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }

          if (!roadNetwork.hasEdgeBetween(mapX, mapZ, mapX, mapZ + 1)) {
            sidewalkSegmentMesh = reusableIntersectionSidewalkFullEastWestMesh;
            sidewalkSegmentMesh.position.y = terrain.heightAtCoordinates(mapX, mapZ);
            sidewalkSegmentMesh.position.x = sceneX;
            sidewalkSegmentMesh.position.z = sceneZ + (CityTour.Config.STREET_DEPTH * 0.375);
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }

          if (!roadNetwork.hasEdgeBetween(mapX, mapZ, mapX - 1, mapZ)) {
            sidewalkSegmentMesh = reusableIntersectionSidewalkFullNorthSouthMesh;
            sidewalkSegmentMesh.position.y = terrain.heightAtCoordinates(mapX, mapZ);
            sidewalkSegmentMesh.position.x = sceneX - (CityTour.Config.STREET_WIDTH * 0.375);
            sidewalkSegmentMesh.position.z = sceneZ;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }

          if (!roadNetwork.hasEdgeBetween(mapX, mapZ, mapX + 1, mapZ)) {
            sidewalkSegmentMesh = reusableIntersectionSidewalkFullNorthSouthMesh;
            sidewalkSegmentMesh.position.y = terrain.heightAtCoordinates(mapX, mapZ);
            sidewalkSegmentMesh.position.x = sceneX + (CityTour.Config.STREET_WIDTH * 0.375);
            sidewalkSegmentMesh.position.z = sceneZ;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }


          // North/South road segment
          if (roadNetwork.hasEdgeBetween(mapX, mapZ, mapX, mapZ + 1)) {
            roadSegment = calculateRoadSegment(terrain.heightAtCoordinates(mapX, mapZ),
                                               terrain.heightAtCoordinates(mapX, mapZ + 1),
                                               CityTour.Config.BLOCK_DEPTH);

            roadSegmentMesh = reusableNorthSouthMesh;
            roadSegmentMesh.position.x = sceneX;
            roadSegmentMesh.rotation.x = roadSegment.angle - HALF_PI;
            roadSegmentMesh.scale.y = roadSegment.length;
            roadSegmentMesh.position.y = roadSegment.midpointHeight;
            roadSegmentMesh.position.z = sceneZ + HALF_BLOCK_AND_STREET_DEPTH;
            roadSegmentMesh.updateMatrix();
            roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);

            // Left sidewalk
            sidewalkSegmentMesh = reusableNorthSouthSidewalkMesh;
            sidewalkSegmentMesh.position.x = sceneX - (CityTour.Config.STREET_WIDTH * 0.375);
            sidewalkSegmentMesh.rotation.x = roadSegment.angle - HALF_PI;
            sidewalkSegmentMesh.scale.y = roadSegment.length;
            sidewalkSegmentMesh.position.y = roadSegment.midpointHeight;
            sidewalkSegmentMesh.position.z = sceneZ + HALF_BLOCK_AND_STREET_DEPTH;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

            // Right sidewalk
            sidewalkSegmentMesh = reusableNorthSouthSidewalkMesh;
            sidewalkSegmentMesh.position.x = sceneX + (CityTour.Config.STREET_WIDTH * 0.375);
            sidewalkSegmentMesh.rotation.x = roadSegment.angle - HALF_PI;
            sidewalkSegmentMesh.scale.y = roadSegment.length;
            sidewalkSegmentMesh.position.y = roadSegment.midpointHeight;
            sidewalkSegmentMesh.position.z = sceneZ + HALF_BLOCK_AND_STREET_DEPTH;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }

          // East/West road segment
          if (roadNetwork.hasEdgeBetween(mapX, mapZ, mapX + 1, mapZ)) {
            roadSegment = calculateRoadSegment(terrain.heightAtCoordinates(mapX, mapZ),
                                               terrain.heightAtCoordinates(mapX + 1, mapZ),
                                               CityTour.Config.BLOCK_WIDTH);

            roadSegmentMesh = reusableEastWestMesh;
            roadSegmentMesh.scale.x = roadSegment.length;
            roadSegmentMesh.position.x = sceneX + HALF_BLOCK_AND_STREET_WIDTH;
            roadSegmentMesh.rotation.x = -HALF_PI;
            roadSegmentMesh.position.y = roadSegment.midpointHeight;
            roadSegmentMesh.rotation.y = roadSegment.angle;
            roadSegmentMesh.position.z = sceneZ;
            roadSegmentMesh.updateMatrix();
            roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);

            // North sidewalk
            sidewalkSegmentMesh = reusableEastWestSidewalkMesh;
            sidewalkSegmentMesh.scale.x = roadSegment.length;
            sidewalkSegmentMesh.position.x = sceneX + HALF_BLOCK_AND_STREET_WIDTH;
            sidewalkSegmentMesh.rotation.x = -HALF_PI;
            sidewalkSegmentMesh.position.y = roadSegment.midpointHeight;
            sidewalkSegmentMesh.rotation.y = roadSegment.angle;
            sidewalkSegmentMesh.position.z = sceneZ - (CityTour.Config.STREET_DEPTH * 0.375);
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

            // South sidewalk
            sidewalkSegmentMesh = reusableEastWestSidewalkMesh;
            sidewalkSegmentMesh.scale.x = roadSegment.length;
            sidewalkSegmentMesh.position.x = sceneX + HALF_BLOCK_AND_STREET_WIDTH;
            sidewalkSegmentMesh.rotation.x = -HALF_PI;
            sidewalkSegmentMesh.position.y = roadSegment.midpointHeight;
            sidewalkSegmentMesh.rotation.y = roadSegment.angle;
            sidewalkSegmentMesh.position.z = sceneZ + (CityTour.Config.STREET_DEPTH * 0.375);
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }
        }
      }
    }

    return [new THREE.Mesh(roadGeometry, roadMaterial), new THREE.Mesh(sidewalkGeometry, sidewalkMaterial)];
  };

  return roadGeometryBuilder;
};

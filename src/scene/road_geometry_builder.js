"use strict";

var CityTour = CityTour || {};
CityTour.Scene = CityTour.Scene || {};

CityTour.Scene.RoadGeometryBuilder = function() {
  var HALF_PI = Math.PI / 2;
  var SIDEWALK_X_CENTER = (CityTour.Config.STREET_WIDTH / 2) - (CityTour.Config.SIDEWALK_WIDTH / 2);
  var SIDEWALK_Z_CENTER = (CityTour.Config.STREET_DEPTH / 2) - (CityTour.Config.SIDEWALK_DEPTH / 2);

  var COLOR_ROAD = 0xaaaaaa;
  var COLOR_SIDEWALK = 0xcccccc;

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

  var buildReusableIntersectionCornerMesh = function(sidewalkMaterial) {
    var reusableIntersectionSidewalkCornerMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.SIDEWALK_WIDTH, CityTour.Config.SIDEWALK_DEPTH), sidewalkMaterial);
    reusableIntersectionSidewalkCornerMesh.rotation.x = -HALF_PI;

    var intersectionSidewalkCornerGeometry = new THREE.Geometry();

    reusableIntersectionSidewalkCornerMesh.position.x = -SIDEWALK_X_CENTER;
    reusableIntersectionSidewalkCornerMesh.position.z = -SIDEWALK_Z_CENTER;
    reusableIntersectionSidewalkCornerMesh.updateMatrix();
    intersectionSidewalkCornerGeometry.merge(reusableIntersectionSidewalkCornerMesh.geometry, reusableIntersectionSidewalkCornerMesh.matrix);

    reusableIntersectionSidewalkCornerMesh.position.x = SIDEWALK_X_CENTER;
    reusableIntersectionSidewalkCornerMesh.position.z = -SIDEWALK_Z_CENTER;
    reusableIntersectionSidewalkCornerMesh.updateMatrix();
    intersectionSidewalkCornerGeometry.merge(reusableIntersectionSidewalkCornerMesh.geometry, reusableIntersectionSidewalkCornerMesh.matrix);

    reusableIntersectionSidewalkCornerMesh.position.x = -SIDEWALK_X_CENTER;
    reusableIntersectionSidewalkCornerMesh.position.z = SIDEWALK_Z_CENTER;
    reusableIntersectionSidewalkCornerMesh.updateMatrix();
    intersectionSidewalkCornerGeometry.merge(reusableIntersectionSidewalkCornerMesh.geometry, reusableIntersectionSidewalkCornerMesh.matrix);

    reusableIntersectionSidewalkCornerMesh.position.x = SIDEWALK_X_CENTER;
    reusableIntersectionSidewalkCornerMesh.position.z = SIDEWALK_Z_CENTER;
    reusableIntersectionSidewalkCornerMesh.updateMatrix();
    intersectionSidewalkCornerGeometry.merge(reusableIntersectionSidewalkCornerMesh.geometry, reusableIntersectionSidewalkCornerMesh.matrix);

    return new THREE.Mesh(intersectionSidewalkCornerGeometry, sidewalkMaterial);
  };

  var roadGeometryBuilder = {};

  roadGeometryBuilder.build = function(terrain, roadNetwork) {
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

    var reusableIntersectionMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.ROAD_WIDTH, CityTour.Config.ROAD_DEPTH), roadMaterial);
    reusableIntersectionMesh.rotation.x = -HALF_PI;

    var reusableIntersectionFillerNorthSouthMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.SIDEWALK_WIDTH, CityTour.Config.ROAD_DEPTH), roadMaterial);
    reusableIntersectionFillerNorthSouthMesh.rotation.x = -HALF_PI;

    var reusableIntersectionFillerEastWestMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.ROAD_WIDTH, CityTour.Config.SIDEWALK_DEPTH), roadMaterial);
    reusableIntersectionFillerEastWestMesh.rotation.x = -HALF_PI;

    var reusableNorthSouthMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.ROAD_WIDTH, 1.0), roadMaterial);
    var reusableEastWestMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, CityTour.Config.ROAD_DEPTH), roadMaterial);

    var reusableNorthSouthSidewalkMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityTour.Config.SIDEWALK_WIDTH, 1.0), sidewalkMaterial);
    var reusableEastWestSidewalkMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, CityTour.Config.SIDEWALK_DEPTH), sidewalkMaterial);

    var intersectionSidewalkCornerMesh = buildReusableIntersectionCornerMesh(sidewalkMaterial);

    var northRoad, eastRoad, southRoad, westRoad;
    var selfSurfaceHeight, southSurfaceHeight, eastSurfaceHeight;

    for (mapX = roadNetwork.minColumn(); mapX <= roadNetwork.maxColumn(); mapX++) {
      sceneX = CityTour.Coordinates.mapXToSceneX(mapX);

      for (mapZ = roadNetwork.minRow(); mapZ <= roadNetwork.maxRow(); mapZ++) { 
        sceneZ = CityTour.Coordinates.mapZToSceneZ(mapZ);

        if (roadNetwork.hasIntersection(mapX, mapZ)) {
          selfSurfaceHeight = roadNetwork.getIntersectionHeight(mapX, mapZ);

          northRoad = roadNetwork.edgeBetween(mapX, mapZ, mapX, mapZ - 1);
          eastRoad = roadNetwork.edgeBetween(mapX, mapZ, mapX + 1, mapZ);
          southRoad = roadNetwork.edgeBetween(mapX, mapZ, mapX, mapZ + 1);
          westRoad = roadNetwork.edgeBetween(mapX, mapZ, mapX - 1, mapZ);

          // Road intersection
          roadSegmentMesh = reusableIntersectionMesh;
          roadSegmentMesh.position.x = sceneX;
          roadSegmentMesh.position.y = selfSurfaceHeight;
          roadSegmentMesh.position.z = sceneZ;
          roadSegmentMesh.updateMatrix();
          roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);

          sidewalkSegmentMesh = intersectionSidewalkCornerMesh;
          sidewalkSegmentMesh.position.x = sceneX;
          sidewalkSegmentMesh.position.y = selfSurfaceHeight;
          sidewalkSegmentMesh.position.z = sceneZ;
          sidewalkSegmentMesh.updateMatrix();
          sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

          sidewalkSegmentMesh = reusableIntersectionFillerEastWestMesh;
          sidewalkSegmentMesh.position.y = selfSurfaceHeight;

          // Top sidewalk "filler"
          sidewalkSegmentMesh.position.x = sceneX;
          sidewalkSegmentMesh.position.z = sceneZ - SIDEWALK_Z_CENTER;
          sidewalkSegmentMesh.updateMatrix();
          if (northRoad != false) {
            roadGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }
          else {
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);    
          }

          // Bottom sidewalk "filler"
          sidewalkSegmentMesh.position.x = sceneX;
          sidewalkSegmentMesh.position.z = sceneZ + SIDEWALK_Z_CENTER;
          sidewalkSegmentMesh.updateMatrix();
          if (southRoad != false) {
            roadGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }
          else {
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);    
          }

          sidewalkSegmentMesh = reusableIntersectionFillerNorthSouthMesh;
          sidewalkSegmentMesh.position.y = selfSurfaceHeight;

          // Left sidewalk "filler"
          sidewalkSegmentMesh.position.x = sceneX - SIDEWALK_X_CENTER;
          sidewalkSegmentMesh.position.z = sceneZ;
          sidewalkSegmentMesh.updateMatrix();
          if (westRoad != false) {
            roadGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }
          else {
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }

          // Right sidewalk "filler"
          sidewalkSegmentMesh.position.x = sceneX + SIDEWALK_X_CENTER;
          sidewalkSegmentMesh.position.z = sceneZ;
          sidewalkSegmentMesh.updateMatrix();
          if (eastRoad != false) {
            roadGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }
          else {
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }


          // North/South road segment
          if (southRoad != false) {
            southSurfaceHeight = roadNetwork.getIntersectionHeight(mapX, mapZ + 1);

            roadSegment = calculateRoadSegment(selfSurfaceHeight,
                                               southSurfaceHeight,
                                               CityTour.Config.BLOCK_DEPTH);

            roadSegmentMesh = reusableNorthSouthMesh;
            roadSegmentMesh.position.x = sceneX;
            roadSegmentMesh.rotation.x = roadSegment.angle - HALF_PI;
            roadSegmentMesh.scale.y = roadSegment.length;
            roadSegmentMesh.position.y = roadSegment.midpointHeight;
            roadSegmentMesh.position.z = sceneZ + HALF_BLOCK_AND_STREET_DEPTH;
            roadSegmentMesh.updateMatrix();
            roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);

            sidewalkSegmentMesh = reusableNorthSouthSidewalkMesh;
            sidewalkSegmentMesh.rotation.x = roadSegment.angle - HALF_PI;
            sidewalkSegmentMesh.scale.y = roadSegment.length;
            sidewalkSegmentMesh.position.y = roadSegment.midpointHeight;
            sidewalkSegmentMesh.position.z = sceneZ + HALF_BLOCK_AND_STREET_DEPTH;

            // Left sidewalk
            sidewalkSegmentMesh.position.x = sceneX - SIDEWALK_X_CENTER;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

            // Right sidewalk
            sidewalkSegmentMesh.position.x = sceneX + SIDEWALK_X_CENTER;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }

          // East/West road segment
          if (eastRoad != false) {
            eastSurfaceHeight = roadNetwork.getIntersectionHeight(mapX + 1, mapZ);

            roadSegment = calculateRoadSegment(selfSurfaceHeight,
                                               eastSurfaceHeight,
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

            sidewalkSegmentMesh = reusableEastWestSidewalkMesh;
            sidewalkSegmentMesh.scale.x = roadSegment.length;
            sidewalkSegmentMesh.position.x = sceneX + HALF_BLOCK_AND_STREET_WIDTH;
            sidewalkSegmentMesh.rotation.x = -HALF_PI;
            sidewalkSegmentMesh.position.y = roadSegment.midpointHeight;
            sidewalkSegmentMesh.rotation.y = roadSegment.angle;

            // North sidewalk
            sidewalkSegmentMesh.position.z = sceneZ - SIDEWALK_Z_CENTER;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

            // South sidewalk
            sidewalkSegmentMesh.position.z = sceneZ + SIDEWALK_Z_CENTER;
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

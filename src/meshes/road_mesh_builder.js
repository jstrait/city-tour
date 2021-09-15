"use strict";

import * as THREE from "three";

import { Config } from "./../config";
import { CityTourMath } from "./../math";
import { RoadNetwork } from "./../road_network";

const HALF_PI = Math.PI * 0.5;

var RoadMeshBuilder = function() {
  var SIDEWALK_X_CENTER = (Config.STREET_WIDTH / 2) - (Config.SIDEWALK_WIDTH / 2);
  var SIDEWALK_Z_CENTER = (Config.STREET_DEPTH / 2) - (Config.SIDEWALK_DEPTH / 2);

  var COLOR_ROAD = 0xaaaaaa;
  var COLOR_SIDEWALK = 0xcccccc;
  var COLOR_GUARDRAIL = 0xbbbbbb;

  var calculateRoadSegment = function(heightAtPoint1, heightAtPoint2, mapLength) {
    var midpointHeight = (heightAtPoint1 + heightAtPoint2) / 2;
    var angle = Math.atan2((heightAtPoint1 - heightAtPoint2), mapLength);
    var length = CityTourMath.distanceBetweenPoints(heightAtPoint1, 0, heightAtPoint2, mapLength);

    return {
      angle: angle,
      midpointHeight: midpointHeight,
      length: length,
    };
  };

  var buildReusableIntersectionCornerMesh = function() {
    var reusableIntersectionSidewalkCornerMesh = new THREE.Mesh(new THREE.PlaneGeometry(Config.SIDEWALK_WIDTH, Config.SIDEWALK_DEPTH));
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

    return new THREE.Mesh(intersectionSidewalkCornerGeometry);
  };

  var roadMeshBuilder = {};

  roadMeshBuilder.build = function(terrain, roadNetwork) {
    var HALF_BLOCK_AND_STREET_WIDTH = Config.BLOCK_AND_STREET_WIDTH / 2;
    var HALF_BLOCK_AND_STREET_DEPTH = Config.BLOCK_AND_STREET_DEPTH / 2;
    var BRIDGE_SUPPORT_HEIGHT = 8.333333333333333;
    var HALF_BRIDGE_SUPPORT_HEIGHT = BRIDGE_SUPPORT_HEIGHT / 2;
    var BRIDGE_SUPPORT_SEPARATION_FROM_ROAD_DECK = 0.020833333333333;

    var x, z;

    var roadSegment;

    var roadMaterial = new THREE.MeshBasicMaterial({ color: COLOR_ROAD, side: THREE.DoubleSide });
    var roadGeometry = new THREE.Geometry();
    var roadSegmentMesh;

    var sidewalkMaterial = new THREE.MeshBasicMaterial({ color: COLOR_SIDEWALK, side: THREE.DoubleSide });
    var sidewalkGeometry = new THREE.Geometry();
    var sidewalkSegmentMesh;

    var guardrailMaterial = new THREE.MeshBasicMaterial({ color: COLOR_GUARDRAIL, side: THREE.DoubleSide });
    var guardrailGeometry = new THREE.Geometry();
    var guardrailSegmentMesh;

    var reusableIntersectionMesh = new THREE.Mesh(new THREE.PlaneGeometry(Config.ROAD_WIDTH, Config.ROAD_DEPTH));
    reusableIntersectionMesh.rotation.x = -HALF_PI;

    var reusableIntersectionFillerNorthSouthMesh = new THREE.Mesh(new THREE.PlaneGeometry(Config.SIDEWALK_WIDTH, Config.ROAD_DEPTH));
    reusableIntersectionFillerNorthSouthMesh.rotation.x = -HALF_PI;

    var reusableIntersectionFillerEastWestMesh = new THREE.Mesh(new THREE.PlaneGeometry(Config.ROAD_WIDTH, Config.SIDEWALK_DEPTH));
    reusableIntersectionFillerEastWestMesh.rotation.x = -HALF_PI;

    var reusableNorthSouthMesh = new THREE.Mesh(new THREE.PlaneGeometry(Config.ROAD_WIDTH, 1.0));
    var reusableEastWestMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, Config.ROAD_DEPTH));
    reusableEastWestMesh.rotation.x = -HALF_PI;

    var reusableNorthSouthSidewalkMesh = new THREE.Mesh(new THREE.PlaneGeometry(Config.SIDEWALK_WIDTH, 1.0));
    var reusableEastWestSidewalkMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, Config.SIDEWALK_DEPTH));
    reusableEastWestSidewalkMesh.rotation.x = -HALF_PI;

    var intersectionSidewalkCornerMesh = buildReusableIntersectionCornerMesh();

    var reusableBridgeSupportMesh = new THREE.Mesh(new THREE.BoxGeometry(0.075, BRIDGE_SUPPORT_HEIGHT, 0.075));
    var reusableGuardrailMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.0));

    var northRoad, eastRoad, southRoad, westRoad;
    var selfSurfaceHeight, southSurfaceHeight, eastSurfaceHeight;

    var minX = roadNetwork.minBoundingX();
    var maxX = roadNetwork.maxBoundingX();
    var minZ = roadNetwork.minBoundingZ();
    var maxZ = roadNetwork.maxBoundingZ();

    for (x = minX; x <= maxX; x++) {
      for (z = minZ; z <= maxZ; z++) {
        if (roadNetwork.hasIntersection(x, z)) {
          selfSurfaceHeight = roadNetwork.getRoadHeight(x, z);

          northRoad = roadNetwork.hasEdgeBetween(x, z, x, z - 1);
          eastRoad = roadNetwork.hasEdgeBetween(x, z, x + 1, z);
          southRoad = roadNetwork.hasEdgeBetween(x, z, x, z + 1);
          westRoad = roadNetwork.hasEdgeBetween(x, z, x - 1, z);

          // Road intersection
          roadSegmentMesh = reusableIntersectionMesh;
          roadSegmentMesh.position.x = x;
          roadSegmentMesh.position.y = selfSurfaceHeight;
          roadSegmentMesh.position.z = z;
          roadSegmentMesh.updateMatrix();
          roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);

          if (roadNetwork.getIntersectionGradeType(x, z) === RoadNetwork.BRIDGE_GRADE) {
            reusableBridgeSupportMesh.position.x = x;
            reusableBridgeSupportMesh.position.y = selfSurfaceHeight - HALF_BRIDGE_SUPPORT_HEIGHT - BRIDGE_SUPPORT_SEPARATION_FROM_ROAD_DECK;
            reusableBridgeSupportMesh.position.z = z;
            reusableBridgeSupportMesh.updateMatrix();
            sidewalkGeometry.merge(reusableBridgeSupportMesh.geometry, reusableBridgeSupportMesh.matrix);

            // Guardrail
            if (northRoad === true && southRoad === true) {
              guardrailSegmentMesh = reusableGuardrailMesh;
              guardrailSegmentMesh.scale.y = Config.STREET_WIDTH;
              guardrailSegmentMesh.position.y = selfSurfaceHeight;
              guardrailSegmentMesh.rotation.x = 0.0;
              guardrailSegmentMesh.rotation.y = HALF_PI;
              guardrailSegmentMesh.rotation.z = HALF_PI;
              guardrailSegmentMesh.position.z = z;

              // Left guardrail
              guardrailSegmentMesh.position.x = x - (Config.STREET_WIDTH / 2);
              guardrailSegmentMesh.updateMatrix();
              guardrailGeometry.merge(guardrailSegmentMesh.geometry, guardrailSegmentMesh.matrix);

              // Right guardrail
              guardrailSegmentMesh.position.x = x + (Config.STREET_WIDTH / 2);
              guardrailSegmentMesh.updateMatrix();
              guardrailGeometry.merge(guardrailSegmentMesh.geometry, guardrailSegmentMesh.matrix);
            }
            else if (eastRoad === true && westRoad === true) {
              guardrailSegmentMesh = reusableGuardrailMesh;
              guardrailSegmentMesh.position.x = x;
              guardrailSegmentMesh.rotation.x = 0.0;
              guardrailSegmentMesh.scale.y = Config.STREET_DEPTH;
              guardrailSegmentMesh.position.y = selfSurfaceHeight;
              guardrailSegmentMesh.rotation.y = 0.0;
              guardrailSegmentMesh.rotation.z = HALF_PI;

              // North guardrail
              guardrailSegmentMesh.position.z = z - (Config.STREET_DEPTH / 2);
              guardrailSegmentMesh.updateMatrix();
              guardrailGeometry.merge(guardrailSegmentMesh.geometry, guardrailSegmentMesh.matrix);

              // South guardrail
              guardrailSegmentMesh.position.z = z + (Config.STREET_DEPTH / 2);
              guardrailSegmentMesh.updateMatrix();
              guardrailGeometry.merge(guardrailSegmentMesh.geometry, guardrailSegmentMesh.matrix);
            }
          }

          sidewalkSegmentMesh = intersectionSidewalkCornerMesh;
          sidewalkSegmentMesh.position.x = x;
          sidewalkSegmentMesh.position.y = selfSurfaceHeight;
          sidewalkSegmentMesh.position.z = z;
          sidewalkSegmentMesh.updateMatrix();
          sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

          sidewalkSegmentMesh = reusableIntersectionFillerEastWestMesh;
          sidewalkSegmentMesh.position.y = selfSurfaceHeight;

          // Top sidewalk "filler"
          sidewalkSegmentMesh.position.x = x;
          sidewalkSegmentMesh.position.z = z - SIDEWALK_Z_CENTER;
          sidewalkSegmentMesh.updateMatrix();
          if (northRoad === true) {
            roadGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }
          else {
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }

          // Bottom sidewalk "filler"
          sidewalkSegmentMesh.position.x = x;
          sidewalkSegmentMesh.position.z = z + SIDEWALK_Z_CENTER;
          sidewalkSegmentMesh.updateMatrix();
          if (southRoad === true) {
            roadGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }
          else {
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }

          sidewalkSegmentMesh = reusableIntersectionFillerNorthSouthMesh;
          sidewalkSegmentMesh.position.y = selfSurfaceHeight;

          // Left sidewalk "filler"
          sidewalkSegmentMesh.position.x = x - SIDEWALK_X_CENTER;
          sidewalkSegmentMesh.position.z = z;
          sidewalkSegmentMesh.updateMatrix();
          if (westRoad === true) {
            roadGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }
          else {
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }

          // Right sidewalk "filler"
          sidewalkSegmentMesh.position.x = x + SIDEWALK_X_CENTER;
          sidewalkSegmentMesh.position.z = z;
          sidewalkSegmentMesh.updateMatrix();
          if (eastRoad === true) {
            roadGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }
          else {
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);
          }


          // North/South road segment
          if (southRoad === true) {
            southSurfaceHeight = roadNetwork.getRoadHeight(x, z + 1);

            roadSegment = calculateRoadSegment(selfSurfaceHeight,
                                               southSurfaceHeight,
                                               Config.BLOCK_DEPTH);

            roadSegmentMesh = reusableNorthSouthMesh;
            roadSegmentMesh.position.x = x;
            roadSegmentMesh.rotation.x = roadSegment.angle - HALF_PI;
            roadSegmentMesh.scale.y = roadSegment.length;
            roadSegmentMesh.position.y = roadSegment.midpointHeight;
            roadSegmentMesh.position.z = z + HALF_BLOCK_AND_STREET_DEPTH;
            roadSegmentMesh.updateMatrix();
            roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);

            sidewalkSegmentMesh = reusableNorthSouthSidewalkMesh;
            sidewalkSegmentMesh.rotation.x = roadSegment.angle - HALF_PI;
            sidewalkSegmentMesh.scale.y = roadSegment.length;
            sidewalkSegmentMesh.position.y = roadSegment.midpointHeight;
            sidewalkSegmentMesh.position.z = z + HALF_BLOCK_AND_STREET_DEPTH;

            // Left sidewalk
            sidewalkSegmentMesh.position.x = x - SIDEWALK_X_CENTER;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

            // Right sidewalk
            sidewalkSegmentMesh.position.x = x + SIDEWALK_X_CENTER;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

            if (roadNetwork.edgeBetween(x, z, x, z + 1).gradeType === RoadNetwork.BRIDGE_GRADE) {
              // Guardrail
              guardrailSegmentMesh = reusableGuardrailMesh;
              guardrailSegmentMesh.rotation.x = roadSegment.angle;
              guardrailSegmentMesh.scale.y = roadSegment.length;
              guardrailSegmentMesh.position.y = roadSegment.midpointHeight;
              guardrailSegmentMesh.rotation.y = HALF_PI;
              guardrailSegmentMesh.rotation.z = HALF_PI;
              guardrailSegmentMesh.position.z = z + HALF_BLOCK_AND_STREET_DEPTH;

              // Left guardrail
              guardrailSegmentMesh.position.x = x - (Config.STREET_WIDTH / 2);
              guardrailSegmentMesh.updateMatrix();
              guardrailGeometry.merge(guardrailSegmentMesh.geometry, guardrailSegmentMesh.matrix);

              // Right guardrail
              guardrailSegmentMesh.position.x = x + (Config.STREET_WIDTH / 2);
              guardrailSegmentMesh.updateMatrix();
              guardrailGeometry.merge(guardrailSegmentMesh.geometry, guardrailSegmentMesh.matrix);
            }
          }

          // East/West road segment
          if (eastRoad === true) {
            eastSurfaceHeight = roadNetwork.getRoadHeight(x + 1, z);

            roadSegment = calculateRoadSegment(selfSurfaceHeight,
                                               eastSurfaceHeight,
                                               Config.BLOCK_WIDTH);

            roadSegmentMesh = reusableEastWestMesh;
            roadSegmentMesh.scale.x = roadSegment.length;
            roadSegmentMesh.position.x = x + HALF_BLOCK_AND_STREET_WIDTH;
            roadSegmentMesh.position.y = roadSegment.midpointHeight;
            roadSegmentMesh.rotation.y = roadSegment.angle;
            roadSegmentMesh.position.z = z;
            roadSegmentMesh.updateMatrix();
            roadGeometry.merge(roadSegmentMesh.geometry, roadSegmentMesh.matrix);

            sidewalkSegmentMesh = reusableEastWestSidewalkMesh;
            sidewalkSegmentMesh.scale.x = roadSegment.length;
            sidewalkSegmentMesh.position.x = x + HALF_BLOCK_AND_STREET_WIDTH;
            sidewalkSegmentMesh.position.y = roadSegment.midpointHeight;
            sidewalkSegmentMesh.rotation.y = roadSegment.angle;

            // North sidewalk
            sidewalkSegmentMesh.position.z = z - SIDEWALK_Z_CENTER;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

            // South sidewalk
            sidewalkSegmentMesh.position.z = z + SIDEWALK_Z_CENTER;
            sidewalkSegmentMesh.updateMatrix();
            sidewalkGeometry.merge(sidewalkSegmentMesh.geometry, sidewalkSegmentMesh.matrix);

            if (roadNetwork.edgeBetween(x, z, x + 1, z).gradeType === RoadNetwork.BRIDGE_GRADE) {
              // Guardrail
              guardrailSegmentMesh = reusableGuardrailMesh;
              guardrailSegmentMesh.position.x = x + HALF_BLOCK_AND_STREET_DEPTH;
              guardrailSegmentMesh.rotation.x = 0.0;
              guardrailSegmentMesh.scale.y = roadSegment.length;
              guardrailSegmentMesh.position.y = roadSegment.midpointHeight;
              guardrailSegmentMesh.rotation.y = 0.0;
              guardrailSegmentMesh.rotation.z = -roadSegment.angle - HALF_PI;

              // Left guardrail
              guardrailSegmentMesh.position.z = z - (Config.STREET_DEPTH / 2);
              guardrailSegmentMesh.updateMatrix();
              guardrailGeometry.merge(guardrailSegmentMesh.geometry, guardrailSegmentMesh.matrix);

              // Right guardrail
              guardrailSegmentMesh.position.z = z + (Config.STREET_DEPTH / 2);
              guardrailSegmentMesh.updateMatrix();
              guardrailGeometry.merge(guardrailSegmentMesh.geometry, guardrailSegmentMesh.matrix);
            }
          }
        }
      }
    }

    return [new THREE.Mesh(roadGeometry, roadMaterial),
            new THREE.Mesh(sidewalkGeometry, sidewalkMaterial),
            new THREE.Mesh(guardrailGeometry, guardrailMaterial)];
  };

  return roadMeshBuilder;
};

export { RoadMeshBuilder };

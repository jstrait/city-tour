"use strict";

import * as THREE from "three";

import { Config } from "./../config";
import { RoadNetwork } from "./../road_network";

const SIDEWALK_WIDTH = Config.STREET_WIDTH * 0.24;
const SIDEWALK_DEPTH = Config.STREET_DEPTH * 0.24;

const HALF_ROADBED_WIDTH = Config.HALF_STREET_WIDTH - SIDEWALK_WIDTH;
const HALF_ROADBED_DEPTH = Config.HALF_STREET_DEPTH - SIDEWALK_DEPTH;

const HALF_BRIDGE_SUPPORT_COLUMN_WIDTH = 0.0375;
const HALF_BRIDGE_SUPPORT_COLUMN_DEPTH = 0.0375;
const BRIDGE_SUPPORT_COLUMN_BOTTOM_Y = 0.0;

const HALF_GUARDRAIL_HEIGHT = 0.025;

var RoadMeshBuilder = function() {
  let build = function(terrain, roadNetwork) {
    var x, z;

    var roadGeometry = new THREE.BufferGeometry();
    let roadPositionAttributes = [];
    var roadMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });

    var sidewalkGeometry = new THREE.BufferGeometry();
    let sidewalkPositionAttributes = [];
    var sidewalkMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });

    var guardrailGeometry = new THREE.BufferGeometry();
    let guardrailPositionAttributes = [];
    var guardrailMaterial = new THREE.MeshBasicMaterial({ color: 0xbbbbbb, side: THREE.DoubleSide });

    let positionAttributes;

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
          addQuad(
            roadPositionAttributes,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
          );

          // Northwest sidewalk corner
          addQuad(
            sidewalkPositionAttributes,
            x - Config.HALF_STREET_WIDTH, selfSurfaceHeight, z - Config.HALF_STREET_DEPTH,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z - Config.HALF_STREET_DEPTH,
            x - Config.HALF_STREET_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
          );

          // Northeast sidewalk corner
          addQuad(
            sidewalkPositionAttributes,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z - Config.HALF_STREET_DEPTH,
            x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z - Config.HALF_STREET_DEPTH,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
            x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
          );

          // Southwest sidewalk corner
          addQuad(
            sidewalkPositionAttributes,
            x - Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
            x - Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
          );

          // Southeast sidewalk corner
          addQuad(
            sidewalkPositionAttributes,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
            x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
            x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
          );

          if (roadNetwork.getIntersectionGradeType(x, z) === RoadNetwork.BRIDGE_GRADE) {
            // North bridge support column wall
            addQuad(
              sidewalkPositionAttributes,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, selfSurfaceHeight, z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, selfSurfaceHeight, z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, BRIDGE_SUPPORT_COLUMN_BOTTOM_Y, z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, BRIDGE_SUPPORT_COLUMN_BOTTOM_Y, z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
            );

            // South bridge support column wall
            addQuad(
              sidewalkPositionAttributes,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, selfSurfaceHeight, z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, selfSurfaceHeight, z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, BRIDGE_SUPPORT_COLUMN_BOTTOM_Y, z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, BRIDGE_SUPPORT_COLUMN_BOTTOM_Y, z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
            );

            // West bridge support column wall
            addQuad(
              sidewalkPositionAttributes,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, selfSurfaceHeight, z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, selfSurfaceHeight, z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, BRIDGE_SUPPORT_COLUMN_BOTTOM_Y, z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, BRIDGE_SUPPORT_COLUMN_BOTTOM_Y, z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
            );

            // East bridge support column wall
            addQuad(
              sidewalkPositionAttributes,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, selfSurfaceHeight, z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, selfSurfaceHeight, z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, BRIDGE_SUPPORT_COLUMN_BOTTOM_Y, z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH, BRIDGE_SUPPORT_COLUMN_BOTTOM_Y, z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
            );

            // Guardrail
            if (northRoad === true && southRoad === true) {
              // West guardrail
              addQuad(
                guardrailPositionAttributes,
                x - Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
              );

              // East guardrail
              addQuad(
                guardrailPositionAttributes,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
              );
            }
            else if (eastRoad === true && westRoad === true) {
              // North guardrail
              addQuad(
                guardrailPositionAttributes,
                x - Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
              );

              // South guardrail
              addQuad(
                guardrailPositionAttributes,
                x - Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
              );
            }
          }

          // North sidewalk "filler"
          positionAttributes = (northRoad === true) ? roadPositionAttributes : sidewalkPositionAttributes;
          addQuad(
            positionAttributes,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z - Config.HALF_STREET_DEPTH,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z - Config.HALF_STREET_DEPTH,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
          );

          // South sidewalk "filler"
          positionAttributes = (southRoad === true) ? roadPositionAttributes : sidewalkPositionAttributes;
          addQuad(
            positionAttributes,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
          );

          // West sidewalk "filler"
          positionAttributes = (westRoad === true) ? roadPositionAttributes : sidewalkPositionAttributes;
          addQuad(
            positionAttributes,
            x - Config.HALF_STREET_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
            x - Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
          );

          // East sidewalk "filler"
          positionAttributes = (eastRoad === true) ? roadPositionAttributes : sidewalkPositionAttributes;
          addQuad(
            positionAttributes,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
            x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
            x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
          );

          // Road segment going south from the intersection
          if (southRoad === true) {
            southSurfaceHeight = roadNetwork.getRoadHeight(x, z + 1);

            // Main road surface
            addQuad(
              roadPositionAttributes,
              x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
              x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
              x - HALF_ROADBED_WIDTH, southSurfaceHeight, z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
              x + HALF_ROADBED_WIDTH, southSurfaceHeight, z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
            );

            // West sidewalk
            addQuad(
              sidewalkPositionAttributes,
              x - Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
              x - HALF_ROADBED_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
              x - Config.HALF_STREET_WIDTH, southSurfaceHeight, z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
              x - HALF_ROADBED_WIDTH, southSurfaceHeight, z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
            );

            // East sidewalk
            addQuad(
              sidewalkPositionAttributes,
              x + HALF_ROADBED_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
              x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
              x + HALF_ROADBED_WIDTH, southSurfaceHeight, z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
              x + Config.HALF_STREET_WIDTH, southSurfaceHeight, z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
            );

            if (roadNetwork.edgeBetween(x, z, x, z + 1).gradeType === RoadNetwork.BRIDGE_GRADE) {
              // West guardrail
              addQuad(
                guardrailPositionAttributes,
                x - Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH, southSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
                x - Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH, southSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
              );

              // East guardrail
              addQuad(
                guardrailPositionAttributes,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, southSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, southSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
              );
            }
          }

          // Road segment going east from the intersection
          if (eastRoad === true) {
            eastSurfaceHeight = roadNetwork.getRoadHeight(x + 1, z);

            // Main road surface
            addQuad(
              roadPositionAttributes,
              x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH, eastSurfaceHeight, z - HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH, eastSurfaceHeight, z + HALF_ROADBED_DEPTH,
            );

            // North sidewalk
            addQuad(
              sidewalkPositionAttributes,
              x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z - Config.HALF_STREET_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH, eastSurfaceHeight, z - Config.HALF_STREET_DEPTH,
              x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z - HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH, eastSurfaceHeight, z - HALF_ROADBED_DEPTH,
            );

            // South sidewalk
            addQuad(
              sidewalkPositionAttributes,
              x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH, eastSurfaceHeight, z + HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH, selfSurfaceHeight, z + Config.HALF_STREET_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH, eastSurfaceHeight, z + Config.HALF_STREET_DEPTH,
            );

            if (roadNetwork.edgeBetween(x, z, x + 1, z).gradeType === RoadNetwork.BRIDGE_GRADE) {
              // North guardrail
              addQuad(
                guardrailPositionAttributes,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH, eastSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH, eastSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z - Config.HALF_STREET_DEPTH,
              );

              // South guardrail
              addQuad(
                guardrailPositionAttributes,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH, eastSurfaceHeight + HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH, selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH, eastSurfaceHeight - HALF_GUARDRAIL_HEIGHT, z + Config.HALF_STREET_DEPTH,
              );
            }
          }
        }
      }
    }

    roadGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(roadPositionAttributes), 3).onUpload(disposeArray));
    sidewalkGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(sidewalkPositionAttributes), 3).onUpload(disposeArray));
    guardrailGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(guardrailPositionAttributes), 3).onUpload(disposeArray));

    return [new THREE.Mesh(roadGeometry, roadMaterial),
            new THREE.Mesh(sidewalkGeometry, sidewalkMaterial),
            new THREE.Mesh(guardrailGeometry, guardrailMaterial)];
  };

  let addQuad = function(positionAttributes, x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) {
    positionAttributes.push(
      x1, y1, z1, x2, y2, z2, x3, y3, z3,  // Triangle 1
      x3, y3, z3, x2, y2, z2, x4, y4, z4,  // Triangle 2
    );
  };

  let disposeArray = function() {
    this.array = null;
  };


  return {
    build: build,
  };
};

export { RoadMeshBuilder };

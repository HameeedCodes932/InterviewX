/**
 * Generate distinct seated male/female interviewer GLB assets (InterviewX original).
 * Multi-node scene graph: Body, Chest, Eyelid_L, Eyelid_R for idle animation.
 *
 * Usage: node avatar/scripts/generate-interviewers.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../assets");
const WEB_DIR = path.resolve(__dirname, "../../apps/web/public/avatars");

function box(cx, cy, cz, sx, sy, sz) {
  const hx = sx / 2,
    hy = sy / 2,
    hz = sz / 2;
  const v = [
    [cx - hx, cy - hy, cz - hz],
    [cx + hx, cy - hy, cz - hz],
    [cx + hx, cy + hy, cz - hz],
    [cx - hx, cy + hy, cz - hz],
    [cx - hx, cy - hy, cz + hz],
    [cx + hx, cy - hy, cz + hz],
    [cx + hx, cy + hy, cz + hz],
    [cx - hx, cy + hy, cz + hz],
  ];
  const faces = [
    [0, 1, 2, 3],
    [4, 7, 6, 5],
    [0, 4, 5, 1],
    [2, 6, 7, 3],
    [0, 3, 7, 4],
    [1, 5, 6, 2],
  ];
  const positions = [];
  const indices = [];
  let base = 0;
  for (const f of faces) {
    for (const i of f) positions.push(...v[i]);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    base += 4;
  }
  return { positions, indices };
}

function ellipsoid(cx, cy, cz, rx, ry, rz, segsU = 12, segsV = 8) {
  const positions = [];
  const indices = [];
  for (let v = 0; v <= segsV; v++) {
    const phi = (v / segsV) * Math.PI;
    for (let u = 0; u <= segsU; u++) {
      const theta = (u / segsU) * Math.PI * 2;
      positions.push(
        cx + rx * Math.sin(phi) * Math.cos(theta),
        cy + ry * Math.cos(phi),
        cz + rz * Math.sin(phi) * Math.sin(theta),
      );
    }
  }
  for (let v = 0; v < segsV; v++) {
    for (let u = 0; u < segsU; u++) {
      const a = v * (segsU + 1) + u;
      const b = a + segsU + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions, indices };
}

function cylinder(cx, cy, cz, rTop, rBot, h, segs = 12) {
  const positions = [];
  const indices = [];
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    positions.push(cx + c * rBot, y0, cz + s * rBot);
    positions.push(cx + c * rTop, y1, cz + s * rTop);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const topCenter = positions.length / 3;
  positions.push(cx, y1, cz);
  const botCenter = positions.length / 3;
  positions.push(cx, y0, cz);
  for (let i = 0; i < segs; i++) {
    const t0 = i * 2 + 1;
    const t1 = ((i + 1) % (segs + 1)) * 2 + 1;
    indices.push(topCenter, t0, t1);
    const b0 = i * 2;
    const b1 = ((i + 1) % (segs + 1)) * 2;
    indices.push(botCenter, b1, b0);
  }
  return { positions, indices };
}

function withNormals(mesh) {
  const { positions, indices } = mesh;
  const normals = new Array(positions.length).fill(0);
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;
    const ax = positions[i1] - positions[i0];
    const ay = positions[i1 + 1] - positions[i0 + 1];
    const az = positions[i1 + 2] - positions[i0 + 2];
    const bx = positions[i2] - positions[i0];
    const by = positions[i2 + 1] - positions[i0 + 1];
    const bz = positions[i2 + 2] - positions[i0 + 2];
    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    for (const ii of [i0, i1, i2]) {
      normals[ii] += nx;
      normals[ii + 1] += ny;
      normals[ii + 2] += nz;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= len;
    normals[i + 1] /= len;
    normals[i + 2] /= len;
  }
  return { positions, normals, indices };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

function mergeParts(parts) {
  const positions = [];
  const indices = [];
  let offset = 0;
  for (const mesh of parts) {
    positions.push(...mesh.positions);
    for (const idx of mesh.indices) indices.push(idx + offset);
    offset += mesh.positions.length / 3;
  }
  return withNormals({ positions, indices });
}

function maleParts() {
  const skin = "#c68642";
  const suit = "#1e3a5f";
  const shirt = "#e8eef5";
  const pants = "#152536";
  const hair = "#2a1f14";
  const shoe = "#1a1a1a";
  const eyeWhite = "#f5f5f5";
  const iris = "#3d2914";
  const lid = "#b8753a";

  return [
    {
      name: "LowerBody",
      color: pants,
      mesh: mergeParts([
        box(0, 0.55, 0.02, 0.42, 0.18, 0.34),
        box(-0.12, 0.42, 0.28, 0.16, 0.14, 0.46),
        box(0.12, 0.42, 0.28, 0.16, 0.14, 0.46),
        box(-0.12, 0.18, 0.48, 0.14, 0.34, 0.14),
        box(0.12, 0.18, 0.48, 0.14, 0.34, 0.14),
      ]),
    },
    {
      name: "Shoes",
      color: shoe,
      mesh: mergeParts([
        box(-0.12, 0.04, 0.56, 0.16, 0.08, 0.28),
        box(0.12, 0.04, 0.56, 0.16, 0.08, 0.28),
      ]),
    },
    {
      name: "Chest",
      color: suit,
      mesh: mergeParts([
        box(0, 0.92, -0.02, 0.48, 0.55, 0.28),
        box(-0.3, 1.12, -0.02, 0.14, 0.14, 0.22),
        box(0.3, 1.12, -0.02, 0.14, 0.14, 0.22),
        box(-0.38, 0.88, 0.06, 0.12, 0.36, 0.12),
        box(0.38, 0.88, 0.06, 0.12, 0.36, 0.12),
        box(-0.28, 0.72, 0.28, 0.12, 0.1, 0.32),
        box(0.28, 0.72, 0.28, 0.12, 0.1, 0.32),
      ]),
    },
    {
      name: "Shirt",
      color: shirt,
      mesh: mergeParts([box(0, 0.9, 0.08, 0.18, 0.5, 0.06)]),
    },
    {
      name: "Skin",
      color: skin,
      mesh: mergeParts([
        box(-0.22, 0.72, 0.48, 0.1, 0.06, 0.12),
        box(0.22, 0.72, 0.48, 0.1, 0.06, 0.12),
        cylinder(0, 1.28, -0.02, 0.07, 0.08, 0.12, 10),
        ellipsoid(0, 1.48, -0.02, 0.14, 0.17, 0.15, 14, 10),
        ellipsoid(-0.15, 1.48, -0.02, 0.025, 0.04, 0.02, 8, 6),
        ellipsoid(0.15, 1.48, -0.02, 0.025, 0.04, 0.02, 8, 6),
      ]),
    },
    {
      name: "Hair",
      color: hair,
      mesh: mergeParts([ellipsoid(0, 1.55, -0.04, 0.145, 0.1, 0.155, 12, 6)]),
    },
    {
      name: "Eyes",
      color: eyeWhite,
      mesh: mergeParts([
        ellipsoid(-0.05, 1.5, 0.12, 0.028, 0.018, 0.012, 8, 6),
        ellipsoid(0.05, 1.5, 0.12, 0.028, 0.018, 0.012, 8, 6),
      ]),
    },
    {
      name: "Iris",
      color: iris,
      mesh: mergeParts([
        ellipsoid(-0.05, 1.5, 0.13, 0.014, 0.014, 0.01, 8, 6),
        ellipsoid(0.05, 1.5, 0.13, 0.014, 0.014, 0.01, 8, 6),
      ]),
    },
    {
      name: "Eyelid_L",
      color: lid,
      mesh: mergeParts([box(-0.05, 1.515, 0.125, 0.06, 0.012, 0.02)]),
    },
    {
      name: "Eyelid_R",
      color: lid,
      mesh: mergeParts([box(0.05, 1.515, 0.125, 0.06, 0.012, 0.02)]),
    },
  ];
}

function femaleParts() {
  const skin = "#e0ac69";
  const blouse = "#0d7377";
  const pants = "#2c2c34";
  const hair = "#4a2c0a";
  const shoe = "#222222";
  const eyeWhite = "#f8f8f8";
  const iris = "#2e5a3c";
  const lid = "#d4a06a";
  const blazer = "#1a2f38";

  return [
    {
      name: "LowerBody",
      color: pants,
      mesh: mergeParts([
        box(0, 0.55, 0.02, 0.36, 0.16, 0.3),
        box(-0.1, 0.42, 0.26, 0.14, 0.12, 0.44),
        box(0.1, 0.42, 0.26, 0.14, 0.12, 0.44),
        box(-0.1, 0.18, 0.46, 0.12, 0.32, 0.12),
        box(0.1, 0.18, 0.46, 0.12, 0.32, 0.12),
      ]),
    },
    {
      name: "Shoes",
      color: shoe,
      mesh: mergeParts([
        box(-0.1, 0.04, 0.54, 0.14, 0.07, 0.26),
        box(0.1, 0.04, 0.54, 0.14, 0.07, 0.26),
      ]),
    },
    {
      name: "Chest",
      color: blazer,
      mesh: mergeParts([
        box(0, 0.95, -0.04, 0.42, 0.42, 0.26),
        box(-0.26, 1.1, -0.02, 0.12, 0.12, 0.2),
        box(0.26, 1.1, -0.02, 0.12, 0.12, 0.2),
        box(-0.32, 0.86, 0.05, 0.1, 0.34, 0.1),
        box(0.32, 0.86, 0.05, 0.1, 0.34, 0.1),
      ]),
    },
    {
      name: "Blouse",
      color: blouse,
      mesh: mergeParts([
        box(0, 0.9, -0.02, 0.36, 0.5, 0.24),
        box(-0.24, 0.7, 0.26, 0.1, 0.09, 0.3),
        box(0.24, 0.7, 0.26, 0.1, 0.09, 0.3),
      ]),
    },
    {
      name: "Skin",
      color: skin,
      mesh: mergeParts([
        box(-0.18, 0.7, 0.46, 0.09, 0.055, 0.11),
        box(0.18, 0.7, 0.46, 0.09, 0.055, 0.11),
        cylinder(0, 1.24, -0.02, 0.06, 0.065, 0.1, 10),
        ellipsoid(0, 1.44, -0.02, 0.125, 0.155, 0.135, 14, 10),
        ellipsoid(-0.135, 1.44, -0.02, 0.022, 0.035, 0.018, 8, 6),
        ellipsoid(0.135, 1.44, -0.02, 0.022, 0.035, 0.018, 8, 6),
      ]),
    },
    {
      name: "Hair",
      color: hair,
      mesh: mergeParts([
        ellipsoid(0, 1.5, -0.06, 0.14, 0.12, 0.15, 12, 8),
        box(-0.12, 1.28, -0.08, 0.08, 0.36, 0.1),
        box(0.12, 1.28, -0.08, 0.08, 0.36, 0.1),
        box(0, 1.2, -0.14, 0.2, 0.28, 0.08),
      ]),
    },
    {
      name: "Eyes",
      color: eyeWhite,
      mesh: mergeParts([
        ellipsoid(-0.045, 1.46, 0.11, 0.026, 0.016, 0.011, 8, 6),
        ellipsoid(0.045, 1.46, 0.11, 0.026, 0.016, 0.011, 8, 6),
      ]),
    },
    {
      name: "Iris",
      color: iris,
      mesh: mergeParts([
        ellipsoid(-0.045, 1.46, 0.12, 0.012, 0.012, 0.009, 8, 6),
        ellipsoid(0.045, 1.46, 0.12, 0.012, 0.012, 0.009, 8, 6),
      ]),
    },
    {
      name: "Eyelid_L",
      color: lid,
      mesh: mergeParts([box(-0.045, 1.475, 0.115, 0.055, 0.01, 0.018)]),
    },
    {
      name: "Eyelid_R",
      color: lid,
      mesh: mergeParts([box(0.045, 1.475, 0.115, 0.055, 0.01, 0.018)]),
    },
  ];
}

function pad4(buf, padByte = 0x00) {
  const pad = (4 - (buf.length % 4)) % 4;
  if (!pad) return buf;
  return Buffer.concat([buf, Buffer.alloc(pad, padByte)]);
}

function buildGlb(groups, rootName) {
  const bufferPieces = [];
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const materials = [];
  const nodes = [];
  const childIndices = [];

  let byteOffset = 0;

  groups.forEach((g, gi) => {
    const pos = Buffer.from(new Float32Array(g.mesh.positions).buffer);
    const nor = Buffer.from(new Float32Array(g.mesh.normals).buffer);
    const idx = Buffer.from(new Uint32Array(g.mesh.indices).buffer);

    const viewsStart = bufferViews.length;
    for (const b of [pos, nor, idx]) {
      bufferViews.push({ buffer: 0, byteOffset, byteLength: b.length });
      bufferPieces.push(b);
      byteOffset += b.length;
    }

    const vertexCount = g.mesh.positions.length / 3;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < g.mesh.positions.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], g.mesh.positions[i + k]);
        max[k] = Math.max(max[k], g.mesh.positions[i + k]);
      }
    }

    const accBase = accessors.length;
    accessors.push(
      {
        bufferView: viewsStart,
        componentType: 5126,
        count: vertexCount,
        type: "VEC3",
        min,
        max,
      },
      { bufferView: viewsStart + 1, componentType: 5126, count: vertexCount, type: "VEC3" },
      {
        bufferView: viewsStart + 2,
        componentType: 5125,
        count: g.mesh.indices.length,
        type: "SCALAR",
      },
    );

    materials.push({
      name: `${g.name}Mat`,
      pbrMetallicRoughness: {
        baseColorFactor: hexToRgb(g.color),
        metallicFactor: 0.05,
        roughnessFactor: 0.7,
      },
      doubleSided: true,
    });

    meshes.push({
      name: g.name,
      primitives: [
        {
          attributes: { POSITION: accBase, NORMAL: accBase + 1 },
          indices: accBase + 2,
          material: gi,
        },
      ],
    });

    const nodeIndex = nodes.length + 1; // +1 for root at 0
    childIndices.push(nodeIndex);
    nodes.push({ name: g.name, mesh: gi });
  });

  const root = {
    name: rootName,
    children: childIndices,
    extras: {
      interviewx: {
        kind: "seated_interviewer",
        breath_node: "Chest",
        blink_nodes: ["Eyelid_L", "Eyelid_R"],
      },
    },
  };

  const allNodes = [root, ...nodes];
  // Fix children indices: root children should point to 1..n
  allNodes[0].children = groups.map((_, i) => i + 1);

  const bin = pad4(Buffer.concat(bufferPieces), 0x00);
  const gltf = {
    asset: { version: "2.0", generator: "InterviewX generate-interviewers.mjs" },
    scenes: [{ name: "InterviewSeat", nodes: [0] }],
    scene: 0,
    nodes: allNodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: bin.length }],
  };

  // glTF 2.0: JSON chunk padding MUST be spaces (0x20), not NUL
  const json = pad4(Buffer.from(JSON.stringify(gltf), "utf8"), 0x20);
  const totalLength = 12 + 8 + json.length + 8 + bin.length;
  const out = Buffer.alloc(totalLength);
  out.writeUInt32LE(0x46546c67, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(totalLength, 8);
  let p = 12;
  out.writeUInt32LE(json.length, p);
  out.writeUInt32LE(0x4e4f534a, p + 4);
  json.copy(out, p + 8);
  p += 8 + json.length;
  out.writeUInt32LE(bin.length, p);
  out.writeUInt32LE(0x004e4942, p + 4);
  bin.copy(out, p + 8);
  return out;
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

ensureDir(OUT_DIR);
ensureDir(WEB_DIR);

const assets = [
  ["interviewer_male_v1.glb", maleParts(), "interviewer_male_v1"],
  ["interviewer_female_v1.glb", femaleParts(), "interviewer_female_v1"],
];

for (const [file, parts, name] of assets) {
  const buf = buildGlb(parts, name);
  for (const dir of [OUT_DIR, WEB_DIR]) {
    const dest = path.join(dir, file);
    fs.writeFileSync(dest, buf);
    console.log(`Wrote ${dest} (${buf.length} bytes)`);
  }
}

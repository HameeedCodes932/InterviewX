# Avatar asset licences

Every 3D asset and runtime dependency used by InterviewX Phase 2 avatars is listed here. Re-verify at pin / download time before commercial packaging.

## InterviewX original character assets

| Asset | Path | Licence | Notes |
| ----- | ---- | ------- | ----- |
| Male seated interviewer v1 | `avatar/assets/interviewer_male_v1.glb` (mirror: `apps/web/public/avatars/`) | **InterviewX Original** — created for InterviewX; free to use within this project | Distinct navy-suit seated male; multi-node GLB (`Chest`, `Eyelid_L`, `Eyelid_R`) for idle breath/blink |
| Female seated interviewer v1 | `avatar/assets/interviewer_female_v1.glb` (mirror: `apps/web/public/avatars/`) | **InterviewX Original** — created for InterviewX; free to use within this project | Distinct teal-blouse / charcoal blazer seated female; separate mesh from male (not a texture/voice swap) |

**Provenance:** Procedural geometry authored via `avatar/scripts/generate-interviewers.mjs` (Node, no third-party mesh packs). Regenerable; no Mixamo / Ready Player Me / marketplace kits.

**Not used:** AVTR-1, Avatar Forcing, InsightFace, purchased NC character kits.

## Environment (runtime primitives)

Chair, desk, floor, and lighting in the interview room are constructed at runtime with Three.js primitives inside `@interviewx/avatar` (no external environment GLB). Geometry is InterviewX Original.

## Runtime libraries (npm)

| Package | Role | Licence (typical; confirm at pin) |
| ------- | ---- | --------------------------------- |
| `three` | WebGL / glTF loader | MIT |
| `@react-three/fiber` | React renderer for Three.js | MIT |
| `@react-three/drei` | Helpers (`useGLTF`, lights, etc.) | MIT |
| `@types/three` | TypeScript types | MIT |

## Tooling

| Tool | Role | Licence note |
| ---- | ---- | ------------ |
| Node.js script `generate-interviewers.mjs` | Builds GLB binaries | InterviewX script; output art owned by InterviewX |
| Blender (optional future) | DCC customisation | GPL for the app; **exported artwork remains yours** (Blender Foundation FAQ) |

## Regeneration

```bash
node avatar/scripts/generate-interviewers.mjs
```

Writes to `avatar/assets/` and `apps/web/public/avatars/`.

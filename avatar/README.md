# InterviewX Avatar

Browser avatar runtime (React Three Fiber) for seated interviewers.

## Phase 2 status

- Distinct **male** and **female** seated GLB characters (`assets/`)
- Professional interview environment (desk, chairs, lighting)
- Idle **breathing** + **blink** via named GLB nodes (`Chest`, `Eyelid_L`, `Eyelid_R`)
- Wired into `apps/web` interview room; gender from profile / session
- Brain stays separate — this package only renders

## Assets & licences

See [`LICENSES.md`](./LICENSES.md). Regenerate originals:

```bash
npm run generate-assets
# or: node scripts/generate-interviewers.mjs
```

## Usage (from apps/web)

```tsx
import dynamic from "next/dynamic";

const InterviewScene = dynamic(
  () => import("@interviewx/avatar").then((m) => m.InterviewScene),
  { ssr: false },
);

<InterviewScene gender="female" behaviourState="IDLE" />
```

## Separation rules

- Must **not** import agent brain / LiveKit agent Python code
- Agent emits `AvatarAction` events; Phase 3 wires speak/listen fully

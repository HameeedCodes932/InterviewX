"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { IdleController } from "./IdleController";
import {
  AVATAR_ASSET_PATHS,
  type AvatarBehaviourState,
  type InterviewerGender,
} from "./types";

type Props = {
  gender: InterviewerGender;
  behaviourState?: AvatarBehaviourState;
  position?: [number, number, number];
};

/**
 * Loads the selected distinct male/female seated GLB and runs idle animation.
 * Brain / LiveKit stay outside this package — only visual expression.
 */
export function InterviewerAvatar({
  gender,
  behaviourState = "IDLE",
  position = [0, 0, -0.05],
}: Props) {
  const url = AVATAR_ASSET_PATHS[gender];
  const { scene } = useGLTF(url);
  const rootRef = useRef<Group>(null);

  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Slight lean-in when listening (Phase 2 light coupling; full AvatarAction in Phase 3)
  const lean =
    behaviourState === "LISTENING" || behaviourState === "ACKNOWLEDGING"
      ? 0.04
      : behaviourState === "THINKING"
        ? -0.02
        : 0;

  return (
    <group ref={rootRef} position={position} rotation={[lean, 0, 0]}>
      <primitive object={cloned} />
      <IdleController rootRef={rootRef} />
    </group>
  );
}

export function preloadInterviewerAssets() {
  useGLTF.preload(AVATAR_ASSET_PATHS.male);
  useGLTF.preload(AVATAR_ASSET_PATHS.female);
}

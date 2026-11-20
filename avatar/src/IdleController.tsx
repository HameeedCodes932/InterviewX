"use client";

import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { useRef } from "react";
import type { Group, Object3D } from "three";

/**
 * Idle breathing (Chest scale) + periodic blink (Eyelid_L / Eyelid_R scale).
 * Looks up named nodes from the loaded GLB scene graph.
 */
export function IdleController({ rootRef }: { rootRef: RefObject<Group | null> }) {
  const blinkUntil = useRef(0);
  const nextBlink = useRef(2.5 + Math.random() * 2);

  useFrame(({ clock }) => {
    const root = rootRef.current;
    if (!root) return;
    const t = clock.getElapsedTime();

    // Prefer named Chest on the cloned GLB; fall back to first child named Chest
    const chest =
      (root.getObjectByName("Chest") as Object3D | undefined) ??
      undefined;
    if (chest) {
      const breath = 1 + Math.sin(t * 1.35) * 0.012;
      chest.scale.set(1, breath, 1 + Math.sin(t * 1.35 + 0.2) * 0.006);
    }

    // Subtle seated sway on the character root (first child of wrapper)
    const character = root.children[0] as Object3D | undefined;
    if (character) {
      character.rotation.y = Math.sin(t * 0.35) * 0.015;
      character.position.y = Math.sin(t * 1.35) * 0.004;
    }

    const lidL = root.getObjectByName("Eyelid_L") as Object3D | undefined;
    const lidR = root.getObjectByName("Eyelid_R") as Object3D | undefined;
    if (lidL && lidR) {
      if (t >= nextBlink.current && blinkUntil.current === 0) {
        blinkUntil.current = t + 0.12;
        nextBlink.current = t + 2.8 + Math.random() * 3.5;
      }
      const blinking = blinkUntil.current > 0 && t < blinkUntil.current;
      if (t >= blinkUntil.current) blinkUntil.current = 0;
      const sy = blinking ? 0.15 : 1;
      lidL.scale.set(1, sy, 1);
      lidR.scale.set(1, sy, 1);
      const dy = blinking ? -0.008 : 0;
      lidL.position.y = dy;
      lidR.position.y = dy;
    }
  });

  return null;
}

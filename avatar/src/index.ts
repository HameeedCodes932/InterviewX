/**
 * Avatar runtime stub.
 * Phase 2+: export AvatarScene / AnimationController consuming AvatarAction contracts.
 */
export const AVATAR_PACKAGE_VERSION = "0.0.1";

export type AvatarReadyState = "stub";

export function createAvatarStub(): { state: AvatarReadyState } {
  return { state: "stub" };
}

/**
 * InterviewX avatar runtime (Phase 2).
 * Distinct male/female seated GLBs + R3F interview room.
 * Does not import agent brain / LiveKit agent code.
 */
export const AVATAR_PACKAGE_VERSION = "0.2.0";

export { InterviewScene } from "./InterviewScene";
export type { InterviewSceneProps } from "./InterviewScene";
export { InterviewerAvatar, preloadInterviewerAssets } from "./InterviewerAvatar";
export { InterviewEnvironment } from "./InterviewEnvironment";
export { IdleController } from "./IdleController";
export {
  AVATAR_ASSET_PATHS,
  AVATAR_IDS,
  type AvatarBehaviourState,
  type InterviewerGender,
} from "./types";

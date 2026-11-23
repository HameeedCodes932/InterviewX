/**
 * Helpers for AI interviewer generation state (separate from message saves).
 */

export type AiTurnState =
  | { status: "idle" }
  | { status: "generating"; candidateClientMessageId: string }
  | {
      status: "error";
      candidateClientMessageId: string;
      message: string;
    };

export function isAiGenerating(state: AiTurnState): boolean {
  return state.status === "generating";
}

export function canRequestAiTurn(options: {
  isCompleted: boolean;
  aiTurn: AiTurnState;
}): boolean {
  if (options.isCompleted) return false;
  if (options.aiTurn.status === "generating") return false;
  return true;
}

export function beginAiGeneration(
  candidateClientMessageId: string,
): AiTurnState {
  return { status: "generating", candidateClientMessageId };
}

export function completeAiGeneration(): AiTurnState {
  return { status: "idle" };
}

export function failAiGeneration(
  candidateClientMessageId: string,
  message: string,
): AiTurnState {
  return {
    status: "error",
    candidateClientMessageId,
    message,
  };
}

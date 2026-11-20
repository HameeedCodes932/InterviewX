"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { InterviewEnvironment } from "./InterviewEnvironment";
import { InterviewerAvatar, preloadInterviewerAssets } from "./InterviewerAvatar";
import type { AvatarBehaviourState, InterviewerGender } from "./types";

export type InterviewSceneProps = {
  gender: InterviewerGender;
  behaviourState?: AvatarBehaviourState;
  className?: string;
};

function SceneContent({
  gender,
  behaviourState,
}: {
  gender: InterviewerGender;
  behaviourState: AvatarBehaviourState;
}) {
  return (
    <>
      <InterviewEnvironment />
      {/* Seated behind desk, facing candidate camera */}
      <InterviewerAvatar
        gender={gender}
        behaviourState={behaviourState}
        position={[0, 0, -0.12]}
      />
    </>
  );
}

/**
 * Full interview-room viewport: environment + selected seated interviewer.
 * Must be client-only (WebGL). Parent should dynamic-import with ssr:false.
 */
export function InterviewScene({
  gender,
  behaviourState = "IDLE",
  className,
}: InterviewSceneProps) {
  useEffect(() => {
    preloadInterviewerAssets();
  }, []);

  return (
    <div className={className} style={{ width: "100%", height: "100%", minHeight: 280 }}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
        // Across-the-desk framing: candidate POV toward seated interviewer
        camera={{ position: [0, 1.28, 1.55], fov: 40, near: 0.1, far: 40 }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, 1.15, -0.1);
          camera.updateProjectionMatrix();
          gl.setClearColor("#cfc7bb");
        }}
      >
        <Suspense fallback={null}>
          <SceneContent gender={gender} behaviourState={behaviourState} />
        </Suspense>
      </Canvas>
    </div>
  );
}

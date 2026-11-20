"use client";

/**
 * Professional interview room: desk, interviewer chair, soft lighting.
 * Built from Three.js primitives (InterviewX Original) — no external env pack.
 */
export function InterviewEnvironment() {
  return (
    <group name="InterviewEnvironment">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#d8d0c4" roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.6, -2.4]} receiveShadow>
        <boxGeometry args={[8, 3.2, 0.12]} />
        <meshStandardMaterial color="#e7e2d8" roughness={0.95} />
      </mesh>

      <mesh position={[-3.4, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[5, 3.2, 0.08]} />
        <meshStandardMaterial color="#e0dbd2" roughness={0.95} />
      </mesh>

      {/* Desk in front of interviewer */}
      <group position={[0, 0, 0.42]}>
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.55, 0.05, 0.62]} />
          <meshStandardMaterial color="#6b4f3a" roughness={0.55} metalness={0.05} />
        </mesh>
        {[
          [-0.68, 0.36, -0.24],
          [0.68, 0.36, -0.24],
          [-0.68, 0.36, 0.24],
          [0.68, 0.36, 0.24],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} castShadow>
            <boxGeometry args={[0.05, 0.72, 0.05]} />
            <meshStandardMaterial color="#4a3728" roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0.32, 0.755, 0.02]} castShadow>
          <boxGeometry args={[0.2, 0.01, 0.26]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.85} />
        </mesh>
      </group>

      {/* Interviewer chair (under / behind character) */}
      <OfficeChair position={[0, 0, -0.2]} />

      <ambientLight intensity={0.55} color="#fff6ea" />
      <directionalLight
        castShadow
        position={[2.4, 4.5, 3]}
        intensity={1.25}
        color="#fff4e0"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-2.8, 3, -0.5]} intensity={0.4} color="#b8c8e0" />
      <pointLight position={[0.5, 1.5, 0.8]} intensity={0.45} color="#ffe8c8" distance={5} />
    </group>
  );
}

function OfficeChair({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.46, 0.07, 0.46]} />
        <meshStandardMaterial color="#2c333a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.72, -0.2]} castShadow>
        <boxGeometry args={[0.46, 0.62, 0.07]} />
        <meshStandardMaterial color="#2c333a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.4, 10]} />
        <meshStandardMaterial color="#1a1f24" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.04, 16]} />
        <meshStandardMaterial color="#1a1f24" metalness={0.35} roughness={0.45} />
      </mesh>
    </group>
  );
}

'use client';

import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '@/lib/constants';

/**
 * Ambient drifting point-cloud ("liquid financial mesh") rendered on the same
 * WebGL canvas layer as the shader background. Positions are pre-computed once
 * at module scope and animated per-frame without reallocation.
 */

const COUNT = 160;
const RADIUS = 3.4;

const positions = new Float32Array(COUNT * 3);
const seeds = new Float32Array(COUNT);

function init() {
  for (let i = 0; i < COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = RADIUS * (0.5 + Math.random() * 0.5);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    seeds[i] = Math.random() * Math.PI * 2;
  }
}
init();

function NodeField() {
  const ref = React.useRef<THREE.Points>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const attr = ref.current?.geometry.getAttribute('position') as
      | THREE.BufferAttribute
      | undefined;
    if (!attr) return;
    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3;
      const drift = Math.sin(t * 0.3 + seeds[i]) * 0.04;
      attr.array[idx] = positions[idx] + drift;
      attr.array[idx + 1] = positions[idx + 1] + Math.cos(t * 0.24 + seeds[i]) * 0.03;
      attr.array[idx + 2] = positions[idx + 2] + Math.sin(t * 0.18 + seeds[i] * 2) * 0.03;
    }
    attr.needsUpdate = true;
    ref.current!.rotation.y = t * 0.012;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color={new THREE.Color(COLORS.cyan)}
        transparent
        opacity={0.5}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export default function FloatingNodes() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 4] }} dpr={[1, 1.5]} gl={{ antialias: false }}>
        <NodeField />
      </Canvas>
    </div>
  );
}

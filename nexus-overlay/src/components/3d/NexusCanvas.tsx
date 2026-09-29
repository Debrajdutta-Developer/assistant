import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MayraAvatar } from '../MayraAvatar';

const CameraRig: React.FC = () => {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, Math.sin(t * 0.18) * 0.12, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, Math.cos(t * 0.16) * 0.06, 0.03);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5.2, 0.04);
    camera.lookAt(0, -0.1, 0);
  });
  return null;
};

export const NexusCanvas: React.FC = () => (
  <div className="w-full h-full relative bg-[#050711]">
    <Canvas
      dpr={[1, 1.35]}
      camera={{ position: [0, 0, 5.2], fov: 42, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }}
    >
      <color attach="background" args={['#050711']} />
      <fog attach="fog" args={['#050711', 5, 12]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 3, 4]} intensity={1.1} />
      <pointLight position={[-2, 1, 2]} color="#6366f1" intensity={1.5} distance={7} />
      <CameraRig />
      <MayraAvatar />
    </Canvas>
  </div>
);

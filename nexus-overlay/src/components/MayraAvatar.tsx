import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MayraAvatar: React.FC = () => {
  const [status, setStatus] = useState('Idle');
  const group = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const eyes = useRef<THREE.Group>(null);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const response = await fetch('http://127.0.0.1:3001/state', { cache: 'no-store' });
        const data = await response.json();
        if (alive) setStatus(data.status || 'Idle');
      } catch {}
    };
    poll();
    const timer = window.setInterval(poll, 180);
    const blinkTimer = window.setInterval(() => setBlink(true), 3200);
    return () => { alive = false; window.clearInterval(timer); window.clearInterval(blinkTimer); };
  }, []);

  useEffect(() => {
    if (!blink) return;
    const timer = window.setTimeout(() => setBlink(false), 130);
    return () => window.clearTimeout(timer);
  }, [blink]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speaking = status === 'Speaking';
    if (group.current) {
      group.current.position.y = Math.sin(t * 1.2) * 0.025;
      group.current.rotation.y = Math.sin(t * 0.45) * 0.035;
    }
    if (mouth.current) {
      const open = speaking ? 0.06 + Math.abs(Math.sin(t * 13)) * 0.075 : 0.018;
      mouth.current.scale.y = THREE.MathUtils.lerp(mouth.current.scale.y, open / 0.025, 0.25);
    }
    if (eyes.current) eyes.current.scale.y = THREE.MathUtils.lerp(eyes.current.scale.y, blink ? 0.08 : 1, 0.35);
  });

  const speaking = status === 'Speaking';
  const thinking = status === 'Thinking';
  const listening = status === 'Listening';

  return (
    <group ref={group} position={[0, -0.15, 0]} scale={1.35}>
      <mesh position={[0, -1.25, 0]}>
        <capsuleGeometry args={[0.68, 1.15, 8, 16]} />
        <meshStandardMaterial color="#18223b" metalness={0.35} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.72, 32, 24]} />
        <meshStandardMaterial color="#e7b99f" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.58, -0.01]} scale={[0.82, 0.74, 0.78]}>
        <sphereGeometry args={[0.76, 32, 24]} />
        <meshStandardMaterial color="#19131b" roughness={0.75} />
      </mesh>
      <group ref={eyes} position={[0, 0.22, -0.69]}>
        <mesh position={[-0.25, 0, 0]} scale={[0.07, 0.09, 0.035]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#f5fbff" emissive="#60a5fa" emissiveIntensity={0.45} /></mesh>
        <mesh position={[0.25, 0, 0]} scale={[0.07, 0.09, 0.035]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#f5fbff" emissive="#60a5fa" emissiveIntensity={0.45} /></mesh>
      </group>
      <mesh ref={mouth} position={[0, -0.2, -0.7]} scale={[0.11, 0.025, 0.025]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={speaking ? '#fb7185' : '#7f1d3b'} emissive={speaking ? '#fb7185' : '#000000'} emissiveIntensity={speaking ? 0.5 : 0} />
      </mesh>
      <mesh position={[0, 0.93, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.82, 0.45, 32]} />
        <meshStandardMaterial color={listening ? '#253b72' : thinking ? '#3a315f' : '#202a46'} metalness={0.4} roughness={0.35} />
      </mesh>
      <pointLight color={speaking ? '#f472b6' : listening ? '#60a5fa' : '#818cf8'} intensity={speaking ? 1.8 : 1.15} distance={3.2} />
    </group>
  );
};

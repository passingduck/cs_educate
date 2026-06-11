import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Selectable } from '../Selectable';
import { Label3D } from './shared/Label3D';
import { COLORS } from '../materials';

/** 맥미니 느낌의 IPC 컴퓨터 외형 */
export function Level0Computer() {
  const spin = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.12;
    if (led.current) {
      led.current.emissiveIntensity = 1.6 + Math.sin(state.clock.elapsedTime * 2.2) * 0.7;
    }
  });

  return (
    <group ref={spin}>
      <Selectable nodeId="motherboard">
        {/* 본체 */}
        <RoundedBox args={[4, 1.15, 4]} radius={0.28} smoothness={6} position={[0, 0.62, 0]}>
          <meshStandardMaterial color={COLORS.silver} metalness={0.85} roughness={0.32} />
        </RoundedBox>
        {/* 바닥 링 */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[1.55, 1.55, 0.12, 48]} />
          <meshStandardMaterial color="#1a1d22" roughness={0.7} />
        </mesh>
        {/* 상판 로고 디스크 */}
        <mesh position={[0, 1.205, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 48]} />
          <meshStandardMaterial
            color={COLORS.accent}
            emissive={COLORS.accent}
            emissiveIntensity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 후면 포트들 */}
        {[-1.1, -0.6, -0.1, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 0.55, -1.97]}>
            <boxGeometry args={[0.34, 0.16, 0.1]} />
            <meshStandardMaterial color="#0b0d10" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[1.2, 0.55, -1.97]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.1, 16]} />
          <meshStandardMaterial color="#0b0d10" roughness={0.9} />
        </mesh>
        {/* 전면 전원 LED */}
        <mesh position={[1.55, 0.32, 1.92]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial
            ref={led}
            color={COLORS.accent}
            emissive={COLORS.accent}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
        {/* 측면 통풍구 슬릿 */}
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[2.005, 0.62, -1.0 + i * 0.25]}>
            <boxGeometry args={[0.02, 0.55, 0.06]} />
            <meshStandardMaterial color="#2c3036" roughness={0.8} />
          </mesh>
        ))}
      </Selectable>
      <Label3D position={[0, 2.0, 0]} accent>
        클릭해서 내부 보기
      </Label3D>
    </group>
  );
}

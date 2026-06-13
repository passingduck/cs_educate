import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Selectable } from '../Selectable';
import { Label3D } from './shared/Label3D';
import { COLORS } from '../materials';

/**
 * 맥미니 느낌의 IPC 컴퓨터 외형.
 * 케이스는 Blender(헤드리스)로 모델링한 GLB — 베벨 모서리, 불리언 음각 포트/통풍구,
 * PBR 머티리얼, 발광 로고 링 포함. blender/gen_computer.py에서 생성.
 */
export function Level0Computer() {
  const spin = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const { scene: model } = useGLTF('/models/computer.glb');

  useFrame((state, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.12;
    if (led.current) {
      led.current.emissiveIntensity = 1.6 + Math.sin(state.clock.elapsedTime * 2.2) * 0.7;
    }
  });

  return (
    <group ref={spin}>
      <Selectable nodeId="motherboard">
        <primitive object={model} />
        {/* 전면 전원 LED (호흡 애니메이션은 three에서) */}
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
      </Selectable>
      <Label3D position={[0, 2.0, 0]} accent>
        클릭해서 내부 보기
      </Label3D>
    </group>
  );
}

useGLTF.preload('/models/computer.glb');

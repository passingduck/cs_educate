import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Selectable } from '../../Selectable';
import { Label3D } from '../shared/Label3D';
import { Wire } from '../shared/Wire';
import { Html } from '@react-three/drei';

const UNITS = [
  { id: 'alu-add' as const, x: -2.4, color: '#2c4a6e', symbol: '＋', name: '가산기 (Adder)' },
  { id: 'alu-mul' as const, x: 0, color: '#4a2c5e', symbol: '×', name: '곱셈기 (Multiplier)' },
  { id: 'alu-shift' as const, x: 2.4, color: '#2c5e4a', symbol: '≪', name: '시프터 (Shifter)' },
];

/** ALU 내부: 연산기 3종 + 입력/출력 버스 */
export function AluUnits() {
  const flow = useRef<THREE.Group>(null);

  useFrame((state) => {
    // 입력 버스 위를 흐르는 은은한 펄스
    if (flow.current) {
      const t = (state.clock.elapsedTime * 0.4) % 1;
      flow.current.position.x = -4 + t * 8;
      const mat = (flow.current.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 * Math.sin(t * Math.PI);
    }
  });

  return (
    <group>
      {/* 바닥 플레이트 */}
      <mesh position={[0, -0.1, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[8.2, 0.16, 4.6]} />
        <meshStandardMaterial color="#141a26" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* 입력 버스 A, B (위쪽) / 결과 버스 (아래쪽) */}
      <Wire points={[[-4, 0.16, -1.7], [4, 0.16, -1.7]]} radius={0.05} color="#2d3849" />
      <Wire points={[[-4, 0.16, -1.3], [4, 0.16, -1.3]]} radius={0.05} color="#2d3849" />
      <Wire points={[[-4, 0.16, 1.6], [4, 0.16, 1.6]]} radius={0.05} color="#2d3849" />
      <Label3D position={[-4.0, 0.5, -1.5]} small>
        피연산자 A, B
      </Label3D>
      <Label3D position={[-4.0, 0.5, 1.6]} small>
        결과 (MUX 선택)
      </Label3D>

      <group ref={flow}>
        <mesh position={[0, 0.16, -1.5]} userData={{ noHighlight: true }}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color="#4cc8ff" emissive="#4cc8ff" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      </group>

      {UNITS.map((u) => (
        <group key={u.id}>
          <Selectable nodeId={u.id}>
            <mesh position={[u.x, 0.5, 0]}>
              <boxGeometry args={[1.8, 1.0, 1.6]} />
              <meshStandardMaterial color={u.color} roughness={0.4} metalness={0.35} />
            </mesh>
            {/* 상판 심볼 */}
            <Html position={[u.x, 1.05, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  color: '#4cc8ff',
                  textShadow: '0 0 18px rgba(76,200,255,.8)',
                  pointerEvents: 'none',
                }}
              >
                {u.symbol}
              </div>
            </Html>
          </Selectable>
          {/* 입출력 스터브 */}
          <Wire points={[[u.x - 0.3, 0.16, -1.5], [u.x - 0.3, 0.16, -0.8]]} radius={0.04} color="#39424f" />
          <Wire points={[[u.x + 0.3, 0.16, -1.3], [u.x + 0.3, 0.16, -0.8]]} radius={0.04} color="#39424f" />
          <Wire points={[[u.x, 0.16, 0.8], [u.x, 0.16, 1.6]]} radius={0.04} color="#39424f" />
          <Label3D position={[u.x, 1.55, 0.4]} accent>
            {u.name}
          </Label3D>
        </group>
      ))}

      <Label3D position={[0, 0.3, 2.6]} small>
        연산기를 클릭해 게이트 수준으로
      </Label3D>
    </group>
  );
}

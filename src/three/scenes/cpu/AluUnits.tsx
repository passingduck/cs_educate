import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Selectable } from '../../Selectable';
import { Label3D } from '../shared/Label3D';
import { Wire } from '../shared/Wire';

const SYMBOL_MAT = { color: '#4cc8ff', emissive: '#4cc8ff', emissiveIntensity: 1.2, toneMapped: false } as const;

/** 상판에 새겨진 3D 연산 기호 */
function Symbol({ kind, position }: { kind: 'add' | 'mul' | 'shift'; position: [number, number, number] }) {
  if (kind === 'add') {
    return (
      <group position={position}>
        <mesh userData={{ noHighlight: true }}>
          <boxGeometry args={[0.66, 0.06, 0.16]} />
          <meshStandardMaterial {...SYMBOL_MAT} />
        </mesh>
        <mesh userData={{ noHighlight: true }}>
          <boxGeometry args={[0.16, 0.06, 0.66]} />
          <meshStandardMaterial {...SYMBOL_MAT} />
        </mesh>
      </group>
    );
  }
  if (kind === 'mul') {
    return (
      <group position={position} rotation={[0, Math.PI / 4, 0]}>
        <mesh userData={{ noHighlight: true }}>
          <boxGeometry args={[0.62, 0.06, 0.14]} />
          <meshStandardMaterial {...SYMBOL_MAT} />
        </mesh>
        <mesh userData={{ noHighlight: true }}>
          <boxGeometry args={[0.14, 0.06, 0.62]} />
          <meshStandardMaterial {...SYMBOL_MAT} />
        </mesh>
      </group>
    );
  }
  // shift: 왼쪽 방향 더블 셰브론 ≪
  return (
    <group position={position}>
      {[0, 0.34].map((dx, i) => (
        <group key={i} position={[dx, 0, 0]}>
          <mesh position={[0.06, 0, -0.12]} rotation={[0, Math.PI / 4, 0]} userData={{ noHighlight: true }}>
            <boxGeometry args={[0.38, 0.06, 0.1]} />
            <meshStandardMaterial {...SYMBOL_MAT} />
          </mesh>
          <mesh position={[0.06, 0, 0.12]} rotation={[0, -Math.PI / 4, 0]} userData={{ noHighlight: true }}>
            <boxGeometry args={[0.38, 0.06, 0.1]} />
            <meshStandardMaterial {...SYMBOL_MAT} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const UNITS = [
  { id: 'alu-add' as const, x: -2.4, color: '#2c4a6e', kind: 'add' as const, name: '가산기 (Adder)' },
  { id: 'alu-mul' as const, x: 0, color: '#4a2c5e', kind: 'mul' as const, name: '곱셈기 (Multiplier)' },
  { id: 'alu-shift' as const, x: 2.4, color: '#2c5e4a', kind: 'shift' as const, name: '시프터 (Shifter)' },
];

/** ALU 내부: 연산기 3종 + 입력/출력 버스 */
export function AluUnits() {
  const flow = useRef<THREE.Group>(null);

  useFrame((state) => {
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
            <Symbol kind={u.kind} position={[u.x, 1.04, 0]} />
          </Selectable>
          {/* 입출력 스터브 — 버스 라인과 정확히 연결 */}
          <Wire points={[[u.x - 0.35, 0.16, -1.7], [u.x - 0.35, 0.16, -0.8]]} radius={0.04} color="#39424f" />
          <Wire points={[[u.x + 0.35, 0.16, -1.3], [u.x + 0.35, 0.16, -0.8]]} radius={0.04} color="#39424f" />
          <Wire points={[[u.x, 0.16, 0.8], [u.x, 0.16, 1.6]]} radius={0.04} color="#39424f" />
          <Label3D position={[u.x, 1.6, 0.45]} accent>
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

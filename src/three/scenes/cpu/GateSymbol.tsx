import { useMemo } from 'react';
import * as THREE from 'three';

export type GateType = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR';

function andShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.5, -0.5);
  s.lineTo(0, -0.5);
  s.absarc(0, 0, 0.5, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-0.5, 0.5);
  s.closePath();
  return s;
}

function orShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.5, -0.5);
  s.quadraticCurveTo(-0.1, 0, -0.5, 0.5);
  s.quadraticCurveTo(0.15, 0.5, 0.6, 0);
  s.quadraticCurveTo(0.15, -0.5, -0.5, -0.5);
  s.closePath();
  return s;
}

/** XOR의 뒤쪽 이중 곡선 */
function xorArcShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.68, -0.5);
  s.quadraticCurveTo(-0.28, 0, -0.68, 0.5);
  s.lineTo(-0.6, 0.5);
  s.quadraticCurveTo(-0.2, 0, -0.6, -0.5);
  s.closePath();
  return s;
}

interface Props {
  type: GateType;
  color?: string;
  /** 게이트가 활성(출력 1)일 때 살짝 발광 */
  lit?: boolean;
  scale?: number;
}

/** 회로도 스타일의 2.5D 논리 게이트 (XY 평면, 출력 +X 방향) */
export function GateSymbol({ type, color = '#33405a', lit, scale = 1 }: Props) {
  const base = type === 'AND' || type === 'NAND' ? 'AND' : 'OR';
  const geometry = useMemo(() => {
    const shape = base === 'AND' ? andShape() : orShape();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false });
  }, [base]);
  const arcGeometry = useMemo(
    () =>
      type === 'XOR'
        ? new THREE.ExtrudeGeometry(xorArcShape(), { depth: 0.16, bevelEnabled: false })
        : null,
    [type],
  );
  const hasBubble = type === 'NAND' || type === 'NOR';
  const tipX = base === 'AND' ? 0.5 : 0.6;

  return (
    <group scale={scale}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.3}
          emissive={lit ? '#4cc8ff' : '#000000'}
          emissiveIntensity={lit ? 0.35 : 0}
        />
      </mesh>
      {arcGeometry && (
        <mesh geometry={arcGeometry}>
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
        </mesh>
      )}
      {hasBubble && (
        <mesh position={[tipX + 0.1, 0, 0.08]}>
          <sphereGeometry args={[0.1, 14, 14]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
        </mesh>
      )}
    </group>
  );
}

import { useMemo } from 'react';
import * as THREE from 'three';

interface Props {
  points: [number, number, number][];
  radius?: number;
  color?: string;
  /** 1이면 발광 (논리값 1 등) */
  lit?: boolean;
  litColor?: string;
}

/** 폴리라인을 따라가는 튜브 — 회로 배선/버스 표현 */
export function Wire({ points, radius = 0.035, color = '#3a4456', lit, litColor = '#4cc8ff' }: Props) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      false,
      'catmullrom',
      0.0,
    );
    return new THREE.TubeGeometry(curve, Math.max(8, points.length * 6), radius, 6, false);
  }, [points, radius]);

  return (
    <mesh geometry={geometry} userData={{ noHighlight: true }}>
      <meshStandardMaterial
        color={lit ? litColor : color}
        emissive={lit ? litColor : '#000000'}
        emissiveIntensity={lit ? 1.6 : 0}
        toneMapped={!lit}
        roughness={0.5}
        metalness={0.4}
      />
    </mesh>
  );
}

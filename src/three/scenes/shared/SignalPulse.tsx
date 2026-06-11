import { useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface PulseHandle {
  /** 주어진 경로를 따라 펄스 1회 발사 */
  fire: (points: [number, number, number][], color?: string, duration?: number) => void;
}

/**
 * 버스/배선 위를 달리는 발광 펄스. ref.fire()로 트리거 — 리렌더 없이 useFrame으로 애니메이션.
 */
export const SignalPulse = forwardRef<PulseHandle>(function SignalPulse(_, ref) {
  const mesh = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Mesh>(null);
  const anim = useRef<{ curve: THREE.CatmullRomCurve3; start: number; duration: number } | null>(
    null,
  );
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#4cc8ff',
        emissive: new THREE.Color('#4cc8ff'),
        emissiveIntensity: 3,
        toneMapped: false,
      }),
    [],
  );

  useImperativeHandle(ref, () => ({
    fire: (points, color = '#4cc8ff', duration = 0.5) => {
      const curve = new THREE.CatmullRomCurve3(
        points.map((p) => new THREE.Vector3(...p)),
        false,
        'catmullrom',
        0.0,
      );
      anim.current = { curve, start: performance.now(), duration: duration * 1000 };
      material.color.set(color);
      material.emissive.set(color);
      if (mesh.current) mesh.current.visible = true;
      if (trail.current) trail.current.visible = true;
    },
  }));

  useFrame(() => {
    const a = anim.current;
    if (!a || !mesh.current || !trail.current) return;
    const t = (performance.now() - a.start) / a.duration;
    if (t >= 1) {
      mesh.current.visible = false;
      trail.current.visible = false;
      anim.current = null;
      return;
    }
    const pos = a.curve.getPoint(t);
    mesh.current.position.copy(pos);
    const trailPos = a.curve.getPoint(Math.max(0, t - 0.06));
    trail.current.position.copy(trailPos);
  });

  return (
    <>
      <mesh ref={mesh} visible={false} material={material} userData={{ noHighlight: true }}>
        <sphereGeometry args={[0.09, 12, 12]} />
      </mesh>
      <mesh ref={trail} visible={false} material={material} userData={{ noHighlight: true }}>
        <sphereGeometry args={[0.055, 10, 10]} />
      </mesh>
    </>
  );
});

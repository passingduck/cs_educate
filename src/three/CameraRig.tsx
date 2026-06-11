import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { easing } from 'maath';
import { useNavStore } from '../nav/useNavStore';
import { NAV_TREE } from '../nav/tree';

/**
 * 노드의 카메라 포즈로 부드럽게 이동(damp)한 뒤, 사용자가 자유롭게 궤도 조작.
 * 씬이 교체될 때(snapToken 변경)는 즉시 스냅 — 페이드 뒤에 가려져 보이지 않음.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const settling = useRef(true);
  const targetVec = useRef(new THREE.Vector3());

  const currentId = useNavStore((s) => s.currentId);
  const snapToken = useNavStore((s) => s.snapToken);
  const transition = useNavStore((s) => s.transition);

  // 같은 씬 내 이동: 다시 정착 모드로
  useEffect(() => {
    settling.current = true;
  }, [currentId]);

  // 씬 교체: 카메라 즉시 스냅
  useEffect(() => {
    const pose = NAV_TREE[useNavStore.getState().currentId].pose;
    camera.position.set(...pose.position);
    targetVec.current.set(...pose.target);
    controls.current?.target.copy(targetVec.current);
    controls.current?.update();
    settling.current = false;
  }, [snapToken, camera]);

  useFrame((_, delta) => {
    if (!settling.current || !controls.current) return;
    const pose = NAV_TREE[useNavStore.getState().currentId].pose;
    const dt = Math.min(delta, 0.05);
    easing.damp3(camera.position, pose.position, 0.4, dt);
    easing.damp3(controls.current.target, pose.target, 0.4, dt);
    controls.current.update();
    const dist =
      camera.position.distanceTo(new THREE.Vector3(...pose.position)) +
      controls.current.target.distanceTo(new THREE.Vector3(...pose.target));
    if (dist < 0.02) settling.current = false;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={transition === 'idle'}
      enablePan={false}
      minDistance={1.2}
      maxDistance={30}
      maxPolarAngle={Math.PI * 0.52}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

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
    const c = controls.current;
    if (!c) return;
    const id = useNavStore.getState().currentId;

    if (settling.current) {
      const pose = NAV_TREE[id].pose;
      const dt = Math.min(delta, 0.05);
      easing.damp3(camera.position, pose.position, 0.42, dt);
      easing.damp3(c.target, pose.target, 0.42, dt);
      const dist =
        camera.position.distanceTo(new THREE.Vector3(...pose.position)) +
        c.target.distanceTo(new THREE.Vector3(...pose.target));
      if (dist < 0.02) settling.current = false;
    }

    // 히어로(컴퓨터)에서는 정착 후 카메라가 천천히 도는 쇼케이스 턴테이블
    c.autoRotate = id === 'computer' && !settling.current && transition === 'idle';
    c.autoRotateSpeed = 0.55;
    c.update();
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
      dampingFactor={0.075}
    />
  );
}

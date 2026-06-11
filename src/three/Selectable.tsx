import { useEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { useNavStore } from '../nav/useNavStore';
import type { NodeId } from '../nav/types';

interface Props {
  nodeId: NodeId;
  children: ReactNode;
  /** true면 클릭 내비게이션 비활성 (호버 정보만) */
  noNavigate?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const HOVER_EMISSIVE = new THREE.Color('#4cc8ff');

/**
 * 모든 인터랙티브 부품의 공통 래퍼.
 * 호버 → 스토어 hoveredId + emissive 글로우(Bloom), 클릭 → 해당 노드로 줌인.
 * 자식 메시의 머티리얼은 마운트 시 클론해 공유 머티리얼 오염을 방지.
 */
export function Selectable({ nodeId, children, noNavigate, position, rotation }: Props) {
  const group = useRef<THREE.Group>(null);
  const saved = useRef<
    { mat: THREE.MeshStandardMaterial; emissive: THREE.Color; intensity: number }[]
  >([]);
  const hovered = useNavStore((s) => s.hoveredId === nodeId);
  const setHovered = useNavStore((s) => s.setHovered);
  const navigateTo = useNavStore((s) => s.navigateTo);

  // 마운트 시 머티리얼 클론 + 원본 emissive 기억
  useEffect(() => {
    const list: typeof saved.current = [];
    group.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !obj.userData.noHighlight) {
        const clone = (m: THREE.Material) => {
          if (m instanceof THREE.MeshStandardMaterial) {
            const c = m.clone();
            list.push({ mat: c, emissive: m.emissive.clone(), intensity: m.emissiveIntensity });
            return c;
          }
          return m;
        };
        obj.material = Array.isArray(obj.material)
          ? obj.material.map(clone)
          : clone(obj.material);
      }
    });
    saved.current = list;
  }, []);

  useEffect(() => {
    for (const { mat, emissive, intensity } of saved.current) {
      if (hovered) {
        mat.emissive.copy(HOVER_EMISSIVE);
        mat.emissiveIntensity = Math.max(intensity, 0.55);
      } else {
        mat.emissive.copy(emissive);
        mat.emissiveIntensity = intensity;
      }
    }
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      if (hovered) document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(nodeId);
  };
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (useNavStore.getState().hoveredId === nodeId) setHovered(null);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!noNavigate) navigateTo(nodeId);
  };

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerOver={onOver}
      onPointerOut={onOut}
      onClick={onClick}
    >
      {children}
    </group>
  );
}

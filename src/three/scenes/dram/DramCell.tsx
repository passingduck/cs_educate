import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Label3D } from '../shared/Label3D';
import { Wire } from '../shared/Wire';
import { COLORS } from '../../materials';

/**
 * 1T1C DRAM 셀: 트랜지스터 + 커패시터.
 * 커패시터 전하가 서서히 누설 → 자동/수동 리프레시로 재충전.
 */
export function DramCell() {
  const charge = useRef(1); // 0..1
  const fill = useRef<THREE.Mesh>(null);
  const fillMat = useRef<THREE.MeshStandardMaterial>(null);
  const wlGlow = useRef<THREE.MeshStandardMaterial>(null);
  const refreshing = useRef(0);
  const [hover, setHover] = useState(false);

  useFrame((state, delta) => {
    // 누설: 약 9초에 걸쳐 방전 → 15% 이하로 떨어지면 자동 리프레시
    if (refreshing.current > 0) {
      refreshing.current -= delta;
      charge.current = Math.min(1, charge.current + delta * 2.4);
    } else {
      charge.current = Math.max(0, charge.current - delta / 9);
      if (charge.current < 0.15) refreshing.current = 0.6;
    }
    if (fill.current && fillMat.current) {
      const h = 1.5 * charge.current;
      fill.current.scale.y = Math.max(0.02, charge.current);
      fill.current.position.y = 0.25 + h / 2 - (1.5 * (1 - charge.current)) / 2 / 1; // 바닥 고정
      fill.current.position.y = 0.25 + h / 2;
      fillMat.current.emissiveIntensity = 0.4 + charge.current * 1.8;
      fillMat.current.color.setHSL(0.55, 0.85, 0.25 + charge.current * 0.35);
    }
    if (wlGlow.current) {
      wlGlow.current.emissiveIntensity =
        refreshing.current > 0 ? 2.2 : 0.25 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  const manualRefresh = () => {
    refreshing.current = 0.6;
  };

  return (
    <group>
      {/* 기판 */}
      <mesh position={[0, -0.3, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[7, 0.6, 5]} />
        <meshStandardMaterial color="#3b2f4a" roughness={0.6} transparent opacity={0.85} />
      </mesh>
      <Label3D position={[-3.0, 0.15, 1.8]} small>
        p형 기판 (Substrate)
      </Label3D>

      {/* ===== 트랜지스터 (스위치) ===== */}
      <group position={[-1.4, 0, 0]}>
        {/* 소스/드레인 확산 영역 */}
        <mesh position={[-0.7, 0.06, 0]}>
          <boxGeometry args={[0.9, 0.28, 1.0]} />
          <meshStandardMaterial color={COLORS.nmos} roughness={0.45} emissive={COLORS.nmos} emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0.7, 0.06, 0]}>
          <boxGeometry args={[0.9, 0.28, 1.0]} />
          <meshStandardMaterial color={COLORS.nmos} roughness={0.45} emissive={COLORS.nmos} emissiveIntensity={0.15} />
        </mesh>
        {/* 게이트 (워드라인에 연결) */}
        <mesh position={[0, 0.36, 0]}>
          <boxGeometry args={[0.5, 0.34, 1.05]} />
          <meshStandardMaterial
            ref={wlGlow}
            color="#cf3e3e"
            emissive="#ff5a5a"
            emissiveIntensity={0.3}
            roughness={0.4}
          />
        </mesh>
        <Label3D position={[0, 1.0, 0]} small>
          트랜지스터 게이트
        </Label3D>
      </group>

      {/* ===== 커패시터 (저장소) ===== */}
      <group
        position={[1.3, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          manualRefresh();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* 외벽 (유전체) */}
        <mesh position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.62, 0.55, 1.7, 24, 1, true]} />
          <meshStandardMaterial
            color={hover ? '#5b6c84' : '#46536a'}
            roughness={0.35}
            metalness={0.5}
            side={THREE.DoubleSide}
            transparent
            opacity={0.55}
          />
        </mesh>
        {/* 전하 충전 표시 */}
        <mesh ref={fill} position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.45, 0.4, 1.5, 20]} />
          <meshStandardMaterial
            ref={fillMat}
            color="#4cc8ff"
            emissive="#4cc8ff"
            emissiveIntensity={1.5}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </mesh>
        <Label3D position={[0, 2.3, 0]} accent>
          커패시터 — 클릭하면 리프레시
        </Label3D>
      </group>

      {/* 워드라인 / 비트라인 */}
      <Wire points={[[-1.4, 0.55, -2.4], [-1.4, 0.55, 2.4]]} radius={0.05} color="#8a4444" />
      <Label3D position={[-1.4, 0.9, -2.0]} small>
        워드라인 (Word Line)
      </Label3D>
      <Wire points={[[-3.4, 0.2, 0], [-2.1, 0.2, 0]]} radius={0.05} color="#3a6d8c" />
      <Label3D position={[-3.2, 0.6, 0]} small>
        비트라인 (Bit Line)
      </Label3D>
      {/* 드레인 → 커패시터 연결 */}
      <Wire points={[[-0.7, 0.25, 0], [0.3, 0.5, 0], [1.3, 0.25, 0]]} radius={0.045} color="#5d6b80" />
    </group>
  );
}

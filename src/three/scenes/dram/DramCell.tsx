import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Label3D } from '../shared/Label3D';
import { Wire } from '../shared/Wire';
import { COLORS, mat } from '../../materials';

// 커패시터 기하: 중심 y=1.0, 높이 1.7 → 안쪽 전하 영역 [0.28 .. 1.72], 높이 1.44
const CAP_BOTTOM = 0.28;
const CAP_FILL_H = 1.44;

/**
 * 1T1C DRAM 셀: 트랜지스터(스위치) + 커패시터(저장소).
 * 커패시터 전하가 서서히 누설 → 자동/수동 리프레시로 재충전. 전하는 유리관 속 차오르는 액체로 표현.
 */
export function DramCell() {
  const charge = useRef(1); // 0..1
  const fill = useRef<THREE.Mesh>(null);
  const fillMat = useRef<THREE.MeshStandardMaterial>(null);
  const wlGlow = useRef<THREE.MeshStandardMaterial>(null);
  const sparks = useRef<THREE.InstancedMesh>(null);
  const refreshing = useRef(0);
  const [hover, setHover] = useState(false);

  const glass = useMemo(() => mat.glass('#bfe0ff', 0.16), []);
  const electrode = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#9aa6b5', metalness: 0.95, roughness: 0.25 }),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const N_SPARK = 10;

  useFrame((state, delta) => {
    if (refreshing.current > 0) {
      refreshing.current -= delta;
      charge.current = Math.min(1, charge.current + delta * 2.4);
    } else {
      charge.current = Math.max(0, charge.current - delta / 11);
      if (charge.current < 0.15) refreshing.current = 0.7;
    }
    const c = charge.current;
    if (fill.current && fillMat.current) {
      fill.current.scale.y = Math.max(0.02, c);
      fill.current.position.y = CAP_BOTTOM + (CAP_FILL_H * c) / 2;
      fillMat.current.emissiveIntensity = 0.5 + c * 2.0;
      fillMat.current.color.setHSL(0.55, 0.85, 0.22 + c * 0.38);
    }
    if (wlGlow.current) {
      wlGlow.current.emissiveIntensity =
        refreshing.current > 0 ? 2.4 : 0.25 + Math.sin(state.clock.elapsedTime * 1.5) * 0.12;
    }
    // 리프레시 중 위로 솟는 충전 스파크
    if (sparks.current) {
      const active = refreshing.current > 0;
      sparks.current.visible = active;
      if (active) {
        for (let i = 0; i < N_SPARK; i++) {
          const t = (state.clock.elapsedTime * 1.4 + i / N_SPARK) % 1;
          dummy.position.set(
            1.3 + Math.sin(i * 2.1) * 0.28,
            CAP_BOTTOM + t * CAP_FILL_H,
            Math.cos(i * 1.7) * 0.28,
          );
          dummy.scale.setScalar(1 - t * 0.6);
          dummy.updateMatrix();
          sparks.current.setMatrixAt(i, dummy.matrix);
        }
        sparks.current.instanceMatrix.needsUpdate = true;
      }
    }
  });

  const manualRefresh = () => {
    refreshing.current = 0.7;
  };

  return (
    <group>
      {/* 기판 */}
      <RoundedBox args={[7, 0.6, 5]} radius={0.08} smoothness={4} position={[0, -0.3, 0]} userData={{ noHighlight: true }}>
        <meshStandardMaterial color="#2a2336" roughness={0.7} metalness={0.1} />
      </RoundedBox>
      <Label3D position={[-3.0, 0.15, 1.8]} small>
        p형 기판 (Substrate)
      </Label3D>

      {/* ===== 트랜지스터 (스위치) ===== */}
      <group position={[-1.4, 0, 0]}>
        {/* 소스/드레인 확산 영역 */}
        {[-0.7, 0.7].map((x) => (
          <RoundedBox key={x} args={[0.9, 0.3, 1.0]} radius={0.05} smoothness={4} position={[x, 0.07, 0]} userData={{ noHighlight: true }}>
            <meshStandardMaterial color={COLORS.nmos} roughness={0.4} metalness={0.2} emissive={COLORS.nmos} emissiveIntensity={0.2} />
          </RoundedBox>
        ))}
        {/* 게이트 산화막 */}
        <mesh position={[0, 0.24, 0]} userData={{ noHighlight: true }}>
          <boxGeometry args={[0.52, 0.05, 1.06]} />
          <meshPhysicalMaterial color="#eaf2ff" roughness={0.12} transmission={0.0} transparent opacity={0.55} clearcoat={1} />
        </mesh>
        {/* 게이트 (워드라인에 연결) */}
        <RoundedBox args={[0.5, 0.34, 1.05]} radius={0.05} smoothness={4} position={[0, 0.45, 0]} userData={{ noHighlight: true }}>
          <meshStandardMaterial ref={wlGlow} color="#c93f3f" emissive="#ff5a5a" emissiveIntensity={0.3} metalness={0.5} roughness={0.35} />
        </RoundedBox>
        <Label3D position={[0, 1.05, 0]} small>
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
        {/* 하단/상단 전극판 */}
        <mesh position={[0, CAP_BOTTOM - 0.04, 0]} material={electrode} userData={{ noHighlight: true }}>
          <cylinderGeometry args={[0.66, 0.66, 0.08, 32]} />
        </mesh>
        <mesh position={[0, CAP_BOTTOM + CAP_FILL_H + 0.04, 0]} material={electrode} userData={{ noHighlight: true }}>
          <cylinderGeometry args={[0.66, 0.66, 0.08, 32]} />
        </mesh>
        {/* 전하 (차오르는 액체) */}
        <mesh ref={fill} userData={{ noHighlight: true }}>
          <cylinderGeometry args={[0.5, 0.46, CAP_FILL_H, 28]} />
          <meshStandardMaterial ref={fillMat} color="#4cc8ff" emissive="#4cc8ff" emissiveIntensity={1.8} toneMapped={false} transparent opacity={0.92} />
        </mesh>
        {/* 유리 외벽 (유전체) */}
        <mesh position={[0, 1.0, 0]} material={glass} userData={{ noHighlight: true }}>
          <cylinderGeometry args={[0.6, 0.56, 1.72, 32, 1, true]} />
        </mesh>
        {/* 충전 스파크 */}
        <instancedMesh ref={sparks} args={[undefined, undefined, N_SPARK]} position={[-1.3, 0, 0]} visible={false} userData={{ noHighlight: true }}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#9fe0ff" emissive="#9fe0ff" emissiveIntensity={3} toneMapped={false} />
        </instancedMesh>
        <Label3D position={[0, 2.35, 0]} accent={hover}>
          커패시터 — 클릭하면 리프레시
        </Label3D>
      </group>

      {/* 워드라인 / 비트라인 */}
      <Wire points={[[-1.4, 0.66, -2.4], [-1.4, 0.66, 2.4]]} radius={0.05} color="#a85555" lit litColor="#ff6b6b" />
      <Label3D position={[-1.4, 1.0, -2.0]} small>
        워드라인 (Word Line)
      </Label3D>
      <Wire points={[[-3.4, 0.2, 0], [-2.1, 0.2, 0]]} radius={0.05} color="#3a6d8c" lit litColor="#4cc8ff" />
      <Label3D position={[-3.2, 0.6, 0]} small>
        비트라인 (Bit Line)
      </Label3D>
      {/* 드레인 → 커패시터 연결 */}
      <Wire points={[[-0.7, 0.28, 0], [0.3, 0.5, 0], [1.3, 0.32, 0]]} radius={0.045} color="#6b7a90" />
    </group>
  );
}

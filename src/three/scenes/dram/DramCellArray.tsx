import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Selectable } from '../../Selectable';
import { Label3D } from '../shared/Label3D';
import { COLORS } from '../../materials';

const ROWS = 12;
const COLS = 16;
const SPACING = 0.42;
const X0 = -((COLS - 1) * SPACING) / 2;
const Z0 = -((ROWS - 1) * SPACING) / 2 - 0.6;
const SENSE_Z = Z0 + ROWS * SPACING + 0.5;

const cellX = (c: number) => X0 + c * SPACING;
const cellZ = (r: number) => Z0 + r * SPACING;

const DIM = new THREE.Color('#222a38');
const LIT = new THREE.Color('#4cc8ff');

/**
 * DRAM 셀 어레이: 워드라인(행) 클릭 → 행 전체 활성화 → 비트라인 펄스 → 감지 증폭기 점등.
 * "행 단위로만 읽을 수 있다"는 DRAM의 핵심 특성을 체험.
 */
export function DramCellArray() {
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const animStart = useRef(0);
  const caps = useRef<THREE.InstancedMesh>(null);
  const trs = useRef<THREE.InstancedMesh>(null);
  const pulses = useRef<THREE.Group>(null);
  const amps = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // 셀 위치 배치 (1회): 커패시터 + 액세스 트랜지스터(워드라인 쪽으로 살짝 비킴)
  useEffect(() => {
    const m = new THREE.Matrix4();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        m.setPosition(cellX(c), 0.24, cellZ(r) + 0.12);
        caps.current?.setMatrixAt(i, m);
        caps.current?.setColorAt(i, DIM);
        m.setPosition(cellX(c), 0.1, cellZ(r) - 0.08);
        trs.current?.setMatrixAt(i, m);
        trs.current?.setColorAt(i, DIM);
      }
    }
    for (const mesh of [caps.current, trs.current]) {
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }
  }, []);

  // 행 활성화: 해당 행 셀 색 변경
  useEffect(() => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = r === activeRow ? LIT : DIM;
        caps.current?.setColorAt(r * COLS + c, color);
        trs.current?.setColorAt(r * COLS + c, color);
      }
    }
    for (const mesh of [caps.current, trs.current]) {
      if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    animStart.current = performance.now();
  }, [activeRow]);

  // 비트라인 펄스 + 감지 증폭기 점등 애니메이션
  useFrame(() => {
    const elapsed = (performance.now() - animStart.current) / 1000;
    const group = pulses.current;
    if (!group) return;
    const active = activeRow !== null && elapsed < 1.4;
    group.visible = active;
    if (active && activeRow !== null) {
      const t = Math.min(elapsed / 0.9, 1);
      const z = cellZ(activeRow) + (SENSE_Z - cellZ(activeRow)) * t;
      group.children.forEach((child) => (child.position.z = z));
    }
    amps.current.forEach((mat) => {
      if (!mat) return;
      const on = activeRow !== null && elapsed > 0.85 && elapsed < 4;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, on ? 1.8 : 0.05, 0.12);
    });
  });

  return (
    <group>
      {/* 실리콘 기판 */}
      <mesh position={[0, -0.06, 0.2]} userData={{ noHighlight: true }}>
        <boxGeometry args={[COLS * SPACING + 1.6, 0.12, ROWS * SPACING + 2.8]} />
        <meshStandardMaterial color={COLORS.die} roughness={0.4} metalness={0.35} />
      </mesh>

      {/* 셀 = 커패시터(원통) + 액세스 트랜지스터(납작 박스) 인스턴스 */}
      <instancedMesh ref={caps} args={[undefined, undefined, ROWS * COLS]} userData={{ noHighlight: true }}>
        <cylinderGeometry args={[0.09, 0.07, 0.34, 10]} />
        <meshStandardMaterial roughness={0.35} metalness={0.4} emissive="#4cc8ff" emissiveIntensity={0.12} />
      </instancedMesh>
      <instancedMesh ref={trs} args={[undefined, undefined, ROWS * COLS]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.16, 0.08, 0.12]} />
        <meshStandardMaterial roughness={0.45} metalness={0.35} emissive="#4cc8ff" emissiveIntensity={0.08} />
      </instancedMesh>

      {/* 워드라인 (가로, 행 단위) — 클릭으로 행 활성화 */}
      {Array.from({ length: ROWS }, (_, r) => (
        <mesh
          key={r}
          position={[0, 0.05, cellZ(r)]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoverRow(r);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHoverRow((h) => (h === r ? null : h));
            document.body.style.cursor = 'auto';
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveRow(r);
          }}
          userData={{ noHighlight: true }}
        >
          <boxGeometry args={[COLS * SPACING + 1.2, 0.07, 0.09]} />
          <meshStandardMaterial
            color={activeRow === r ? '#4cc8ff' : hoverRow === r ? '#3a7ba5' : '#39424f'}
            emissive={activeRow === r ? '#4cc8ff' : hoverRow === r ? '#4cc8ff' : '#000000'}
            emissiveIntensity={activeRow === r ? 1.6 : hoverRow === r ? 0.5 : 0}
            toneMapped={activeRow !== r}
          />
        </mesh>
      ))}

      {/* 비트라인 (세로, 열 단위) — 첫 행 직전부터 감지 증폭기까지 정확히 */}
      {Array.from({ length: COLS }, (_, c) => {
        const zStart = Z0 - 0.3;
        const zEnd = SENSE_Z - 0.25;
        return (
          <mesh key={c} position={[cellX(c), 0.0, (zStart + zEnd) / 2]} userData={{ noHighlight: true }}>
            <boxGeometry args={[0.05, 0.05, zEnd - zStart]} />
            <meshStandardMaterial color="#2d3542" roughness={0.5} metalness={0.4} />
          </mesh>
        );
      })}
      <Label3D position={[X0 - 1.3, 0.25, SENSE_Z - 1.6]} small>
        ↓ 비트라인 (열·Column)
      </Label3D>

      {/* 비트라인 펄스 (행 → 감지 증폭기) */}
      <group ref={pulses} visible={false}>
        {Array.from({ length: COLS }, (_, c) => (
          <mesh key={c} position={[cellX(c), 0.12, 0]} userData={{ noHighlight: true }}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#7ee787" emissive="#7ee787" emissiveIntensity={2.5} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* 감지 증폭기 + 행 버퍼 */}
      {Array.from({ length: COLS }, (_, c) => (
        <mesh key={c} position={[cellX(c), 0.16, SENSE_Z]} userData={{ noHighlight: true }}>
          <boxGeometry args={[0.3, 0.28, 0.5]} />
          <meshStandardMaterial
            ref={(m) => {
              amps.current[c] = m;
            }}
            color="#3c4a3e"
            emissive="#7ee787"
            emissiveIntensity={0.05}
            roughness={0.4}
          />
        </mesh>
      ))}
      <Label3D position={[0, 0.8, SENSE_Z + 0.7]} small>
        감지 증폭기 + 행 버퍼 (Sense Amp / Row Buffer)
      </Label3D>

      {/* 안내 라벨 */}
      <Label3D position={[-(COLS * SPACING) / 2 - 1.6, 0.5, cellZ(2)]} accent>
        워드라인 클릭 → 행 활성화
      </Label3D>

      {/* 샘플 셀 — 클릭해서 1T1C 셀로 줌인 */}
      <Selectable nodeId="dram-cell" position={[cellX(COLS - 2), 0, cellZ(1)]}>
        <mesh position={[0, 0.7, 0]}>
          <torusGeometry args={[0.32, 0.035, 10, 32]} />
          <meshStandardMaterial color="#ffb454" emissive="#ffb454" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.4, 0]} visible={false}>
          <boxGeometry args={[0.8, 1.2, 0.8]} />
          <meshBasicMaterial />
        </mesh>
      </Selectable>
      <Label3D position={[cellX(COLS - 2), 1.35, cellZ(1)]} small>
        셀 하나 확대
      </Label3D>
    </group>
  );
}

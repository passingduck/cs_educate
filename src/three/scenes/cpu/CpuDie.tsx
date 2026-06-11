import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Selectable } from '../../Selectable';
import { Label3D } from '../shared/Label3D';
import { SignalPulse, type PulseHandle } from '../shared/SignalPulse';
import { COLORS } from '../../materials';
import { useSimStore } from '../../../sim/useSimStore';
import { useNavStore } from '../../../nav/useNavStore';

const Y = 0.34; // 펄스가 달리는 높이

// 블록 중심 좌표 (XZ)
const POS = {
  rom: [-2.0, -1.05] as const,
  sram: [-2.0, 1.05] as const,
  cu: [-0.2, -1.15] as const,
  pc: [0.62, -1.5] as const,
  ir: [0.62, -0.85] as const,
  alu: [1.85, -1.05] as const,
  reg: [1.7, 1.0] as const,
};

const path = (a: readonly [number, number], b: readonly [number, number]): [number, number, number][] => [
  [a[0], Y, a[1]],
  [a[0], Y, 0],
  [b[0], Y, 0],
  [b[0], Y, b[1]],
];

function Block({
  x,
  z,
  w,
  d,
  h = 0.3,
  color = COLORS.chipLight,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  h?: number;
  color?: string;
}) {
  return (
    <mesh position={[x, h / 2 + 0.06, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.42} metalness={0.3} />
    </mesh>
  );
}

/** 시뮬레이션 이벤트 → 3D 펄스/플래시. 리렌더 없이 store 구독으로 구동. */
function SimFx() {
  const fetchPulse = useRef<PulseHandle>(null);
  const dataPulse = useRef<PulseHandle>(null);
  const resultPulse = useRef<PulseHandle>(null);
  const romStripes = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const regTiles = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const sramTiles = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const pcMat = useRef<THREE.MeshStandardMaterial>(null);
  const aluMat = useRef<THREE.MeshStandardMaterial>(null);

  const flash = (mat: THREE.MeshStandardMaterial | null, color: string, intensity = 2.2) => {
    if (!mat) return;
    mat.emissive.set(color);
    mat.emissiveIntensity = intensity;
    // 감쇠는 setTimeout 단계로 (가벼움)
    window.setTimeout(() => {
      mat.emissiveIntensity *= 0.4;
    }, 280);
    window.setTimeout(() => {
      mat.emissiveIntensity = 0.06;
    }, 560);
  };

  useEffect(
    () =>
      useSimStore.subscribe(
        (s) => s.state,
        (state) => {
          if (!state || !state.lastEvent) {
            // 리셋: ROM 스트라이프 초기화
            romStripes.current.forEach((m, i) => {
              if (m) m.emissiveIntensity = i === 0 ? 1.6 : 0.06;
            });
            return;
          }
          const ev = state.lastEvent;
          const speed = useSimStore.getState().speedHz;
          const dur = Math.min(0.45, (1 / speed) * 0.7);

          // 모든 스텝: 명령어 페치 ROM → IR (XIP)
          fetchPulse.current?.fire(path(POS.rom, POS.ir), '#ffb454', dur);

          // PC 표시: ROM 스트라이프 + PC 레지스터 플래시
          const stripeCount = romStripes.current.length;
          romStripes.current.forEach((m, i) => {
            if (m) m.emissiveIntensity = i === state.pc % stripeCount ? 1.8 : 0.06;
          });
          flash(pcMat.current, '#ffb454', 1.8);

          switch (ev.kind) {
            case 'ldr':
              dataPulse.current?.fire(path(POS.sram, POS.reg), '#7ee787', dur);
              flash(sramTiles.current[(ev.addr / 4) % 16], '#7ee787');
              window.setTimeout(() => flash(regTiles.current[ev.rt], '#7ee787'), dur * 800);
              break;
            case 'str':
              dataPulse.current?.fire(path(POS.reg, POS.sram), '#7ee787', dur);
              flash(regTiles.current[ev.rt], '#7ee787');
              window.setTimeout(() => flash(sramTiles.current[(ev.addr / 4) % 16], '#7ee787'), dur * 800);
              break;
            case 'alu':
              dataPulse.current?.fire(path(POS.reg, POS.alu), '#4cc8ff', dur * 0.6);
              flash(aluMat.current, '#4cc8ff', 1.4);
              window.setTimeout(() => {
                resultPulse.current?.fire(path(POS.alu, POS.reg), '#ffb454', dur * 0.6);
                flash(regTiles.current[ev.rd], '#ffb454');
              }, dur * 650);
              break;
            case 'cmp':
              dataPulse.current?.fire(path(POS.reg, POS.alu), '#4cc8ff', dur * 0.6);
              flash(aluMat.current, '#4cc8ff', 1.4);
              break;
            case 'mov':
              flash(regTiles.current[ev.rd], '#ffb454');
              break;
            case 'branch':
              if (ev.taken) flash(pcMat.current, '#ff7a59', 2.6);
              break;
            case 'vec-sp':
            case 'vec-pc':
              dataPulse.current?.fire(path(POS.rom, POS.cu), '#4cc8ff', dur);
              break;
          }
        },
      ),
    [],
  );

  return (
    <group>
      <SignalPulse ref={fetchPulse} />
      <SignalPulse ref={dataPulse} />
      <SignalPulse ref={resultPulse} />

      {/* ROM 내부 명령어 스트라이프 — 현재 PC 위치가 빛남 */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[POS.rom[0], 0.38, POS.rom[1] - 0.52 + i * 0.115]} userData={{ noHighlight: true }}>
          <boxGeometry args={[1.05, 0.02, 0.06]} />
          <meshStandardMaterial
            ref={(m) => {
              romStripes.current[i] = m;
            }}
            color="#39424f"
            emissive="#ffb454"
            emissiveIntensity={i === 0 ? 1.6 : 0.06}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* 레지스터 타일 R0..R7 */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          position={[POS.reg[0] - 0.72 + (i % 4) * 0.48, 0.4, POS.reg[1] - 0.22 + Math.floor(i / 4) * 0.45]}
          userData={{ noHighlight: true }}
        >
          <boxGeometry args={[0.36, 0.06, 0.3]} />
          <meshStandardMaterial
            ref={(m) => {
              regTiles.current[i] = m;
            }}
            color="#2a3142"
            emissive="#ffb454"
            emissiveIntensity={0.06}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* SRAM 타일 4x4 */}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh
          key={i}
          position={[POS.sram[0] - 0.45 + (i % 4) * 0.3, 0.4, POS.sram[1] - 0.48 + Math.floor(i / 4) * 0.3]}
          userData={{ noHighlight: true }}
        >
          <boxGeometry args={[0.22, 0.05, 0.22]} />
          <meshStandardMaterial
            ref={(m) => {
              sramTiles.current[i] = m;
            }}
            color="#2a3142"
            emissive="#7ee787"
            emissiveIntensity={0.06}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* PC / ALU 본체 플래시 대상 (블록 위 얇은 캡) */}
      <mesh position={[POS.pc[0], 0.42, POS.pc[1]]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.55, 0.04, 0.32]} />
        <meshStandardMaterial
          ref={pcMat}
          color="#39424f"
          emissive="#ffb454"
          emissiveIntensity={0.25}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[POS.alu[0], 0.42, POS.alu[1]]} userData={{ noHighlight: true }}>
        <boxGeometry args={[1.4, 0.04, 1.1]} />
        <meshStandardMaterial
          ref={aluMat}
          color="#2a3142"
          emissive="#4cc8ff"
          emissiveIntensity={0.06}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** CPU 다이 플로어플랜 */
export function CpuDie() {
  const currentId = useNavStore((s) => s.currentId);

  return (
    <group>
      {/* 다이 기판 */}
      <mesh position={[0, 0, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[6.2, 0.12, 4.6]} />
        <meshStandardMaterial color={COLORS.die} roughness={0.35} metalness={0.45} />
      </mesh>

      {/* 중앙 버스 */}
      <mesh position={[0, 0.1, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[5.8, 0.06, 0.5]} />
        <meshStandardMaterial color="#1f2735" emissive="#4cc8ff" emissiveIntensity={0.18} roughness={0.4} />
      </mesh>
      <Label3D position={[0, 0.32, 0]} small>
        시스템 버스 (Bus)
      </Label3D>
      {/* 버스 스터브 */}
      {Object.values(POS).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z / 2]} userData={{ noHighlight: true }}>
          <boxGeometry args={[0.14, 0.04, Math.abs(z)]} />
          <meshStandardMaterial color="#1f2735" emissive="#4cc8ff" emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* ===== ROM (부트 코드) → 클릭: 부팅 시뮬레이션 ===== */}
      <Selectable nodeId="cpu-boot">
        <Block x={POS.rom[0]} z={POS.rom[1]} w={1.3} d={1.35} color="#23354a" />
      </Selectable>
      <Label3D position={[POS.rom[0], 0.75, POS.rom[1]]} accent={currentId !== 'cpu-boot'}>
        ROM (부트 코드)
      </Label3D>

      {/* ===== SRAM ===== */}
      <Selectable nodeId="cpu-regdemo">
        <Block x={POS.sram[0]} z={POS.sram[1]} w={1.4} d={1.5} color="#243a2e" />
      </Selectable>
      <Label3D position={[POS.sram[0], 0.75, POS.sram[1]]}>SRAM</Label3D>

      {/* ===== 제어 장치 + IR ===== */}
      <Block x={POS.cu[0]} z={POS.cu[1]} w={1.15} d={0.85} color="#3a3148" />
      <Label3D position={[POS.cu[0], 0.7, POS.cu[1] - 0.2]} small>
        제어 장치 (CU)
      </Label3D>
      <Block x={POS.ir[0]} z={POS.ir[1]} w={0.55} d={0.4} h={0.26} color="#46324a" />
      <Label3D position={[POS.ir[0] + 0.05, 0.62, POS.ir[1] + 0.32]} small>
        IR
      </Label3D>
      <Block x={POS.pc[0]} z={POS.pc[1]} w={0.55} d={0.4} h={0.26} color="#4a3a2c" />
      <Label3D position={[POS.pc[0] + 0.05, 0.62, POS.pc[1] - 0.35]} small>
        PC
      </Label3D>

      {/* ===== ALU ===== */}
      <Selectable nodeId="alu">
        <Block x={POS.alu[0]} z={POS.alu[1]} w={1.5} d={1.2} color="#2c3a52" />
      </Selectable>
      <Label3D position={[POS.alu[0], 0.75, POS.alu[1]]} accent>
        ALU
      </Label3D>

      {/* ===== 범용 레지스터 ===== */}
      <Selectable nodeId="cpu-regdemo">
        <Block x={POS.reg[0]} z={POS.reg[1]} w={2.0} d={1.2} color="#3d3526" />
      </Selectable>
      <Label3D position={[POS.reg[0], 0.75, POS.reg[1]]} accent={currentId !== 'cpu-regdemo'}>
        범용 레지스터 (R0–R7)
      </Label3D>

      <SimFx />
    </group>
  );
}

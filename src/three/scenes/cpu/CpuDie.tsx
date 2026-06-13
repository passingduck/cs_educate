import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Selectable } from '../../Selectable';
import { Label3D } from '../shared/Label3D';
import { SignalPulse, type PulseHandle } from '../shared/SignalPulse';
import { COLORS } from '../../materials';
import { useSimStore } from '../../../sim/useSimStore';
import type { SimEvent } from '../../../sim/isa';
import { useNavStore } from '../../../nav/useNavStore';

const Y = 0.34; // 펄스가 달리는 높이

// 블록 중심 좌표 (XZ)
const POS = {
  rom: [-2.0, -1.05] as const,
  sram: [-2.0, 1.05] as const,
  cu: [-0.5, -1.15] as const,
  pc: [0.55, -1.55] as const,
  ir: [0.55, -0.75] as const,
  alu: [1.85, -1.05] as const,
  reg: [1.7, 1.0] as const,
};

const path = (a: readonly [number, number], b: readonly [number, number]): [number, number, number][] => [
  [a[0], Y, a[1]],
  [a[0], Y, 0],
  [b[0], Y, 0],
  [b[0], Y, b[1]],
];

/** 교과서의 ALU 기호(위가 넓고 가운데 패인 사다리꼴)를 다이 위에 눕힌 형태 */
function AluShape() {
  const geometry = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.78, 0.55);
    s.lineTo(-0.16, 0.55);
    s.lineTo(0, 0.28);
    s.lineTo(0.16, 0.55);
    s.lineTo(0.78, 0.55);
    s.lineTo(0.45, -0.55);
    s.lineTo(-0.45, -0.55);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false });
  }, []);
  // 넓은 면(입력)이 버스/레지스터 쪽(+z)을 향하도록 눕힘
  return (
    <mesh geometry={geometry} position={[POS.alu[0], 0.36, POS.alu[1]]} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#2c3a52" roughness={0.42} metalness={0.3} />
    </mesh>
  );
}

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
  const cuMat = useRef<THREE.MeshStandardMaterial>(null);

  // 클럭이 느릴수록 플래시도 천천히 사그라들도록 지속시간을 속도에 비례
  const flash = (mat: THREE.MeshStandardMaterial | null, color: string, intensity = 2.2, holdMs = 280) => {
    if (!mat) return;
    mat.emissive.set(color);
    mat.emissiveIntensity = intensity;
    window.setTimeout(() => {
      mat.emissiveIntensity *= 0.4;
    }, holdMs);
    window.setTimeout(() => {
      mat.emissiveIntensity = 0.06;
    }, holdMs * 2);
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
          // 폰 노이만 사이클: 클럭 한 주기를 인출/해석/실행 3박자로 분할 (UI PhaseCard와 동기)
          const sub = Math.min(1 / speed, 3.6) / 3; // 한 박자(초)
          const dur = sub * 0.85; // 박자 내 펄스 이동 시간
          const holdMs = Math.min(1600, sub * 800);

          // ① 인출: 명령어 페치 ROM → IR (XIP) + PC 갱신 표시
          fetchPulse.current?.fire(path(POS.rom, POS.ir), '#ffb454', dur);
          const stripeCount = romStripes.current.length;
          romStripes.current.forEach((m, i) => {
            if (m) m.emissiveIntensity = i === state.pc % stripeCount ? 1.8 : 0.06;
          });
          flash(pcMat.current, '#ffb454', 1.8, holdMs);

          // ② 해석: 제어 장치 플래시
          window.setTimeout(() => flash(cuMat.current, '#c792ea', 1.6, holdMs), sub * 1000);

          // ③ 실행: 명령어 종류별 동작 (한 박자 뒤에)
          window.setTimeout(() => runExecutePhase(ev, dur, holdMs), sub * 2000);
        },
      ),
    [],
  );

  const runExecutePhase = (ev: SimEvent, dur: number, holdMs: number) => {
    switch (ev.kind) {
            case 'ldr':
              dataPulse.current?.fire(path(POS.sram, POS.reg), '#7ee787', dur);
              flash(sramTiles.current[(ev.addr / 4) % 16], '#7ee787', 2.2, holdMs);
              window.setTimeout(
                () => flash(regTiles.current[ev.rt], '#7ee787', 2.2, holdMs),
                dur * 900,
              );
              break;
            case 'str':
              dataPulse.current?.fire(path(POS.reg, POS.sram), '#7ee787', dur);
              flash(regTiles.current[ev.rt], '#7ee787', 2.2, holdMs);
              window.setTimeout(
                () => flash(sramTiles.current[(ev.addr / 4) % 16], '#7ee787', 2.2, holdMs),
                dur * 900,
              );
              break;
            case 'alu':
              dataPulse.current?.fire(path(POS.reg, POS.alu), '#4cc8ff', dur * 0.55);
              flash(aluMat.current, '#4cc8ff', 1.4, holdMs);
              window.setTimeout(() => {
                resultPulse.current?.fire(path(POS.alu, POS.reg), '#ffb454', dur * 0.55);
                flash(regTiles.current[ev.rd], '#ffb454', 2.2, holdMs);
              }, dur * 600);
              break;
            case 'cmp':
              dataPulse.current?.fire(path(POS.reg, POS.alu), '#4cc8ff', dur * 0.55);
              flash(aluMat.current, '#4cc8ff', 1.4, holdMs);
              break;
            case 'mov':
              flash(regTiles.current[ev.rd], '#ffb454', 2.2, holdMs);
              break;
            case 'branch':
              if (ev.taken) flash(pcMat.current, '#ff7a59', 2.6, holdMs);
              break;
            case 'vec-sp':
            case 'vec-pc':
              dataPulse.current?.fire(path(POS.rom, POS.cu), '#4cc8ff', dur);
              break;
    }
  };

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

      {/* CU 해석 단계 플래시 캡 */}
      <mesh position={[POS.cu[0], 0.42, POS.cu[1]]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.8, 0.04, 0.7]} />
        <meshStandardMaterial
          ref={cuMat}
          color="#3a3148"
          emissive="#c792ea"
          emissiveIntensity={0.06}
          toneMapped={false}
        />
      </mesh>

      {/* PC / ALU 본체 플래시 대상 (블록 위 얇은 캡) */}
      <mesh position={[POS.pc[0], 0.42, POS.pc[1]]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.42, 0.04, 0.3]} />
        <meshStandardMaterial
          ref={pcMat}
          color="#39424f"
          emissive="#ffb454"
          emissiveIntensity={0.25}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[POS.alu[0], 0.42, POS.alu[1]]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.85, 0.04, 0.95]} />
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
      <Label3D position={[-1.2, 0.32, 0]} small>
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

      {/* ===== 제어 장치 + IR + PC — 서로 떨어뜨려 라벨이 겹치지 않게 ===== */}
      <Block x={POS.cu[0]} z={POS.cu[1]} w={0.95} d={0.85} color="#3a3148" />
      <Label3D position={[POS.cu[0], 0.65, POS.cu[1] - 0.65]} small>
        제어 장치 (CU)
      </Label3D>
      <Block x={POS.ir[0]} z={POS.ir[1]} w={0.5} d={0.38} h={0.26} color="#46324a" />
      <Label3D position={[POS.ir[0], 0.5, POS.ir[1] + 0.42]} small>
        IR
      </Label3D>
      <Block x={POS.pc[0]} z={POS.pc[1]} w={0.5} d={0.38} h={0.26} color="#4a3a2c" />
      <Label3D position={[POS.pc[0], 0.5, POS.pc[1] - 0.42]} small>
        PC
      </Label3D>

      {/* ===== ALU — 교과서 기호 모양 ===== */}
      <Selectable nodeId="alu">
        <AluShape />
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

      {/* 1비트 확대 마커: SRAM → SR 래치 / 레지스터 → D 플립플롭 */}
      <Selectable nodeId="sram-latch">
        <mesh position={[POS.sram[0], 0.62, POS.sram[1] + 0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.03, 10, 28]} />
          <meshStandardMaterial color="#7ee787" emissive="#7ee787" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <mesh position={[POS.sram[0], 0.62, POS.sram[1] + 0.55]} visible={false}>
          <boxGeometry args={[0.55, 0.4, 0.55]} />
          <meshBasicMaterial />
        </mesh>
      </Selectable>
      <Label3D position={[POS.sram[0], 1.05, POS.sram[1] + 0.85]} small>
        1비트 = 래치
      </Label3D>
      <Selectable nodeId="reg-flipflop">
        <mesh position={[POS.reg[0] + 0.7, 0.62, POS.reg[1] + 0.42]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.03, 10, 28]} />
          <meshStandardMaterial color="#ffb454" emissive="#ffb454" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <mesh position={[POS.reg[0] + 0.7, 0.62, POS.reg[1] + 0.42]} visible={false}>
          <boxGeometry args={[0.55, 0.4, 0.55]} />
          <meshBasicMaterial />
        </mesh>
      </Selectable>
      <Label3D position={[POS.reg[0] + 0.7, 1.05, POS.reg[1] + 0.75]} small>
        1비트 = 플립플롭
      </Label3D>

      {/* 다이 가장자리 본드 패드 */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = -2.86 + i * 0.44;
        return [-2.18, 2.18].map((z) => (
          <mesh key={`${i}-${z}`} position={[x, 0.07, z]} userData={{ noHighlight: true }}>
            <boxGeometry args={[0.22, 0.03, 0.14]} />
            <meshStandardMaterial color="#d4a843" metalness={0.85} roughness={0.3} />
          </mesh>
        ));
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const z = -1.62 + i * 0.46;
        return [-2.96, 2.96].map((x) => (
          <mesh key={`${i}-${x}`} position={[x, 0.07, z]} userData={{ noHighlight: true }}>
            <boxGeometry args={[0.14, 0.03, 0.22]} />
            <meshStandardMaterial color="#d4a843" metalness={0.85} roughness={0.3} />
          </mesh>
        ));
      })}

      <SimFx />
    </group>
  );
}

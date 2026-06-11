import { useEffect, useRef, useState } from 'react';
import { Selectable } from '../../Selectable';
import { Wire } from '../shared/Wire';
import { BitToggle, OutputLamp } from '../shared/BitToggle';
import { Label3D } from '../shared/Label3D';
import { SignalPulse, type PulseHandle } from '../shared/SignalPulse';

const PMOS_COLOR = '#ff7a59';
const NMOS_COLOR = '#5aa2ff';

/** 회로도 스타일 MOSFET: 게이트 플레이트 + 채널 바. 전도 시 채널 발광. */
function Transistor({
  position,
  type,
  conducting,
  label,
}: {
  position: [number, number, number];
  type: 'P' | 'N';
  conducting: boolean;
  label: string;
}) {
  const color = type === 'P' ? PMOS_COLOR : NMOS_COLOR;
  return (
    <Selectable nodeId="mosfet" position={position}>
      {/* 채널 (세로 바) */}
      <mesh>
        <boxGeometry args={[0.2, 0.85, 0.2]} />
        <meshStandardMaterial
          color={conducting ? color : '#2a3142'}
          emissive={conducting ? color : '#000000'}
          emissiveIntensity={conducting ? 1.4 : 0}
          toneMapped={!conducting}
          roughness={0.4}
        />
      </mesh>
      {/* 게이트 플레이트 */}
      <mesh position={[-0.32, 0, 0]}>
        <boxGeometry args={[0.08, 0.7, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.4} />
      </mesh>
      {/* PMOS 버블 */}
      {type === 'P' && (
        <mesh position={[-0.48, 0, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      )}
      <Label3D position={[0.55, 0, 0]} small>
        {label}
      </Label3D>
    </Selectable>
  );
}

/**
 * CMOS NAND: PMOS 병렬 풀업 + NMOS 직렬 풀다운.
 * 입력을 바꾸면 어떤 트랜지스터가 켜지고 출력이 어디에 연결되는지 시각화.
 */
export function CmosGate() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(true);
  const pulse = useRef<PulseHandle>(null);
  const prevOut = useRef<boolean | null>(null);

  const out = !(a && b);
  const pA = !a; // PMOS는 입력 0에 전도
  const pB = !b;
  const nA = a; // NMOS는 입력 1에 전도
  const nB = b;

  // 출력 전환 시 충/방전 전류 펄스 — "스위칭 순간에만 전류가 흐른다"
  useEffect(() => {
    if (prevOut.current !== null && prevOut.current !== out) {
      if (out) {
        pulse.current?.fire(
          [
            [0, 2.5, 0],
            [pA ? -1.0 : 1.0, 1.4, 0],
            [pA ? -1.0 : 1.0, 0.3, 0],
            [1.9, 0.3, 0],
          ],
          PMOS_COLOR,
          0.55,
        );
      } else {
        pulse.current?.fire(
          [
            [1.9, 0.3, 0],
            [0, 0.3, 0],
            [0, -0.7, 0],
            [0, -1.8, 0],
            [0, -2.7, 0],
          ],
          NMOS_COLOR,
          0.55,
        );
      }
    }
    prevOut.current = out;
  }, [out, pA]);

  return (
    <group>
      {/* 전원/접지 레일 */}
      <mesh position={[0, 2.5, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[4.6, 0.14, 0.2]} />
        <meshStandardMaterial color="#7a3b30" emissive={PMOS_COLOR} emissiveIntensity={0.35} />
      </mesh>
      <Label3D position={[-2.9, 2.5, 0]} small>
        VDD (전원, 1)
      </Label3D>
      <mesh position={[0, -2.7, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[4.6, 0.14, 0.2]} />
        <meshStandardMaterial color="#2c3a52" emissive={NMOS_COLOR} emissiveIntensity={0.25} />
      </mesh>
      <Label3D position={[-2.9, -2.7, 0]} small>
        GND (접지, 0)
      </Label3D>

      {/* ===== PMOS 풀업 (병렬 2개) ===== */}
      <Transistor position={[-1.0, 1.4, 0]} type="P" conducting={pA} label="PMOS·A" />
      <Transistor position={[1.0, 1.4, 0]} type="P" conducting={pB} label="PMOS·B" />
      <Label3D position={[0, 1.95, 0]} small>
        풀업 네트워크 (병렬)
      </Label3D>
      {/* VDD → PMOS 소스 */}
      <Wire points={[[-1.0, 2.45, 0], [-1.0, 1.85, 0]]} lit={true} litColor="#5d4038" radius={0.04} />
      <Wire points={[[1.0, 2.45, 0], [1.0, 1.85, 0]]} lit={true} litColor="#5d4038" radius={0.04} />
      {/* PMOS 드레인 → 출력 노드 */}
      <Wire points={[[-1.0, 0.95, 0], [-1.0, 0.3, 0], [1.9, 0.3, 0]]} lit={out} litColor={PMOS_COLOR} radius={0.04} />
      <Wire points={[[1.0, 0.95, 0], [1.0, 0.3, 0]]} lit={out} litColor={PMOS_COLOR} radius={0.04} />

      {/* ===== NMOS 풀다운 (직렬 2개) ===== */}
      <Transistor position={[0, -0.7, 0]} type="N" conducting={nA} label="NMOS·A" />
      <Transistor position={[0, -1.8, 0]} type="N" conducting={nB} label="NMOS·B" />
      <Label3D position={[1.7, -1.25, 0]} small>
        풀다운 네트워크 (직렬)
      </Label3D>
      <Wire points={[[1.9, 0.3, 0], [0, 0.3, 0], [0, -0.25, 0]]} lit={!out} litColor={NMOS_COLOR} radius={0.04} />
      <Wire points={[[0, -1.15, 0], [0, -1.35, 0]]} lit={nA && !out} litColor={NMOS_COLOR} radius={0.04} />
      <Wire points={[[0, -2.25, 0], [0, -2.62, 0]]} lit={nA && nB} litColor={NMOS_COLOR} radius={0.04} />

      {/* ===== 입력 ===== */}
      <BitToggle position={[-3.4, 0.7, 0]} value={a} label="A" onToggle={() => setA(!a)} />
      <BitToggle position={[-3.4, -0.4, 0]} value={b} label="B" onToggle={() => setB(!b)} />
      {/* A 게이트 배선: PMOS·A + NMOS·A */}
      <Wire points={[[-3.2, 0.7, 0], [-2.2, 0.7, 0], [-2.2, 1.4, 0], [-1.4, 1.4, 0]]} lit={a} radius={0.03} />
      <Wire points={[[-2.2, 0.7, 0], [-2.2, -0.7, 0], [-0.4, -0.7, 0]]} lit={a} radius={0.03} />
      {/* B 게이트 배선 */}
      <Wire points={[[-3.2, -0.4, 0], [-2.7, -0.4, 0], [-2.7, 2.0, 0], [0.3, 2.0, 0], [0.6, 1.4, 0]]} lit={b} radius={0.03} />
      <Wire points={[[-2.7, -0.4, 0], [-2.7, -1.8, 0], [-0.4, -1.8, 0]]} lit={b} radius={0.03} />

      {/* 출력 */}
      <OutputLamp position={[2.3, 0.3, 0]} value={out} label="Y = NAND(A,B)" color="#7ee787" />

      <SignalPulse ref={pulse} />

      <Label3D position={[0, -3.5, 0]} small>
        트랜지스터를 클릭하면 반도체 물리 수준으로
      </Label3D>
    </group>
  );
}

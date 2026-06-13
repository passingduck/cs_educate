import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Selectable } from '../../Selectable';
import { Wire } from '../shared/Wire';
import { Label3D } from '../shared/Label3D';

const REG_X = -3.4;
const regY = (i: number) => 2.1 - i * 0.6;

/** 오른쪽(또는 왼쪽)을 가리키는 사다리꼴 — MUX/DEMUX 기호 */
function Trap({
  position,
  flip,
  label,
  color = '#33405a',
}: {
  position: [number, number, number];
  flip?: boolean;
  label: string;
  color?: string;
}) {
  const geometry = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.5, -1.0);
    s.lineTo(-0.5, 1.0);
    s.lineTo(0.5, 0.45);
    s.lineTo(0.5, -0.45);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false });
  }, []);
  return (
    <Selectable nodeId="mux" position={position} rotation={flip ? [0, Math.PI, 0] : undefined}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      <Html position={[0, 0, flip ? -0.3 : 0.3]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="label3d small" style={{ pointerEvents: 'none' }}>{label}</div>
      </Html>
    </Selectable>
  );
}

function Selector({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
}) {
  const btn: React.CSSProperties = {
    width: 26,
    height: 28,
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,.15)',
    background: 'rgba(14,19,31,.85)',
    color: '#9aa7ba',
    cursor: 'pointer',
    fontWeight: 700,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 11.5, color: '#9aa7ba' }}>{label}</span>
      <button style={btn} onClick={() => onChange((value + 7) % 8)}>‹</button>
      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color, width: 26, textAlign: 'center' }}>
        R{value}
      </span>
      <button style={btn} onClick={() => onChange((value + 1) % 8)}>›</button>
    </div>
  );
}

/** 레지스터 파일: MUX 2개(읽기)와 DEMUX(쓰기)가 8개 중 상자를 고르는 모습 */
export function RegFile() {
  const [vals, setVals] = useState([7, 5, 0, 3, 1, 9, 2, 8]);
  const [rn, setRn] = useState(0);
  const [rm, setRm] = useState(1);
  const [rd, setRd] = useState(2);
  const [flash, setFlash] = useState(-1);

  const run = () => {
    const next = [...vals];
    next[rd] = vals[rn] + vals[rm];
    setVals(next);
    setFlash(rd);
    window.setTimeout(() => setFlash(-1), 700);
  };

  return (
    <group>
      {/* ===== 레지스터 8개 ===== */}
      {vals.map((v, i) => (
        <group key={i} position={[REG_X, regY(i), 0]}>
          <mesh userData={{ noHighlight: true }}>
            <boxGeometry args={[1.0, 0.48, 0.2]} />
            <meshStandardMaterial
              color={i === rn ? '#1d3a52' : i === rm ? '#1d2c52' : i === rd ? '#52401d' : '#222a38'}
              emissive={flash === i ? '#ffb454' : i === rn ? '#4cc8ff' : i === rm ? '#5aa2ff' : i === rd ? '#ffb454' : '#000000'}
              emissiveIntensity={flash === i ? 1.6 : i === rn || i === rm || i === rd ? 0.25 : 0}
              roughness={0.4}
            />
          </mesh>
          <Html position={[0, 0, 0.15]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: '#e8edf5', pointerEvents: 'none' }}>
              R{i} <span style={{ color: '#7ee787' }}>{v}</span>
            </div>
          </Html>
          {/* 읽기 버스 스터브 (희미) */}
          <Wire points={[[0.5, 0, 0], [0.8, 0, 0]]} radius={0.02} color="#2a3242" />
        </group>
      ))}
      <Label3D position={[REG_X, 2.75, 0]} accent>
        범용 레지스터 R0–R7
      </Label3D>

      {/* 플립플롭으로 내려가는 입구 */}
      <Selectable nodeId="reg-flipflop" position={[REG_X - 1.2, -2.75, 0]}>
        <mesh>
          <torusGeometry args={[0.18, 0.03, 10, 28]} />
          <meshStandardMaterial color="#ffb454" emissive="#ffb454" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </Selectable>
      <Label3D position={[REG_X - 1.2, -3.25, 0]} small>
        1비트의 실체 = 플립플롭
      </Label3D>

      {/* ===== 읽기 MUX 2개 ===== */}
      <Trap position={[-0.6, 1.1, 0]} label="MUX A (8→1)" />
      <Label3D position={[-0.6, -0.25 + 1.1 - 1.15, 0]} small>
        {`선택 S=${rn.toString(2).padStart(3, '0')} (R${rn})`}
      </Label3D>
      <Trap position={[-0.6, -1.3, 0]} label="MUX B (8→1)" />
      <Label3D position={[-0.6, -2.55, 0]} small>
        {`선택 S=${rm.toString(2).padStart(3, '0')} (R${rm})`}
      </Label3D>

      {/* 선택된 읽기 경로 */}
      <Wire points={[[REG_X + 0.5, regY(rn), 0], [-1.7, regY(rn), 0], [-1.25, 1.1, 0], [-1.1, 1.1, 0]]} lit litColor="#4cc8ff" />
      <Wire points={[[REG_X + 0.5, regY(rm), 0], [-1.85, regY(rm), 0], [-1.25, -1.3, 0], [-1.1, -1.3, 0]]} lit litColor="#5aa2ff" />
      {/* MUX → ALU */}
      <Wire points={[[-0.1, 1.1, 0], [0.7, 1.1, 0], [1.15, 0.5, 0]]} lit litColor="#4cc8ff" />
      <Wire points={[[-0.1, -1.3, 0], [0.7, -1.3, 0], [1.15, -0.5, 0]]} lit litColor="#5aa2ff" />

      {/* ===== ALU ===== */}
      <mesh position={[1.75, 0, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[1.1, 1.5, 0.2]} />
        <meshStandardMaterial color="#2c3a52" roughness={0.4} metalness={0.3} />
      </mesh>
      <Html position={[1.75, 0, 0.15]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#4cc8ff', pointerEvents: 'none' }}>＋</div>
      </Html>
      <Label3D position={[1.75, 1.1, 0]} small>
        ALU
      </Label3D>

      {/* ===== 결과 → DEMUX → 선택된 레지스터 ===== */}
      <Wire points={[[2.3, 0, 0], [3.1, 0, 0], [3.1, 3.1, 0], [-0.75, 3.1, 0]]} lit litColor="#ffb454" />
      <Trap position={[-1.25, 3.1, 0]} flip label="DEMUX (1→8)" color="#52401d" />
      <Label3D position={[-1.25, 1.85, 0]} small>
        {`선택 S=${rd.toString(2).padStart(3, '0')} (R${rd})`}
      </Label3D>
      <Wire points={[[-1.75, 3.1, 0], [-4.35, 3.1, 0], [-4.35, regY(rd), 0], [REG_X - 0.5, regY(rd), 0]]} lit litColor="#ffb454" />

      {/* ===== 컨트롤 ===== */}
      <Html position={[0, -3.6, 0]} center zIndexRange={[5, 0]}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(14,19,31,.8)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 18px' }}>
          <Selector label="A 읽기" value={rn} color="#4cc8ff" onChange={setRn} />
          <Selector label="B 읽기" value={rm} color="#5aa2ff" onChange={setRm} />
          <Selector label="쓰기" value={rd} color="#ffb454" onChange={setRd} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12.5, color: '#e8edf5' }}>
            ADD R{rd}, R{rn}, R{rm} → {vals[rn]}+{vals[rm]}
          </span>
          <button
            onClick={run}
            style={{ padding: '6px 16px', borderRadius: 999, border: '1px solid rgba(255,180,84,.45)', background: 'rgba(255,180,84,.15)', color: '#ffb454', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            실행 ▶
          </button>
        </div>
      </Html>

      <Label3D position={[0, -4.4, 0]} small>
        MUX/DEMUX를 클릭하면 게이트 수준 구현으로
      </Label3D>
    </group>
  );
}

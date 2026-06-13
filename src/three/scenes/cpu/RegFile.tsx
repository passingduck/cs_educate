import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Selectable } from '../../Selectable';
import { Wire } from '../shared/Wire';
import { Label3D } from '../shared/Label3D';

const REG_X = -3.4;
const regY = (i: number) => 2.1 - i * 0.6;
const Z = 0.22; // 펄스가 배선 앞에 보이도록

// ALU 위치/크기
const ALU = { x: 1.75, y: 0, h: 1.5, w: 1.1 };

type Phase = 'idle' | 'in' | 'scan' | 'out' | 'done';
const T_IN = 1.6;
const T_SCAN = 1.3;
const T_OUT = 1.6;

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
  disabled,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const btn: React.CSSProperties = {
    width: 26,
    height: 28,
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,.15)',
    background: 'rgba(14,19,31,.85)',
    color: '#9aa7ba',
    cursor: disabled ? 'default' : 'pointer',
    fontWeight: 700,
    opacity: disabled ? 0.4 : 1,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 11.5, color: '#9aa7ba' }}>{label}</span>
      <button style={btn} disabled={disabled} onClick={() => onChange((value + 7) % 8)}>‹</button>
      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color, width: 26, textAlign: 'center' }}>
        R{value}
      </span>
      <button style={btn} disabled={disabled} onClick={() => onChange((value + 1) % 8)}>›</button>
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
  const [phase, setPhase] = useState<Phase>('idle');

  const busy = phase !== 'idle';

  // 애니메이션 경로 (선택된 레지스터 기준으로 재계산)
  const pathA = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          [REG_X + 0.5, regY(rn), Z],
          [-1.7, regY(rn), Z],
          [-1.1, 1.1, Z],
          [-0.1, 1.1, Z],
          [0.7, 1.1, Z],
          [ALU.x - 0.35, 0.42, Z],
        ].map((p) => new THREE.Vector3(...p)),
        false,
        'catmullrom',
        0.0,
      ),
    [rn],
  );
  const pathB = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          [REG_X + 0.5, regY(rm), Z],
          [-1.85, regY(rm), Z],
          [-1.1, -1.3, Z],
          [-0.1, -1.3, Z],
          [0.7, -1.3, Z],
          [ALU.x - 0.35, -0.42, Z],
        ].map((p) => new THREE.Vector3(...p)),
        false,
        'catmullrom',
        0.0,
      ),
    [rm],
  );
  const pathOut = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          [ALU.x + 0.55, 0, Z],
          [3.1, 0, Z],
          [3.1, 3.1, Z],
          [-1.25, 3.1, Z],
          [-4.35, 3.1, Z],
          [-4.35, regY(rd), Z],
          [REG_X - 0.5, regY(rd), Z],
        ].map((p) => new THREE.Vector3(...p)),
        false,
        'catmullrom',
        0.0,
      ),
    [rd],
  );

  const anim = useRef<{ start: number } | null>(null);
  const pulseA = useRef<THREE.Mesh>(null);
  const pulseB = useRef<THREE.Mesh>(null);
  const pulseOut = useRef<THREE.Mesh>(null);
  const scan = useRef<THREE.Mesh>(null);
  const scanMat = useRef<THREE.MeshStandardMaterial>(null);
  const aluMat = useRef<THREE.MeshStandardMaterial>(null);

  const run = () => {
    if (anim.current) return;
    anim.current = { start: performance.now() };
    setPhase('in');
    window.setTimeout(() => setPhase('scan'), T_IN * 1000);
    window.setTimeout(() => setPhase('out'), (T_IN + T_SCAN) * 1000);
    window.setTimeout(() => {
      setVals((prev) => {
        const next = [...prev];
        next[rd] = prev[rn] + prev[rm];
        return next;
      });
      setFlash(rd);
      setPhase('done');
    }, (T_IN + T_SCAN + T_OUT) * 1000);
    window.setTimeout(() => {
      setFlash(-1);
      setPhase('idle');
      anim.current = null;
    }, (T_IN + T_SCAN + T_OUT + 0.7) * 1000);
  };

  useFrame(() => {
    const a = anim.current;
    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    if (!a) {
      [pulseA, pulseB, pulseOut, scan].forEach((r) => {
        if (r.current) r.current.visible = false;
      });
      if (aluMat.current) aluMat.current.emissiveIntensity = 0.0;
      return;
    }

    const el = (performance.now() - a.start) / 1000;

    // ① 입력 펄스: 레지스터 → MUX → ALU (위에서 스며들 듯 페이드인)
    const inActive = el < T_IN;
    [
      { ref: pulseA, path: pathA },
      { ref: pulseB, path: pathB },
    ].forEach(({ ref, path }) => {
      const m = ref.current;
      if (!m) return;
      m.visible = inActive;
      if (inActive) {
        const t = easeInOut(Math.min(el / T_IN, 1));
        m.position.copy(path.getPoint(t));
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1.2 + Math.sin(el * 9) * 0.6 + (1 - t) * 0.8;
        const s = 0.6 + Math.sin(t * Math.PI) * 0.6;
        m.scale.setScalar(s);
      }
    });

    // ② ALU 스캔: 위 → 아래로 빛 띠가 훑고, ALU 본체가 점점 달아오름
    const scanT = (el - T_IN) / T_SCAN;
    const scanActive = scanT >= 0 && scanT < 1;
    if (scan.current && scanMat.current) {
      scan.current.visible = scanActive;
      if (scanActive) {
        const top = ALU.y + ALU.h / 2 - 0.1;
        const bot = ALU.y - ALU.h / 2 + 0.1;
        // 위에서 아래로 (여러 번 훑는 느낌: 2회 스윕)
        const sweep = (scanT * 2) % 1;
        scan.current.position.set(ALU.x, top - (top - bot) * sweep, Z + 0.02);
        scanMat.current.emissiveIntensity = 2.6 * (0.5 + 0.5 * Math.sin(scanT * Math.PI));
      }
    }
    if (aluMat.current) {
      if (scanActive) {
        aluMat.current.emissiveIntensity = 0.4 + 1.3 * Math.sin(Math.min(scanT, 1) * Math.PI);
      } else if (el >= T_IN) {
        aluMat.current.emissiveIntensity *= 0.9;
      }
    }

    // ③ 결과 펄스: ALU → DEMUX → 출력 레지스터
    const outT = (el - T_IN - T_SCAN) / T_OUT;
    const outActive = outT >= 0 && outT < 1;
    if (pulseOut.current) {
      pulseOut.current.visible = outActive;
      if (outActive) {
        const t = easeInOut(outT);
        pulseOut.current.position.copy(pathOut.getPoint(t));
        const mat = pulseOut.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1.6 + Math.sin(el * 10) * 0.6;
        pulseOut.current.scale.setScalar(0.7 + Math.sin(t * Math.PI) * 0.5);
      }
    }
  });

  return (
    <group>
      {/* ===== 레지스터 8개 ===== */}
      {vals.map((v, i) => {
        const isIn = (i === rn || i === rm) && (phase === 'in' || phase === 'scan');
        const isOut = i === rd && (phase === 'out' || phase === 'done');
        return (
          <group key={i} position={[REG_X, regY(i), 0]}>
            <mesh userData={{ noHighlight: true }}>
              <boxGeometry args={[1.0, 0.48, 0.2]} />
              <meshStandardMaterial
                color={i === rn ? '#1d3a52' : i === rm ? '#1d2c52' : i === rd ? '#52401d' : '#222a38'}
                emissive={
                  flash === i || isOut
                    ? '#ffb454'
                    : i === rn
                      ? '#4cc8ff'
                      : i === rm
                        ? '#5aa2ff'
                        : i === rd
                          ? '#ffb454'
                          : '#000000'
                }
                emissiveIntensity={
                  flash === i || isOut ? 1.8 : isIn ? 1.3 : i === rn || i === rm || i === rd ? 0.25 : 0
                }
                roughness={0.4}
              />
            </mesh>
            <Html position={[0, 0, 0.15]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: '#e8edf5', pointerEvents: 'none' }}>
                R{i} <span style={{ color: '#7ee787' }}>{v}</span>
              </div>
            </Html>
            <Wire points={[[0.5, 0, 0], [0.8, 0, 0]]} radius={0.02} color="#2a3242" />
          </group>
        );
      })}
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
      <mesh position={[ALU.x, ALU.y, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[ALU.w, ALU.h, 0.2]} />
        <meshStandardMaterial
          ref={aluMat}
          color="#2c3a52"
          emissive="#4cc8ff"
          emissiveIntensity={0}
          roughness={0.4}
          metalness={0.3}
          toneMapped={false}
        />
      </mesh>
      {/* ALU 내부 스캔 라인 (위→아래) */}
      <mesh ref={scan} visible={false} userData={{ noHighlight: true }}>
        <boxGeometry args={[ALU.w - 0.1, 0.12, 0.06]} />
        <meshStandardMaterial
          ref={scanMat}
          color="#bfe6ff"
          emissive="#cfeeff"
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>
      <Html position={[ALU.x, 0, 0.16]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#4cc8ff', pointerEvents: 'none' }}>＋</div>
      </Html>
      <Label3D position={[ALU.x, 1.1, 0]} small>
        ALU
      </Label3D>

      {/* ===== 결과 → DEMUX → 선택된 레지스터 ===== */}
      <Wire points={[[2.3, 0, 0], [3.1, 0, 0], [3.1, 3.1, 0], [-0.75, 3.1, 0]]} lit litColor="#ffb454" />
      <Trap position={[-1.25, 3.1, 0]} flip label="DEMUX (1→8)" color="#52401d" />
      <Label3D position={[-1.25, 1.85, 0]} small>
        {`선택 S=${rd.toString(2).padStart(3, '0')} (R${rd})`}
      </Label3D>
      <Wire points={[[-1.75, 3.1, 0], [-4.35, 3.1, 0], [-4.35, regY(rd), 0], [REG_X - 0.5, regY(rd), 0]]} lit litColor="#ffb454" />

      {/* ===== 움직이는 펄스 ===== */}
      <mesh ref={pulseA} visible={false} userData={{ noHighlight: true }}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#4cc8ff" emissive="#4cc8ff" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh ref={pulseB} visible={false} userData={{ noHighlight: true }}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#5aa2ff" emissive="#5aa2ff" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh ref={pulseOut} visible={false} userData={{ noHighlight: true }}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#ffb454" emissive="#ffb454" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>

      {/* ===== 컨트롤 ===== */}
      <Html position={[0, -3.6, 0]} center zIndexRange={[5, 0]}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(14,19,31,.8)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 18px' }}>
          <Selector label="A 읽기" value={rn} color="#4cc8ff" onChange={setRn} disabled={busy} />
          <Selector label="B 읽기" value={rm} color="#5aa2ff" onChange={setRm} disabled={busy} />
          <Selector label="쓰기" value={rd} color="#ffb454" onChange={setRd} disabled={busy} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12.5, color: '#e8edf5' }}>
            ADD R{rd}, R{rn}, R{rm} → {vals[rn]}+{vals[rm]}
          </span>
          <button
            onClick={run}
            disabled={busy}
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              border: '1px solid rgba(255,180,84,.45)',
              background: 'rgba(255,180,84,.15)',
              color: '#ffb454',
              fontWeight: 700,
              cursor: busy ? 'default' : 'pointer',
              fontFamily: 'inherit',
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? '실행 중…' : '실행 ▶'}
          </button>
        </div>
      </Html>

      <Label3D position={[0, -4.4, 0]} small>
        {phase === 'in'
          ? 'A·B 레지스터 값이 MUX를 지나 ALU로 들어갑니다'
          : phase === 'scan'
            ? 'ALU가 비트를 위에서 아래로 훑으며 계산 중…'
            : phase === 'out' || phase === 'done'
              ? '결과가 DEMUX를 지나 출력 레지스터로 돌아갑니다'
              : 'MUX/DEMUX를 클릭하면 게이트 수준 구현으로'}
      </Label3D>
    </group>
  );
}

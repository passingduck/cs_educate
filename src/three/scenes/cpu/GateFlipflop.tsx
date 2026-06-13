import { useEffect, useState } from 'react';
import { Selectable } from '../../Selectable';
import { GateSymbol } from './GateSymbol';
import { Wire } from '../shared/Wire';
import { BitToggle, OutputLamp } from '../shared/BitToggle';
import { Label3D } from '../shared/Label3D';

const S = 0.6; // 게이트 스케일
/** NAND(s=0.6)의 입출력 앵커: back -0.3, in y ±0.15, out(버블 포함) +0.42 */
const gate = (x: number, y: number) => ({
  pos: [x, y, 0] as [number, number, number],
  in1: [x - 0.3, y + 0.15, 0] as [number, number, number],
  in2: [x - 0.3, y - 0.15, 0] as [number, number, number],
  out: [x + 0.42, y, 0] as [number, number, number],
});

// 클럭 인버터 + 마스터(4 NAND) + 슬레이브(4 NAND)
const G0 = gate(-3.3, -1.7); // ¬CLK
const M1 = gate(-2.2, 1.3);
const M2 = gate(-2.2, 0.1);
const M3 = gate(-0.9, 1.0); // Qm
const M4 = gate(-0.9, -0.2); // Q̄m
const S1 = gate(0.8, 1.3);
const S2 = gate(0.8, 0.1);
const S3 = gate(2.1, 1.0); // Q
const S4 = gate(2.1, -0.2); // Q̄

/** 게이트형 D 래치 4개 NAND 묶음 */
function LatchCluster({
  gates,
  lits,
}: {
  gates: ReturnType<typeof gate>[];
  lits: boolean[];
}) {
  return (
    <Selectable nodeId="cmos">
      {gates.map((g, i) => (
        <group key={i} position={g.pos}>
          <GateSymbol type="NAND" scale={S} lit={lits[i]} />
        </group>
      ))}
    </Selectable>
  );
}

/**
 * 마스터-슬레이브 D 플립플롭 (NAND 9개).
 * CLK=0: 마스터 열림(D 추적)·슬레이브 잠김 / CLK=1: 마스터 잠김·슬레이브 열림(Q 갱신).
 * 상승 에지 순간의 D만 Q로 전달되는 에지 트리거를 체험.
 */
export function GateFlipflop() {
  const [d, setD] = useState(true);
  const [clk, setClk] = useState(false);
  const [qm, setQm] = useState(true);
  const [qs, setQs] = useState(true);

  useEffect(() => {
    if (!clk) setQm(d); // 마스터 투명
  }, [d, clk]);
  useEffect(() => {
    if (clk) setQs(qm); // 슬레이브 투명 (상승 에지에 마스터 값 캡처)
  }, [clk, qm]);

  const nclk = !clk;
  const g1m = !(d && nclk);
  const g2m = !(g1m && nclk);
  const g1s = !(qm && clk);
  const g2s = !(g1s && clk);

  return (
    <group>
      {/* 입력 */}
      <BitToggle position={[-4.6, 1.3, 0]} value={d} label="D (데이터)" onToggle={() => setD(!d)} />
      <BitToggle position={[-4.6, -1.7, 0]} value={clk} label="CLK (클럭)" onToggle={() => setClk(!clk)} />

      {/* 열린(투명) 래치 표시 바닥판 */}
      <mesh position={[-1.55, 0.55, -0.18]} userData={{ noHighlight: true }}>
        <boxGeometry args={[2.5, 2.6, 0.05]} />
        <meshStandardMaterial
          color="#1a2230"
          emissive="#ffb454"
          emissiveIntensity={nclk ? 0.4 : 0.02}
          transparent
          opacity={0.5}
        />
      </mesh>
      <mesh position={[1.45, 0.55, -0.18]} userData={{ noHighlight: true }}>
        <boxGeometry args={[2.5, 2.6, 0.05]} />
        <meshStandardMaterial
          color="#1a2230"
          emissive="#ffb454"
          emissiveIntensity={clk ? 0.4 : 0.02}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* ===== 클럭 인버터 (NAND 양입력 묶음) ===== */}
      <Wire points={[[-4.4, -1.7, 0], [-3.9, -1.7, 0]]} lit={clk} />
      <Wire points={[[-3.9, -1.7, 0], [-3.6, -1.55, 0], G0.in1]} lit={clk} radius={0.028} />
      <Wire points={[[-3.9, -1.7, 0], [-3.6, -1.85, 0], G0.in2]} lit={clk} radius={0.028} />
      <Selectable nodeId="cmos">
        <group position={G0.pos}>
          <GateSymbol type="NAND" scale={S} lit={nclk} />
        </group>
      </Selectable>
      <Label3D position={[-3.3, -2.3, 0]} small>
        ¬CLK (인버터)
      </Label3D>

      {/* ===== 마스터 래치 ===== */}
      <LatchCluster gates={[M1, M2, M3, M4]} lits={[g1m, g2m, qm, !qm]} />
      <Label3D position={[-1.55, 2.15, 0]} accent>
        {`마스터 래치 ${nclk ? '— 열림 (D 추적 중)' : '— 잠김 (값 고정)'}`}
      </Label3D>

      {/* D → M1 */}
      <Wire points={[[-4.4, 1.3, 0], [-3.0, 1.3, 0], M1.in1]} lit={d} />
      {/* ¬CLK → M1, M2 */}
      <Wire points={[G0.out, [-2.75, -1.7, 0], [-2.75, 1.15, 0], M1.in2]} lit={nclk} />
      <Wire points={[[-2.75, -0.05, 0], M2.in2]} lit={nclk} />
      {/* M1 → M3, M2 */}
      <Wire points={[M1.out, [-1.6, 1.3, 0], [-1.6, 1.15, 0], M3.in1]} lit={g1m} />
      <Wire points={[[-1.6, 1.3, 0], [-1.6, 0.6, 0], [-2.65, 0.6, 0], [-2.65, 0.25, 0], M2.in1]} lit={g1m} />
      {/* M2 → M4 */}
      <Wire points={[M2.out, [-1.5, 0.1, 0], [-1.5, -0.35, 0], M4.in2]} lit={g2m} />
      {/* 되먹임 */}
      <Wire points={[M4.out, [-0.3, -0.2, 0], [-0.3, 0.5, 0], [-1.35, 0.5, 0], [-1.35, 0.85, 0], M3.in2]} lit={!qm} radius={0.028} />
      <Wire points={[M3.out, [-0.38, 1.0, 0], [-0.38, 0.32, 0], [-1.3, 0.32, 0], [-1.3, -0.05, 0], M4.in1]} lit={qm} radius={0.028} />

      {/* ===== 슬레이브 래치 ===== */}
      <LatchCluster gates={[S1, S2, S3, S4]} lits={[g1s, g2s, qs, !qs]} />
      <Label3D position={[1.45, 2.15, 0]} accent>
        {`슬레이브 래치 ${clk ? '— 열림 (Q 갱신)' : '— 잠김 (Q 유지)'}`}
      </Label3D>

      {/* Qm → S1 */}
      <Wire points={[[-0.38, 1.0, 0], [0.1, 1.0, 0], [0.1, 1.45, 0], S1.in1]} lit={qm} />
      {/* CLK → S1, S2 (인버터를 거치지 않은 원clock) */}
      <Wire points={[[-4.0, -1.7, 0], [-4.0, -2.45, 0], [0.32, -2.45, 0], [0.32, -0.05, 0], S2.in2]} lit={clk} />
      <Wire points={[[0.32, 1.15, 0], S1.in2]} lit={clk} />
      {/* S1 → S3, S2 */}
      <Wire points={[S1.out, [1.4, 1.3, 0], [1.4, 1.15, 0], S3.in1]} lit={g1s} />
      <Wire points={[[1.4, 1.3, 0], [1.4, 0.6, 0], [0.35, 0.6, 0], [0.35, 0.25, 0], S2.in1]} lit={g1s} />
      {/* S2 → S4 */}
      <Wire points={[S2.out, [1.5, 0.1, 0], [1.5, -0.35, 0], S4.in2]} lit={g2s} />
      {/* 되먹임 */}
      <Wire points={[S4.out, [2.7, -0.2, 0], [2.7, 0.5, 0], [1.65, 0.5, 0], [1.65, 0.85, 0], S3.in2]} lit={!qs} radius={0.028} />
      <Wire points={[S3.out, [2.62, 1.0, 0], [2.62, 0.32, 0], [1.7, 0.32, 0], [1.7, -0.05, 0], S4.in1]} lit={qs} radius={0.028} />

      {/* 출력 */}
      <Wire points={[[2.62, 1.0, 0], [3.4, 1.0, 0]]} lit={qs} litColor="#7ee787" />
      <OutputLamp position={[3.7, 1.0, 0]} value={qs} label="Q (레지스터 비트)" />

      <Label3D position={[0, -3.1, 0]} small>
        CLK=0에서 D를 바꿔도 Q는 그대로 — CLK를 1로 올리는 순간의 D만 캡처됩니다
      </Label3D>
      <Label3D position={[0, -3.7, 0]} small>
        게이트를 클릭하면 CMOS 트랜지스터 수준으로
      </Label3D>
    </group>
  );
}

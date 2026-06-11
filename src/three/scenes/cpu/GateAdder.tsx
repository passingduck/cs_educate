import { useState } from 'react';
import { Selectable } from '../../Selectable';
import { GateSymbol } from './GateSymbol';
import { Wire } from '../shared/Wire';
import { BitToggle, OutputLamp } from '../shared/BitToggle';
import { Label3D } from '../shared/Label3D';

/**
 * 전가산기(Full Adder) 인터랙티브 회로도.
 * S = A⊕B⊕Cin, Cout = A·B + (A⊕B)·Cin — 입력을 클릭해 신호 전파를 관찰.
 * 배선 좌표는 게이트 입출력 가장자리(±0.25·scale)에 정확히 맞춤.
 */
export function GateAdder() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const [cin, setCin] = useState(true);

  const s1 = a !== b; // A ⊕ B
  const sum = s1 !== cin; // S
  const c1 = a && b;
  const c2 = s1 && cin;
  const cout = c1 || c2;

  return (
    <group>
      {/* 입력 스위치 */}
      <BitToggle position={[-4.2, 2.0, 0]} value={a} label="A" onToggle={() => setA(!a)} />
      <BitToggle position={[-4.2, 0.9, 0]} value={b} label="B" onToggle={() => setB(!b)} />
      <BitToggle position={[-4.2, -1.6, 0]} value={cin} label="Cin" onToggle={() => setCin(!cin)} />

      {/* ===== XOR1: A⊕B (게이트 위치 -1.9,1.5 / s=0.85) ===== */}
      <Wire points={[[-4.0, 2.0, 0], [-3.0, 2.0, 0], [-2.48, 1.71, 0]]} lit={a} />
      <Wire points={[[-4.0, 0.9, 0], [-3.0, 0.9, 0], [-2.48, 1.29, 0]]} lit={b} />
      <Selectable nodeId="cmos" position={[-1.9, 1.5, 0]}>
        <GateSymbol type="XOR" lit={s1} scale={0.85} />
      </Selectable>
      <Label3D position={[-1.9, 2.35, 0]} small>
        XOR
      </Label3D>

      {/* s1 분기: → XOR2 위 입력, → AND2 위 입력 */}
      <Wire points={[[-1.39, 1.5, 0], [-0.3, 1.5, 0], [0.62, 1.31, 0]]} lit={s1} />
      <Wire points={[[-0.3, 1.5, 0], [-0.3, -0.9, 0], [0.8, -0.9, 0]]} lit={s1} />
      {/* Cin 분기: → XOR2 아래 입력, → AND2 아래 입력 */}
      <Wire points={[[-4.0, -1.6, 0], [0.3, -1.6, 0]]} lit={cin} />
      <Wire points={[[0.0, -1.6, 0], [0.0, 0.89, 0], [0.62, 0.89, 0]]} lit={cin} />
      <Wire points={[[0.3, -1.6, 0], [0.3, -1.3, 0], [0.8, -1.3, 0]]} lit={cin} />

      {/* ===== XOR2: 합 S (1.2,1.1 / s=0.85) ===== */}
      <Selectable nodeId="cmos" position={[1.2, 1.1, 0]}>
        <GateSymbol type="XOR" lit={sum} scale={0.85} />
      </Selectable>
      <Label3D position={[1.2, 1.95, 0]} small>
        XOR
      </Label3D>
      <Wire points={[[1.71, 1.1, 0], [3.2, 1.1, 0]]} lit={sum} litColor="#7ee787" />
      <OutputLamp position={[3.5, 1.1, 0]} value={sum} label="S (합)" />

      {/* ===== AND1: A·B (-1.9,-0.25 / s=0.8) ===== */}
      <Wire points={[[-3.6, 2.0, 0], [-3.6, -0.05, 0], [-2.3, -0.05, 0]]} lit={a} />
      <Wire points={[[-3.3, 0.9, 0], [-3.3, -0.45, 0], [-2.3, -0.45, 0]]} lit={b} />
      <Selectable nodeId="cmos" position={[-1.9, -0.25, 0]}>
        <GateSymbol type="AND" lit={c1} scale={0.8} />
      </Selectable>
      <Label3D position={[-1.9, -1.0, 0]} small>
        AND
      </Label3D>

      {/* ===== AND2: (A⊕B)·Cin (1.2,-1.1 / s=0.8) ===== */}
      <Selectable nodeId="cmos" position={[1.2, -1.1, 0]}>
        <GateSymbol type="AND" lit={c2} scale={0.8} />
      </Selectable>
      <Label3D position={[1.2, -1.85, 0]} small>
        AND
      </Label3D>

      {/* ===== OR: Cout (2.9,-0.65 / s=0.8) ===== */}
      <Wire points={[[-1.5, -0.25, 0], [1.9, -0.25, 0], [2.5, -0.45, 0]]} lit={c1} />
      <Wire points={[[1.6, -1.1, 0], [2.0, -1.1, 0], [2.5, -0.85, 0]]} lit={c2} />
      <Selectable nodeId="cmos" position={[2.9, -0.65, 0]}>
        <GateSymbol type="OR" lit={cout} scale={0.8} />
      </Selectable>
      <Label3D position={[2.9, -1.4, 0]} small>
        OR
      </Label3D>
      <Wire points={[[3.38, -0.65, 0], [4.2, -0.65, 0]]} lit={cout} litColor="#ffb454" />
      <OutputLamp position={[4.5, -0.65, 0]} value={cout} label="Cout (자리올림)" color="#ffb454" />

      <Label3D position={[0, -2.7, 0]} small>
        게이트를 클릭하면 CMOS 트랜지스터 수준으로
      </Label3D>
    </group>
  );
}

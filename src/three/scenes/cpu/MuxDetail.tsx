import { useState } from 'react';
import { Selectable } from '../../Selectable';
import { GateSymbol } from './GateSymbol';
import { Wire } from '../shared/Wire';
import { BitToggle, OutputLamp } from '../shared/BitToggle';
import { Label3D } from '../shared/Label3D';

/**
 * 2:1 MUX 게이트 구현: OUT = (A AND ¬S) OR (B AND S)
 * S가 어느 길을 열어주는지 체험. 게이트 → CMOS로 하향.
 */
export function MuxDetail() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const [s, setS] = useState(false);

  const ns = !s;
  const c1 = a && ns;
  const c2 = b && s;
  const out = c1 || c2;

  return (
    <group>
      <BitToggle position={[-4.0, 1.6, 0]} value={a} label="A 입력" onToggle={() => setA(!a)} />
      <BitToggle position={[-4.0, -0.2, 0]} value={b} label="B 입력" onToggle={() => setB(!b)} />
      <BitToggle position={[-4.0, -2.1, 0]} value={s} label="S (선택)" onToggle={() => setS(!s)} />

      {/* NOT(S) — 양입력 NAND */}
      <Wire points={[[-3.8, -2.1, 0], [-3.1, -2.1, 0]]} lit={s} />
      <Wire points={[[-3.1, -2.1, 0], [-2.8, -1.95, 0], [-2.6, -1.95, 0]]} lit={s} radius={0.028} />
      <Wire points={[[-3.1, -2.1, 0], [-2.8, -2.25, 0], [-2.6, -2.25, 0]]} lit={s} radius={0.028} />
      <Selectable nodeId="cmos" position={[-2.3, -2.1, 0]}>
        <GateSymbol type="NAND" lit={ns} scale={0.6} />
      </Selectable>
      <Label3D position={[-2.3, -2.7, 0]} small>
        NOT (¬S)
      </Label3D>

      {/* AND1: A · ¬S — S=0일 때 열리는 문 */}
      <Wire points={[[-3.8, 1.6, 0], [-1.6, 1.6, 0], [-1.0, 1.4, 0]]} lit={a} />
      <Wire points={[[-1.88, -2.1, 0], [-1.55, -2.1, 0], [-1.55, 1.0, 0], [-1.0, 1.0, 0]]} lit={ns} />
      <Selectable nodeId="cmos" position={[-0.6, 1.2, 0]}>
        <GateSymbol type="AND" lit={c1} scale={0.8} />
      </Selectable>
      <Label3D position={[-0.6, 2.0, 0]} small>
        {`AND — A의 문 ${ns ? '(열림)' : '(닫힘)'}`}
      </Label3D>

      {/* AND2: B · S — S=1일 때 열리는 문 */}
      <Wire points={[[-3.8, -0.2, 0], [-1.6, -0.2, 0], [-1.0, -0.4, 0]]} lit={b} />
      <Wire points={[[-3.0, -2.1, 0], [-3.0, -1.3, 0], [-1.3, -1.3, 0], [-1.3, -0.8, 0], [-1.0, -0.8, 0]]} lit={s} />
      <Selectable nodeId="cmos" position={[-0.6, -0.6, 0]}>
        <GateSymbol type="AND" lit={c2} scale={0.8} />
      </Selectable>
      <Label3D position={[-0.6, -1.4, 0]} small>
        {`AND — B의 문 ${s ? '(열림)' : '(닫힘)'}`}
      </Label3D>

      {/* OR — 두 길의 합류 */}
      <Wire points={[[-0.2, 1.2, 0], [1.0, 1.2, 0], [1.5, 0.5, 0]]} lit={c1} />
      <Wire points={[[-0.2, -0.6, 0], [1.0, -0.6, 0], [1.5, 0.1, 0]]} lit={c2} />
      <Selectable nodeId="cmos" position={[2.1, 0.3, 0]}>
        <GateSymbol type="OR" lit={out} scale={0.8} />
      </Selectable>
      <Label3D position={[2.1, -0.5, 0]} small>
        OR (합류)
      </Label3D>

      <Wire points={[[2.58, 0.3, 0], [3.4, 0.3, 0]]} lit={out} litColor="#7ee787" />
      <OutputLamp position={[3.7, 0.3, 0]} value={out} label={`OUT = ${s ? 'B' : 'A'} 통과`} />

      <Label3D position={[0, 2.8, 0]} accent>
        {`S=${s ? 1 : 0} → ${s ? 'B' : 'A'}의 문만 열려 있습니다`}
      </Label3D>
      <Label3D position={[0, -3.3, 0]} small>
        DEMUX는 반대 방향: 입력 하나를 S에 따라 출구 0/1로 — AND 2개 + NOT 1개면 끝
      </Label3D>
      <Label3D position={[0, -3.9, 0]} small>
        게이트를 클릭하면 CMOS 트랜지스터 수준으로
      </Label3D>
    </group>
  );
}

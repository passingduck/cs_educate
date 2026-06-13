import { useEffect, useState } from 'react';
import { Selectable } from '../../Selectable';
import { GateSymbol } from './GateSymbol';
import { Wire } from '../shared/Wire';
import { BitToggle, OutputLamp } from '../shared/BitToggle';
import { Label3D } from '../shared/Label3D';

/**
 * SR 래치: NOR 게이트 2개의 교차 결합(Cross-coupled).
 * 되먹임 고리가 입력이 사라져도 상태를 유지하는 것을 체험 — SRAM 셀의 원리.
 * Q = NOR(R, Q̄), Q̄ = NOR(S, Q)
 */
export function GateLatch() {
  const [s, setS] = useState(false);
  const [r, setR] = useState(false);
  const [q, setQ] = useState(true);

  useEffect(() => {
    if (s && !r) setQ(true);
    if (r && !s) setQ(false);
  }, [s, r]);

  const invalid = s && r;
  const qOut = invalid ? false : q;
  const qbOut = invalid ? false : !q;

  return (
    <group>
      {/* 입력 (위: R, 아래: S — 교과서 배치) */}
      <BitToggle position={[-3.6, 1.4, 0]} value={r} label="R (Reset)" onToggle={() => setR(!r)} />
      <BitToggle position={[-3.6, -1.4, 0]} value={s} label="S (Set)" onToggle={() => setS(!s)} />

      {/* 위 NOR: Q = NOR(R, Q̄) */}
      <Wire points={[[-3.4, 1.4, 0], [-1.2, 1.4, 0], [-0.23, 1.31, 0]]} lit={r} />
      <Selectable nodeId="cmos" position={[0.2, 1.1, 0]}>
        <GateSymbol type="NOR" lit={qOut} scale={0.85} />
      </Selectable>
      <Label3D position={[0.2, 1.95, 0]} small>
        NOR
      </Label3D>

      {/* 아래 NOR: Q̄ = NOR(S, Q) */}
      <Wire points={[[-3.4, -1.4, 0], [-1.2, -1.4, 0], [-0.23, -1.31, 0]]} lit={s} />
      <Selectable nodeId="cmos" position={[0.2, -1.1, 0]}>
        <GateSymbol type="NOR" lit={qbOut} scale={0.85} />
      </Selectable>
      <Label3D position={[0.2, -1.95, 0]} small>
        NOR
      </Label3D>

      {/* 출력 */}
      <Wire points={[[0.9, 1.1, 0], [3.2, 1.1, 0]]} lit={qOut} litColor="#7ee787" />
      <OutputLamp position={[3.5, 1.1, 0]} value={qOut} label="Q (저장된 비트)" />
      <Wire points={[[0.9, -1.1, 0], [3.2, -1.1, 0]]} lit={qbOut} litColor="#ffb454" />
      <OutputLamp position={[3.5, -1.1, 0]} value={qbOut} label="Q̄ (반전)" color="#ffb454" />

      {/* ===== 되먹임(Feedback) 교차 배선 — 래치의 핵심 ===== */}
      <Wire
        points={[[1.5, 1.1, 0], [1.5, 0.5, 0], [-1.0, -0.5, 0], [-1.0, -0.89, 0], [-0.23, -0.89, 0]]}
        lit={qOut}
      />
      <Wire
        points={[[1.5, -1.1, 0], [1.5, -0.5, 0], [-1.0, 0.5, 0], [-1.0, 0.89, 0], [-0.23, 0.89, 0]]}
        lit={qbOut}
      />
      <Label3D position={[0.25, 0, 0]} accent>
        되먹임 고리
      </Label3D>

      {invalid && (
        <Label3D position={[0, 2.7, 0]} accent>
          ⚠ S=R=1 은 금지 입력 — 두 출력이 모두 0 (모순 상태)
        </Label3D>
      )}

      <Label3D position={[0, -2.8, 0]} small>
        실제 SRAM 6T 셀 = 교차 결합 인버터 2개 + 액세스 트랜지스터 2개 — 같은 되먹임 원리
      </Label3D>
      <Label3D position={[0, -3.4, 0]} small>
        게이트를 클릭하면 CMOS 트랜지스터 수준으로
      </Label3D>
    </group>
  );
}

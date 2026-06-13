import { useEffect, useRef, useState } from 'react';
import { useNavStore } from '../nav/useNavStore';
import { useSimStore } from '../sim/useSimStore';
import { explainEvent, PHASE_INFO } from '../sim/explain';
import { PROGRAMS, type ProgramKey } from '../content/programs';

const REGDEMO_TABS: ProgramKey[] = ['add', 'mul', 'pow'];

/** 폰 노이만 사이클(인출→해석→실행) 표시 + 방금 실행된 명령 해설 */
function PhaseCard() {
  const state = useSimStore((s) => s.state);
  const speedHz = useSimStore((s) => s.speedHz);
  const [phase, setPhase] = useState(-1);
  const steps = state?.steps ?? 0;

  useEffect(() => {
    if (steps === 0) {
      setPhase(-1);
      return;
    }
    const sub = (Math.min(1 / speedHz, 3.6) / 3) * 1000;
    setPhase(0);
    const timers = [
      window.setTimeout(() => setPhase(1), sub),
      window.setTimeout(() => setPhase(2), sub * 2),
      window.setTimeout(() => setPhase(-1), sub * 3),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  if (!state) return null;

  const explanation =
    phase >= 0 && phase < 2
      ? PHASE_INFO[phase].desc
      : steps > 0
        ? explainEvent(state.lastEvent)
        : 'CPU가 하는 일은 단 세 가지의 무한 반복입니다. ▶ 또는 ⏭ 버튼으로 직접 돌려 보세요!';

  return (
    <div className="sim-card">
      <h3>폰 노이만 사이클 — CPU의 영원한 3박자</h3>
      <div className="phase-chips">
        {PHASE_INFO.map((p, i) => (
          <div key={p.key} className={`phase-chip${phase === i ? ' active' : ''}`}>
            <span className="ko">{p.label}</span>
            <span className="en">{p.en}</span>
          </div>
        ))}
      </div>
      <p className="explain-text">{explanation}</p>
    </div>
  );
}

function CodeListing() {
  const asm = useSimStore((s) => s.asm);
  const state = useSimStore((s) => s.state);
  const linesRef = useRef<HTMLDivElement>(null);

  const currentLine =
    state && asm && !state.halted && state.pc < asm.pcToLine.length
      ? asm.pcToLine[state.pc]
      : -1;

  useEffect(() => {
    const el = linesRef.current?.querySelector('.code-line.current');
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentLine]);

  if (!asm) return null;

  return (
    <div className="sim-card code-listing">
      <h3>프로그램 (메모리 속 명령어들) — 노란 줄 = PC가 가리키는 곳</h3>
      <div className="lines" ref={linesRef}>
        {asm.lines.map((line, i) => {
          const trimmed = line.trim();
          const cls = trimmed.startsWith(';')
            ? 'comment'
            : /^[A-Za-z_]\w*:\s*$/.test(trimmed)
              ? 'label'
              : '';
          return (
            <div key={i} className={`code-line${i === currentLine ? ' current' : ''}`}>
              <span className="gutter">{i + 1}</span>
              <span className={cls}>{line || ' '}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegisterView() {
  const state = useSimStore((s) => s.state);
  if (!state) return null;
  const lw = state.lastWrite;

  return (
    <div className="sim-card">
      <h3>레지스터 — CPU가 손에 든 작은 상자들</h3>
      <div className="register-grid">
        <div className="reg-cell pc">
          <div className="name">PC (위치)</div>
          <div className="value">0x{(state.pc * 4).toString(16).padStart(4, '0').toUpperCase()}</div>
        </div>
        <div className={`reg-cell${lw?.kind === 'sp' ? ' flash' : ''}`}>
          <div className="name">SP</div>
          <div className="value">
            {state.sp ? `0x${state.sp.toString(16).toUpperCase()}` : '—'}
          </div>
        </div>
        {state.regs.map((v, i) => (
          <div key={i} className={`reg-cell${lw?.kind === 'reg' && lw.index === i ? ' flash' : ''}`}>
            <div className="name">R{i}</div>
            <div className="value">{v}</div>
          </div>
        ))}
      </div>
      <div className="flags-row">
        <span className={`flag-chip${state.flags.Z ? ' on' : ''}`}>Z 깃발 (같다!)</span>
        <span className={`flag-chip${state.flags.N ? ' on' : ''}`}>N 깃발 (음수)</span>
      </div>
    </div>
  );
}

function MemoryView() {
  const state = useSimStore((s) => s.state);
  const programKey = useSimStore((s) => s.programKey);
  if (!state || !programKey) return null;
  const { memWindow, memLabels } = PROGRAMS[programKey];
  const [start, count] = memWindow;
  const lw = state.lastWrite;

  return (
    <div className="sim-card">
      <h3>메모리 (SRAM) — 데이터가 사는 곳</h3>
      <div className="memory-grid">
        {Array.from({ length: count }, (_, i) => {
          const addr = start + i * 4;
          return (
            <div key={addr} className={`mem-cell${lw?.kind === 'mem' && lw.index === addr ? ' flash' : ''}`}>
              <div className="addr">0x{addr.toString(16).padStart(2, '0').toUpperCase()}</div>
              <div className="value">{state.mem[addr] ?? 0}</div>
              {memLabels[addr] && <div className="mem-label">{memLabels[addr]}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimControls() {
  const running = useSimStore((s) => s.running);
  const speedHz = useSimStore((s) => s.speedHz);
  const halted = useSimStore((s) => s.state?.halted ?? false);
  const steps = useSimStore((s) => s.state?.steps ?? 0);
  const { play, pause, stepOnce, reset, setSpeed } = useSimStore.getState();

  return (
    <div className="sim-card">
      <div className="sim-controls">
        <button className="primary" onClick={running ? pause : play} disabled={halted} title={running ? '일시정지' : '자동 실행'}>
          {running ? '⏸' : '▶'}
        </button>
        <button onClick={stepOnce} disabled={halted || running} title="한 명령만 실행">
          ⏭
        </button>
        <button onClick={reset} title="처음부터">
          ⟲
        </button>
        <div className="speed-control">
          <span>속도</span>
          <input
            type="range"
            min={0.25}
            max={8}
            step={0.25}
            value={speedHz}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <span>{speedHz}Hz</span>
        </div>
      </div>
      <div className="sim-status">
        {steps}개 명령 실행됨{halted && <span className="halted"> · 완료! ⟲로 다시 보기</span>}
      </div>
    </div>
  );
}

/** cpu-boot / cpu-regdemo 노드에서만 표시되는 시뮬레이션 패널 */
export function SimPanel() {
  const currentId = useNavStore((s) => s.currentId);
  const programKey = useSimStore((s) => s.programKey);
  const isBoot = currentId === 'cpu-boot';
  const isRegdemo = currentId === 'cpu-regdemo';

  useEffect(() => {
    const { load, pause } = useSimStore.getState();
    const key = useSimStore.getState().programKey;
    if (isBoot && key !== 'boot') load('boot');
    if (isRegdemo && (!key || !REGDEMO_TABS.includes(key))) load('add');
    return () => pause();
  }, [isBoot, isRegdemo]);

  if (!isBoot && !isRegdemo) return null;

  return (
    <div className="sim-panel">
      {isRegdemo && (
        <div className="sim-card">
          <div className="program-tabs" style={{ paddingBottom: 12 }}>
            {REGDEMO_TABS.map((key) => (
              <button
                key={key}
                className={programKey === key ? 'active' : ''}
                onClick={() => useSimStore.getState().load(key)}
              >
                {PROGRAMS[key].title}
              </button>
            ))}
          </div>
        </div>
      )}
      <PhaseCard />
      <CodeListing />
      <RegisterView />
      <MemoryView />
      <SimControls />
    </div>
  );
}

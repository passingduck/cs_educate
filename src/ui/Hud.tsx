import { useNavStore } from '../nav/useNavStore';
import { Breadcrumb } from './Breadcrumb';
import { InfoPanel } from './InfoPanel';
import { Tooltip } from './Tooltip';
import { SimPanel } from './SimPanel';

export function Hud() {
  const transition = useNavStore((s) => s.transition);
  const currentId = useNavStore((s) => s.currentId);

  return (
    <div className="hud">
      <Breadcrumb />
      <InfoPanel />
      <SimPanel />
      <Tooltip />
      {currentId === 'computer' && (
        <div className="visit-hint">
          컴퓨터를 <b>클릭</b>해 내부로 들어가 보세요 · 드래그로 회전
        </div>
      )}
      {currentId === 'software' && (
        <div className="visit-hint">
          process 블록과 하드웨어 칩을 <b>클릭</b>해 연결 관계를 확인하세요
        </div>
      )}
      {currentId === 'cpu' && (
        <div className="scenario-buttons">
          <span className="scenario-title">학습 시나리오</span>
          <button onClick={() => useNavStore.getState().navigateTo('compiler')}>
            📜 코드의 여행 — 컴파일러
          </button>
          <button onClick={() => useNavStore.getState().navigateTo('mem-hierarchy')}>
            🍳 메모리 계층 — 요리사의 주방
          </button>
        </div>
      )}
      <div className={`fade-layer${transition === 'out' ? ' visible' : ''}`} />
    </div>
  );
}

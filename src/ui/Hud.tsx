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
      <div className={`fade-layer${transition === 'out' ? ' visible' : ''}`} />
    </div>
  );
}

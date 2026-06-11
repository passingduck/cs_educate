import { useEffect, useState } from 'react';
import { useNavStore } from '../nav/useNavStore';
import { NODE_CONTENT } from '../content/nodes';

export function Tooltip() {
  const hoveredId = useNavStore((s) => s.hoveredId);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  if (!hoveredId) return null;
  const content = NODE_CONTENT[hoveredId];

  return (
    <div className="tooltip" style={{ left: pos.x, top: pos.y }}>
      {content.title}
      <span className="hint">클릭해서 들어가기</span>
    </div>
  );
}

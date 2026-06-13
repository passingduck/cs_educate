import { useState } from 'react';
import { useNavStore } from '../nav/useNavStore';
import { NODE_CONTENT } from '../content/nodes';
import type { NodeId } from '../nav/types';

/** **굵게**와 [[라벨|nodeId]] wiki 링크를 렌더링 */
function renderRich(text: string, navigateTo: (id: NodeId) => void) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[[^\]|]+\|[^\]]+\]\])/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('[[') && p.endsWith(']]')) {
      const [label, id] = p.slice(2, -2).split('|') as [string, NodeId];
      if (!NODE_CONTENT[id]) return label;
      return (
        <button key={i} className="wiki-link" onClick={() => navigateTo(id)}>
          {label}
        </button>
      );
    }
    return p;
  });
}

export function InfoPanel() {
  const currentId = useNavStore((s) => s.currentId);
  const navigateTo = useNavStore((s) => s.navigateTo);
  const [open, setOpen] = useState(true);
  const content = NODE_CONTENT[currentId];

  if (!open) {
    return (
      <button className="info-panel-toggle" onClick={() => setOpen(true)} title="설명 열기">
        ℹ
      </button>
    );
  }

  return (
    <aside className={`info-panel${open ? '' : ' collapsed'}`} key={currentId}>
      <div className="info-header">
        <button className="close-btn" onClick={() => setOpen(false)} title="닫기">
          ✕
        </button>
        <div className="subtitle">{content.subtitle}</div>
        <h2>{content.title}</h2>
      </div>
      <div className="info-body">
        {content.description.split('\n\n').map((para, i) => (
          <p key={i}>{renderRich(para, navigateTo)}</p>
        ))}
        {content.facts.length > 0 && (
          <div className="info-facts">
            <h3>알고 계셨나요?</h3>
            <ul>
              {content.facts.map((f, i) => (
                <li key={i}>{renderRich(f, navigateTo)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

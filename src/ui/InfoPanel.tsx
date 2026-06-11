import { useState } from 'react';
import { useNavStore } from '../nav/useNavStore';
import { NODE_CONTENT } from '../content/nodes';

/** **굵게** 마크업을 <strong>으로 */
function renderRich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p,
  );
}

export function InfoPanel() {
  const currentId = useNavStore((s) => s.currentId);
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
          <p key={i}>{renderRich(para)}</p>
        ))}
        {content.facts.length > 0 && (
          <div className="info-facts">
            <h3>알고 계셨나요?</h3>
            <ul>
              {content.facts.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

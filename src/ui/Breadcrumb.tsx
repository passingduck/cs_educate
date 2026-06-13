import { Fragment } from 'react';
import { useNavStore } from '../nav/useNavStore';
import { NODE_CONTENT } from '../content/nodes';

export function Breadcrumb() {
  const currentId = useNavStore((s) => s.currentId);
  const navigateTo = useNavStore((s) => s.navigateTo);
  const path = useNavStore((s) => s.trail);

  return (
    <nav className="breadcrumb">
      {path.map((id, i) => (
        <Fragment key={id}>
          {i > 0 && <span className="sep">▸</span>}
          <button
            className={id === currentId ? 'current' : ''}
            onClick={() => id !== currentId && navigateTo(id)}
          >
            {NODE_CONTENT[id].title}
          </button>
        </Fragment>
      ))}
    </nav>
  );
}

import { Fragment } from 'react';
import { useNavStore } from '../nav/useNavStore';
import { NODE_CONTENT } from '../content/nodes';
import { rootOf } from '../nav/tree';

const ROOT_TABS = ['computer'] as const;

export function Breadcrumb() {
  const currentId = useNavStore((s) => s.currentId);
  const navigateTo = useNavStore((s) => s.navigateTo);
  const path = useNavStore((s) => s.trail);
  const activeRoot = rootOf(currentId);
  const crumbPath = path.filter((id) => !ROOT_TABS.includes(id as (typeof ROOT_TABS)[number]));

  return (
    <nav className="top-nav">
      <div className="root-tabs">
        {ROOT_TABS.map((id) => (
          <button
            key={id}
            className={id === activeRoot ? 'current' : ''}
            onClick={() => id !== currentId && navigateTo(id)}
          >
            {NODE_CONTENT[id].title}
          </button>
        ))}
      </div>
      {crumbPath.length > 0 && (
        <div className="breadcrumb">
          {crumbPath.map((id, i) => (
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
        </div>
      )}
    </nav>
  );
}

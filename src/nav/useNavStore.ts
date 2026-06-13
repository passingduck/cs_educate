import { create } from 'zustand';
import type { NodeId } from './types';
import { NAV_TREE, pathOf } from './tree';

export type Transition = 'idle' | 'out' | 'in';

interface NavState {
  currentId: NodeId;
  hoveredId: NodeId | null;
  transition: Transition;
  /** 실제 드릴다운 경로 — 브레드크럼의 진실. 공유 노드(CMOS/MOSFET)도 들어온 길을 그대로 반영 */
  trail: NodeId[];
  /** 씬이 교체될 때마다 증가 — CameraRig가 카메라를 즉시 스냅하는 신호 */
  snapToken: number;
  navigateTo: (id: NodeId) => void;
  setHovered: (id: NodeId | null) => void;
}

const FADE_MS = 300;
const SETTLE_MS = 650;

/** 다음 trail 계산: 이미 경로에 있으면 거기까지 자르고(줌아웃), 아니면 끝에 추가(드릴다운) */
function nextTrail(trail: NodeId[], id: NodeId): NodeId[] {
  const idx = trail.indexOf(id);
  if (idx !== -1) return trail.slice(0, idx + 1);
  // 현재 끝의 자식이면 이어붙이고, 그 외(시나리오 점프 등)도 그냥 추가
  return [...trail, id];
}

export const useNavStore = create<NavState>((set, get) => ({
  currentId: 'computer',
  hoveredId: null,
  transition: 'idle',
  trail: pathOf('computer'),
  snapToken: 0,

  navigateTo: (id) => {
    const { currentId, transition, trail } = get();
    if (transition !== 'idle' || id === currentId) return;

    const newTrail = nextTrail(trail, id);
    const sameScene = NAV_TREE[id].sceneKey === NAV_TREE[currentId].sceneKey;
    if (sameScene) {
      // 같은 씬 안에서는 카메라만 부드럽게 이동
      set({ currentId: id, hoveredId: null, trail: newTrail });
      return;
    }

    set({ transition: 'out', hoveredId: null });
    document.body.style.cursor = 'auto';
    window.setTimeout(() => {
      set((s) => ({ currentId: id, transition: 'in', trail: newTrail, snapToken: s.snapToken + 1 }));
      window.setTimeout(() => set({ transition: 'idle' }), SETTLE_MS - FADE_MS);
    }, FADE_MS);
  },

  setHovered: (id) => {
    if (get().hoveredId !== id) set({ hoveredId: id });
  },
}));

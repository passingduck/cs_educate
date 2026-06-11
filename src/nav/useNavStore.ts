import { create } from 'zustand';
import type { NodeId } from './types';
import { NAV_TREE } from './tree';

export type Transition = 'idle' | 'out' | 'in';

interface NavState {
  currentId: NodeId;
  hoveredId: NodeId | null;
  transition: Transition;
  /** 씬이 교체될 때마다 증가 — CameraRig가 카메라를 즉시 스냅하는 신호 */
  snapToken: number;
  navigateTo: (id: NodeId) => void;
  setHovered: (id: NodeId | null) => void;
}

const FADE_MS = 300;
const SETTLE_MS = 650;

export const useNavStore = create<NavState>((set, get) => ({
  currentId: 'computer',
  hoveredId: null,
  transition: 'idle',
  snapToken: 0,

  navigateTo: (id) => {
    const { currentId, transition } = get();
    if (transition !== 'idle' || id === currentId) return;

    const sameScene = NAV_TREE[id].sceneKey === NAV_TREE[currentId].sceneKey;
    if (sameScene) {
      // 같은 씬 안에서는 카메라만 부드럽게 이동
      set({ currentId: id, hoveredId: null });
      return;
    }

    set({ transition: 'out', hoveredId: null });
    document.body.style.cursor = 'auto';
    window.setTimeout(() => {
      set((s) => ({ currentId: id, transition: 'in', snapToken: s.snapToken + 1 }));
      window.setTimeout(() => set({ transition: 'idle' }), SETTLE_MS - FADE_MS);
    }, FADE_MS);
  },

  setHovered: (id) => {
    if (get().hoveredId !== id) set({ hoveredId: id });
  },
}));

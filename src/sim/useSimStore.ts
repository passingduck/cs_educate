import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Assembled } from './isa';
import { assemble } from './assemble';
import { createState, step, type MachineState } from './machine';
import { PROGRAMS, type ProgramKey } from '../content/programs';

interface SimStore {
  programKey: ProgramKey | null;
  asm: Assembled | null;
  state: MachineState | null;
  running: boolean;
  speedHz: number;
  load: (key: ProgramKey) => void;
  stepOnce: () => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (hz: number) => void;
}

let timer: number | null = null;

function clearTimer() {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}

export const useSimStore = create<SimStore>()(
  subscribeWithSelector((set, get) => {
    const startTimer = () => {
      clearTimer();
      timer = window.setInterval(() => {
        const { state, asm, running } = get();
        if (!running || !state || !asm) return;
        const next = step(state, asm);
        set({ state: next });
        if (next.halted) {
          clearTimer();
          set({ running: false });
        }
      }, 1000 / get().speedHz);
    };

    return {
      programKey: null,
      asm: null,
      state: null,
      running: false,
      speedHz: 2,

      load: (key) => {
        clearTimer();
        const def = PROGRAMS[key];
        set({
          programKey: key,
          asm: assemble(def.source),
          state: createState(def.initialMem),
          running: false,
        });
      },

      stepOnce: () => {
        const { state, asm } = get();
        if (!state || !asm || state.halted) return;
        set({ state: step(state, asm), running: false });
        clearTimer();
      },

      play: () => {
        const { state } = get();
        if (!state || state.halted) return;
        set({ running: true });
        startTimer();
      },

      pause: () => {
        clearTimer();
        set({ running: false });
      },

      reset: () => {
        const { programKey } = get();
        if (programKey) get().load(programKey);
      },

      setSpeed: (hz) => {
        set({ speedHz: hz });
        if (get().running) startTimer();
      },
    };
  }),
);

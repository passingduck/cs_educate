import type { Assembled, SimEvent } from './isa';

export interface MachineState {
  pc: number;
  sp: number;
  regs: number[]; // R0..R7
  flags: { Z: boolean; N: boolean };
  mem: Record<number, number>;
  halted: boolean;
  /** 단조 증가 스텝 카운터 — UI 펄스 트리거 */
  steps: number;
  lastEvent: SimEvent | null;
  lastWrite: { kind: 'reg' | 'mem' | 'sp'; index: number } | null;
}

export function createState(initialMem: Record<number, number>): MachineState {
  return {
    pc: 0,
    sp: 0,
    regs: [0, 0, 0, 0, 0, 0, 0, 0],
    flags: { Z: false, N: false },
    mem: { ...initialMem },
    halted: false,
    steps: 0,
    lastEvent: null,
    lastWrite: null,
  };
}

/** 한 명령어 실행. 순수 함수 — 새 상태를 반환. */
export function step(s: MachineState, asm: Assembled): MachineState {
  if (s.halted || s.pc < 0 || s.pc >= asm.instrs.length) {
    return { ...s, halted: true };
  }
  const instr = asm.instrs[s.pc];
  const next: MachineState = {
    ...s,
    regs: [...s.regs],
    flags: { ...s.flags },
    mem: { ...s.mem },
    pc: s.pc + 1,
    steps: s.steps + 1,
    lastEvent: null,
    lastWrite: null,
  };

  const val = (rm?: number, imm?: number) => (rm !== undefined ? s.regs[rm] : imm ?? 0);

  switch (instr.op) {
    case 'VEC_SP':
      next.sp = instr.value;
      next.lastEvent = { kind: 'vec-sp', value: instr.value };
      next.lastWrite = { kind: 'sp', index: 0 };
      break;
    case 'VEC_PC':
      next.pc = instr.target;
      next.lastEvent = { kind: 'vec-pc', target: instr.target };
      break;
    case 'MOV':
      next.regs[instr.rd] = instr.rs !== undefined ? s.regs[instr.rs] : instr.imm ?? 0;
      next.lastEvent = { kind: 'mov', rd: instr.rd };
      next.lastWrite = { kind: 'reg', index: instr.rd };
      break;
    case 'ADD':
    case 'SUB':
    case 'MUL': {
      const a = s.regs[instr.rn];
      const b = val(instr.rm, instr.imm);
      const r = instr.op === 'ADD' ? a + b : instr.op === 'SUB' ? a - b : a * b;
      next.regs[instr.rd] = r | 0;
      next.lastEvent = { kind: 'alu', op: instr.op, rd: instr.rd };
      next.lastWrite = { kind: 'reg', index: instr.rd };
      break;
    }
    case 'CMP': {
      const diff = s.regs[instr.rn] - val(instr.rm, instr.imm);
      next.flags = { Z: diff === 0, N: diff < 0 };
      next.lastEvent = { kind: 'cmp' };
      break;
    }
    case 'B':
    case 'BEQ':
    case 'BNE': {
      const taken =
        instr.op === 'B' || (instr.op === 'BEQ' ? s.flags.Z : !s.flags.Z);
      if (taken) next.pc = instr.target;
      next.lastEvent = { kind: 'branch', taken, target: instr.target };
      break;
    }
    case 'LDR': {
      const addr = (instr.base !== undefined ? s.regs[instr.base] : 0) + instr.offset;
      next.regs[instr.rt] = s.mem[addr] ?? 0;
      next.lastEvent = { kind: 'ldr', rt: instr.rt, addr };
      next.lastWrite = { kind: 'reg', index: instr.rt };
      break;
    }
    case 'STR': {
      const addr = (instr.base !== undefined ? s.regs[instr.base] : 0) + instr.offset;
      next.mem[addr] = s.regs[instr.rt];
      next.lastEvent = { kind: 'str', rt: instr.rt, addr };
      next.lastWrite = { kind: 'mem', index: addr };
      break;
    }
    case 'NOP':
      next.lastEvent = { kind: 'nop' };
      break;
    case 'HALT':
      next.halted = true;
      next.pc = s.pc;
      next.lastEvent = { kind: 'halt' };
      break;
  }

  return next;
}

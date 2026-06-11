/** Cortex-M0를 단순화한 교육용 ISA. pc/분기 target은 명령어 배열 인덱스 단위. */
export type Instr =
  | { op: 'MOV'; rd: number; imm?: number; rs?: number }
  | { op: 'ADD' | 'SUB' | 'MUL'; rd: number; rn: number; rm?: number; imm?: number }
  | { op: 'CMP'; rn: number; rm?: number; imm?: number }
  | { op: 'B' | 'BEQ' | 'BNE'; target: number }
  | { op: 'LDR' | 'STR'; rt: number; base?: number; offset: number }
  | { op: 'VEC_SP'; value: number } // 벡터 테이블 word 0: 초기 SP
  | { op: 'VEC_PC'; target: number } // 벡터 테이블 word 1: 리셋 핸들러로 점프
  | { op: 'NOP' }
  | { op: 'HALT' };

export type InstrOp = Instr['op'];

/** 어셈블 결과: 명령어 + 소스 줄 매핑 */
export interface Assembled {
  instrs: Instr[];
  lines: string[];
  /** pc(명령어 인덱스) → 소스 줄 번호 */
  pcToLine: number[];
}

/** 실행 시 시각화를 위한 이벤트 */
export type SimEvent =
  | { kind: 'vec-sp'; value: number }
  | { kind: 'vec-pc'; target: number }
  | { kind: 'mov'; rd: number }
  | { kind: 'alu'; op: 'ADD' | 'SUB' | 'MUL'; rd: number }
  | { kind: 'cmp' }
  | { kind: 'branch'; taken: boolean; target: number }
  | { kind: 'ldr'; rt: number; addr: number }
  | { kind: 'str'; rt: number; addr: number }
  | { kind: 'nop' }
  | { kind: 'halt' };

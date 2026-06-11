export type ProgramKey = 'boot' | 'add' | 'mul' | 'pow';

export interface ProgramDef {
  key: ProgramKey;
  title: string;
  source: string;
  /** 시작 시점의 SRAM 내용 (주소 → 값) */
  initialMem: Record<number, number>;
  /** MemoryView에 보여줄 주소 창 [시작, 워드 수] */
  memWindow: [number, number];
}

export const PROGRAMS: Record<ProgramKey, ProgramDef> = {
  boot: {
    key: 'boot',
    title: 'Boot ROM',
    source: `; ===== 벡터 테이블 (Vector Table) =====
.word 0x20001000      ; [0] 초기 SP 값
.word Reset_Handler   ; [1] 리셋 핸들러 주소

Reset_Handler:
; --- 시작 코드 (Startup) ---
MOV R0, #0            ; 초기화 값 0
MOV R1, #16           ; .bss 끝 오프셋
MOV R2, #0            ; i = 0
bss_loop:
CMP R2, R1            ; i == 끝?
BEQ start_main
STR R0, [R2, #0x40]   ; RAM[0x40+i] = 0
ADD R2, R2, #4        ; i += 4
B bss_loop
start_main:
; --- main() 진입 ---
MOV R0, #42           ; 첫 변수
STR R0, [0x40]        ; RAM에 저장
HALT                  ; (실제론 무한루프)`,
    initialMem: { 0x40: 0xff, 0x44: 0xff, 0x48: 0xff, 0x4c: 0xff },
    memWindow: [0x40, 8],
  },

  add: {
    key: 'add',
    title: 'ADD',
    source: `; C 코드:  c = a + b;
LDR R0, [0x00]    ; R0 ← a (SRAM에서 로드)
LDR R1, [0x04]    ; R1 ← b
ADD R2, R0, R1    ; R2 = R0 + R1 (ALU)
STR R2, [0x08]    ; c ← R2 (SRAM에 저장)
HALT`,
    initialMem: { 0x00: 7, 0x04: 5 },
    memWindow: [0x00, 4],
  },

  mul: {
    key: 'mul',
    title: 'MUL',
    source: `; C 코드:  c = a * b;
LDR R0, [0x00]    ; R0 ← a
LDR R1, [0x04]    ; R1 ← b
MUL R2, R0, R1    ; R2 = R0 × R1 (곱셈기)
STR R2, [0x08]    ; c ← R2
HALT`,
    initialMem: { 0x00: 6, 0x04: 7 },
    memWindow: [0x00, 4],
  },

  pow: {
    key: 'pow',
    title: 'POW',
    source: `; C 코드:  r = 1;
;          for (i=0; i<exp; i++)
;              r *= base;
LDR R0, [0x00]    ; R0 ← base (=3)
LDR R1, [0x04]    ; R1 ← exp  (=4)
MOV R2, #1        ; R2 = r = 1
MOV R3, #0        ; R3 = i = 0
loop:
CMP R3, R1        ; i == exp ?
BEQ done          ; 같으면 루프 탈출
MUL R2, R2, R0    ; r *= base
ADD R3, R3, #1    ; i++
B loop            ; 루프 처음으로 점프
done:
STR R2, [0x08]    ; 결과 저장 (3⁴=81)
HALT`,
    initialMem: { 0x00: 3, 0x04: 4 },
    memWindow: [0x00, 4],
  },
};

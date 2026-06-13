export type ProgramKey = 'boot' | 'add' | 'mul' | 'pow';

export interface ProgramDef {
  key: ProgramKey;
  title: string;
  source: string;
  /** 시작 시점의 SRAM 내용 (주소 → 값) */
  initialMem: Record<number, number>;
  /** MemoryView에 보여줄 주소 창 [시작, 워드 수] */
  memWindow: [number, number];
  /** 메모리 칸의 의미 라벨 (초보자용) */
  memLabels: Record<number, string>;
}

export const PROGRAMS: Record<ProgramKey, ProgramDef> = {
  boot: {
    key: 'boot',
    title: '부팅',
    source: `; ★ 전원 버튼을 누르면 생기는 일 ★
; CPU는 무조건 메모리 0번지부터 읽어요.
; 맨 앞 두 칸은 '출발 안내판'입니다:

.word 0x20001000      ; ① 메모장(스택) 꼭대기 위치
.word Reset_Handler   ; ② 진짜 코드의 시작 주소

Reset_Handler:
; --- 준비 운동 (시작 코드) ---
MOV R0, #0            ; '0'을 상자에 준비해서
STR R0, [0x40]        ; 작업 메모리를 깨끗이!
STR R0, [0x44]        ; (이전 쓰레기값 청소)
; --- 이제 프로그램 시작 ---
MOV R0, #42           ; 첫 데이터를 만들어
STR R0, [0x48]        ; 메모리에 저장
HALT                  ; (실제론 main이 계속 돌아요)`,
    initialMem: { 0x40: 255, 0x44: 255, 0x48: 255, 0x4c: 0 },
    memWindow: [0x40, 4],
    memLabels: { 0x40: '쓰레기값→청소', 0x44: '쓰레기값→청소', 0x48: '첫 데이터' },
  },

  add: {
    key: 'add',
    title: '더하기',
    source: `; ★ 과일 가게 계산기 ★
; 사과 700원 + 바나나 500원 = ?
;
; CPU는 메모리 값을 직접 못 더해요.
; ① 상자(레지스터)에 꺼내와서
; ② ALU(계산기)로 계산하고
; ③ 결과를 메모리에 돌려놓습니다.

LDR R0, [0x00]    ; 사과 가격을 R0 상자에
LDR R1, [0x04]    ; 바나나 가격을 R1 상자에
ADD R2, R0, R1    ; ALU가 더해서 R2에
STR R2, [0x08]    ; 합계를 메모리에 저장
HALT              ; 끝!`,
    initialMem: { 0x00: 700, 0x04: 500 },
    memWindow: [0x00, 4],
    memLabels: { 0x00: '사과 가격', 0x04: '바나나 가격', 0x08: '합계' },
  },

  mul: {
    key: 'mul',
    title: '곱하기',
    source: `; ★ 핫도그 4개 사기 ★
; 1개 1500원 × 4개 = ?
; 패턴은 더하기와 똑같아요:
; 꺼내고 → 계산하고 → 저장하기
; (Load → Compute → Store)

LDR R0, [0x00]    ; 핫도그 가격을 R0에
LDR R1, [0x04]    ; 개수를 R1에
MUL R2, R0, R1    ; 곱셈기가 곱해서 R2에
STR R2, [0x08]    ; 총액을 메모리에 저장
HALT`,
    initialMem: { 0x00: 1500, 0x04: 4 },
    memWindow: [0x00, 4],
    memLabels: { 0x00: '가격', 0x04: '개수', 0x08: '총액' },
  },

  pow: {
    key: 'pow',
    title: '반복문',
    source: `; ★ 세균 증식 시뮬레이션 ★
; 세균은 분열할 때마다 2배!
; 5번 분열하면? (2⁵ = 32마리)
;
; CPU엔 '거듭제곱' 명령이 없어요.
; 그래서 곱하기를 5번 "반복"합니다.
; 이것이 모든 for문의 정체!

LDR R0, [0x00]    ; 배수(2)를 R0에
LDR R1, [0x04]    ; 목표 횟수(5)를 R1에
MOV R2, #1        ; 세균 수: 1마리부터
MOV R3, #0        ; 지금까지 분열: 0번
loop:
CMP R3, R1        ; 5번 다 했나? 비교!
BEQ done          ; 다 했으면 탈출
MUL R2, R2, R0    ; 세균 수 × 2
ADD R3, R3, #1    ; 분열 횟수 +1
B loop            ; 다시 위로! (반복)
done:
STR R2, [0x08]    ; 최종 마리 수 저장
HALT`,
    initialMem: { 0x00: 2, 0x04: 5 },
    memWindow: [0x00, 4],
    memLabels: { 0x00: '분열 배수', 0x04: '분열 횟수', 0x08: '최종 마리 수' },
  },
};

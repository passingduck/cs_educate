import type { SimEvent } from './isa';

/** 방금 실행된 동작을 CS 초보자용 한국어 문장으로 */
export function explainEvent(ev: SimEvent | null): string {
  if (!ev) return '';
  switch (ev.kind) {
    case 'vec-sp':
      return '전원 ON! CPU가 메모리 첫 칸을 읽어 "메모장(스택) 꼭대기 위치"를 SP에 적어 두었어요.';
    case 'vec-pc':
      return '두 번째 칸에서 "진짜 코드의 시작 주소"를 읽어 PC를 그곳으로 점프시켰어요. 이제 본격 시작!';
    case 'mov':
      return `R${ev.rd} 상자에 값을 바로 넣었어요. (메모리를 거치지 않는 즉시 값)`;
    case 'alu': {
      const name = ev.op === 'ADD' ? '더해서' : ev.op === 'SUB' ? '빼서' : '곱해서';
      return `ALU(계산기)가 두 상자의 값을 ${name} 결과를 R${ev.rd} 상자에 담았어요.`;
    }
    case 'cmp':
      return 'ALU가 두 값을 비교했어요. "같다/다르다" 결과는 플래그(Z)에 깃발로 꽂아 둡니다.';
    case 'branch':
      return ev.taken
        ? `조건이 맞아서 PC를 ${ev.target + 1}번째 명령으로 점프! 실행 위치가 통째로 바뀌어요.`
        : '조건이 안 맞아서 점프하지 않고, 평소처럼 다음 줄로 내려갑니다.';
    case 'ldr':
      return `메모리 ${hex(ev.addr)} 칸의 값을 꺼내 R${ev.rt} 상자에 담았어요. (Load — 메모리→레지스터)`;
    case 'str':
      return `R${ev.rt} 상자의 값을 메모리 ${hex(ev.addr)} 칸에 저장했어요. (Store — 레지스터→메모리)`;
    case 'nop':
      return '아무것도 안 하고 한 박자 쉬었어요. (NOP)';
    case 'halt':
      return '프로그램 끝! CPU가 멈췄어요. ⟲ 버튼으로 처음부터 다시 볼 수 있어요.';
  }
}

const hex = (n: number) => `0x${n.toString(16).padStart(2, '0').toUpperCase()}`;

export const PHASE_INFO = [
  {
    key: 'fetch',
    label: '① 인출',
    en: 'Fetch',
    desc: '메모리(ROM)에서 명령어 한 줄을 가져와 IR에 담습니다. PC가 "어디서 가져올지"를 가리켜요.',
  },
  {
    key: 'decode',
    label: '② 해석',
    en: 'Decode',
    desc: '제어 장치(CU)가 명령어를 읽고 "아, 더하기구나!" 하고 각 부품에 지시를 내립니다.',
  },
  {
    key: 'execute',
    label: '③ 실행',
    en: 'Execute',
    desc: 'ALU·레지스터·메모리가 실제로 일을 합니다. 끝나면 PC가 다음 줄로 — 그리고 ①부터 반복!',
  },
] as const;

import type { Assembled, Instr } from './isa';

/**
 * 미니 어셈블러. 지원 문법:
 *   레이블:            `name:`
 *   주석               `; ...`
 *   .word 0x...        (벡터 테이블 — 1번째는 SP, 2번째는 레이블로 점프)
 *   MOV Rd, #imm | Rs
 *   ADD/SUB/MUL Rd, Rn, Rm | #imm
 *   CMP Rn, Rm | #imm
 *   B/BEQ/BNE label
 *   LDR/STR Rt, [addr] | [Rb, #off]
 *   NOP / HALT
 */
export function assemble(source: string): Assembled {
  const lines = source.split('\n');

  interface Pending {
    line: number;
    text: string;
  }

  // 1차 패스: 레이블 수집 (레이블 → 명령어 인덱스)
  const labels: Record<string, number> = {};
  const pendings: Pending[] = [];
  for (let i = 0; i < lines.length; i++) {
    let text = lines[i].replace(/;.*$/, '').trim();
    if (!text) continue;
    const labelMatch = text.match(/^([A-Za-z_][\w]*)\s*:/);
    if (labelMatch) {
      labels[labelMatch[1]] = pendings.length;
      text = text.slice(labelMatch[0].length).trim();
      if (!text) continue;
    }
    pendings.push({ line: i, text });
  }

  const parseNum = (s: string): number => {
    const n = s.startsWith('0x') || s.startsWith('0X') ? parseInt(s, 16) : parseInt(s, 10);
    if (Number.isNaN(n)) throw new Error(`숫자 파싱 실패: "${s}"`);
    return n;
  };
  const parseReg = (s: string): number => {
    const m = s.trim().match(/^[Rr](\d+)$/);
    if (!m) throw new Error(`레지스터 파싱 실패: "${s}"`);
    return parseInt(m[1], 10);
  };
  const resolveTarget = (s: string): number => {
    if (s in labels) return labels[s];
    throw new Error(`레이블을 찾을 수 없음: "${s}"`);
  };

  // 2차 패스: 명령어 생성
  const instrs: Instr[] = [];
  const pcToLine: number[] = [];
  let wordIndex = 0;

  for (const p of pendings) {
    const text = p.text;
    let instr: Instr;

    if (text.startsWith('.word')) {
      const arg = text.slice(5).trim();
      instr =
        wordIndex === 0
          ? { op: 'VEC_SP', value: parseNum(arg) }
          : { op: 'VEC_PC', target: resolveTarget(arg) };
      wordIndex++;
    } else {
      const m = text.match(/^(\w+)\s*(.*)$/);
      if (!m) throw new Error(`명령어 파싱 실패: "${text}"`);
      const op = m[1].toUpperCase();
      const rest = m[2].trim();

      if (op === 'NOP') instr = { op: 'NOP' };
      else if (op === 'HALT') instr = { op: 'HALT' };
      else if (op === 'MOV') {
        const [rd, src] = rest.split(',').map((s) => s.trim());
        instr = src.startsWith('#')
          ? { op: 'MOV', rd: parseReg(rd), imm: parseNum(src.slice(1)) }
          : { op: 'MOV', rd: parseReg(rd), rs: parseReg(src) };
      } else if (op === 'ADD' || op === 'SUB' || op === 'MUL') {
        const [rd, rn, last] = rest.split(',').map((s) => s.trim());
        instr = last.startsWith('#')
          ? { op, rd: parseReg(rd), rn: parseReg(rn), imm: parseNum(last.slice(1)) }
          : { op, rd: parseReg(rd), rn: parseReg(rn), rm: parseReg(last) };
      } else if (op === 'CMP') {
        const [rn, last] = rest.split(',').map((s) => s.trim());
        instr = last.startsWith('#')
          ? { op: 'CMP', rn: parseReg(rn), imm: parseNum(last.slice(1)) }
          : { op: 'CMP', rn: parseReg(rn), rm: parseReg(last) };
      } else if (op === 'B' || op === 'BEQ' || op === 'BNE') {
        instr = { op, target: resolveTarget(rest) };
      } else if (op === 'LDR' || op === 'STR') {
        const bm = rest.match(/^[Rr](\d+)\s*,\s*\[(.+)\]$/);
        if (!bm) throw new Error(`메모리 접근 파싱 실패: "${text}"`);
        const rt = parseInt(bm[1], 10);
        const inner = bm[2].split(',').map((s) => s.trim());
        if (inner.length === 1) {
          instr = { op, rt, offset: parseNum(inner[0]) };
        } else {
          const off = inner[1].replace(/^#/, '');
          instr = { op, rt, base: parseReg(inner[0]), offset: parseNum(off) };
        }
      } else {
        throw new Error(`알 수 없는 명령어: "${op}"`);
      }
    }

    instrs.push(instr);
    pcToLine.push(p.line);
  }

  return { instrs, lines, pcToLine };
}

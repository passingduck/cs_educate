/* 시뮬레이션 엔진 검증: POW(3,4)=81, ADD, MUL, 부트 시퀀스 */
import { assemble } from '../src/sim/assemble';
import { createState, step, type MachineState } from '../src/sim/machine';
import { PROGRAMS } from '../src/content/programs';

function run(key: keyof typeof PROGRAMS, maxSteps = 200): MachineState {
  const def = PROGRAMS[key];
  const asm = assemble(def.source);
  let s = createState(def.initialMem);
  let n = 0;
  while (!s.halted && n++ < maxSteps) s = step(s, asm);
  if (!s.halted) throw new Error(`${key}: ${maxSteps}스텝 내에 HALT하지 않음`);
  return s;
}

const assertEq = (label: string, actual: unknown, expected: unknown) => {
  if (actual !== expected) {
    console.error(`FAIL ${label}: expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS ${label} = ${actual}`);
  }
};

const add = run('add');
assertEq('ADD 7+5 → mem[0x08]', add.mem[0x08], 12);

const mul = run('mul');
assertEq('MUL 6×7 → mem[0x08]', mul.mem[0x08], 42);

const pow = run('pow');
assertEq('POW 3^4 → mem[0x08]', pow.mem[0x08], 81);

const boot = run('boot');
assertEq('BOOT SP', boot.sp, 0x20001000);
assertEq('BOOT bss[0x40] (main이 42 저장)', boot.mem[0x40], 42);
assertEq('BOOT bss[0x44] 클리어', boot.mem[0x44], 0);
assertEq('BOOT bss[0x4C] 클리어', boot.mem[0x4c], 0);

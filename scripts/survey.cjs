/* 모든 씬을 순회하며 현재 상태 스크린샷 — 품질 평가용 */
const { chromium } = require('playwright-core');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = process.env.OUT || '/tmp/survey';
require('fs').mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));

  async function findClick(match, region = [250, 1250, 150, 800]) {
    const [x0, x1, y0, y1] = region;
    for (let y = y0; y <= y1; y += 38) {
      for (let x = x0; x <= x1; x += 46) {
        await p.mouse.move(x, y);
        await sleep(85);
        const t = p.locator('.tooltip');
        if ((await t.count()) > 0 && (await t.innerText()).includes(match)) {
          await p.mouse.click(x, y);
          await sleep(1500);
          return true;
        }
      }
    }
    return false;
  }
  const crumbClick = async (label) => {
    await p.locator('.breadcrumb button', { hasText: label }).first().click();
    await sleep(1500);
  };
  const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` });

  await p.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await sleep(4500);
  await shot('00-computer');

  await p.mouse.click(700, 460); await sleep(1700); await shot('01-motherboard');

  // DRAM 가지
  await findClick('DRAM 모듈', [900, 1350, 200, 650]); await shot('02-dram-module');
  await findClick('셀 어레이', [300, 1200, 200, 700]); await p.mouse.click(700, 430); await sleep(900); await shot('03-dram-array');
  await findClick('1T1C', [300, 1250, 150, 750]); await sleep(2000); await shot('04-dram-cell');

  // CPU 가지
  await crumbClick('메인보드');
  await findClick('CPU 다이', [350, 1100, 250, 700]); await shot('10-cpu-die');
  // 시나리오
  await p.locator('.scenario-buttons button', { hasText: '주방' }).click(); await sleep(1700); await shot('11-kitchen');
  await crumbClick('CPU 다이');
  await p.locator('.scenario-buttons button', { hasText: '컴파일러' }).click(); await sleep(1700); await shot('12-compiler');
  await crumbClick('CPU 다이');
  await findClick('레지스터 파일', [400, 1200, 250, 750]); await shot('13-regfile');
  await findClick('MUX 내부', [300, 1300, 150, 800]); await shot('14-mux');
  await crumbClick('레지스터 파일');
  await findClick('플립플롭', [300, 1100, 150, 800]); await shot('15-flipflop');
  await crumbClick('CPU 다이');
  await findClick('ALU', [600, 1300, 250, 750]); await shot('20-alu');
  await findClick('가산기', [250, 1300, 250, 750]); await shot('21-adder');
  await findClick('CMOS', [250, 1300, 150, 800]); await shot('22-cmos');
  await findClick('MOSFET', [250, 1300, 150, 800]); await sleep(1500); await shot('23-mosfet');
  await crumbClick('ALU');
  await findClick('곱셈기', [250, 1300, 200, 800]); await shot('24-mul');
  await crumbClick('ALU');
  await findClick('시프터', [250, 1300, 200, 800]); await shot('25-shift');
  // 부팅
  await crumbClick('CPU 다이');
  await findClick('전원 버튼', [300, 1150, 200, 750]); await sleep(800); await shot('30-boot');
  // SRAM 연산
  await crumbClick('CPU 다이');
  await findClick('CPU가 일하는', [400, 1200, 250, 750]); await shot('31-sram-demo');
  await findClick('SR 래치', [300, 1100, 150, 800]); await shot('32-latch');

  console.log('ERRORS:', errs.length ? errs : '(none)');
  await b.close();
})();

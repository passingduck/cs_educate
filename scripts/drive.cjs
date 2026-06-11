/* 브라우저로 앱을 실제 구동하며 검증 */
const { chromium } = require('playwright-core');

const URL = 'http://localhost:5199/';
const SHOT = (n) => `/tmp/csedu-${n}.png`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));

  const crumb = async () => (await page.locator('.breadcrumb').innerText()).replace(/\n/g, ' > ');

  // 툴팁 텍스트가 매칭될 때까지 캔버스 격자 스캔 후 클릭
  async function findAndClick(match, region) {
    const [x0, x1, y0, y1] = region;
    for (let y = y0; y <= y1; y += 40) {
      for (let x = x0; x <= x1; x += 50) {
        await page.mouse.move(x, y);
        await sleep(120);
        const tip = page.locator('.tooltip');
        if ((await tip.count()) > 0) {
          const t = await tip.innerText();
          if (t.includes(match)) {
            await page.mouse.click(x, y);
            return { x, y, tip: t.split('\n')[0] };
          }
        }
      }
    }
    return null;
  }

  console.log('1. 페이지 로드...');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await sleep(3500);
  console.log('   breadcrumb:', await crumb());
  console.log('   hint visible:', await page.locator('.visit-hint').isVisible());
  console.log('   info title:', await page.locator('.info-header h2').innerText());
  await page.screenshot({ path: SHOT('1-level0') });

  console.log('2. 컴퓨터 클릭 → 메인보드...');
  const hit0 = await findAndClick('메인보드', [600, 1000, 350, 600]);
  console.log('   clicked at:', JSON.stringify(hit0));
  await sleep(1400);
  console.log('   breadcrumb:', await crumb());
  await page.screenshot({ path: SHOT('2-motherboard') });

  console.log('3. CPU 클릭...');
  const hitCpu = await findAndClick('CPU', [350, 1100, 250, 700]);
  console.log('   clicked at:', JSON.stringify(hitCpu));
  await sleep(1400);
  console.log('   breadcrumb:', await crumb());
  await page.screenshot({ path: SHOT('3-cpudie') });

  console.log('4. ROM 클릭 → 부팅 시뮬레이션...');
  const hitRom = await findAndClick('부팅', [300, 1150, 200, 750]);
  console.log('   clicked at:', JSON.stringify(hitRom));
  await sleep(1400);
  console.log('   breadcrumb:', await crumb());
  console.log('   sim panel visible:', await page.locator('.sim-panel').isVisible());

  // 스텝 실행 3회 → PC/레지스터 변화 확인
  const pcVal = async () => await page.locator('.reg-cell.pc .value').innerText();
  const curLine = async () => {
    const el = page.locator('.code-line.current .gutter');
    return (await el.count()) ? await el.innerText() : '-';
  };
  console.log('   PC before:', await pcVal(), 'line:', await curLine());
  const stepBtn = page.locator('.sim-controls button').nth(1);
  for (let i = 0; i < 4; i++) {
    await stepBtn.click();
    await sleep(250);
  }
  console.log('   PC after 4 steps:', await pcVal(), 'line:', await curLine());
  console.log('   SP:', await page.locator('.register-grid .reg-cell').nth(1).innerText());
  await page.screenshot({ path: SHOT('4-bootsim') });

  console.log('5. 자동 실행(▶) 2초...');
  await page.locator('.sim-controls button').nth(0).click();
  await sleep(2500);
  console.log('   status:', await page.locator('.sim-status').innerText());
  await page.screenshot({ path: SHOT('5-bootrun') });

  console.log('6. 브레드크럼으로 컴퓨터 복귀...');
  await page.locator('.breadcrumb button').first().click();
  await sleep(1400);
  console.log('   breadcrumb:', await crumb());
  await page.screenshot({ path: SHOT('6-back') });

  console.log('\nCONSOLE ERRORS:', errors.length ? errors : '(none)');
  await browser.close();
})().catch((e) => {
  console.error('DRIVER FAILED:', e);
  process.exit(1);
});

const { chromium } = require('playwright-core');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOT = (n) => `/tmp/csedu-${n}.png`;

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text().slice(0, 250));
  });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 250)));

  const crumb = async () => (await page.locator('.breadcrumb').innerText()).replace(/\n▸\n/g, ' > ');

  async function findAndClick(match, region = [250, 1150, 150, 800]) {
    const [x0, x1, y0, y1] = region;
    for (let y = y0; y <= y1; y += 40) {
      for (let x = x0; x <= x1; x += 50) {
        await page.mouse.move(x, y);
        await sleep(110);
        const tip = page.locator('.tooltip');
        if ((await tip.count()) > 0 && (await tip.innerText()).includes(match)) {
          await page.mouse.click(x, y);
          await sleep(1400);
          return true;
        }
      }
    }
    return false;
  }
  const crumbClick = async (label) => {
    await page.locator('.breadcrumb button', { hasText: label }).first().click();
    await sleep(1400);
  };

  await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await sleep(3000);

  console.log('--- DRAM 브랜치 ---');
  console.log('메인보드:', await findAndClick('메인보드', [500, 1000, 300, 650]));
  console.log('DRAM 모듈:', await findAndClick('DRAM 모듈', [900, 1300, 200, 650]));
  console.log('  crumb:', await crumb());
  await page.screenshot({ path: SHOT('7-dram-module') });
  console.log('셀 어레이:', await findAndClick('셀 어레이', [300, 1200, 200, 700]));
  console.log('  crumb:', await crumb());
  // 워드라인 클릭 (행 활성화) — 어레이 중앙 부근
  await page.mouse.click(700, 420);
  await sleep(900);
  await page.screenshot({ path: SHOT('8-dram-array') });
  console.log('셀 줌인:', await findAndClick('1T1C', [300, 1250, 150, 750]));
  console.log('  crumb:', await crumb());
  await sleep(2500);
  await page.screenshot({ path: SHOT('9-dram-cell') });

  console.log('--- ALU 브랜치 ---');
  await crumbClick('메인보드');
  console.log('CPU:', await findAndClick('CPU 다이', [350, 1100, 250, 700]));
  console.log('ALU:', await findAndClick('ALU', [600, 1300, 250, 750]));
  console.log('  crumb:', await crumb());
  await page.screenshot({ path: SHOT('10-alu') });
  console.log('가산기:', await findAndClick('가산기', [250, 1300, 250, 750]));
  console.log('  crumb:', await crumb());
  await page.screenshot({ path: SHOT('11-adder') });
  console.log('CMOS:', await findAndClick('CMOS', [250, 1300, 150, 800]));
  console.log('  crumb:', await crumb());
  await page.screenshot({ path: SHOT('12-cmos') });
  console.log('MOSFET:', await findAndClick('MOSFET', [250, 1300, 150, 800]));
  console.log('  crumb:', await crumb());
  await sleep(1500);
  await page.screenshot({ path: SHOT('13-mosfet') });

  console.log('--- POW 데모 ---');
  await crumbClick('CPU 다이');
  console.log('레지데모:', await findAndClick('레지스터와 SRAM', [400, 1200, 250, 750]));
  await page.locator('.program-tabs button', { hasText: 'POW' }).click();
  await sleep(400);
  // 최고 속도로 자동 실행
  await page.locator('.speed-control input').fill('8');
  await page.locator('.sim-controls button').first().click();
  await sleep(5000);
  const status = await page.locator('.sim-status').innerText();
  const mem08 = await page.locator('.mem-cell').nth(2).innerText();
  console.log('  status:', status.trim());
  console.log('  mem[0x08]:', mem08.replace('\n', ' '));
  await page.screenshot({ path: SHOT('14-pow') });

  console.log('\nCONSOLE ERRORS:', errors.length ? errors : '(none)');
  await browser.close();
})().catch((e) => {
  console.error('DRIVER FAILED:', String(e).slice(0, 500));
  process.exit(1);
});

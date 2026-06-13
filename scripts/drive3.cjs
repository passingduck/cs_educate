/* 래치/플립플롭 신규 깊이 검증 */
const { chromium } = require('playwright-core');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 250)));

  const crumb = async () => (await page.locator('.breadcrumb').innerText()).replace(/\n▸\n/g, ' > ');
  async function findAndClick(match, region = [250, 1250, 150, 800]) {
    const [x0, x1, y0, y1] = region;
    for (let y = y0; y <= y1; y += 38) {
      for (let x = x0; x <= x1; x += 48) {
        await page.mouse.move(x, y);
        await sleep(105);
        const tip = page.locator('.tooltip');
        if ((await tip.count()) > 0 && (await tip.innerText()).includes(match)) {
          const t = await tip.innerText();
          await page.mouse.click(x, y);
          await sleep(1400);
          return { x, y, tip: t.split('\n')[0] };
        }
      }
    }
    return null;
  }
  const crumbClick = async (label) => {
    await page.locator('.breadcrumb button', { hasText: label }).first().click();
    await sleep(1400);
  };

  await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await sleep(3000);
  await page.mouse.click(700, 450); // → 메인보드
  await sleep(1500);
  console.log('CPU:', JSON.stringify(await findAndClick('CPU 다이', [350, 1100, 250, 700])));

  console.log('--- SR 래치 ---');
  console.log('래치 마커:', JSON.stringify(await findAndClick('SR 래치')));
  console.log('  crumb:', await crumb());
  await page.screenshot({ path: '/tmp/v5-latch.png' });
  // S 토글 → Q=1 확인 (램프는 시각 확인, 라벨 텍스트로 검증)
  const latchClicked = await findAndClick('CMOS', [250, 1300, 150, 800]);
  console.log('래치 게이트→CMOS:', JSON.stringify(latchClicked));
  console.log('  crumb:', await crumb());
  console.log('MOSFET:', JSON.stringify(await findAndClick('MOSFET', [250, 1300, 150, 800])));
  console.log('  crumb:', await crumb());

  console.log('--- D 플립플롭 ---');
  await crumbClick('CPU 다이');
  console.log('FF 마커:', JSON.stringify(await findAndClick('플립플롭')));
  console.log('  crumb:', await crumb());
  await sleep(500);
  await page.screenshot({ path: '/tmp/v5-ff-clk0.png' });
  console.log('FF 게이트→CMOS:', JSON.stringify(await findAndClick('CMOS', [250, 1350, 150, 850])));
  console.log('  crumb:', await crumb());

  console.log('\nERRORS:', errors.length ? errors : '(none)');
  await browser.close();
})().catch((e) => {
  console.error('DRIVER FAILED:', String(e).slice(0, 400));
  process.exit(1);
});

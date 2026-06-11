/* 개선된 씬들 스크린샷 */
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

  async function findAndClick(match, region = [250, 1200, 150, 800]) {
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

  console.log('메인보드:', await findAndClick('메인보드', [500, 1000, 300, 650]));
  await page.screenshot({ path: '/tmp/v2-motherboard.png' });
  console.log('DRAM:', await findAndClick('DRAM 모듈', [900, 1350, 200, 650]));
  await page.screenshot({ path: '/tmp/v2-dram-module.png' });
  console.log('어레이:', await findAndClick('셀 어레이', [300, 1200, 200, 700]));
  await page.mouse.click(700, 430);
  await sleep(1000);
  await page.screenshot({ path: '/tmp/v2-dram-array.png' });
  await crumbClick('메인보드');
  console.log('CPU:', await findAndClick('CPU 다이', [350, 1100, 250, 700]));
  await page.screenshot({ path: '/tmp/v2-cpudie.png' });
  console.log('ALU:', await findAndClick('ALU', [600, 1300, 250, 750]));
  await page.screenshot({ path: '/tmp/v2-alu.png' });
  console.log('가산기:', await findAndClick('가산기', [250, 1300, 250, 750]));
  await page.screenshot({ path: '/tmp/v2-adder.png' });
  console.log('CMOS:', await findAndClick('CMOS', [250, 1300, 150, 800]));
  await page.screenshot({ path: '/tmp/v2-cmos.png' });
  console.log('ERRORS:', errors.length ? errors : '(none)');
  await browser.close();
})();

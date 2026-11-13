import { launchBrowser } from './cdp.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await launchBrowser();
const { send, evaluate, until, click, fill, pause } = browser;
const output = '.impeccable/review';
const route = async action => { await click(`[data-action="${action}"]`); await pause(120); };
async function capture(name, width = 390, height = 844, full = false) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await evaluate('window.scrollTo(0, 0)');
  await pause(150);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `Overflow: ${name}`);
  const metrics = await send('Page.getLayoutMetrics');
  const shot = await send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: full,
    ...(full ? { clip: { x: 0, y: 0, width, height: metrics.cssContentSize.height, scale: 1 } } : {})
  });
  await writeFile(`${output}/${name}.png`, Buffer.from(shot.data, 'base64'));
}
// WCAG contrast for the actual rendered theme tokens, including colored panels.
function contrast(a, b) {
  const luminance = rgb => rgb.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i], 0);
  const [x,y] = [luminance(a),luminance(b)].sort((a,b)=>b-a);
  return (x + .05) / (y + .05);
}
await mkdir(output, { recursive: true });
try {
  await send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
  await until(`!!document.querySelector('#profile-form')`);
  await capture('onboarding-mobile',390,844,true);
  await fill('[name=name]', 'Alex');
  await click('#profile-form [type=submit]');
  await until(`!!document.querySelector('#books')`);
  await capture('library-mobile-full',390,844,true);
  await click('.filter-panel summary');
  await capture('filters-mobile',390,844,true);
  await click('.filter-panel summary');
  for (const theme of ['adults','kids','teens']) {
    await evaluate(`document.body.dataset.theme = ${JSON.stringify(theme)}`);
    const pairs = await evaluate(`(() => {
      const rgb = value => value.match(/[\\d.]+/g).slice(0,3).map(Number);
      const pairs = [];
      for (const selector of ['body','section.intro','section.intro h1','section.intro .muted','section.intro .greeting','.nav-links .active','.book-count']) {
        const el = document.querySelector(selector);
        const style = getComputedStyle(el);
        let parent = el;
        let bg = style.backgroundColor;
        while (bg === 'rgba(0, 0, 0, 0)' && parent.parentElement) { parent=parent.parentElement; bg=getComputedStyle(parent).backgroundColor; }
        if (bg === 'rgba(0, 0, 0, 0)') bg=getComputedStyle(document.documentElement).backgroundColor;
        // Body's palette is painted by the root canvas; use its current theme token.
        if (selector === 'body') { const probe=document.createElement('span'); probe.style.color=style.getPropertyValue('--paper'); document.body.append(probe); bg=getComputedStyle(probe).color; probe.remove(); }
        pairs.push({selector,fg:rgb(style.color),bg:rgb(bg)});
      }
      return pairs;
    })()`);
    for (const pair of pairs) assert.ok(contrast(pair.fg,pair.bg) >= 4.5, `${theme} ${pair.selector}: ${contrast(pair.fg,pair.bg).toFixed(2)}`);
    await capture(`theme-${theme}`,390,844);
  }
  await evaluate(`document.body.dataset.theme='adults'`);
  await route('profile'); await capture('profile-mobile');
  await route('settings'); await capture('settings-mobile',390,844,true);
  await fill('#language','pt-BR'); await pause(120); await route('library'); await capture('library-portuguese',320,844,true);
  await route('profile'); await route('settings'); await fill('#language','en'); await pause(120);
  await route('library'); await click('[data-action=details][data-id=sample-red-bag]'); await pause(120); await capture('details-mobile',390,844,true);
  await route('start'); await route('toggle-nav'); await capture('reader-expanded-mobile',390,844,true);
  await click('[data-action=page][data-index="3"]'); await pause(150); await route('toggle-nav');
  await capture('activity-mobile',390,844,true);
  await click('input[data-answer=bag-color][value=Red]'); await pause(150); await route('check'); await capture('feedback-mobile',390,844,true);
  await route('profile'); await route('collections'); await capture('collections-empty',390,844,true);
  console.log('Design checks passed: three theme contrast palettes, phone layouts, Portuguese at 320px, onboarding, details, filters, profile, settings, activities, feedback, expanded reader, empty collections.');
} finally { await browser.close(); }

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const out = new URL('../experiments/v8.29/browser/', import.meta.url); mkdirSync(out, { recursive: true });
const log = [];
process.on('exit', () => writeFileSync(new URL('play.json', out), JSON.stringify(log, null, 2)));
function command(...args) { const result = spawnSync('npx', ['--yes', 'agent-browser', '--session', 'elevator-v829', ...args], { encoding: 'utf8' }); if (result.status !== 0) throw Error(result.stderr || result.stdout); return result.stdout.trim(); }
function evaluate(js) { let value = JSON.parse(command('eval', js)); if (typeof value === 'string') { try { return JSON.parse(value); } catch {} } return value; }
const snapshot = () => command('snapshot', '-i');
const read = () => evaluate(`JSON.stringify({floor:Number(document.querySelector('.floor-indicator b')?.textContent),text:document.body.innerText,seats:[...document.querySelectorAll('.standing-slot')].map(e=>({text:e.innerText,label:e.getAttribute('aria-label'),occupied:e.classList.contains('occupied')})),offers:[...document.querySelectorAll('.passenger-card')].map((e,i)=>({i,name:e.querySelector('.card-head strong')?.textContent,text:e.innerText,disabled:e.disabled,boarded:e.classList.contains('boarded')}))})`);
command('set', 'viewport', '1440', '900'); command('open', 'http://localhost:5183/?lang=zh&tutorial=1');
evaluate(`localStorage.setItem('elevator-tales-fast-reveal-v1','off')`); command('reload'); snapshot();
command('find', 'role', 'button', 'click', '--name', '开始临时夜班'); snapshot();
for (let i = 0; i < 3; i++) {
  evaluate(`document.querySelectorAll('.passenger-card')[${i}].click()`); snapshot();
  evaluate(`document.querySelectorAll('.standing-slot')[${i}].click()`); snapshot();
}
assert.deepEqual(evaluate(`JSON.stringify([...document.querySelectorAll('.seat-fare')].map(e=>e.textContent))`), ['15', '15', '6']);
command('screenshot', fileURLToPath(new URL('desktop-pair.png', out)));
assert.equal(evaluate(`document.querySelector('.reveal-toggle').getAttribute('aria-pressed')==='true'`), false);
evaluate(`document.querySelector('.depart-button').click()`);
command('wait', '--fn', `Number(document.querySelector('.floor-indicator b')?.textContent)===2 && !document.querySelector('.depart-button').disabled`); snapshot();
assert.equal(read().floor, 2); assert.ok(!read().text.includes('本班发现'));
evaluate(`document.querySelector('.reveal-toggle').click()`); snapshot();
assert.equal(evaluate(`document.querySelector('.reveal-toggle').getAttribute('aria-pressed')==='true'`), true);
for (let step = 0; step < 38; step++) {
  snapshot(); let s = read();
  if (s.text.includes('本班失败')) { log.push({ event: 'failure', ...s }); break; }
  if (s.text.includes('已补 5 电 · 继续充电')) {
    log.push({ event: 'shop', ...s }); command('screenshot', fileURLToPath(new URL(`shop-${s.floor}.png`, out)));
    evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.includes('补至 50 电')&&!e.disabled);b?.click()})()`); snapshot();
    evaluate(`(()=>{const b=[...document.querySelectorAll('.upgrade-grid button')].find(e=>e.textContent.includes('压力回收')&&!e.disabled);b?.click()})()`); snapshot();
    evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>['继续上行','确认冒险离开','无力修复 · 结束本班'].includes(e.textContent.trim()));b?.click()})()`); continue;
  }
  if (s.floor >= 21) break;
  let count = s.seats.filter(x => x.occupied).length;
  const wanted = s.offers.filter(o => !o.disabled && !o.boarded).map(o => ({ ...o, score: ({游客:9,快递员:8,维修工:7,教练:8,恋人:6,通勤者:3,护士:4})[o.name] ?? 0 })).sort((a,b)=>b.score-a.score);
  for (const o of wanted) {
    if (count >= 3 || o.score <= 0 && count > 0) break;
    s = read(); const empty = s.seats.findIndex(x => !x.occupied); if (empty < 0) break;
    evaluate(`document.querySelectorAll('.passenger-card')[${o.i}].click()`); snapshot();
    evaluate(`document.querySelectorAll('.standing-slot')[${empty}].click()`); snapshot(); count++;
  }
  s = read(); log.push({ event: 'depart', ...s }); console.log('UI floor', s.floor);
  evaluate(`document.querySelector('.depart-button').click()`);
  command('wait', '--fn', `Number(document.querySelector('.floor-indicator b')?.textContent)>${s.floor} && document.querySelector('.elevator-stage')?.classList.contains('doors-open')`);
}
snapshot(); log.push({ event: 'final', ...read() });
command('set', 'viewport', '390', '844'); snapshot();
command('screenshot', fileURLToPath(new URL('mobile.png', out)));
const bounds = evaluate(`JSON.stringify({width:innerWidth,documentWidth:document.documentElement.scrollWidth,cards:[...document.querySelectorAll('.passenger-card')].map(e=>({height:e.clientHeight,contentHeight:e.scrollHeight,overflow:getComputedStyle(e).overflowY})),quick:document.querySelector('.reveal-toggle').getBoundingClientRect().toJSON()})`);
assert.ok(bounds.documentWidth <= bounds.width); log.push({ event: 'mobile-layout', bounds });
command('set', 'media', 'dark', 'reduced-motion'); snapshot();
evaluate(`document.querySelector('.reveal-toggle').click()`); snapshot();
assert.equal(evaluate(`document.querySelector('.reveal-toggle').getAttribute('aria-pressed')==='true'`), false);
assert.equal(evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`), true);
assert.equal(evaluate(`getComputedStyle(document.querySelector('.passenger-item')).animationName`), 'none');
command('set', 'viewport', '1440', '900');
evaluate(`document.querySelector('.language-button').click()`); snapshot();
const english = read(); assert.ok(!/[\u3400-\u9fff]/u.test(english.text.replaceAll('中文', ''))); log.push({ event: 'english', ...english });
command('screenshot', fileURLToPath(new URL('english.png', out)));
log.push({ event: 'page-errors', errors: command('errors') });
writeFileSync(new URL('play.json', out), JSON.stringify(log, null, 2));
console.log('UI COMPLETE', read().floor, JSON.stringify(bounds));

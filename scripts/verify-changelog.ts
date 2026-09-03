import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHANGELOG, GAME_VERSION } from '../lib/changelog';

const component=readFileSync(new URL('../components/elevator-game.tsx',import.meta.url),'utf8');
const markdown=readFileSync(new URL('../CHANGELOG.md',import.meta.url),'utf8');
assert.equal(CHANGELOG[0]?.version,GAME_VERSION,'newest changelog entry must match the game version');
assert.match(markdown,new RegExp(`## v${GAME_VERSION.replaceAll('.','\\.')}\\b`),'repository changelog must contain the current version');
assert.ok(component.includes('GAME_VERSION')&&component.includes('CHANGELOG'),'the game must render the shared version and changelog data');
for(const entry of CHANGELOG){
  assert.ok(entry.title&&entry.summary&&entry.date,'every release needs identity and summary');
  assert.ok(entry.changes.length&&entry.experiments.length&&entry.watch.length,'every release needs changes, experiments, and watch items');
}
console.log(JSON.stringify({version:`v${GAME_VERSION}`,entries:CHANGELOG.length,releaseInvariant:true}));

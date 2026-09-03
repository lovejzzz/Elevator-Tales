import { execFileSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
// Historical regression suite stays pinned to its historical rules. Active
// v6.5 rules are checked independently by verify-three-values.ts.
const root=resolve(import.meta.dirname,'..'),dir=mkdtempSync(join(tmpdir(),'elevator-v64-regression-'));
const source=execFileSync('git',['archive','798acef7f5edeeba1075ed6c3f2fbf64fa804a04','lib','scripts','experiments','components/elevator-game.tsx','app/globals.css'],{cwd:root,maxBuffer:30*1024*1024});
execFileSync('tar',['-x','-C',dir],{input:source});symlinkSync(join(root,'node_modules'),join(dir,'node_modules'),'dir');symlinkSync(join(root,'public'),join(dir,'public'),'dir');writeFileSync(join(dir,'package.json'),'{"type":"module"}');
for(const name of ['mechanics','v6','v61','v62','v63','v64'])execFileSync(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),join(dir,'scripts/verify-'+name+'.ts')],{cwd:dir,stdio:'inherit'});

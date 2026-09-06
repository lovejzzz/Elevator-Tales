import assert from 'node:assert/strict';
import type {PolicyName} from './types.mts';

export function guidedOpening(opening:string,policy:PolicyName):boolean {
 assert(['policy-default','ordinary','guided'].includes(opening),'Unknown opening');
 return opening==='guided'||(opening==='policy-default'&&policy==='novice');
}

// Post-hoc case selection must not let the first persona monopolize the queue.
export function diverseQueue<T extends {caseId:string;trigger:string}>(packets:T[],limit=30):T[]{
 const buckets=new Map<string,T[]>();
 for(const p of packets){const key=p.caseId.split('-')[0]+'/'+p.trigger;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key)!.push(p);}
 const result:T[]=[];
 while(result.length<limit){let added=false;for(const list of buckets.values())if(list.length&&result.length<limit){result.push(list.shift()!);added=true;}if(!added)break;}
 return result;
}

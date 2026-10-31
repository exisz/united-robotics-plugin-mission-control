import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {handle} from '../src/rpc.mjs';
test('bounded pagination, missing source, invalid requests and architecture',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mission-'));try{
 await assert.rejects(handle('mission.runs',{},dir));
 const rows=Array.from({length:205},(_,i)=>({run_id:String(i),self_summary:'真实总结'}));
 await writeFile(join(dir,'snapshot.json'),JSON.stringify({schemaVersion:1,generatedAt:'2026-11-01T00:00:00Z',rows,architecture:{id:'root'},state:{pending:null}}));
 const first=await handle('mission.runs',{},dir),next=await handle('mission.runs',{page:1},dir),last=await handle('mission.runs',{page:2},dir);
 assert.equal(first.rows.length,100);assert.equal(first.total,205);assert.equal(next.rows[0].run_id,'100');assert.equal(last.rows.length,5);
 for(const params of [{page:-1},{page:1.5},{pageSize:101},{path:'/etc/passwd'}])await assert.rejects(handle('mission.runs',params,dir));
 assert.equal((await handle('mission.architecture',{},dir)).tree.id,'root');await assert.rejects(handle('write',{},dir));
 assert.equal(JSON.parse(await (await import('node:fs/promises')).readFile(join(dir,'snapshot.json'),'utf8')).rows.length,205);
 }finally{await rm(dir,{recursive:true,force:true})}
});

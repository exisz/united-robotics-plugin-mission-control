import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
export async function handle(method, params={}, dir=process.env.WORLD_PLUGIN_STATE_DIR) {
  if (!['mission.runs','mission.architecture'].includes(method)) throw Error('Unknown method');
  if (!params || typeof params!=='object' || Array.isArray(params)) throw Error('Invalid parameters');
  const keys=method==='mission.runs'?['page','pageSize']:[];
  if(Object.keys(params).some(k=>!keys.includes(k))) throw Error('Unknown parameter');
  const page=params.page??0, pageSize=params.pageSize??100;
  if(!Number.isSafeInteger(page)||page<0||page>100000||!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw Error('Invalid page');
  if(!dir) throw Error('Missing plugin state directory');
  const file=join(dir,'snapshot.json');
  if((await stat(file)).size>64*1024*1024) throw Error('Snapshot exceeds limit');
  const data=JSON.parse(await readFile(file,'utf8'));
  if(data.schemaVersion!==1||!Array.isArray(data.rows)||!data.architecture||!data.generatedAt) throw Error('Invalid snapshot');
  const common={generatedAt:data.generatedAt,malformedLines:data.malformedLines??0};
  if(method==='mission.architecture')return {...common,tree:data.architecture,state:data.state};
  return {...common,page,pageSize,total:data.rows.length,rows:data.rows.slice(page*pageSize,(page+1)*pageSize)};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  let input='';
  try {
    for await(const part of process.stdin){input+=part;if(input.length>16384)throw Error('Request exceeds limit');}
    const q=JSON.parse(input);if(q.version!==1)throw Error('Invalid protocol');
    const result=await handle(q.method,q.params);
    process.stdout.write(JSON.stringify({version:1,ok:true,result}));
  }catch(e){process.stdout.write(JSON.stringify({version:1,ok:false,error:{code:'mission_read_failed',message:e.code==='ENOENT'?'No scheduler snapshot yet': e.code?'Scheduler snapshot unavailable':e.message}}));process.exitCode=1;}
}

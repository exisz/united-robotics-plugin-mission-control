import React,{useState,useEffect,useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {AgGridReact} from 'ag-grid-react';
import {ModuleRegistry,AllCommunityModule,themeQuartz,colorSchemeDark} from 'ag-grid-community';
import css from './plugin.css';
ModuleRegistry.registerModules([AllCommunityModule]);
export const windows=[{id:'runs',title:'Mission Control · Runs'},{id:'architecture',title:'Mission Control · Architecture'}];
const theme=themeQuartz.withPart(colorSchemeDark).withParams({fontFamily:'system-ui',fontSize:12,rowHeight:32,headerHeight:34,backgroundColor:'#111923',foregroundColor:'#dbe5ee',borderColor:'#293846',accentColor:'#6bd8c5'});
function time(v){return v?new Date(v).toLocaleString('zh-CN',{timeZone:'Australia/Sydney',hour12:false}):'—'}
function Tree({node}){return <li><strong>{node.label}</strong>{node.detail&&<p>{node.detail}</p>}{node.children&&<ul>{node.children.map(n=><Tree key={n.id} node={n}/>)}</ul>}</li>}
function App({context,entry,styleContainer}){
 const [page,setPage]=useState(0),[tick,setTick]=useState(0),[data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[selected,setSelected]=useState(null),[query,setQuery]=useState('');
 useEffect(()=>{let live=true;setLoading(true);setError('');setSelected(null);context.invoke(entry==='runs'?'mission.runs':'mission.architecture',entry==='runs'?{page,pageSize:100}:{}).then(d=>{if(live){if(!d?.generatedAt)throw Error('Invalid response');setData(d);}}).catch(e=>{if(live){setError(e.message||'Read failed');setData(null);}}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[page,tick,entry]);
 const cols=useMemo(()=>[{field:'started_at',headerName:'时间 · Sydney',width:164,valueFormatter:p=>time(p.value)},{field:'role',headerName:'角色',width:115},{field:'outcome',headerName:'结果',width:100,cellClass:p=>'mc-status-'+p.value},{field:'self_summary',headerName:'自我总结 · ≤100字符',flex:1,minWidth:260,valueFormatter:p=>p.value||'— 无自我总结',tooltipField:'self_summary'},{field:'run_id',headerName:'Run',width:90,valueFormatter:p=>p.value?.slice(0,8)}],[]);
 const stale=data && Date.now()-Date.parse(data.generatedAt)>2*3600000;
 return <section className="mc"><header><div><span className="mc-kicker">LOREMASTER / MISSION CONTROL</span><h2>{entry==='runs'?'调度运行记录':'管线架构'}</h2></div><button disabled={loading} onClick={()=>setTick(t=>t+1)}>刷新</button></header>
 <div className="mc-meta">{loading?'正在读取…':data?`更新 ${time(data.generatedAt)}${stale?' · 数据已超过2小时':''}`:'数据不可用'}{data?.malformedLines>0&&` · ${data.malformedLines} 条无效日志`}</div>
 {error&&<div role="alert" className="mc-error">{error}</div>}
 {entry==='runs'&&<><div className="mc-tools"><input aria-label="筛选本页" placeholder="筛选本页…" value={query} onChange={e=>setQuery(e.target.value)}/><span>{data?`${data.total} 轮 · 每页100轮 · 最新优先`:''}</span></div><div className="mc-grid"><AgGridReact themeStyleContainer={styleContainer} theme={theme} columnDefs={cols} rowData={data?.rows??[]} defaultColDef={{sortable:true,resizable:true}} getRowId={p=>p.data.run_id} quickFilterText={query} onRowClicked={e=>setSelected(e.data)} overlayNoRowsTemplate="暂无运行记录"/></div><footer><button disabled={loading||page===0} onClick={()=>setPage(p=>p-1)}>← 更新</button><span>第 {page+1} / {Math.max(1,Math.ceil((data?.total??0)/100))} 页</span><button disabled={loading||!data||(page+1)*100>=data.total} onClick={()=>setPage(p=>p+1)}>更早 →</button></footer>{selected&&<details open className="mc-detail"><summary>{selected.run_id} · {selected.outcome}</summary><p>{selected.self_summary||'旧记录未提供自我总结。'}</p><pre>{selected.evidence||selected.reason||'尚无完成回执'}</pre></details>}</>}
 {entry==='architecture'&&data&&<div className="mc-architecture"><div className="mc-metrics"><span>距审计 <b>{data.state?.turns_since_overseer??'—'}</b> / 20轮</span><span>预约 <b>{data.state?.pending?.role||'空闲'}</b></span><span>来源等待 <b>{Object.keys(data.state?.waiting_issues??{}).length}</b></span></div><ul className="mc-tree"><Tree node={data.tree}/></ul><details><summary>当前来源等待项</summary>{Object.entries(data.state?.waiting_issues??{}).map(([id,w])=><p key={id}><a href={`https://github.com/exisz/storyteller/issues/${id}`} target="_blank" rel="noreferrer">#{id}</a> · {w.reason}</p>)}</details></div>}
 </section>
}
export function mount(root,context){
 const entry=context.props?.window??'runs';
 if(!windows.some(w=>w.id===entry))throw Error('Unknown Mission Control window');
 const host=document.createElement('div');host.style.height='100%';root.append(host);
 const shadow=host.attachShadow({mode:'open'});
 const style=document.createElement('style');style.textContent=css;shadow.append(style);
 const container=document.createElement('div');container.style.height='100%';shadow.append(container);
 const react=createRoot(container);react.render(<App context={context} entry={entry} styleContainer={container}/>);
 return()=>{react.unmount();host.remove()};
}

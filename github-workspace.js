(function(){
'use strict';
const API='https://api.github.com';
const DEFAULT_REPO='OCodejs/ocodejs.github.io';
const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
const state={repo:DEFAULT_REPO,branches:[],tree:[],selectedPath:'',request:0};
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=sha=>String(sha||'').slice(0,7);
const date=value=>value?new Date(value).toLocaleString('vi-VN'):'—';
async function get(path){
 const response=await fetch(API+path,{headers:headers,cache:'no-store'});
 if(!response.ok){let message='HTTP '+response.status;try{const body=await response.json();if(body.message)message=body.message;}catch(_){}throw new Error(message);}
 return response.json();
}
function repoPath(path){return '/repos/'+state.repo+path;}
function statusClass(value){const v=String(value||'').toLowerCase();if(['success','completed','healthy','passed'].includes(v))return 'ok';if(['failure','failed','error','timed_out','action_required'].includes(v))return 'bad';if(['queued','in_progress','pending','waiting','requested'].includes(v))return 'wait';return 'muted';}
function shell(){
 return '<style id="githubWorkspaceStyles">'+
 '.ghw{display:grid;gap:14px;color:var(--text)}.ghw *{box-sizing:border-box}.ghw .gh-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:14px}.ghw .gh-panel{border:1px solid var(--line);background:var(--panel);min-width:0}.ghw .gh-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px;border-bottom:1px solid var(--line)}.ghw .gh-head strong{font-size:10px;letter-spacing:.08em}.ghw .gh-body{padding:14px}.ghw .gh-form{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px}.ghw input,.ghw select{background:#080d14;color:var(--text);border:1px solid var(--line);padding:10px;min-width:0;border-radius:0}.ghw button{border:1px solid #3b4f75;background:#172642;color:#e5edff;padding:9px 12px;border-radius:0;font:inherit;font-size:10px;cursor:pointer}.ghw button.ghost{background:transparent;border-color:var(--line);color:#aeb9ca}.ghw button:disabled{opacity:.5;cursor:wait}.ghw .gh-note{border:1px solid #59482e;background:#17140e;color:#d7bd8b;padding:11px 13px;font-size:10px;line-height:1.7}.ghw .gh-muted{color:var(--muted);font-size:9px;line-height:1.6}.ghw .gh-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #1b2431;font-size:10px}.ghw .gh-row:last-child{border:0}.ghw .gh-pill{border:1px solid var(--line);padding:4px 7px;font-size:8px;white-space:nowrap}.ghw .ok{color:var(--green);border-color:#275744}.ghw .bad{color:#f19ba2;border-color:#633b40}.ghw .wait{color:var(--amber);border-color:#604d2d}.ghw .muted{color:#a1adbf}.ghw .gh-split{display:grid;grid-template-columns:minmax(180px,.7fr) minmax(0,1.3fr);gap:12px}.ghw .gh-tree{max-height:470px;overflow:auto;border:1px solid var(--line);padding:8px}.ghw .gh-tree button{display:block;width:100%;text-align:left;background:transparent;border:0;color:#aebbd0;padding:6px;font-size:9px;overflow-wrap:anywhere}.ghw .gh-tree button:hover,.ghw .gh-tree button.selected{background:#142039;color:#fff}.ghw .gh-file{min-height:180px;max-height:470px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:#080d14;border:1px solid var(--line);padding:12px;font-size:10px;line-height:1.65;color:#c4cede}.ghw .gh-list{max-height:420px;overflow:auto}.ghw .gh-commit{padding:11px 0;border-bottom:1px solid #1b2431}.ghw .gh-commit:last-child{border:0}.ghw .gh-commit a,.ghw .gh-link{color:#9db6ff;text-decoration:none}.ghw .gh-commit a:hover,.ghw .gh-link:hover{text-decoration:underline}.ghw .gh-stats{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:9px;margin-top:6px}.ghw .gh-compare{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center}.ghw .gh-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.ghw .gh-kpi{border:1px solid var(--line);padding:12px;background:#0b1018}.ghw .gh-kpi b{display:block;font-size:19px;margin-top:7px}.ghw .gh-table{width:100%;border-collapse:collapse}.ghw .gh-table th,.ghw .gh-table td{text-align:left;border-bottom:1px solid #1d2735;padding:9px 8px;font-size:9px;vertical-align:top}.ghw .gh-table th{color:var(--muted);font-weight:500}.ghw .gh-empty{padding:24px;text-align:center;color:var(--muted);font-size:10px}.ghw .gh-tabs{display:flex;gap:6px;flex-wrap:wrap}.ghw .gh-tabs button.active{background:#14213a;border-color:#536fae}.ghw .gh-error{color:#f19ba2}.ghw .gh-break{overflow-wrap:anywhere}@media(max-width:760px){.ghw .gh-grid,.ghw .gh-split{grid-template-columns:1fr}.ghw .gh-form{grid-template-columns:1fr 1fr}.ghw .gh-form input{grid-column:1/-1}.ghw .gh-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.ghw .gh-compare{grid-template-columns:1fr 1fr}.ghw .gh-compare button{grid-column:1/-1}}'+
 '</style><section class="ghw">'+
 '<div class="gh-note"><b>READ-ONLY MODE</b> · GitHub public REST API · Chỉ thực hiện GET. Không có OAuth, PAT, token input, write action, workflow dispatch hoặc thay đổi repository. Private repository cần cơ chế xác thực và phân quyền server-side trước khi hỗ trợ.</div>'+
 '<section class="gh-panel"><div class="gh-head"><strong>REPOSITORY TARGET</strong><span id="ghwRepoState" class="gh-pill muted">NOT LOADED</span></div><div class="gh-body"><div class="gh-form"><input id="ghwRepo" value="'+esc(state.repo)+'" aria-label="GitHub owner/repository" placeholder="owner/repository"><button id="ghwLoad">Load repository</button><a id="ghwOpenRepo" class="gh-link" target="_blank" rel="noopener noreferrer" href="https://github.com/'+esc(state.repo)+'">Open GitHub ↗</a></div><div id="ghwRepoMeta" class="gh-muted" style="margin-top:10px">Nhập owner/repository public rồi tải dữ liệu.</div></div></section>'+
 '<div class="gh-kpis"><div class="gh-kpi"><span class="gh-muted">DEFAULT BRANCH</span><b id="ghwDefault">—</b></div><div class="gh-kpi"><span class="gh-muted">BRANCHES LOADED</span><b id="ghwBranchCount">—</b></div><div class="gh-kpi"><span class="gh-muted">LATEST COMMIT</span><b id="ghwLatest">—</b></div><div class="gh-kpi"><span class="gh-muted">CI SUMMARY</span><b id="ghwCi">—</b></div></div>'+
 '<div class="gh-grid"><section class="gh-panel"><div class="gh-head"><strong>BRANCH COMPARISON</strong><span class="gh-muted">BASE → HEAD</span></div><div class="gh-body"><div class="gh-compare"><select id="ghwBase" aria-label="Base branch"><option>Loading…</option></select><select id="ghwHead" aria-label="Compare branch"><option>Loading…</option></select><button id="ghwCompare">Compare</button></div><div id="ghwCompareResult" class="gh-list" style="margin-top:12px"><div class="gh-empty">Chọn hai branch để xem ahead/behind, commit và file diff.</div></div></div></section>'+
 '<section class="gh-panel"><div class="gh-head"><strong>CI STATUS OVERVIEW</strong><span class="gh-muted">LATEST DEFAULT BRANCH SHA</span></div><div class="gh-body"><div id="ghwCiDetail" class="gh-list"><div class="gh-empty">Chưa tải CI status.</div></div></div></section></div>'+
 '<div class="gh-grid"><section class="gh-panel"><div class="gh-head"><strong>COMMIT HISTORY</strong><span class="gh-muted">LATEST 20</span></div><div class="gh-body"><div id="ghwHistory" class="gh-list"><div class="gh-empty">Chưa tải commit history.</div></div></div></section>'+
 '<section class="gh-panel"><div class="gh-head"><strong>FILE EXPLORER</strong><span id="ghwTreeRef" class="gh-muted">DEFAULT BRANCH</span></div><div class="gh-body"><div class="gh-split"><div id="ghwTree" class="gh-tree"><div class="gh-empty">Chưa tải file tree.</div></div><div><div id="ghwFilePath" class="gh-muted" style="margin-bottom:8px">Chọn file để xem nội dung</div><pre id="ghwFileContent" class="gh-file">File preview sẽ hiển thị ở đây. File lớn và binary được mở trực tiếp trên GitHub.</pre></div></div></div></section></div>'+
 '<div class="gh-muted" id="ghwFoot" role="status" aria-live="polite">Dữ liệu công khai từ GitHub REST API. Rate limit unauthenticated áp dụng.</div></section>';
}
function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=String(value==null?'—':value);}
function pill(value){return '<span class="gh-pill '+statusClass(value)+'">'+esc(String(value||'unknown').toUpperCase().replace(/_/g,' '))+'</span>';}
async function loadRepository(){
 const input=document.getElementById('ghwRepo');if(!input)return;
 const match=input.value.trim().match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
 if(!match){setText('ghwRepoMeta','Định dạng hợp lệ: owner/repository');return;}
 state.repo=match[1]+'/'+match[2];const id=++state.request;
 const button=document.getElementById('ghwLoad');button.disabled=true;button.textContent='Loading…';
 setText('ghwRepoState','LOADING');setText('ghwRepoMeta','Đang đọc metadata public repository…');
 const open=document.getElementById('ghwOpenRepo');open.href='https://github.com/'+state.repo;
 try{
  const repo=await get(repoPath(''));
  if(id!==state.request)return;
  if(repo.private)throw new Error('Repository private: cần auth server-side được phân quyền. Không gửi token từ trình duyệt.');
  setText('ghwRepoState','PUBLIC · READ ONLY');
  setText('ghwRepoMeta',(repo.full_name||state.repo)+' · '+(repo.description||'No description')+' · '+repo.visibility+' · updated '+date(repo.updated_at));
  setText('ghwDefault',repo.default_branch||'—');
  const branches=await get(repoPath('/branches?per_page=100'));
  state.branches=Array.isArray(branches)?branches.map(x=>x.name):[];
  setText('ghwBranchCount',state.branches.length);
  const options=state.branches.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
  ['ghwBase','ghwHead'].forEach((id,index)=>{const el=document.getElementById(id);el.innerHTML=options;el.value=index===0?(repo.default_branch||state.branches[0]):(state.branches.includes('main')?'main':state.branches[0]);});
  const commits=await get(repoPath('/commits?sha='+encodeURIComponent(repo.default_branch)+'&per_page=20'));
  if(id!==state.request)return;
  const latest=commits[0];setText('ghwLatest',latest?short(latest.sha):'—');
  renderHistory(commits);
  await Promise.all([loadTree(repo.default_branch,id),loadCi(latest&&latest.sha,id)]);
  setText('ghwFoot','Loaded '+date(new Date().toISOString())+' · GitHub public API · '+state.repo);
 }catch(error){if(id===state.request){setText('ghwRepoState','ERROR');setText('ghwRepoMeta',error.message);setText('ghwFoot','Request failed: '+error.message);}}
 finally{if(id===state.request){button.disabled=false;button.textContent='Load repository';}}
}
function renderHistory(commits){
 const target=document.getElementById('ghwHistory');if(!target)return;
 if(!Array.isArray(commits)||!commits.length){target.innerHTML='<div class="gh-empty">No commits returned.</div>';return;}
 target.innerHTML=commits.map(c=>'<article class="gh-commit"><div><a target="_blank" rel="noopener noreferrer" href="'+esc(c.html_url)+'">'+esc(short(c.sha))+'</a> · '+esc(c.commit?.message?.split('\n')[0]||'No message')+'</div><div class="gh-stats"><span>'+esc(c.commit?.author?.name||c.author?.login||'Unknown author')+'</span><span>'+esc(date(c.commit?.author?.date))+'</span><span>'+esc(c.parents?.length||0)+' parent(s)</span></div></article>').join('');
}
async function loadTree(branch,requestId){
 const target=document.getElementById('ghwTree');if(!target)return;
 setText('ghwTreeRef',branch);target.innerHTML='<div class="gh-empty">Loading repository tree…</div>';
 try{
  const data=await get(repoPath('/git/trees/'+encodeURIComponent(branch)+'?recursive=1'));
  if(requestId!==state.request)return;
  state.tree=Array.isArray(data.tree)?data.tree:[];
  if(data.truncated){target.innerHTML='<div class="gh-empty">Git tree is truncated by GitHub. Open full tree on GitHub.</div>';return;}
  const entries=state.tree.filter(x=>x.type==='tree'||x.type==='blob').slice(0,500);
  renderTreeFolder('',branch);
 }catch(error){if(requestId===state.request)target.innerHTML='<div class="gh-empty gh-error">'+esc(error.message)+'</div>';}
}
function renderTreeFolder(prefix,branch){
 const target=document.getElementById('ghwTree');if(!target)return;
 const normalized=prefix?prefix+'/':'';
 const immediate=new Map();
 state.tree.filter(x=>x.type==='blob'||x.type==='tree').forEach(item=>{
  if(!item.path.startsWith(normalized))return;
  const rest=item.path.slice(normalized.length);if(!rest)return;
  const segment=rest.split('/')[0];const full=normalized+segment;
  if(rest.includes('/'))immediate.set(full,{path:full,type:'tree'});
  else immediate.set(full,{path:full,type:item.type});
 });
 const items=[...immediate.values()].sort((a,b)=>a.type===b.type?a.path.localeCompare(b.path):a.type==='tree'?-1:1);
 target.innerHTML=(prefix?'<button type="button" data-ghw-up="1">↰ .. / '+esc(prefix)+'</button>':'')+items.map(x=>'<button type="button" data-ghw-path="'+esc(x.path)+'" data-ghw-type="'+esc(x.type)+'">'+(x.type==='tree'?'▸ ':'▤ ')+esc(x.path.slice(normalized.length))+'</button>').join('')||'<div class="gh-empty">Empty directory.</div>';
 target.querySelectorAll('[data-ghw-path]').forEach(btn=>btn.addEventListener('click',()=>openTreeItem(btn.dataset.ghwPath,btn.dataset.ghwType,branch)));
 const up=target.querySelector('[data-ghw-up]');if(up)up.addEventListener('click',()=>renderTreeFolder(prefix.split('/').slice(0,-1).join('/'),branch));
}
async function openTreeItem(path,type,branch){
 const target=document.getElementById('ghwFileContent');setText('ghwFilePath',path);
 if(type==='tree'){setText('ghwFilePath',path+' · directory');document.getElementById('ghwFileContent').textContent='Directory: '+path;renderTreeFolder(path,branch);return;}
 target.textContent='Loading '+path+'…';
 try{
  const file=await get(repoPath('/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(branch)));
  if(file.type!=='file'||!file.content){target.textContent='This item cannot be previewed. Open it on GitHub.';return;}
  const raw=atob(file.content.replace(/\s/g,''));const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  if(bytes.length>180000){target.textContent='File exceeds 180 KB preview limit. Open on GitHub.';return;}
  const text=new TextDecoder('utf-8',{fatal:false}).decode(bytes);
  if(text.includes('\u0000')){target.textContent='Binary file. Preview disabled.';return;}
  target.textContent=text;
 }catch(error){target.textContent='Unable to load file: '+error.message;}
}
async function compareBranches(){
 const base=document.getElementById('ghwBase').value,head=document.getElementById('ghwHead').value,target=document.getElementById('ghwCompareResult'),button=document.getElementById('ghwCompare');
 if(!base||!head||base===head){target.innerHTML='<div class="gh-empty">Chọn hai branch khác nhau.</div>';return;}
 button.disabled=true;button.textContent='Comparing…';target.innerHTML='<div class="gh-empty">Đang so sánh refs…</div>';
 try{
  const result=await get(repoPath('/compare/'+encodeURIComponent(base)+'...'+encodeURIComponent(head)));
  const files=Array.isArray(result.files)?result.files:[];
  target.innerHTML='<div class="gh-kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="gh-kpi"><span class="gh-muted">AHEAD</span><b>'+Number(result.ahead_by||0)+'</b></div><div class="gh-kpi"><span class="gh-muted">BEHIND</span><b>'+Number(result.behind_by||0)+'</b></div><div class="gh-kpi"><span class="gh-muted">COMMITS</span><b>'+Number(result.total_commits||0)+'</b></div></div><p class="gh-muted">Status: '+esc(result.status)+' · '+esc(base)+' → '+esc(head)+'</p><div class="table-wrap"><table class="gh-table"><thead><tr><th>File</th><th>Status</th><th>+ / −</th></tr></thead><tbody>'+files.map(f=>'<tr><td class="gh-break">'+esc(f.filename)+'</td><td>'+esc(f.status)+'</td><td><span class="ok">+'+Number(f.additions||0)+'</span> / <span class="gh-error">−'+Number(f.deletions||0)+'</span></td></tr>').join('')+'</tbody></table></div>'+(result.too_large?'<p class="gh-muted">Diff too large; GitHub omitted some file details.</p>':'');
 }catch(error){target.innerHTML='<div class="gh-empty gh-error">'+esc(error.message)+'</div>';}
 finally{button.disabled=false;button.textContent='Compare';}
}
async function loadCi(sha,requestId){
 const target=document.getElementById('ghwCiDetail');if(!target)return;
 target.innerHTML='<div class="gh-empty">Loading check-runs and commit statuses…</div>';
 if(!sha){setText('ghwCi','NO SHA');return;}
 const results=await Promise.allSettled([
  get(repoPath('/commits/'+sha+'/check-runs')),
  get(repoPath('/commits/'+sha+'/status')),
  get(repoPath('/actions/runs?head_sha='+encodeURIComponent(sha)+'&per_page=8'))
 ]);
 if(requestId!==state.request)return;
 const checks=results[0].status==='fulfilled'?(results[0].value.check_runs||[]):[];
 const statuses=results[1].status==='fulfilled'?(results[1].value.statuses||[]):[];
 const runs=results[2].status==='fulfilled'?(results[2].value.workflow_runs||[]):[];
 const failed=checks.filter(x=>x.conclusion&&x.conclusion!=='success').length;
 const pending=checks.filter(x=>x.status!=='completed').length;
 const succeeded=checks.filter(x=>x.conclusion==='success').length;
 const overall=failed?'FAILURE':pending?'IN PROGRESS':checks.length?'SUCCESS':statuses.length?(results[1].value.state||'unknown').toUpperCase():'NO CHECKS';
 setText('ghwCi',overall);
 const rows=checks.map(x=>({name:x.name,status:x.status==='completed'?x.conclusion:x.status,url:x.html_url,kind:'Check'}))
 .concat(statuses.map(x=>({name:x.context,status:x.state,url:x.target_url,kind:'Commit status'})))
 .concat(runs.map(x=>({name:x.name+' #'+x.run_number,status:x.conclusion||x.status,url:x.html_url,kind:'Workflow'})));
 target.innerHTML='<div class="gh-stats"><span>Checks '+checks.length+'</span><span>Success '+succeeded+'</span><span>Pending '+pending+'</span><span>Failed '+failed+'</span></div>'+rows.map(x=>'<div class="gh-row"><div><b>'+esc(x.name)+'</b><div class="gh-muted">'+esc(x.kind)+'</div></div>'+pill(x.status)+'<a class="gh-link" target="_blank" rel="noopener noreferrer" href="'+esc(x.url||'#')+'">Open ↗</a></div>').join('')||'<div class="gh-empty">No CI checks or workflow runs reported for this commit.</div>';
 const errors=results.map((r,i)=>r.status==='rejected'?['checks','statuses','workflow runs'][i]+': '+r.reason.message:null).filter(Boolean);
 if(errors.length)target.insertAdjacentHTML('beforeend','<p class="gh-muted">Some sources unavailable: '+esc(errors.join(' · '))+'</p>');
}
function render(){const root=document.getElementById('view');root.innerHTML='<div class="page-head"><div><div class="eyebrow">DEVELOPMENT / GITHUB</div><h1>Repository Operations Center</h1><p>Branch comparison · commit history · file explorer · aggregated CI status.</p></div><span class="tag">GET ONLY / READ ONLY</span></div>'+shell();document.getElementById('ghwLoad').addEventListener('click',loadRepository);document.getElementById('ghwRepo').addEventListener('keydown',e=>{if(e.key==='Enter')loadRepository();});document.getElementById('ghwCompare').addEventListener('click',compareBranches);loadRepository();}
function register(){
 if(!window.OCodeNavigation||typeof window.OCodeNavigation.registerPage!=='function'){setTimeout(register,50);return;}
 window.OCodeNavigation.registerPage({id:'github-workspace',title:'GitHub Workspace',label:'GitHub Workspace',icon:'⌘',group:'DEVELOPMENT',render:function(){setTimeout(render,0);return '<div class="empty">Loading GitHub Workspace…</div>'; }});
}
register();
})();
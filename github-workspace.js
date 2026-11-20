(function(){
'use strict';
const API='https://api.github.com';
const DEFAULT_REPO='OCodejs/ocodejs.github.io';
const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
const state={repo:DEFAULT_REPO,branches:[],tree:[],selectedPath:'',request:0,fileRequest:0,compareRequest:0,prRequest:0};
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=sha=>String(sha||'').slice(0,7);
const date=value=>value?new Date(value).toLocaleString('vi-VN'):'—';
async function get(path){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
 let response;try{response=await fetch(API+path,{headers:headers,cache:'no-store',signal:controller.signal});}catch(error){if(error.name==='AbortError')throw new Error('GitHub request timed out after 15 seconds');throw error;}finally{clearTimeout(timeout);}
 if(!response.ok){let message='HTTP '+response.status;try{const body=await response.json();if(body.message)message=body.message;}catch(_){}throw new Error(message);}
 return response.json();
}
function repoPath(path){return '/repos/'+state.repo+path;}
function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'#';}catch(_){return '#';}}
function statusClass(value){const v=String(value||'').toLowerCase();if(['success','completed','healthy','passed'].includes(v))return 'ok';if(['failure','failed','error','timed_out','action_required'].includes(v))return 'bad';if(['queued','in_progress','pending','waiting','requested'].includes(v))return 'wait';return 'muted';}
function shell(){
 return '<style id="githubWorkspaceStyles">'+
 '.ghw{display:grid;gap:14px;color:var(--text)}.ghw *{box-sizing:border-box}.ghw .gh-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:14px}.ghw .gh-panel{border:1px solid var(--line);background:var(--panel);min-width:0}.ghw .gh-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px;border-bottom:1px solid var(--line)}.ghw .gh-head strong{font-size:10px;letter-spacing:.08em}.ghw .gh-body{padding:14px}.ghw .gh-form{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px}.ghw input,.ghw select{background:#080d14;color:var(--text);border:1px solid var(--line);padding:10px;min-width:0;border-radius:0}.ghw button{border:1px solid #3b4f75;background:#172642;color:#e5edff;padding:9px 12px;border-radius:0;font:inherit;font-size:10px;cursor:pointer}.ghw button.ghost{background:transparent;border-color:var(--line);color:#aeb9ca}.ghw button:disabled{opacity:.5;cursor:wait}.ghw .gh-note{border:1px solid #59482e;background:#17140e;color:#d7bd8b;padding:11px 13px;font-size:10px;line-height:1.7}.ghw .gh-muted{color:var(--muted);font-size:9px;line-height:1.6}.ghw .gh-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #1b2431;font-size:10px}.ghw .gh-row:last-child{border:0}.ghw .gh-pill{border:1px solid var(--line);padding:4px 7px;font-size:8px;white-space:nowrap}.ghw .ok{color:var(--green);border-color:#275744}.ghw .bad{color:#f19ba2;border-color:#633b40}.ghw .wait{color:var(--amber);border-color:#604d2d}.ghw .muted{color:#a1adbf}.ghw .gh-split{display:grid;grid-template-columns:minmax(180px,.7fr) minmax(0,1.3fr);gap:12px}.ghw .gh-tree{max-height:470px;overflow:auto;border:1px solid var(--line);padding:8px}.ghw .gh-tree button{display:block;width:100%;text-align:left;background:transparent;border:0;color:#aebbd0;padding:6px;font-size:9px;overflow-wrap:anywhere}.ghw .gh-tree button:hover,.ghw .gh-tree button.selected{background:#142039;color:#fff}.ghw .gh-file{min-height:180px;max-height:470px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:#080d14;border:1px solid var(--line);padding:12px;font-size:10px;line-height:1.65;color:#c4cede}.ghw .gh-list{max-height:420px;overflow:auto}.ghw .gh-commit{padding:11px 0;border-bottom:1px solid #1b2431}.ghw .gh-commit:last-child{border:0}.ghw .gh-commit a,.ghw .gh-link{color:#9db6ff;text-decoration:none}.ghw .gh-commit a:hover,.ghw .gh-link:hover{text-decoration:underline}.ghw .gh-stats{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:9px;margin-top:6px}.ghw .gh-compare{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center}.ghw .gh-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.ghw .gh-kpi{border:1px solid var(--line);padding:12px;background:#0b1018}.ghw .gh-kpi b{display:block;font-size:19px;margin-top:7px}.ghw .gh-table{width:100%;border-collapse:collapse}.ghw .gh-table th,.ghw .gh-table td{text-align:left;border-bottom:1px solid #1d2735;padding:9px 8px;font-size:9px;vertical-align:top}.ghw .gh-table th{color:var(--muted);font-weight:500}.ghw .gh-empty{padding:24px;text-align:center;color:var(--muted);font-size:10px}.ghw .gh-tabs{display:flex;gap:6px;flex-wrap:wrap}.ghw .gh-tabs button.active{background:#14213a;border-color:#536fae}.ghw .gh-error{color:#f19ba2}.ghw .gh-break{overflow-wrap:anywhere}@media(max-width:760px){.ghw .gh-grid,.ghw .gh-split{grid-template-columns:1fr}.ghw .gh-form{grid-template-columns:1fr 1fr}.ghw .gh-form input{grid-column:1/-1}.ghw .gh-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.ghw .gh-compare{grid-template-columns:1fr 1fr}.ghw .gh-compare button{grid-column:1/-1}}'+
 '</style><section class="ghw">'+
 '<div class="gh-note"><b>READ-ONLY MODE</b> · GitHub public REST API · Chỉ thực hiện GET. Không có OAuth, PAT, token input, write action, workflow dispatch hoặc thay đổi repository. Private repository cần cơ chế xác thực và phân quyền server-side trước khi hỗ trợ.</div>'+
 '<section class="gh-panel"><div class="gh-head"><strong>REPOSITORY TARGET</strong><span id="ghwRepoState" class="gh-pill muted">NOT LOADED</span></div><div class="gh-body"><div class="gh-form"><input id="ghwRepo" value="'+esc(state.repo)+'" aria-label="GitHub owner/repository" placeholder="owner/repository"><button id="ghwLoad">Load repository</button><a id="ghwOpenRepo" class="gh-link" target="_blank" rel="noopener noreferrer" href="https://github.com/'+esc(state.repo)+'">Open GitHub ↗</a></div><div id="ghwRepoMeta" class="gh-muted" style="margin-top:10px">Nhập owner/repository public rồi tải dữ liệu.</div></div></section>'+
 '<div class="gh-kpis"><div class="gh-kpi"><span class="gh-muted">DEFAULT BRANCH</span><b id="ghwDefault">—</b></div><div class="gh-kpi"><span class="gh-muted">BRANCHES LOADED</span><b id="ghwBranchCount">—</b></div><div class="gh-kpi"><span class="gh-muted">LATEST COMMIT</span><b id="ghwLatest">—</b></div><div class="gh-kpi"><span class="gh-muted">CI SUMMARY</span><b id="ghwCi">—</b></div></div>'+
 '<section class="gh-panel"><div class="gh-head"><strong>REPOSITORY INVENTORY</strong><span class="gh-muted">PUBLIC ORGANIZATION REPOSITORIES</span></div><div class="gh-body"><div class="gh-stats" id="ghwInventoryStats">Loading repository inventory…</div><div class="table-wrap"><table class="gh-table"><thead><tr><th>Repository</th><th>Visibility</th><th>Default branch</th><th>Language</th><th>Updated</th></tr></thead><tbody id="ghwInventory"><tr><td colspan="5">Loading…</td></tr></tbody></table></div></div></section>'+
 '<section class="gh-panel"><div class="gh-head"><strong>PULL REQUEST CENTER</strong><span class="gh-muted">LATEST 30 · ALL STATES</span></div><div class="gh-body"><div class="gh-stats" id="ghwPrStats">Loading pull requests…</div><div class="table-wrap"><table class="gh-table"><thead><tr><th>Pull request</th><th>State</th><th>Review</th><th>Merge</th><th>Checks</th></tr></thead><tbody id="ghwPullRequests"><tr><td colspan="5">Loading…</td></tr></tbody></table></div><p class="gh-muted">Review/check detail được lấy cho tối đa 12 PR mới nhất để giới hạn request và tránh GitHub API rate-limit.</p></div></section>'+
 '<section class="gh-panel"><div class="gh-head"><strong>SECURITY &amp; PERMISSIONS</strong><span class="gh-pill muted">DESIGN ONLY</span></div><div class="gh-body"><p class="gh-muted">RBAC đề xuất — chưa cấp quyền hoặc bật endpoint ghi.</p><div class="table-wrap"><table class="gh-table"><thead><tr><th>Capability</th><th>Viewer</th><th>Developer</th><th>Admin</th></tr></thead><tbody><tr><td>Read inventory / PR / CI</td><td>Allow</td><td>Allow</td><td>Allow</td></tr><tr><td>Read file contents</td><td>Allow</td><td>Allow</td><td>Allow</td></tr><tr><td>Create branch / commit</td><td>—</td><td>Future</td><td>Future</td></tr><tr><td>Manage PR / request review</td><td>—</td><td>Future</td><td>Future</td></tr><tr><td>Manage App installation / policy</td><td>—</td><td>—</td><td>Future</td></tr><tr><td>Production deploy / secrets</td><td>—</td><td>—</td><td>Separate approval</td></tr></tbody></table></div><div class="gh-note" style="margin-top:12px"><b>GITHUB APP AUTH DESIGN</b><br>1. GitHub App installed only on allowlisted organizations/repositories.<br>2. OAuth user identity linked to server-side RBAC; deny by default.<br>3. App private key and short-lived installation tokens stay server-side; never expose to browser.<br>4. API proxy allowlists methods, paths, repositories and environments; no arbitrary URL forwarding.<br>5. CSRF/state validation, strict origin checks, rate limits, idempotency keys and audit events.<br>6. Write operations separated by capability; require explicit confirmation and step-up approval.<br>7. Audit log is append-only: actor, role, repo, action, target, request ID, timestamp, outcome; redact secrets.</div><div class="gh-muted" style="margin-top:10px">Audit log status: NOT CONNECTED · No authorization or write events are generated in read-only mode. Future schema: event_id, actor_id, role, installation_id, repository_id, action, resource, request_id, timestamp, result, reason.</div></div></section>'+
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
 ['ghwDefault','ghwBranchCount','ghwLatest','ghwCi'].forEach(key=>setText(key,'—'));
 ['ghwHistory','ghwTree','ghwCiDetail','ghwCompareResult','ghwPullRequests'].forEach(key=>{const el=document.getElementById(key);if(el)el.textContent='Loading new repository…';});
 state.branches=[];state.tree=[];
 setText('ghwRepoState','LOADING');setText('ghwRepoMeta','Đang đọc metadata public repository…');
 const open=document.getElementById('ghwOpenRepo');open.href='https://github.com/'+state.repo;
 try{
  const repo=await get(repoPath(''));
  if(id!==state.request)return;
  if(repo.private)throw new Error('Repository private: cần auth server-side được phân quyền. Không gửi token từ trình duyệt.');
  setText('ghwRepoState','PUBLIC · READ ONLY');
  setText('ghwRepoMeta',(repo.full_name||state.repo)+' · '+(repo.description||'No description')+' · '+repo.visibility+' · updated '+date(repo.updated_at));
  setText('ghwDefault',repo.default_branch||'—');
  const branches=[];for(let page=1;page<=10;page++){const batch=await get(repoPath('/branches?per_page=100&page='+page));branches.push(...(Array.isArray(batch)?batch:[]));if(!Array.isArray(batch)||batch.length<100)break;}
  state.branches=branches.map(x=>x.name);
  setText('ghwBranchCount',state.branches.length);
  const options=state.branches.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
  ['ghwBase','ghwHead'].forEach((id,index)=>{const el=document.getElementById(id);el.innerHTML=options;el.value=index===0?(repo.default_branch||state.branches[0]):(state.branches.find(name=>name!==(repo.default_branch||state.branches[0]))||repo.default_branch||state.branches[0]);});
  const commits=repo.default_branch?await get(repoPath('/commits?sha='+encodeURIComponent(repo.default_branch)+'&per_page=20')):[];
  if(id!==state.request)return;
  const latest=commits[0];setText('ghwLatest',latest?short(latest.sha):'—');
  renderHistory(commits);
  await Promise.all([repo.default_branch?loadTree(repo.default_branch,id):Promise.resolve(setText('ghwTreeRef','EMPTY REPOSITORY')),loadCi(latest&&latest.sha,id),loadPrCenter()]);
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
 setText('ghwTreeRef',branch);target.innerHTML='<div class="gh-empty">Resolving branch tree…</div>';
 try{
  const ref=await get(repoPath('/git/ref/heads/'+branch.split('/').map(encodeURIComponent).join('/')));
  const treeSha=ref.object&&ref.object.sha;if(!treeSha)throw new Error('Git reference không trả về tree commit SHA');
  const commit=await get(repoPath('/git/commits/'+encodeURIComponent(treeSha)));
  const rootTreeSha=commit.tree&&commit.tree.sha;if(!rootTreeSha)throw new Error('Commit không trả về root tree SHA');
  const data=await get(repoPath('/git/trees/'+encodeURIComponent(rootTreeSha)+'?recursive=1'));
  if(requestId!==state.request)return;
  state.tree=Array.isArray(data.tree)?data.tree:[];
  if(data.truncated){target.innerHTML='<div class="gh-empty">Git tree is truncated by GitHub. Open full tree on GitHub.</div>';return;}
  state.tree=state.tree.filter(x=>x.type==='tree'||x.type==='blob').slice(0,5000);
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
 const items=[...immediate.values()].sort((a,b)=>a.type===b.type?a.path.localeCompare(b.path):a.type==='tree'?-1:1).slice(0,500);
 target.innerHTML=(prefix?'<button type="button" data-ghw-up="1">↰ .. / '+esc(prefix)+'</button>':'')+items.map(x=>'<button type="button" data-ghw-path="'+esc(x.path)+'" data-ghw-type="'+esc(x.type)+'">'+(x.type==='tree'?'▸ ':'▤ ')+esc(x.path.slice(normalized.length))+'</button>').join('')||'<div class="gh-empty">Empty directory.</div>';
 target.querySelectorAll('[data-ghw-path]').forEach(btn=>btn.addEventListener('click',()=>openTreeItem(btn.dataset.ghwPath,btn.dataset.ghwType,branch)));
 const up=target.querySelector('[data-ghw-up]');if(up)up.addEventListener('click',()=>renderTreeFolder(prefix.split('/').slice(0,-1).join('/'),branch));
}
async function openTreeItem(path,type,branch){
 const request=++state.fileRequest,repoAtRequest=state.repo;const target=document.getElementById('ghwFileContent');setText('ghwFilePath',path);
 if(type==='tree'){setText('ghwFilePath',path+' · directory');document.getElementById('ghwFileContent').textContent='Directory: '+path;renderTreeFolder(path,branch);return;}
 target.textContent='Loading '+path+'…';
 try{
  const file=await get('/repos/'+repoAtRequest+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(branch));
  if(request!==state.fileRequest||repoAtRequest!==state.repo)return;
  if(file.type!=='file'||!file.content){target.textContent='This item cannot be previewed. Open it on GitHub.';return;}
  const raw=atob(file.content.replace(/\s/g,''));const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  if(bytes.length>180000){target.textContent='File exceeds 180 KB preview limit. Open on GitHub.';return;}
  const text=new TextDecoder('utf-8',{fatal:false}).decode(bytes);
  if(text.includes('\u0000')){target.textContent='Binary file. Preview disabled.';return;}
  target.textContent=text;
 }catch(error){if(request===state.fileRequest&&repoAtRequest===state.repo)target.textContent='Unable to load file: '+error.message;}
}
async function compareBranches(){
 const request=++state.compareRequest,repoAtRequest=state.repo;const base=document.getElementById('ghwBase').value,head=document.getElementById('ghwHead').value,target=document.getElementById('ghwCompareResult'),button=document.getElementById('ghwCompare');
 if(!base||!head||base===head){target.innerHTML='<div class="gh-empty">Chọn hai branch khác nhau.</div>';return;}
 button.disabled=true;button.textContent='Comparing…';target.innerHTML='<div class="gh-empty">Đang so sánh refs…</div>';
 try{
  const result=await get('/repos/'+repoAtRequest+'/compare/'+encodeURIComponent(base)+'...'+encodeURIComponent(head));
  if(request!==state.compareRequest||repoAtRequest!==state.repo)return;
  const files=Array.isArray(result.files)?result.files:[];
  target.innerHTML='<div class="gh-kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="gh-kpi"><span class="gh-muted">AHEAD</span><b>'+Number(result.ahead_by||0)+'</b></div><div class="gh-kpi"><span class="gh-muted">BEHIND</span><b>'+Number(result.behind_by||0)+'</b></div><div class="gh-kpi"><span class="gh-muted">COMMITS</span><b>'+Number(result.total_commits||0)+'</b></div></div><p class="gh-muted">Status: '+esc(result.status)+' · '+esc(base)+' → '+esc(head)+'</p><div class="table-wrap"><table class="gh-table"><thead><tr><th>File</th><th>Status</th><th>+ / −</th></tr></thead><tbody>'+files.map(f=>'<tr><td class="gh-break">'+esc(f.filename)+'</td><td>'+esc(f.status)+'</td><td><span class="ok">+'+Number(f.additions||0)+'</span> / <span class="gh-error">−'+Number(f.deletions||0)+'</span></td></tr>').join('')+'</tbody></table></div>'+(result.too_large?'<p class="gh-muted">Diff too large; GitHub omitted some file details.</p>':'');
 }catch(error){if(request===state.compareRequest&&repoAtRequest===state.repo)target.innerHTML='<div class="gh-empty gh-error">'+esc(error.message)+'</div>';}
 finally{if(request===state.compareRequest){button.disabled=false;button.textContent='Compare';}}
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
 const failedConclusions=['failure','timed_out','cancelled','action_required','startup_failure'];
 const failed=checks.filter(x=>x.status==='completed'&&failedConclusions.includes(String(x.conclusion||'').toLowerCase())).length+statuses.filter(x=>['failure','error'].includes(String(x.state).toLowerCase())).length+runs.filter(x=>x.status==='completed'&&failedConclusions.includes(String(x.conclusion||'').toLowerCase())).length;
 const pending=checks.filter(x=>x.status!=='completed').length+statuses.filter(x=>['pending','queued','in_progress'].includes(String(x.state).toLowerCase())).length+runs.filter(x=>x.status!=='completed').length;
 const succeeded=checks.filter(x=>x.status==='completed'&&x.conclusion==='success').length+statuses.filter(x=>String(x.state).toLowerCase()==='success').length+runs.filter(x=>x.status==='completed'&&x.conclusion==='success').length;
 const sourceCount=checks.length+statuses.length+runs.length;
 const sourceErrors=results.filter(r=>r.status==='rejected').length;
 const overall=failed?'FAILURE':pending?'IN PROGRESS':sourceCount?(sourceErrors?'PARTIAL':'SUCCESS'):sourceErrors?'UNAVAILABLE':'NO CHECKS';
 setText('ghwCi',overall);
 const rows=checks.map(x=>({name:x.name,status:x.status==='completed'?x.conclusion:x.status,url:safeUrl(x.html_url),kind:'Check'}))
 .concat(statuses.map(x=>({name:x.context,status:x.state,url:safeUrl(x.target_url),kind:'Commit status'})))
 .concat(runs.map(x=>({name:x.name+' #'+x.run_number,status:x.conclusion||x.status,url:safeUrl(x.html_url),kind:'Workflow'})));
 target.innerHTML='<div class="gh-stats"><span>Checks '+checks.length+'</span><span>Success '+succeeded+'</span><span>Pending '+pending+'</span><span>Failed '+failed+'</span></div>'+rows.map(x=>'<div class="gh-row"><div><b>'+esc(x.name)+'</b><div class="gh-muted">'+esc(x.kind)+'</div></div>'+pill(x.status)+'<a class="gh-link" target="_blank" rel="noopener noreferrer" href="'+esc(x.url||'#')+'">Open ↗</a></div>').join('')||'<div class="gh-empty">No CI checks or workflow runs reported for this commit.</div>';
 const errors=results.map((r,i)=>r.status==='rejected'?['checks','statuses','workflow runs'][i]+': '+r.reason.message:null).filter(Boolean);
 if(errors.length)target.insertAdjacentHTML('beforeend','<p class="gh-muted">Some sources unavailable: '+esc(errors.join(' · '))+'</p>');
}
async function loadInventory(){
 const body=document.getElementById('ghwInventory'),stats=document.getElementById('ghwInventoryStats');if(!body)return;
 body.innerHTML='<tr><td colspan="5">Loading public repositories…</td></tr>';
 const owner=(state.repo.split('/')[0]||'OCodejs');
 try{
  const repos=await get('/orgs/'+encodeURIComponent(owner)+'/repos?type=all&sort=updated&per_page=100');
  const rows=Array.isArray(repos)?repos:[];
  stats.textContent=rows.length+' repositories · '+rows.filter(x=>x.private).length+' private · '+rows.filter(x=>!x.private).length+' public · organization scope';
  body.innerHTML=rows.map(r=>'<tr><td><a class="gh-link" target="_blank" rel="noopener noreferrer" href="'+esc(r.html_url)+'">'+esc(r.full_name)+'</a><div class="gh-muted">'+esc(r.description||'No description')+'</div></td><td>'+esc(r.visibility|| (r.private?'private':'public'))+'</td><td>'+esc(r.default_branch||'—')+'</td><td>'+esc(r.language||'—')+'</td><td>'+esc(date(r.updated_at))+'</td></tr>').join('')||'<tr><td colspan="5">No repositories returned.</td></tr>';
 }catch(error){stats.textContent='Inventory unavailable: '+error.message;body.innerHTML='<tr><td colspan="5" class="gh-error">'+esc(error.message)+'</td></tr>';}
}
async function loadPrCenter(){
 const body=document.getElementById('ghwPullRequests'),stats=document.getElementById('ghwPrStats');if(!body)return;
 body.innerHTML='<tr><td colspan="5">Loading pull requests…</td></tr>';
 try{
  const request=++state.prRequest,repoAtRequest=state.repo;
  const prs=await get(repoPath('/pulls?state=all&sort=updated&direction=desc&per_page=30'));
  if(request!==state.prRequest||repoAtRequest!==state.repo)return;
  const list=Array.isArray(prs)?prs:[];
  stats.textContent=list.length+' PRs returned · '+list.filter(x=>x.state==='open').length+' open · '+list.filter(x=>x.merged_at).length+' merged · '+list.filter(x=>x.state==='closed'&&!x.merged_at).length+' closed';
  const detailed=await Promise.allSettled(list.slice(0,12).map(async p=>{
   const [reviews,checks,status]=await Promise.allSettled([
    get(repoPath('/pulls/'+p.number+'/reviews?per_page=100')),
    get(repoPath('/commits/'+encodeURIComponent(p.head.sha)+'/check-runs')),
    get(repoPath('/commits/'+encodeURIComponent(p.head.sha)+'/status'))
   ]);
   const reviewList=reviews.status==='fulfilled'?reviews.value:[];
   const latestByUser=new Map();reviewList.forEach(r=>latestByUser.set(r.user?.login||String(r.id),r.state));
   const states=[...latestByUser.values()];
   const review=states.includes('CHANGES_REQUESTED')?'Changes requested':states.includes('APPROVED')?'Approved':states.includes('COMMENTED')?'Commented':'Review pending';
   const runs=checks.status==='fulfilled'?(checks.value.check_runs||[]):[];
   const statuses=status.status==='fulfilled'?(status.value.statuses||[]):[];
   const failed=runs.some(x=>x.status==='completed'&&['failure','timed_out','cancelled','action_required','startup_failure'].includes(String(x.conclusion).toLowerCase()))||statuses.some(x=>['failure','error'].includes(String(x.state).toLowerCase()));
   const pending=runs.some(x=>x.status!=='completed')||statuses.some(x=>['pending','queued','in_progress'].includes(String(x.state).toLowerCase()));
   const unavailable=checks.status==='rejected'&&status.status==='rejected';const checkLabel=failed?'Failure':pending?'In progress':unavailable?'Unavailable':runs.length||statuses.length?'Success':'No checks';
   const merge=p.mergeable===false?'Conflict':p.mergeable===true?'Mergeable':'Unknown';
   return {number:p.number,title:p.title,url:p.html_url,state:p.merged_at?'Merged':p.state,review,merge,checkLabel};
  }));
  const map=new Map();detailed.forEach(x=>{if(x.status==='fulfilled')map.set(x.value.number,x.value);});
  body.innerHTML=list.map(p=>{const d=map.get(p.number)||{review:'Not loaded',merge:p.mergeable===false?'Conflict':p.mergeable===true?'Mergeable':'Unknown',checkLabel:'Not loaded'};return '<tr><td><a class="gh-link" target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(p.html_url))+'">#'+p.number+' · '+esc(p.title)+'</a><div class="gh-muted">'+esc(p.user?.login||'')+' → '+esc(p.base?.ref||'')+'</div></td><td>'+pill(p.merged_at?'merged':p.state)+'</td><td>'+esc(d.review)+'</td><td>'+pill(d.merge==='Conflict'?'failure':d.merge==='Mergeable'?'success':'unknown')+'<div class="gh-muted">'+esc(d.merge)+'</div></td><td>'+pill(d.checkLabel==='Failure'?'failure':d.checkLabel==='Success'?'success':d.checkLabel==='In progress'?'pending':'unknown')+'<div class="gh-muted">'+esc(d.checkLabel)+'</div></td></tr>';}).join('')||'<tr><td colspan="5">No pull requests found.</td></tr>';
  if(detailed.some(x=>x.status==='rejected'))stats.textContent+=' · Some review/check details unavailable';
 }catch(error){stats.textContent='PR data unavailable: '+error.message;body.innerHTML='<tr><td colspan="5" class="gh-error">'+esc(error.message)+'</td></tr>';}
}
function render(){const root=document.getElementById('view');root.innerHTML='<div class="page-head"><div><div class="eyebrow">DEVELOPMENT / GITHUB</div><h1>Repository Operations Center</h1><p>Branch comparison · commit history · file explorer · aggregated CI status.</p></div><span class="tag">GET ONLY / READ ONLY</span></div>'+shell();document.getElementById('ghwLoad').addEventListener('click',loadRepository);document.getElementById('ghwRepo').addEventListener('keydown',e=>{if(e.key==='Enter')loadRepository();});document.getElementById('ghwCompare').addEventListener('click',compareBranches);loadInventory();loadRepository();}
function register(){
 if(!window.OCodeNavigation||typeof window.OCodeNavigation.registerPage!=='function'){setTimeout(register,50);return;}
 window.OCodeNavigation.registerPage({id:'github-workspace',title:'GitHub Workspace',label:'GitHub Workspace',icon:'⌘',group:'DEVELOPMENT',render:function(){setTimeout(render,0);return '<div class="empty">Loading GitHub Workspace…</div>'; }});
}
register();
})();
(() => {
  'use strict';
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const sample = {
    repositories: [
      {name:'mcp.auth.ocodejs',visibility:'public',branch:'main',origin:'Forgejo migration candidate',state:'PLANNED'},
      {name:'ocodejs-cli',visibility:'public',branch:'main',origin:'GitHub import candidate',state:'PLANNED'},
      {name:'ocodejs-server',visibility:'private',branch:'main',origin:'Native repository',state:'PLANNED'}
    ],
    jobs: [
      {id:'demo-001',repo:'mcp.auth.ocodejs',ref:'feat/auth-preview',event:'pull_request',status:'queued',runner:'unassigned',duration:'—'},
      {id:'demo-002',repo:'ocodejs-cli',ref:'main',event:'push',status:'succeeded',runner:'runner-demo-01',duration:'02:14'},
      {id:'demo-003',repo:'ocodejs-server',ref:'feat/dashboard',event:'push',status:'failed',runner:'runner-demo-01',duration:'00:31'}
    ],
    runners: [
      {name:'runner-demo-01',labels:'linux · x64 · node22',state:'OFFLINE'},
      {name:'runner-demo-02',labels:'linux · arm64 · node22',state:'NOT PROVISIONED'}
    ],
    prs: [
      {id:'#12',title:'Add auth preview flow',repo:'mcp.auth.ocodejs',branch:'feat/auth-preview',state:'OPEN',checks:'PENDING'},
      {id:'#08',title:'Update CLI catalog',repo:'ocodejs-cli',branch:'feat/catalog-refresh',state:'DRAFT',checks:'NOT RUN'}
    ]
  };
  const badge = (state) => '<span class="state ' + (state==='succeeded'||state==='OPEN'?'ok':state==='failed'?'warn':'') + '">' + escapeHTML(state.toUpperCase()) + '</span>';
  const table = (headers, rows) => '<div class="table-wrap"><table class="table"><thead><tr>' + headers.map(h=>'<th>'+h+'</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  function render() {
    return '<div class="notice"><strong>STAGING DESIGN PREVIEW</strong> — dữ liệu bên dưới là mẫu minh họa, không phải repository, job, PR hoặc runner đang hoạt động. API và Git server chưa được triển khai.</div>' +
      '<div class="page-head"><div><div class="eyebrow">PLATFORM / GIT + CI</div><h1>OCodeJS AutoRun</h1><p>Git hosting, Pull Requests, queue orchestration và isolated build runners.</p></div><span class="demo-pill">● NOT CONNECTED</span></div>' +
      '<div class="grid stats">' + [['Repositories','03','Sample catalog'],['Open Pull Requests','02','Sample records'],['Queued Jobs','01','No queue binding'],['Online Runners','0','No runner provisioned']].map(x=>'<div class="stat"><div class="stat-top">'+x[0]+'</div><div class="stat-value">'+x[1]+'</div><div class="stat-foot">'+x[2]+'</div></div>').join('') + '</div>' +
      '<div class="grid cols"><section class="panel"><div class="panel-head"><strong>RECENT PIPELINE RUNS</strong><small>DEMO DATA</small></div>' +
      table(['Run','Repository / Ref','Event','Status','Runner','Duration'],sample.jobs.map(j=>'<tr><td><code>'+j.id+'</code></td><td>'+escapeHTML(j.repo)+'<small style="display:block;color:var(--muted)">'+escapeHTML(j.ref)+'</small></td><td>'+j.event+'</td><td>'+badge(j.status)+'</td><td>'+j.runner+'</td><td>'+j.duration+'</td></tr>')) +
      '</section><section class="panel"><div class="panel-head"><strong>RUNNER POOL</strong><small>NO HOST ATTACHED</small></div><div class="panel-body service-list">'+sample.runners.map(r=>'<div class="service"><div><b>'+r.name+'</b><small>'+r.labels+'</small></div><span class="state">'+r.state+'</span></div>').join('')+'<p style="font-size:9px;color:var(--muted)">Runner chỉ nhận job qua mTLS/token ngắn hạn; mỗi job chạy trong sandbox riêng.</p></div></section></div>' +
      '<div style="height:14px"></div><section class="panel"><div class="panel-head"><strong>REPOSITORY MANAGER</strong><small>GIT SERVER: NOT PROVISIONED</small></div>' +
      table(['Repository','Visibility','Default branch','Origin','Status'],sample.repositories.map(r=>'<tr><td><strong>'+r.name+'</strong></td><td>'+r.visibility+'</td><td><code>'+r.branch+'</code></td><td>'+r.origin+'</td><td>'+badge(r.state)+'</td></tr>')) + '</section>' +
      '<div style="height:14px"></div><section class="panel"><div class="panel-head"><strong>PULL REQUESTS</strong><small>REVIEW + REQUIRED CHECKS</small></div>' +
      table(['ID','Title','Repository','Head branch','State','Checks'],sample.prs.map(p=>'<tr><td><code>'+p.id+'</code></td><td>'+p.title+'</td><td>'+p.repo+'</td><td><code>'+p.branch+'</code></td><td>'+badge(p.state)+'</td><td>'+badge(p.checks)+'</td></tr>')) + '</section>' +
      '<div style="height:14px"></div><div class="grid cards">' +
      [['Git Authentication','SSH keys, HTTPS tokens, scoped service identities, MFA and audit events.'],['AutoRun Queue','Idempotent job creation, bounded retries, cancellation and per-repository concurrency.'],['Artifacts & Logs','Short-lived signed downloads, retention limits and redacted structured logs.']].map(x=>'<article class="panel tile"><h3>'+x[0]+'</h3><p>'+x[1]+'</p><span class="tag">DESIGN</span></article>').join('') + '</div>';
  }
  if (window.OCodeNavigation && typeof window.OCodeNavigation.registerPage === 'function') {
    window.OCodeNavigation.registerPage({id:'autorun',title:'OCodeJS AutoRun',icon:'↯',group:'PLATFORM',render});
  }
})();
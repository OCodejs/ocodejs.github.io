(() => {
  'use strict';
  const API_BASE = String(window.OCODEJS_AUTORUN_API_BASE || document.querySelector('meta[name="ocodejs-autorun-api"]')?.content || '').replace(/\/$/, '');
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const stateClass = (job) => job.status === 'completed' && job.conclusion === 'success' ? 'ok' : job.status === 'in_progress' ? 'warn' : job.status === 'completed' ? 'off' : '';
  const stateLabel = (job) => job.status === 'completed' ? String(job.conclusion || 'completed').toUpperCase() : String(job.status || 'unknown').toUpperCase();
  const date = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';
  const endpoint = (path) => API_BASE + path;

  async function request(path) {
    const response = await fetch(endpoint(path), { method: 'GET', cache: 'no-store', headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  }

  function render() {
    const markup = '<style>.autorun-view .panel,.autorun-view .stat,.autorun-view .notice,.autorun-view .state,.autorun-view .tag,.autorun-view .demo-pill,.autorun-view .btn{border-radius:0!important}.autorun-view .state.ok{color:var(--green)}.autorun-view .state.warn{color:var(--amber)}</style>' +
      '<div class="autorun-view">' +
      '<div class="page-head"><div><div class="eyebrow">PLATFORM / GIT + CI</div><h1>OCodeJS AutoRun</h1><p>GitHub repositories + GitHub Actions execution + Cloudflare D1 run history.</p></div><button class="btn ghost" id="autorunRefresh" type="button">↻ Refresh</button></div>' +
      '<div id="autorunNotice" class="notice">Đang kiểm tra OCodeJS AutoRun staging API…</div>' +
      '<div class="grid stats">' +
      '<div class="stat"><div class="stat-top">Workflow runs</div><div class="stat-value" id="autorunTotal">—</div><div class="stat-foot">D1 persisted snapshots</div></div>' +
      '<div class="stat"><div class="stat-top">Running</div><div class="stat-value" id="autorunRunning">—</div><div class="stat-foot">GitHub Actions</div></div>' +
      '<div class="stat"><div class="stat-top">Queued</div><div class="stat-value" id="autorunQueued">—</div><div class="stat-foot">GitHub Actions</div></div>' +
      '<div class="stat"><div class="stat-top">Failed</div><div class="stat-value" id="autorunFailed">—</div><div class="stat-foot">Non-success conclusions</div></div></div>' +
      '<section class="panel"><div class="panel-head"><strong>GITHUB ACTIONS RUN HISTORY</strong><small id="autorunSource">STAGING · READ ONLY</small></div><div id="autorunJobs" class="table-wrap"><div class="empty">Chưa có dữ liệu.</div></div></section>' +
      '<div style="height:14px"></div><div class="grid cards">' +
      '<article class="panel tile"><h3>Source of truth</h3><p>GitHub giữ repositories, branches, commits và Pull Requests. Chưa chuyển mã nguồn sang Git forge khác.</p><span class="tag">GITHUB</span></article>' +
      '<article class="panel tile"><h3>Execution engine</h3><p>GitHub Actions hosted runners thực thi workflow theo quota của tài khoản và loại repository.</p><span class="tag">GITHUB ACTIONS</span></article>' +
      '<article class="panel tile"><h3>Control plane</h3><p>Cloudflare Worker xác minh GitHub OIDC; D1 lưu trạng thái workflow run và event history.</p><span class="tag">CLOUDFLARE STAGING</span></article></div>' +
      '<p id="autorunCheckedAt" class="stat-foot" role="status" aria-live="polite"></p></div>';
    Promise.resolve().then(refresh);
    return markup;
  }

  async function refresh() {
    const notice = document.getElementById('autorunNotice');
    const jobsTarget = document.getElementById('autorunJobs');
    const button = document.getElementById('autorunRefresh');
    if (!notice || !jobsTarget) return;
    if (!API_BASE) {
      notice.textContent = 'API CHƯA ĐƯỢC CẤU HÌNH — Dashboard chưa kết nối Worker staging. Không hiển thị dữ liệu mẫu hoặc trạng thái giả.';
      jobsTarget.innerHTML = '<div class="empty">Chưa có endpoint Control API. Sau khi deploy Worker staging, cấu hình OCODEJS_AUTORUN_API_BASE hoặc meta ocodejs-autorun-api.</div>';
      return;
    }
    if (button) { button.disabled = true; button.textContent = '… Loading'; }
    try {
      const [summaryBody, jobsBody] = await Promise.all([
        request('/api/v1/autorun/summary'),
        request('/api/v1/autorun/jobs?limit=50')
      ]);
      const summary = summaryBody.summary || {};
      for (const [id, value] of [['autorunTotal', summary.total], ['autorunRunning', summary.running], ['autorunQueued', summary.queued], ['autorunFailed', summary.failed]]) {
        const node = document.getElementById(id); if (node) node.textContent = String(value ?? 0);
      }
      const jobs = Array.isArray(jobsBody.jobs) ? jobsBody.jobs : [];
      jobsTarget.innerHTML = jobs.length ? '<table class="table"><thead><tr><th>Run</th><th>Workflow / Repository</th><th>Branch / SHA</th><th>Status</th><th>Updated</th><th>Link</th></tr></thead><tbody>' +
        jobs.map(job => '<tr><td><code>#' + escapeHTML(job.id) + ' · ' + escapeHTML(job.attempt) + '</code></td><td><strong>' + escapeHTML(job.workflow_name) + '</strong><small style="display:block;color:var(--muted)">' + escapeHTML(job.repository) + ' · ' + escapeHTML(job.event_name) + '</small></td><td><code>' + escapeHTML(job.branch) + '</code><small style="display:block;color:var(--muted)">' + escapeHTML(String(job.sha || '').slice(0, 12)) + '</small></td><td><span class="state ' + stateClass(job) + '">' + escapeHTML(stateLabel(job)) + '</span></td><td>' + escapeHTML(date(job.updated_at)) + '</td><td>' + (job.html_url ? '<a href="' + escapeHTML(job.html_url) + '" target="_blank" rel="noopener noreferrer">Open ↗</a>' : '—') + '</td></tr>').join('') +
        '</tbody></table>' : '<div class="empty">Chưa nhận workflow_run event nào từ GitHub Actions.</div>';
      notice.textContent = 'CONNECTED · Dữ liệu thật từ GitHub Actions qua OIDC và Cloudflare D1. API chỉ nhận event từ workflow được cho phép.';
      const source = document.getElementById('autorunSource'); if (source) source.textContent = 'GITHUB ACTIONS → OIDC → WORKER → D1';
      const checked = document.getElementById('autorunCheckedAt'); if (checked) checked.textContent = 'Last checked: ' + new Date(jobsBody.checkedAt || Date.now()).toLocaleString('vi-VN');
    } catch (error) {
      notice.textContent = 'KHÔNG THỂ KẾT NỐI CONTROL API — ' + error.message + '. Dashboard không thay bằng dữ liệu mẫu.';
      jobsTarget.innerHTML = '<div class="empty">Không có snapshot cache. Kiểm tra Worker staging, CORS và D1 binding.</div>';
    } finally {
      if (button) { button.disabled = false; button.textContent = '↻ Refresh'; }
    }
  }

  if (window.OCodeNavigation && typeof window.OCodeNavigation.registerPage === 'function') {
    window.OCodeNavigation.registerPage({ id: 'autorun', title: 'OCodeJS AutoRun', icon: '↯', group: 'PLATFORM', render });
  }
  document.addEventListener('click', (event) => {
    if (event.target && event.target.closest && event.target.closest('#autorunRefresh')) refresh();
  });
})();

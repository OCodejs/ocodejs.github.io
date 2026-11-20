(() => {
  'use strict';

  const API = 'https://api.github.com';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const date = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';
  const stateClass = (value) => ({
    open: 'ok', closed: 'off', merged: 'ok', success: 'ok',
    failure: 'off', pending: 'warn', queued: 'warn', in_progress: 'warn'
  })[String(value || '').toLowerCase()] || '';
  let requestSequence = 0;
  let currentRepo = null;
  let pullRequests = [];
  let selectedPull = null;

  async function github(path, signal) {
    const response = await fetch(API + path, {
      method: 'GET',
      cache: 'no-store',
      signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (response.status === 403 || response.status === 429) {
      const reset = response.headers.get('x-ratelimit-reset');
      const resetText = reset ? ' Thử lại sau ' + date(Number(reset) * 1000) + '.' : '';
      throw new Error('GitHub API rate limit hoặc quyền truy cập bị giới hạn.' + resetText);
    }
    if (!response.ok) {
      let message = 'HTTP ' + response.status;
      try { message = (await response.json()).message || message; } catch {}
      throw new Error(message);
    }
    return response.json();
  }

  function render() {
    return '<style>' +
      '.github-workspace,.github-workspace .panel,.github-workspace .stat,.github-workspace .notice,.github-workspace .btn,.github-workspace input,.github-workspace select,.github-workspace .state,.github-workspace .tag{border-radius:0!important}' +
      '.github-workspace .toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
      '.github-workspace input,.github-workspace select{background:#080d14;border:1px solid #293548;color:#e6edf8;padding:10px;min-width:0}' +
      '.github-workspace .repo-input{flex:1;min-width:220px}' +
      '.github-workspace .split{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:14px}' +
      '.github-workspace .pr-item{padding:14px 16px;border-bottom:1px solid var(--line);cursor:pointer}' +
      '.github-workspace .pr-item:last-child{border-bottom:0}' +
      '.github-workspace .pr-item:hover,.github-workspace .pr-item[aria-current="true"]{background:#101a2a}' +
      '.github-workspace .pr-title{font-size:11px;color:#e5edff;font-weight:600}' +
      '.github-workspace .muted{font-size:9px;color:var(--muted);line-height:1.7}' +
      '.github-workspace .detail-body{padding:16px;display:grid;gap:12px}' +
      '.github-workspace .detail-row{display:grid;grid-template-columns:95px minmax(0,1fr);gap:8px;font-size:10px;overflow-wrap:anywhere}' +
      '.github-workspace .detail-row span:first-child{color:var(--muted)}' +
      '.github-workspace a{color:#9db6ff}' +
      '.github-workspace .empty{padding:24px;text-align:center;color:var(--muted);font-size:10px}' +
      '@media(max-width:760px){.github-workspace .split{grid-template-columns:1fr}.github-workspace .repo-input{min-width:100%}}' +
      '</style>' +
      '<div class="github-workspace">' +
      '<div class="page-head"><div><div class="eyebrow">DEVELOPER WORKSPACE / GITHUB</div><h1>GitHub Workspace</h1><p>Public repository, branch and Pull Request explorer. Read-only; no token, write permission or workflow dispatch.</p></div><span class="tag">PUBLIC API · READ ONLY</span></div>' +
      '<div class="notice" id="ghNotice" role="status" aria-live="polite">Nhập owner/repository để tải dữ liệu công khai từ GitHub.</div>' +
      '<section class="panel"><div class="panel-body"><form class="toolbar" id="ghRepoForm"><input class="repo-input" id="ghRepo" value="OCodejs/ocodejs.github.io" aria-label="GitHub owner/repository" placeholder="owner/repository" pattern="[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+" required><select id="ghState" aria-label="Pull Request state"><option value="open">Open PRs</option><option value="closed">Closed PRs</option><option value="all">All PRs</option></select><button class="btn" type="submit" id="ghLoad">Load repository</button></form></div></section>' +
      '<div style="height:14px"></div>' +
      '<div class="grid stats" id="ghStats">' +
      '<div class="stat"><div class="stat-top">Repository</div><div class="stat-value" style="font-size:15px" id="ghRepoName">—</div><div class="stat-foot">GitHub public metadata</div></div>' +
      '<div class="stat"><div class="stat-top">Open issues / PRs</div><div class="stat-value" id="ghOpenIssues">—</div><div class="stat-foot">GitHub open count</div></div>' +
      '<div class="stat"><div class="stat-top">Branches loaded</div><div class="stat-value" id="ghBranchCount">—</div><div class="stat-foot">First 50 branches</div></div>' +
      '<div class="stat"><div class="stat-top">Pull Requests loaded</div><div class="stat-value" id="ghPrCount">—</div><div class="stat-foot">Up to 50 latest updates</div></div></div>' +
      '<div class="split">' +
      '<section class="panel"><div class="panel-head"><strong>PULL REQUESTS</strong><small id="ghPrMeta">NOT LOADED</small></div><div id="ghPrList"><div class="empty">Chưa tải repository.</div></div></section>' +
      '<section class="panel"><div class="panel-head"><strong>PULL REQUEST DETAIL</strong><small id="ghDetailMeta">READ ONLY</small></div><div id="ghPrDetail" class="detail-body"><div class="empty">Chọn một Pull Request để xem chi tiết.</div></div></section>' +
      '</div><div style="height:14px"></div>' +
      '<section class="panel"><div class="panel-head"><strong>BRANCHES</strong><small>FIRST 50 · READ ONLY</small></div><div id="ghBranches" class="panel-body"><div class="empty">Chưa tải repository.</div></div></section>' +
      '<p class="stat-foot" id="ghCheckedAt"></p></div>';
  }

  function setNotice(message, isError = false) {
    const node = document.getElementById('ghNotice');
    if (node) {
      node.textContent = message;
      node.style.borderColor = isError ? '#63363d' : '';
      node.style.color = isError ? '#ffb9bf' : '';
    }
  }

  function renderPulls() {
    const root = document.getElementById('ghPrList');
    if (!root) return;
    const query = (document.getElementById('ghFilter')?.value || '').trim().toLowerCase();
    const visible = pullRequests.filter((pr) =>
      !query || (pr.title + ' ' + pr.number + ' ' + pr.user?.login + ' ' + pr.head?.ref + ' ' + pr.base?.ref)
        .toLowerCase().includes(query)
    );
    root.innerHTML = visible.length ? visible.map((pr) =>
      '<article class="pr-item" data-gh-pr="' + esc(pr.number) + '" tabindex="0" role="button" aria-current="' + (selectedPull?.number === pr.number ? 'true' : 'false') + '">' +
      '<div class="row" style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><span class="pr-title">#' + esc(pr.number) + ' · ' + esc(pr.title) + '</span><span class="state ' + stateClass(pr.merged_at ? 'merged' : pr.state) + '">' + (pr.merged_at ? 'MERGED' : esc(pr.state).toUpperCase()) + (pr.draft ? ' · DRAFT' : '') + '</span></div>' +
      '<div class="muted">' + esc(pr.user?.login) + ' · ' + esc(pr.head?.ref) + ' → ' + esc(pr.base?.ref) + ' · Updated ' + esc(date(pr.updated_at)) + '</div>' +
      '<div class="muted">' + (pr.labels || []).map((label) => esc(label.name)).join(' · ') + '</div></article>'
    ).join('') : '<div class="empty">Không tìm thấy Pull Request phù hợp.</div>';
  }

  async function loadPullDetail(number) {
    if (!currentRepo) return;
    const sequence = ++requestSequence;
    const detail = document.getElementById('ghPrDetail');
    if (detail) detail.innerHTML = '<div class="empty">Đang tải Pull Request #' + esc(number) + '…</div>';
    try {
      const [pr, reviews] = await Promise.all([
        github('/repos/' + currentRepo + '/pulls/' + number),
        github('/repos/' + currentRepo + '/pulls/' + number + '/reviews?per_page=100')
      ]);
      if (sequence !== requestSequence || !document.getElementById('ghPrDetail')) return;
      selectedPull = pr;
      const reviewCounts = reviews.reduce((acc, review) => {
        const key = String(review.state || 'COMMENTED').toUpperCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      const checks = await github('/repos/' + currentRepo + '/commits/' + pr.head.sha + '/check-runs?per_page=100').catch((error) => ({ error: error.message, check_runs: [] }));
      if (sequence !== requestSequence || !document.getElementById('ghPrDetail')) return;
      const checkRuns = checks.check_runs || [];
      const rows = [
        ['Status', pr.merged_at ? 'MERGED' : pr.state.toUpperCase() + (pr.draft ? ' · DRAFT' : '')],
        ['Author', pr.user?.login],
        ['Base', pr.base?.ref],
        ['Head', pr.head?.ref],
        ['Head SHA', pr.head.sha],
        ['Review', Object.entries(reviewCounts).map(([key, count]) => key + ': ' + count).join(' · ') || 'No reviews'],
        ['CI checks', checks.error || (checkRuns.length ? checkRuns.map((run) => run.name + ': ' + (run.conclusion || run.status)).join(' · ') : 'No check runs reported')],
        ['Created', date(pr.created_at)],
        ['Updated', date(pr.updated_at)]
      ];
      detail.innerHTML = rows.map(([key, value]) => '<div class="detail-row"><span>' + esc(key) + '</span><strong>' + esc(value) + '</strong></div>').join('') +
        '<div class="toolbar"><a href="' + esc(pr.html_url) + '" target="_blank" rel="noopener noreferrer">Open Pull Request ↗</a>' +
        (pr.diff_url ? '<a href="' + esc(pr.diff_url) + '" target="_blank" rel="noopener noreferrer">View diff ↗</a>' : '') + '</div>' +
        '<div class="muted">' + esc(pr.body || 'No description provided.') + '</div>';
      const meta = document.getElementById('ghDetailMeta');
      if (meta) meta.textContent = '#' + pr.number + ' · ' + (pr.merged_at ? 'MERGED' : pr.state.toUpperCase());
      renderPulls();
    } catch (error) {
      if (sequence !== requestSequence) return;
      if (detail) detail.innerHTML = '<div class="empty">Không tải được chi tiết: ' + esc(error.message) + '</div>';
    }
  }

  async function loadRepository(ownerRepo) {
    const normalized = ownerRepo.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(normalized)) {
      setNotice('Định dạng không hợp lệ. Dùng owner/repository.', true);
      return;
    }
    const sequence = ++requestSequence;
    currentRepo = normalized;
    selectedPull = null;
    pullRequests = [];
    setNotice('Đang tải metadata, branches và Pull Requests của ' + normalized + '…');
    const button = document.getElementById('ghLoad');
    if (button) { button.disabled = true; button.textContent = 'Loading…'; }
    try {
      const state = document.getElementById('ghState')?.value || 'open';
      const [repo, branches, pulls] = await Promise.all([
        github('/repos/' + normalized),
        github('/repos/' + normalized + '/branches?per_page=50'),
        github('/repos/' + normalized + '/pulls?state=' + state + '&sort=updated&direction=desc&per_page=50')
      ]);
      if (sequence !== requestSequence) return;
      pullRequests = pulls;
      const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = String(value); };
      set('ghRepoName', repo.full_name);
      set('ghOpenIssues', repo.open_issues_count);
      set('ghBranchCount', branches.length);
      set('ghPrCount', pulls.length);
      const meta = document.getElementById('ghPrMeta');
      if (meta) meta.textContent = state.toUpperCase() + ' · ' + pulls.length + ' RESULTS';
      const branchRoot = document.getElementById('ghBranches');
      if (branchRoot) branchRoot.innerHTML = branches.length
        ? '<div class="toolbar">' + branches.map((item) => '<span class="tag" title="' + esc(item.commit.sha) + '">' + esc(item.name) + '</span>').join(' ') + '</div>'
        : '<div class="empty">Không có branch hoặc API không trả về dữ liệu.</div>';
      const checked = document.getElementById('ghCheckedAt');
      if (checked) checked.textContent = 'Last checked: ' + date(new Date().toISOString()) + ' · GitHub API public unauthenticated · no data writes.';
      setNotice('Đã tải ' + repo.full_name + '. Dữ liệu chỉ đọc từ GitHub Public API; không có thao tác ghi hoặc chạy workflow.');
      renderPulls();
      const detail = document.getElementById('ghPrDetail');
      if (detail) detail.innerHTML = '<div class="empty">Chọn một Pull Request để xem review và CI checks.</div>';
      const list = document.getElementById('ghPrList');
      if (list && !document.getElementById('ghFilter')) {
        const filter = document.createElement('div');
        filter.className = 'panel-body';
        filter.innerHTML = '<input id="ghFilter" style="width:100%" placeholder="Filter title, number, author, branch…" aria-label="Filter Pull Requests">';
        list.prepend(filter);
        filter.querySelector('input').addEventListener('input', renderPulls);
      }
    } catch (error) {
      if (sequence !== requestSequence) return;
      setNotice('GitHub API error: ' + error.message, true);
      const list = document.getElementById('ghPrList');
      if (list) list.innerHTML = '<div class="empty">Không thể tải dữ liệu. Kiểm tra repository visibility, tên owner/repo hoặc API rate limit.</div>';
    } finally {
      if (sequence === requestSequence && button) { button.disabled = false; button.textContent = 'Load repository'; }
    }
  }

  document.addEventListener('submit', (event) => {
    if (event.target?.id !== 'ghRepoForm') return;
    event.preventDefault();
    loadRepository(document.getElementById('ghRepo')?.value || '');
  });
  document.addEventListener('change', (event) => {
    if (event.target?.id === 'ghState') loadRepository(document.getElementById('ghRepo')?.value || '');
  });
  document.addEventListener('click', (event) => {
    const item = event.target?.closest?.('[data-gh-pr]');
    if (item) loadPullDetail(Number(item.getAttribute('data-gh-pr')));
  });
  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target?.matches?.('[data-gh-pr]')) {
      event.preventDefault();
      loadPullDetail(Number(event.target.getAttribute('data-gh-pr')));
    }
  });

  if (window.OCodeNavigation?.registerPage) {
    window.OCodeNavigation.registerPage({
      id: 'github-workspace',
      title: 'GitHub Workspace',
      icon: '◉',
      group: 'DEVELOPER',
      render
    });
  }
})();

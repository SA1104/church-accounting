'use strict';
const { esc } = require('./layout');
const { icon } = require('./icons');

const SOURCE_BADGES = {
  meeting_live: { label: '실시간 회의녹음', bg: '#dbeafe', fg: '#1e40af' },
  meeting_audio: { label: '음성녹음 파일', bg: '#e0e7ff', fg: '#3730a3' },
  clova_note: { label: '클로바노트·텍스트', bg: '#d1fae5', fg: '#065f46' },
  kakaotalk: { label: '카카오톡 대화', bg: '#fef3c7', fg: '#92400e' }
};

function fmtMin(m) {
  const n = Math.max(0, Math.round(Number(m) || 0));
  if (!n) return '';
  const h = Math.floor(n / 60);
  const r = n % 60;
  if (h > 0 && r > 0) return `${h}시간 ${r}분`;
  if (h > 0) return `${h}시간`;
  return `${r}분`;
}

function renderArchiveCard(a) {
  const sb = SOURCE_BADGES[a.source_type] || SOURCE_BADGES.meeting_live;
  const sj = a.summary_json || {};
  const bullets = Array.isArray(sj.summaryBullets) ? sj.summaryBullets : [];
  const decisions = Array.isArray(sj.decisions) ? sj.decisions : [];
  const actions = Array.isArray(sj.actionItems) ? sj.actionItems : [];
  const facts = Array.isArray(sj.keyFacts) ? sj.keyFacts : [];
  const followUps = Array.isArray(sj.followUps) ? sj.followUps : [];

  return `
  <article class="card desk-arch-card" data-arch-id="${a.id}" style="padding:20px;border-left:4px solid #2563eb">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <span class="pill" style="background:${sb.bg};color:${sb.fg};font-weight:800">${esc(sb.label)}</span>
        <span class="pill" style="background:#eff6ff;color:#1d4ed8;font-weight:800">${esc(a.meeting_kind || '업무 기록')}</span>
        <span class="tnum" style="font-size:13px;color:var(--text-3);font-weight:700">${esc(a.doc_date)}</span>
      </div>
      <button type="button" class="btn-xs" data-del-arch="${a.id}" style="color:var(--danger)">삭제</button>
    </div>

    <h3 style="margin:10px 0 4px;font-size:18.5px;line-height:1.35">${esc(a.title)}</h3>
    ${a.participants ? `<p style="margin:0 0 8px;font-size:13px;color:var(--text-3)"><strong>참석·대화상대:</strong> ${esc(a.participants)}</p>` : ''}
    ${sj.oneLiner ? `<p style="margin:0 0 12px;padding:10px 14px;border-radius:10px;background:var(--bg-soft,rgba(37,99,235,0.06));font-size:14px;font-weight:600;color:var(--text)">${esc(sj.oneLiner)}</p>` : ''}

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;margin-top:8px">
      ${bullets.length ? `<div><strong style="font-size:13px;color:#2563eb">핵심 논의 요약</strong><ul style="margin:6px 0 0;padding-left:18px;font-size:13.8px;line-height:1.55">${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>` : ''}
      ${decisions.length ? `<div><strong style="font-size:13px;color:#059669">확정 · 결정 사항</strong><ul style="margin:6px 0 0;padding-left:18px;font-size:13.8px;line-height:1.55">${decisions.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>` : ''}
    </div>

    ${facts.length ? `<div style="margin-top:10px"><strong style="font-size:13px;color:#b45309">대화 속 중요 숫자 · 금액 · 일정 · 조건</strong><ul style="margin:5px 0 0;padding-left:18px;font-size:13.5px;line-height:1.5">${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}

    ${actions.length ? `
    <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border)">
      <strong style="font-size:13px;color:var(--text)">추출된 후속 할 일 (클릭 시 내 할 일 목록에 바로 추가)</strong>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
        ${actions.map((act) => {
          const label = `${act.owner ? '[' + act.owner + '] ' : ''}${act.task || ''}${act.due ? ' (' + act.due + ')' : ''}`;
          return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;background:var(--bg);padding:7px 11px;border-radius:8px;border:1px solid var(--border);font-size:13.5px">
            <span>${esc(label)}</span>
            <button type="button" class="btn-xs" data-promote-todo="${esc(label)}">+ 할 일 등록</button>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    ${followUps.length ? `<p style="margin:10px 0 0;font-size:13px;color:var(--text-2)"><strong>다음 확인 포인트:</strong> ${followUps.map((f) => esc(f)).join(' · ')}</p>` : ''}

    ${a.raw_preview ? `
    <details style="margin-top:10px">
      <summary style="cursor:pointer;font-size:13px;color:var(--text-3);font-weight:700">원문 대화 · 전사 내용 펼치기</summary>
      <pre style="margin-top:8px;padding:12px;border-radius:10px;background:var(--bg);border:1px solid var(--border);white-space:pre-wrap;word-break:break-word;font-size:12.5px;max-height:280px;overflow:auto">${esc(a.raw_preview)}</pre>
    </details>` : ''}
  </article>`;
}

function deskView(data, opts) {
  const { logs = [], archives = [] } = data || {};
  const { hasGeminiKey = false, todayStr = '', searchQ = '', kindFilter = '', notice = '' } = opts || {};

  const todos = logs.filter((x) => x.kind === 'todo' && x.status === 'pending');
  const doneTodos = logs.filter((x) => x.kind === 'todo' && x.status === 'done').slice(0, 8);
  const workLogs = logs.filter((x) => x.kind !== 'todo');

  const todayMin = workLogs.filter((x) => x.log_date === todayStr).reduce((acc, x) => acc + (Number(x.duration_min) || 0), 0);
  const catTotals = {};
  workLogs.forEach((x) => {
    const m = Number(x.duration_min) || 0;
    if (m > 0) catTotals[x.category] = (catTotals[x.category] || 0) + m;
  });

  return `
<style>
  .desk-tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:18px 0; }
  .desk-tab { padding:14px 12px; border-radius:14px; border:2px solid var(--border); background:var(--card, #fff); color:var(--text); font-weight:800; font-size:15px; cursor:pointer; text-align:center; transition:all .15s; }
  .desk-tab.active { border-color:#2563eb; background:#eff6ff; color:#1d4ed8; box-shadow:0 6px 18px rgba(37,99,235,0.14); }
  [data-theme="dark"] .desk-tab.active { background:rgba(37,99,235,0.22); color:#93c5fd; }
  .desk-panel { display:none; }
  .desk-panel.active { display:block; }
  .mic-hero { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:28px 20px; border-radius:22px; border:2.5px solid #2563eb; background:linear-gradient(180deg, rgba(37,99,235,0.06), rgba(16,185,129,0.05)); text-align:center; }
  .mic-btn { width:92px; height:92px; border-radius:50%; border:none; background:#2563eb; color:#fff; font-size:34px; font-weight:900; cursor:pointer; box-shadow:0 10px 28px rgba(37,99,235,0.35); transition:transform .15s, background .15s; display:flex; align-items:center; justify-content:center; }
  .mic-btn.rec { background:#e11d48; animation:deskPulse 1.2s infinite; }
  @keyframes deskPulse { 0%{box-shadow:0 0 0 0 rgba(225,29,72,0.55);} 70%{box-shadow:0 0 0 22px rgba(225,29,72,0);} 100%{box-shadow:0 0 0 0 rgba(225,29,72,0);} }
  .chip-ex { display:inline-block; padding:6px 12px; border-radius:999px; background:var(--bg); border:1px solid var(--border); font-size:12.5px; color:var(--text-2); cursor:pointer; }
  .chip-ex:hover { border-color:#2563eb; color:#2563eb; }
  .drop-zone { border:2px dashed #93c5fd; border-radius:16px; padding:22px; text-align:center; background:rgba(37,99,235,0.03); cursor:pointer; }
  .drop-zone.drag { background:rgba(37,99,235,0.11); border-color:#2563eb; }
  @media (max-width: 720px) { .desk-tabs { grid-template-columns:1fr; } }
</style>

<div class="container admin-wrap">
  <header class="admin-head" style="margin-bottom:12px">
    <div>
      <span class="pill" style="background:#dbeafe;color:#1e40af;font-weight:800">${icon('lock', 13)} 대표님 전용 비공개 통합 비서 (검색·외부 완전 차단)</span>
      <h1 style="margin-top:6px">음성 업무기록 · 회의록 · 카카오톡 정리 데스크</h1>
      <p style="margin:4px 0 0;font-size:14px;color:var(--text-2)">말 한마디로 한 일과 시간을 기록하고, 클로바노트 유무와 상관없이 모든 회의와 카카오톡 대화를 요약·분류해 영구 보관합니다.</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <a class="btn btn-sm" href="/admin">← 방문자 상황판</a>
    </div>
  </header>

  ${notice === 'gemini_saved' ? '<div class="callout" style="margin-bottom:14px;border-color:#059669;background:rgba(16,185,129,0.09)"><strong>Gemini AI 연결 완료:</strong> 이제 휴대폰 음성 녹음파일(.m4a/.mp3) 직접 청취 전사, 카톡 캡처 이미지 판독, 정밀 회의록 분류가 모두 작동합니다!</div>' : ''}

  <div class="kpi-grid tnum" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:14px">
    <div class="card" style="padding:14px"><span>오늘(${esc(todayStr)}) 기록한 업무시간</span><strong style="color:#2563eb">${fmtMin(todayMin) || '0분'}</strong></div>
    <div class="card" style="padding:14px"><span>남아 있는 할 일 (To-Do)</span><strong style="color:${todos.length ? '#e11d48' : '#059669'}">${todos.length}건</strong></div>
    <div class="card" style="padding:14px"><span>누적 보관 회의록 · 카톡</span><strong>${archives.length}건</strong></div>
    <div class="card" style="padding:14px">
      <span>AI 음성·대화 분석 엔진</span>
      <strong style="color:${hasGeminiKey ? '#059669' : '#d97706'};font-size:14px">${hasGeminiKey ? '✓ Gemini 2.5 AI 활성' : '기본 파서 (AI키 미등록)'}</strong>
    </div>
  </div>

  <details class="card" style="padding:14px 18px;margin-bottom:16px"${hasGeminiKey ? '' : ' open'}>
    <summary style="cursor:pointer;font-weight:800;font-size:14px">
      ${hasGeminiKey ? '⚙️ Gemini AI API 키 변경 · 관리 (현재 정상 연결됨)' : '🔑 [1회 설정 권장] 음성파일(.m4a) 자동 전사 & AI 정밀 요약을 위한 Gemini API 키 등록'}
    </summary>
    <form method="POST" action="/admin/desk/api/save-gemini-key" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center">
      <input type="password" name="gemini_key" placeholder="AIzaSy... (Google AI Studio Gemini API Key 입력 시 암호화 DB 보관)" style="flex:1 1 260px;padding:8px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);color:var(--text);font-size:13.5px">
      <button type="submit" class="btn btn-primary btn-sm">AI 키 저장</button>
    </form>
  </details>

  <!-- 3 Core Mode Tabs -->
  <div class="desk-tabs" role="tablist">
    <button type="button" class="desk-tab active" data-dtab="voice">🎙️ 1. 음성 업무·시간 명령</button>
    <button type="button" class="desk-tab" data-dtab="meeting">📝 2. 회의 녹음 · 클로바노트 분석</button>
    <button type="button" class="desk-tab" data-dtab="kakao">💬 3. 카카오톡 대화 정리</button>
  </div>

  <!-- TAB 1: VOICE COMMAND & WORK LOG -->
  <section class="desk-panel active" id="panel-voice">
    <div class="mic-hero">
      <button type="button" class="mic-btn" id="vc-mic-btn" aria-label="음성 명령 녹음 시작">🎙️</button>
      <h2 style="margin:14px 0 4px;font-size:20px" id="vc-status-title">마이크 버튼을 누르고 편하게 말씀하세요</h2>
      <p style="margin:0 0 14px;font-size:13.8px;color:var(--text-2)" id="vc-status-sub">했던 행동·걸린 시간·앞으로 해야 할 일을 말하면 자동으로 분류해 저장합니다.</p>

      <div style="width:100%;max-width:680px;display:flex;gap:8px;flex-wrap:wrap">
        <input type="text" id="vc-input" placeholder="말씀하신 내용이 여기에 표시됩니다 (직접 타이핑 후 엔터도 가능)" style="flex:1 1 260px;padding:12px 14px;border-radius:12px;border:2px solid var(--border);background:var(--card,#fff);color:var(--text);font-size:15px">
        <button type="button" class="btn btn-primary" id="vc-send-btn">즉시 기록 · 실행</button>
      </div>
      <p id="vc-toast" style="margin:10px 0 0;font-size:13.5px;font-weight:800;color:#059669"></p>

      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:12px">
        <span class="chip-ex" data-fill-vc="오전 10시부터 11시 반까지 부자생각 유튜브 광고 확인하고 댓글 점검했어">예시: “오전 10시~11시 반 유튜브 광고 점검했어”</span>
        <span class="chip-ex" data-fill-vc="방금 40분 동안 세무사 사무실이랑 부가세 자료 통화했어">예시: “방금 40분 동안 세무사 통화했어”</span>
        <span class="chip-ex" data-fill-vc="내일 오후 2시에 인테리어 업체 미팅하기 할 일 추가해줘">예시: “내일 오후 2시 미팅 할 일 추가해줘”</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:16px;margin-top:18px">
      <!-- To-Do List -->
      <div class="card">
        <h3 class="card-h" style="margin-bottom:10px">📌 챙겨야 할 일 (To-Do · ${todos.length}건)</h3>
        <div id="todo-list" style="display:flex;flex-direction:column;gap:8px">
          ${todos.length ? todos.map((t) => `
          <div class="card" style="padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;border:1.5px solid var(--border)">
            <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;flex:1">
              <input type="checkbox" data-toggle-log="${t.id}" style="margin-top:4px">
              <span>
                <strong style="font-size:14px">${esc(t.title)}</strong>
                <small style="display:block;color:var(--text-3)">${esc(t.log_date)}${t.time_range ? ' · ' + esc(t.time_range) : ''} · ${esc(t.category)}</small>
              </span>
            </label>
            <button type="button" class="btn-xs" data-del-log="${t.id}" style="color:var(--text-3)">✕</button>
          </div>`).join('') : '<p class="note" style="margin:0">남아 있는 할 일이 없습니다. 음성으로 “내일 ~하기 할 일 추가해줘”라고 말씀해 보세요!</p>'}
        </div>
        ${doneTodos.length ? `
        <details style="margin-top:12px">
          <summary style="cursor:pointer;font-size:12.5px;color:var(--text-3)">최근 완료한 할 일 (${doneTodos.length}건)</summary>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
            ${doneTodos.map((t) => `<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-3);text-decoration:line-through"><span>✓ ${esc(t.title)}</span><button type="button" class="btn-xs" data-del-log="${t.id}">삭제</button></div>`).join('')}
          </div>
        </details>` : ''}
      </div>

      <!-- Work Time Log -->
      <div class="card">
        <h3 class="card-h" style="margin-bottom:10px">⏱️ 내가 한 업무 · 시간 타임라인</h3>
        ${Object.keys(catTotals).length ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
          ${Object.entries(catTotals).map(([cat, mins]) => `<span class="pill" style="font-size:12px">${esc(cat)}: <strong>${fmtMin(mins)}</strong></span>`).join('')}
        </div>` : ''}
        <div id="worklog-list" style="display:flex;flex-direction:column;gap:8px;max-height:420px;overflow:auto">
          ${workLogs.length ? workLogs.map((w) => `
          <div style="padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div>
              <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                <span class="pill" style="font-size:11.5px">${esc(w.category)}</span>
                <span class="tnum" style="font-size:12px;color:var(--text-3);font-weight:700">${esc(w.log_date)}${w.time_range ? ' · ' + esc(w.time_range) : ''}</span>
                ${w.duration_min ? `<strong class="tnum" style="font-size:12px;color:#2563eb">${fmtMin(w.duration_min)}</strong>` : ''}
              </div>
              <div style="margin-top:4px;font-size:14px;font-weight:700">${esc(w.title)}</div>
            </div>
            <button type="button" class="btn-xs" data-del-log="${w.id}" style="color:var(--text-3)">✕</button>
          </div>`).join('') : '<p class="note" style="margin:0">아직 기록된 업무 타임라인이 없습니다.</p>'}
        </div>
      </div>
    </div>
  </section>

  <!-- TAB 2: MEETING RECORDER & CLOVA NOTE ANALYZER -->
  <section class="desk-panel" id="panel-meeting">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:16px">
      <!-- Live Non-Clova Meeting Recorder -->
      <div class="card" style="border:2px solid #2563eb">
        <span class="pill" style="background:#dbeafe;color:#1e40af;font-weight:800">클로바노트 안 켰을 때 · 현장 바로 녹음</span>
        <h2 class="card-h" style="margin:8px 0 6px;font-size:19px">🔴 실시간 회의 녹음 &amp; 자동 요약</h2>
        <p style="margin:0 0 14px;font-size:13.5px;color:var(--text-2)">회의 시작할 때 버튼만 눌러 두세요. 화면 꺼짐을 방지하며 음성과 실시간 받아쓰기를 동시에 기록한 뒤, 종료 즉시 어떤 회의였는지 요약·저장합니다.</p>

        <input type="text" id="mt-live-title" placeholder="회의 제목 메모 (비워두면 AI가 내용 보고 자동 작성)" class="admin-input" style="margin-bottom:10px;width:100%">

        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
          <button type="button" class="btn btn-primary" id="mt-rec-start">🔴 실시간 회의 녹음 시작</button>
          <button type="button" class="btn" id="mt-rec-stop" disabled style="border-color:#e11d48;color:#e11d48;font-weight:800">⏹️ 회의 종료 &amp; AI 요약 저장</button>
          <span class="tnum" id="mt-rec-timer" style="font-weight:900;font-size:16px;color:#e11d48">00:00</span>
        </div>

        <textarea id="mt-live-transcript" rows="6" placeholder="실시간 받아쓰기 내용이 여기에 쌓입니다 (회의 중 직접 메모를 덧붙이셔도 함께 분석됩니다)..." class="contact-ta" style="width:100%;font-size:13.5px"></textarea>
        <p id="mt-live-status" style="margin:8px 0 0;font-size:13px;font-weight:700;color:#2563eb"></p>
      </div>

      <!-- File Upload / Clova Note Paste -->
      <div class="card">
        <span class="pill" style="background:#d1fae5;color:#065f46;font-weight:800">휴대폰 녹음파일(.m4a/.mp3) · 클로바노트(.txt) 겸용</span>
        <h2 class="card-h" style="margin:8px 0 6px;font-size:19px">📂 녹음파일 또는 클로바노트 올리기</h2>
        <p style="margin:0 0 12px;font-size:13.5px;color:var(--text-2)">휴대폰 기본 녹음기로 녹음한 음성파일(<code>.m4a</code>, <code>.mp3</code>, <code>.wav</code>)이나 클로바노트 텍스트(<code>.txt</code>)를 올리거나 아래 칸에 붙여넣어 주세요.</p>

        <input type="text" id="mt-up-title" placeholder="회의 제목 (선택 · 비워두면 자동 생성)" class="admin-input" style="margin-bottom:10px;width:100%">

        <label class="drop-zone" id="mt-drop-zone" style="display:block;margin-bottom:10px">
          <input type="file" id="mt-file-input" accept=".txt,.md,.csv,.m4a,.mp3,.wav,.webm,.ogg,.mp4,audio/*" style="display:none">
          <strong style="font-size:14.5px;color:#1d4ed8" id="mt-file-label">클릭하거나 파일을 여기에 끌어다 놓으세요 (.m4a / .mp3 / .wav / .txt)</strong>
          <small style="display:block;margin-top:4px;color:var(--text-3)">최대 40MB 음성 녹음 또는 텍스트 파일 지원</small>
        </label>

        <textarea id="mt-up-text" rows="5" placeholder="또는 클로바노트·회의 메모 텍스트를 여기에 바로 붙여넣으세요..." class="contact-ta" style="width:100%;font-size:13.5px;margin-bottom:10px"></textarea>

        <button type="button" class="btn btn-primary" id="mt-up-submit" style="width:100%">회의 요약 · 성격 분류 · 할 일 추출 저장하기</button>
        <p id="mt-up-status" style="margin:8px 0 0;font-size:13px;font-weight:700;color:#059669"></p>
      </div>
    </div>
  </section>

  <!-- TAB 3: KAKAOTALK ANALYZER -->
  <section class="desk-panel" id="panel-kakao">
    <div class="card" style="border:2px solid #f59e0b">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:10px">
        <div>
          <span class="pill" style="background:#fef3c7;color:#92400e;font-weight:800">카카오톡 대화 자동 파서 · 요약기</span>
          <h2 class="card-h" style="margin:8px 0 4px;font-size:20px">💬 카카오톡에서 나눈 대화 · 약속 · 금액 한눈에 정리</h2>
          <p style="margin:0;font-size:13.8px;color:var(--text-2)">카톡은 보안 정책상 외부 앱이 몰래 읽을 수 없지만, 카톡 자체의 <strong>[대화 내용 내보내기]</strong> 파일이나 복사한 글·캡처 사진을 올리시면 날짜와 대화자를 자동 분리해 완벽히 정리해 드립니다.</p>
        </div>
      </div>

      <details style="margin-bottom:14px;padding:10px 14px;border-radius:12px;background:var(--bg);border:1px solid var(--border)">
        <summary style="cursor:pointer;font-size:13.5px;font-weight:800;color:#b45309">💡 카카오톡 대화 3초 만에 내보내는 방법 보기 (모바일 / PC)</summary>
        <ol style="margin:8px 0 0;padding-left:20px;font-size:13.2px;line-height:1.6;color:var(--text-2)">
          <li><strong>휴대폰 카카오톡:</strong> 정리할 채팅방 우측 상단 <code>[≡]</code> → 하단 <code>[⚙️ 설정]</code> → <code>[대화 내용 내보내기]</code> → <code>[텍스트 메시지만 보내기]</code> 선택 후 내 휴대폰 파일 저장 또는 복사해서 아래에 올리기!</li>
          <li><strong>PC 카카오톡:</strong> 채팅방 안에서 <code>Ctrl + S</code> (대화 내용 저장) → 저장된 <code>.txt</code> 파일을 아래 박스에 그대로 끌어다 놓기!</li>
          <li><strong>짧은 구간 / 캡처본:</strong> 필요한 대화만 마우스로 드래그해 복사·붙여넣기 하거나, 카톡 화면 캡처 이미지(<code>.png</code>/<code>.jpg</code>)를 올려도 분석됩니다!</li>
        </ol>
      </details>

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
        <span style="font-size:13.5px;font-weight:800">분석할 대화 기간:</span>
        <label class="chip-ex"><input type="radio" name="kk-days" value="1" checked> 오늘(최근 1일) 대화만</label>
        <label class="chip-ex"><input type="radio" name="kk-days" value="3"> 최근 3일</label>
        <label class="chip-ex"><input type="radio" name="kk-days" value="7"> 최근 7일</label>
        <label class="chip-ex"><input type="radio" name="kk-days" value="0"> 파일 전체 기간</label>
      </div>

      <input type="text" id="kk-title" placeholder="대화방 메모 (예: 김세무사님 부가세 카톡, 인테리어 실장님 카톡 — 비워두면 자동 생성)" class="admin-input" style="margin-bottom:10px;width:100%">

      <label class="drop-zone" id="kk-drop-zone" style="display:block;margin-bottom:10px;border-color:#fbbf24">
        <input type="file" id="kk-file-input" accept=".txt,.csv,image/*" style="display:none">
        <strong style="font-size:14.5px;color:#b45309" id="kk-file-label">카카오톡 내보내기 파일(.txt/.csv) 또는 캡처 이미지를 선택하세요</strong>
        <small style="display:block;margin-top:4px;color:var(--text-3)">수개월 치 전체 대화 .txt를 올려도 위에서 고른 최근 날짜 대화만 똑똑하게 발췌합니다</small>
      </label>

      <textarea id="kk-text" rows="6" placeholder="또는 카카오톡 대화를 복사해서 여기에 그대로 붙여넣으세요..." class="contact-ta" style="width:100%;font-size:13.5px;margin-bottom:10px"></textarea>

      <button type="button" class="btn btn-primary" id="kk-submit" style="width:100%">카카오톡 핵심 용건 · 약속 · 금액 요약 저장하기</button>
      <p id="kk-status" style="margin:8px 0 0;font-size:13px;font-weight:700;color:#059669"></p>
    </div>
  </section>

  <!-- UNIFIED SEARCHABLE ARCHIVE -->
  <section class="sec" style="margin-top:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
      <h2 style="margin:0;font-size:20px">🗂️ 저장된 회의록 · 카카오톡 분석 보관함 (${archives.length}건)</h2>
      <form method="GET" action="/admin/desk" style="display:flex;gap:6px;flex-wrap:wrap">
        <select name="kind" class="admin-input" style="width:auto;padding:7px 10px;font-size:13px">
          <option value=""${!kindFilter ? ' selected' : ''}>전체 기록</option>
          <option value="meeting_live"${kindFilter === 'meeting_live' ? ' selected' : ''}>실시간 회의녹음</option>
          <option value="meeting_audio"${kindFilter === 'meeting_audio' ? ' selected' : ''}>음성녹음 파일</option>
          <option value="clova_note"${kindFilter === 'clova_note' ? ' selected' : ''}>클로바노트·텍스트</option>
          <option value="kakaotalk"${kindFilter === 'kakaotalk' ? ' selected' : ''}>카카오톡 대화</option>
        </select>
        <input type="search" name="q" value="${esc(searchQ)}" placeholder="회의 성격 · 참석자 · 단어 검색..." class="admin-input" style="width:210px;padding:7px 12px;font-size:13px">
        <button type="submit" class="btn btn-sm">검색</button>
      </form>
    </div>

    <div id="archive-list" style="display:flex;flex-direction:column;gap:14px">
      ${archives.length ? archives.map(renderArchiveCard).join('') : '<div class="card"><p class="note" style="margin:0">아직 보관된 회의록이나 카카오톡 요약본이 없습니다. 위 탭에서 첫 회의나 카톡 대화를 등록해 보세요!</p></div>'}
    </div>
  </section>
</div>

<script>
(function(){
  // Tab Switching
  document.querySelectorAll('[data-dtab]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var target = btn.getAttribute('data-dtab');
      document.querySelectorAll('[data-dtab]').forEach(function(b){ b.classList.toggle('active', b === btn); });
      document.querySelectorAll('.desk-panel').forEach(function(p){ p.classList.toggle('active', p.id === 'panel-' + target); });
    });
  });

  // Example chips
  document.querySelectorAll('[data-fill-vc]').forEach(function(ch){
    ch.addEventListener('click', function(){
      document.getElementById('vc-input').value = ch.getAttribute('data-fill-vc');
      document.getElementById('vc-input').focus();
    });
  });

  // 1. Voice Command & Work Logger
  var vcBtn = document.getElementById('vc-mic-btn');
  var vcInp = document.getElementById('vc-input');
  var vcSend = document.getElementById('vc-send-btn');
  var vcTitle = document.getElementById('vc-status-title');
  var vcToast = document.getElementById('vc-toast');
  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var vcRec = null, vcListening = false;

  function submitVoiceCommand(text) {
    var val = (text || vcInp.value || '').trim();
    if (!val) return;
    vcSend.disabled = true;
    vcToast.textContent = '분석 및 저장 중...';
    fetch('/admin/desk/api/voice-cmd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: val })
    }).then(function(r){ return r.json(); }).then(function(d){
      vcSend.disabled = false;
      if (d && d.ok) {
        vcToast.textContent = '✓ ' + (d.reply || '저장 완료!');
        vcInp.value = '';
        setTimeout(function(){ window.location.reload(); }, 650);
      } else {
        vcToast.textContent = (d && d.error) || '저장 실패';
      }
    }).catch(function(){ vcSend.disabled = false; vcToast.textContent = '통신 오류가 발생했습니다.'; });
  }

  vcSend.addEventListener('click', function(){ submitVoiceCommand(); });
  vcInp.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); submitVoiceCommand(); } });

  if (SpeechRec) {
    vcRec = new SpeechRec();
    vcRec.lang = 'ko-KR';
    vcRec.interimResults = true;
    vcRec.continuous = false;
    vcRec.onstart = function(){
      vcListening = true;
      vcBtn.classList.add('rec');
      vcTitle.textContent = '듣고 있습니다… 말씀이 끝나면 자동으로 기록됩니다!';
    };
    vcRec.onresult = function(ev){
      var txt = '';
      for (var i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
      vcInp.value = txt;
    };
    vcRec.onend = function(){
      vcListening = false;
      vcBtn.classList.remove('rec');
      vcTitle.textContent = '마이크 버튼을 누르고 편하게 말씀하세요';
      if (vcInp.value.trim().length >= 3) submitVoiceCommand(vcInp.value.trim());
    };
    vcRec.onerror = function(){
      vcListening = false;
      vcBtn.classList.remove('rec');
      vcTitle.textContent = '마이크 권한을 허용해 주시거나 아래 입력창을 이용해 주세요';
    };
    vcBtn.addEventListener('click', function(){
      if (vcListening) vcRec.stop();
      else { vcInp.value = ''; vcRec.start(); }
    });
  } else {
    vcBtn.addEventListener('click', function(){ vcInp.focus(); vcTitle.textContent = '이 브라우저는 키보드 마이크 버튼 또는 텍스트 입력을 사용해 주세요'; });
  }

  // Toggle / Delete Log & Promote Action Item to Todo
  document.addEventListener('change', function(e){
    var id = e.target && e.target.getAttribute('data-toggle-log');
    if (!id) return;
    fetch('/admin/desk/api/log-toggle', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id: Number(id) }) })
      .then(function(){ window.location.reload(); });
  });
  document.addEventListener('click', function(e){
    var delLog = e.target && e.target.getAttribute('data-del-log');
    if (delLog) {
      fetch('/admin/desk/api/log-delete', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id: Number(delLog) }) })
        .then(function(){ window.location.reload(); });
      return;
    }
    var delArch = e.target && e.target.getAttribute('data-del-arch');
    if (delArch && confirm('이 보관 기록을 삭제할까요?')) {
      fetch('/admin/desk/api/archive-delete', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id: Number(delArch) }) })
        .then(function(){ window.location.reload(); });
      return;
    }
    var promo = e.target && e.target.getAttribute('data-promote-todo');
    if (promo) {
      e.target.disabled = true;
      fetch('/admin/desk/api/voice-cmd', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text: promo + ' 할 일 추가해줘' }) })
        .then(function(){ e.target.textContent = '✓ 등록됨'; });
    }
  });

  // Helper: read File as text or base64
  function fileToPayload(file) {
    return new Promise(function(resolve, reject){
      var isText = /\.(txt|md|csv)$/i.test(file.name) || /^text\//i.test(file.type);
      var reader = new FileReader();
      reader.onerror = reject;
      if (isText) {
        reader.onload = function(){ resolve({ fileName: file.name, mimeType: 'text/plain', rawText: String(reader.result || '') }); };
        reader.readAsText(file, 'utf-8');
      } else {
        reader.onload = function(){
          var s = String(reader.result || '');
          var comma = s.indexOf(',');
          resolve({ fileName: file.name, mimeType: file.type || 'audio/mp4', base64Data: comma >= 0 ? s.slice(comma + 1) : s });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 2A. Live Non-Clova Meeting Recorder (WakeLock + SpeechRecognition + MediaRecorder)
  var mtStart = document.getElementById('mt-rec-start');
  var mtStop = document.getElementById('mt-rec-stop');
  var mtTimer = document.getElementById('mt-rec-timer');
  var mtTrans = document.getElementById('mt-live-transcript');
  var mtLiveStatus = document.getElementById('mt-live-status');
  var mediaRec = null, audioChunks = [], liveSpeech = null, keepSpeechAlive = false, secCount = 0, timerInt = null, wakeLockObj = null;

  mtStart.addEventListener('click', async function(){
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRec = new MediaRecorder(stream);
      mediaRec.ondataavailable = function(ev){ if (ev.data && ev.data.size > 0) audioChunks.push(ev.data); };
      mediaRec.start(2000);

      if (navigator.wakeLock && navigator.wakeLock.request) {
        try { wakeLockObj = await navigator.wakeLock.request('screen'); } catch(_){}
      }

      if (SpeechRec) {
        keepSpeechAlive = true;
        liveSpeech = new SpeechRec();
        liveSpeech.lang = 'ko-KR';
        liveSpeech.continuous = true;
        liveSpeech.interimResults = false;
        liveSpeech.onresult = function(ev){
          for (var i = ev.resultIndex; i < ev.results.length; i++) {
            if (ev.results[i].isFinal) {
              mtTrans.value += (mtTrans.value ? '\n' : '') + ev.results[i][0].transcript.trim();
              mtTrans.scrollTop = mtTrans.scrollHeight;
            }
          }
        };
        liveSpeech.onend = function(){ if (keepSpeechAlive) { try { liveSpeech.start(); } catch(_){} } };
        try { liveSpeech.start(); } catch(_){}
      }

      secCount = 0;
      mtStart.disabled = true;
      mtStop.disabled = false;
      mtLiveStatus.textContent = '녹음 및 실시간 받아쓰기 진행 중... (화면 꺼짐 방지 켜짐)';
      timerInt = setInterval(function(){
        secCount++;
        mtTimer.textContent = String(Math.floor(secCount / 60)).padStart(2, '0') + ':' + String(secCount % 60).padStart(2, '0');
      }, 1000);
    } catch (err) {
      mtLiveStatus.textContent = '마이크 접근 권한을 허용해 주세요: ' + err.message;
    }
  });

  mtStop.addEventListener('click', function(){
    keepSpeechAlive = false;
    if (liveSpeech) { try { liveSpeech.stop(); } catch(_){} }
    if (timerInt) clearInterval(timerInt);
    if (wakeLockObj) { try { wakeLockObj.release(); } catch(_){} wakeLockObj = null; }
    mtStop.disabled = true;
    mtLiveStatus.textContent = '회의 음성과 메모를 AI가 분석·분류하여 저장하는 중입니다 (약 5~15초)...';

    if (!mediaRec) return;
    mediaRec.onstop = function(){
      mediaRec.stream.getTracks().forEach(function(t){ t.stop(); });
      var blob = new Blob(audioChunks, { type: mediaRec.mimeType || 'audio/webm' });
      var reader = new FileReader();
      reader.onload = function(){
        var s = String(reader.result || '');
        var b64 = s.indexOf(',') >= 0 ? s.slice(s.indexOf(',') + 1) : '';
        fetch('/admin/desk/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType: 'meeting_live',
            titleHint: document.getElementById('mt-live-title').value,
            rawText: mtTrans.value,
            fileName: 'live_meeting.webm',
            mimeType: (blob.type || 'audio/webm').split(';')[0],
            base64Data: blob.size < 32 * 1024 * 1024 ? b64 : ''
          })
        }).then(function(r){ return r.json(); }).then(function(d){
          mtStart.disabled = false;
          if (d && d.ok) {
            mtLiveStatus.textContent = '✓ 회의록 저장 완료! 아래 보관함으로 이동합니다.';
            setTimeout(function(){ window.location.href = '/admin/desk'; }, 600);
          } else {
            mtLiveStatus.textContent = (d && d.error) || '분석 실패';
          }
        }).catch(function(){ mtStart.disabled = false; mtLiveStatus.textContent = '서버 통신 오류'; });
      };
      reader.readAsDataURL(blob);
    };
    mediaRec.stop();
  });

  // 2B. File Upload / Clova Note Submit
  var mtFileInp = document.getElementById('mt-file-input');
  var mtFileLbl = document.getElementById('mt-file-label');
  var selectedMtFile = null;
  mtFileInp.addEventListener('change', function(){
    selectedMtFile = mtFileInp.files && mtFileInp.files[0];
    if (selectedMtFile) mtFileLbl.textContent = '선택됨: ' + selectedMtFile.name + ' (' + (selectedMtFile.size / 1048576).toFixed(1) + 'MB)';
  });

  document.getElementById('mt-up-submit').addEventListener('click', async function(){
    var btn = this, st = document.getElementById('mt-up-status');
    btn.disabled = true;
    st.textContent = '회의 내용을 정밀 분석하고 어떤 회의였는지 분류하는 중입니다 (음성파일은 10~25초 소요)...';
    try {
      var payload = {
        sourceType: 'clova_note',
        titleHint: document.getElementById('mt-up-title').value,
        rawText: document.getElementById('mt-up-text').value
      };
      if (selectedMtFile) {
        var fp = await fileToPayload(selectedMtFile);
        if (fp.rawText) payload.rawText = (payload.rawText ? payload.rawText + '\n' : '') + fp.rawText;
        if (fp.base64Data) {
          payload.sourceType = 'meeting_audio';
          payload.fileName = fp.fileName;
          payload.mimeType = fp.mimeType;
          payload.base64Data = fp.base64Data;
        }
      }
      var res = await fetch('/admin/desk/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      var d = await res.json();
      btn.disabled = false;
      if (d && d.ok) {
        st.textContent = '✓ 분석 및 보관 완료!';
        setTimeout(function(){ window.location.href = '/admin/desk'; }, 500);
      } else {
        st.textContent = (d && d.error) || '분석 중 오류가 발생했습니다.';
      }
    } catch (e) {
      btn.disabled = false;
      st.textContent = '오류: ' + e.message;
    }
  });

  // 3. KakaoTalk Submit
  var kkFileInp = document.getElementById('kk-file-input');
  var kkFileLbl = document.getElementById('kk-file-label');
  var selectedKkFile = null;
  kkFileInp.addEventListener('change', function(){
    selectedKkFile = kkFileInp.files && kkFileInp.files[0];
    if (selectedKkFile) kkFileLbl.textContent = '선택됨: ' + selectedKkFile.name;
  });

  document.getElementById('kk-submit').addEventListener('click', async function(){
    var btn = this, st = document.getElementById('kk-status');
    btn.disabled = true;
    st.textContent = '카카오톡 대화를 날짜·화자별로 정리하고 핵심 약속과 숫자를 추출하는 중입니다...';
    try {
      var days = 1;
      document.querySelectorAll('input[name="kk-days"]').forEach(function(r){ if (r.checked) days = Number(r.value); });
      var payload = {
        sourceType: 'kakaotalk',
        dateWindowDays: days,
        titleHint: document.getElementById('kk-title').value,
        rawText: document.getElementById('kk-text').value
      };
      if (selectedKkFile) {
        var fp = await fileToPayload(selectedKkFile);
        if (fp.rawText) payload.rawText = (payload.rawText ? payload.rawText + '\n' : '') + fp.rawText;
        if (fp.base64Data) {
          payload.fileName = fp.fileName;
          payload.mimeType = fp.mimeType;
          payload.base64Data = fp.base64Data;
        }
      }
      var res = await fetch('/admin/desk/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      var d = await res.json();
      btn.disabled = false;
      if (d && d.ok) {
        st.textContent = '✓ 카카오톡 대화 정리 및 저장 완료!';
        setTimeout(function(){ window.location.href = '/admin/desk'; }, 500);
      } else {
        st.textContent = (d && d.error) || '분석할 카카오톡 대화 내용을 확인해 주세요.';
      }
    } catch (e) {
      btn.disabled = false;
      st.textContent = '오류: ' + e.message;
    }
  });
})();
</script>`;
}

module.exports = { deskView };

'use strict';
/**
 * BoozaThink Owner Private Assistant Engine (backend/lib/desk-assistant.js)
 * 1) Voice Command & Work-Time Logger (Korean natural speech -> structured work_log / todo / memo)
 * 2) Meeting Analyzer (Live browser audio, raw .m4a/.mp3/.wav voice memo, OR Clova Note .txt)
 * 3) KakaoTalk Analyzer (Mobile/PC KakaoTalk .txt export, copy-paste, OR KakaoTalk screenshot images)
 */

const GEMINI_MODEL = 'gemini-2.5-flash';

function kstNowParts() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  const iso = d.toISOString();
  return {
    dateStr: iso.slice(0, 10),
    timeStr: iso.slice(11, 16),
    tomorrowStr: new Date(d.getTime() + 86400000).toISOString().slice(0, 10)
  };
}

function guessCategory(text) {
  const s = String(text || '');
  if (/유튜브|쇼츠|릴스|스레드|인스타|블로그|광고|썸네일|홍보|마케팅|애드센스/i.test(s)) return '마케팅·유튜브';
  if (/세무|부가세|종소세|세금|회계|기장|대출|정책자금|보증|은행|정산|송금|입금|계산서/i.test(s)) return '세무·자금';
  if (/부자생각|boozathink|계산기|시뮬레이터|서버|개발|코드|사이트|코딩|기획/i.test(s)) return '부자생각·기획';
  if (/미팅|회의|통화|전화|거래처|업체|계약|인테리어|방문|상담/i.test(s)) return '미팅·대외협의';
  return '일반업무';
}

function parseKoreanVoiceHeuristic(spokenText) {
  const { dateStr, timeStr, tomorrowStr } = kstNowParts();
  const raw = String(spokenText || '').trim();
  if (!raw) return [];

  // Split compound utterances gently if separated by '그리고 할 일' or newlines
  const chunks = raw.split(/\n+|(?=\s*그리고\s*(?:내일|모레|할\s*일|해야\s*할))/g).map((c) => c.trim()).filter(Boolean);
  return chunks.map((chunk) => {
    const isTodo = /(할\s*일|해야\s*할|잊지\s*말고|챙겨|예약해|일정\s*추가|메모해\s*둬|보내야|연락해야|하기\s*추가)/.test(chunk) ||
      (/^(내일|모레|이번\s*주|다음\s*주)/.test(chunk) && !/(했어|완료|마쳤어|끝냈어)/.test(chunk));

    let logDate = dateStr;
    if (/내일/.test(chunk)) logDate = tomorrowStr;

    let durationMin = 0;
    const hrMatch = /(\d+(?:\.\d+)?)\s*시간(?:\s*(\d+)\s*분)?/.exec(chunk);
    const halfHrMatch = /(\d+)\s*시간\s*반/.exec(chunk);
    const minOnlyMatch = /(\d+)\s*분\s*(?:동안|간|정도|걸려)?/.exec(chunk);

    if (halfHrMatch) {
      durationMin = parseInt(halfHrMatch[1], 10) * 60 + 30;
    } else if (hrMatch) {
      durationMin = Math.round(parseFloat(hrMatch[1]) * 60) + (hrMatch[2] ? parseInt(hrMatch[2], 10) : 0);
    } else if (minOnlyMatch && !/시\s*\d+\s*분/.test(chunk)) {
      durationMin = parseInt(minOnlyMatch[1], 10);
    }

    let timeRange = '';
    const rangeRe = /(오전|오후|아침|저녁|밤)?\s*(\d{1,2})\s*시(?:\s*(반|\d{1,2}\s*분))?\s*(?:부터|~|-|에서)\s*(오전|오후|저녁|밤)?\s*(\d{1,2})\s*시(?:\s*(반|\d{1,2}\s*분))?/;
    const rm = rangeRe.exec(chunk);
    if (rm) {
      const to24 = (ampm, hStr, mStr, prevH) => {
        let h = parseInt(hStr, 10);
        if (/오후|저녁|밤/.test(ampm || '') && h < 12) h += 12;
        else if (!ampm && prevH != null && h < prevH && h <= 11) h += 12;
        const m = mStr === '반' ? 30 : (mStr ? parseInt(mStr, 10) : 0);
        return { h, m, fmt: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
      };
      const t1 = to24(rm[1], rm[2], rm[3], null);
      const t2 = to24(rm[4] || rm[1], rm[5], rm[6], t1.h);
      timeRange = `${t1.fmt} ~ ${t2.fmt}`;
      const diff = (t2.h * 60 + t2.m) - (t1.h * 60 + t1.m);
      if (diff > 0 && diff <= 960 && !durationMin) durationMin = diff;
    } else {
      const singleTime = /(오전|오후|아침|저녁|밤)?\s*(\d{1,2})\s*시(?:\s*(반|\d{1,2}\s*분))?(?:에)?/.exec(chunk);
      if (singleTime) {
        let h = parseInt(singleTime[2], 10);
        if (/오후|저녁|밤/.test(singleTime[1] || '') && h < 12) h += 12;
        const m = singleTime[3] === '반' ? 30 : (singleTime[3] ? parseInt(singleTime[3], 10) : 0);
        timeRange = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      } else if (!isTodo) {
        timeRange = timeStr;
      }
    }

    const cleanTitle = chunk
      .replace(/(할\s*일\s*추가해\s*줘|할\s*일에?\s*넣어\s*줘|기록해\s*줘|적어\s*줘|저장해\s*줘|추가해\s*줘|기억해\s*줘)\.?$/g, '')
      .trim();

    return {
      log_date: logDate,
      kind: isTodo ? 'todo' : 'work_log',
      status: isTodo ? 'pending' : 'done',
      category: guessCategory(chunk),
      time_range: timeRange,
      duration_min: durationMin,
      title: cleanTitle || chunk,
      raw_voice: chunk
    };
  });
}

async function callGeminiJson(apiKey, parts, systemInstruction) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`Gemini HTTP ${res.status}: ${errTxt.slice(0, 200)}`);
  }
  const data = await res.json();
  const txt = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
    data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!txt) throw new Error('Empty Gemini response');
  return JSON.parse(txt);
}

async function uploadGeminiLargeFile(apiKey, buf, mimeType, displayName) {
  const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(buf.length),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ file: { display_name: displayName || 'meeting_audio' } })
  });
  if (!initRes.ok) throw new Error(`File upload init HTTP ${initRes.status}`);
  const uploadUrl = initRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Missing x-goog-upload-url');

  const upRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(buf.length),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize'
    },
    body: buf
  });
  if (!upRes.ok) throw new Error(`File upload finalize HTTP ${upRes.status}`);
  const meta = await upRes.json();
  const fileObj = meta.file || meta;

  // Poll briefly if file state is PROCESSING
  let state = fileObj.state;
  let tries = 0;
  while (state === 'PROCESSING' && tries < 15) {
    await new Promise((r) => setTimeout(r, 2000));
    const chk = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileObj.name}?key=${encodeURIComponent(apiKey)}`);
    if (chk.ok) {
      const cj = await chk.json();
      state = cj.state;
    }
    tries++;
  }
  return fileObj.uri;
}

async function parseVoiceCommand(spokenText, apiKey) {
  const { dateStr, timeStr, tomorrowStr } = kstNowParts();
  const clean = String(spokenText || '').trim();
  if (!clean) return { ok: false, error: '음성 또는 텍스트 내용이 없습니다.' };

  if (apiKey) {
    try {
      const sys = [
        `당신은 한국 대표님의 개인 음성 업무비서입니다. 현재 한국 시각은 ${dateStr} ${timeStr} (내일: ${tomorrowStr}) 입니다.`,
        `대표님이 말한 문장에서 업무 행동 기록(work_log), 앞으로 해야 할 일(todo), 단순 메모(memo)를 분리해 JSON으로 반환하세요.`,
        `출력 스키마: {"reply":"짧은 한국어 확인 멘트","items":[{"log_date":"YYYY-MM-DD","kind":"work_log|todo|memo","status":"done|pending","category":"마케팅·유튜브|세무·자금|부자생각·기획|미팅·대외협의|일반업무","time_range":"09:30 ~ 11:00 또는 14:00 등","duration_min":90,"title":"핵심 업무 요약 제목"}]}`
      ].join('\n');
      const out = await callGeminiJson(apiKey, [{ text: clean }], sys);
      if (out && Array.isArray(out.items) && out.items.length > 0) {
        return {
          ok: true,
          mode: 'gemini-ai',
          reply: out.reply || `${out.items.length}건의 업무·할 일을 기록했습니다.`,
          items: out.items.map((it) => ({ ...it, raw_voice: clean }))
        };
      }
    } catch (e) {
      // Fall back gracefully to deterministic parser
    }
  }

  const items = parseKoreanVoiceHeuristic(clean);
  const reply = items.map((it) => (
    it.kind === 'todo'
      ? `[할 일 등록] ${it.log_date} ${it.time_range ? '(' + it.time_range + ') ' : ''}${it.title}`
      : `[업무 기록] ${it.category}${it.duration_min ? ' · ' + it.duration_min + '분' : ''} — ${it.title}`
  )).join(' / ');
  return { ok: true, mode: 'smart-rule', reply, items };
}

/**
 * Parses KakaoTalk PC & Mobile (iOS/Android) .txt exports + raw pasted chats
 */
function parseKakaoTalkText(rawText, dateWindowDays) {
  const lines = String(rawText || '').replace(/\r\n/g, '\n').split('\n');
  const speakerCounts = {};
  const messages = [];
  let currentDate = null;

  const pcDateRe = /^-+\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/;
  const pcMsgRe = /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)$/;
  const mobKorMsgRe = /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)?\s*(\d{1,2}:\d{2}),\s*([^:]{1,30}?)\s*:\s*(.+)$/;
  const mobDotMsgRe = /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)?\s*(\d{1,2}:\d{2}),\s*([^:]{1,30}?)\s*:\s*(.+)$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const dm = pcDateRe.exec(line);
    if (dm) {
      currentDate = `${dm[1]}-${String(dm[2]).padStart(2, '0')}-${String(dm[3]).padStart(2, '0')}`;
      continue;
    }

    let m = pcMsgRe.exec(line);
    if (m) {
      const speaker = m[1].trim();
      const timeLbl = m[2].trim();
      const body = m[3].trim();
      if (/^(사진|동영상|이모티콘|삭제된 메시지입니다\.?)$/.test(body)) continue;
      speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
      messages.push({ date: currentDate, time: timeLbl, speaker, text: body });
      continue;
    }

    m = mobKorMsgRe.exec(line) || mobDotMsgRe.exec(line);
    if (m) {
      currentDate = `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
      const speaker = m[6].trim();
      const timeLbl = `${m[4] ? m[4] + ' ' : ''}${m[5]}`;
      const body = m[7].trim();
      if (/^(사진|동영상|이모티콘|삭제된 메시지입니다\.?)$/.test(body)) continue;
      speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
      messages.push({ date: currentDate, time: timeLbl, speaker, text: body });
      continue;
    }

    // Multi-line continuation of previous message
    if (messages.length > 0 && !/^저장한 날짜\s*:/.test(line) && !/님과 카카오톡 대화$/.test(line)) {
      messages[messages.length - 1].text += '\n' + line;
    }
  }

  // Filter by recent N days relative to latest date in chat if requested
  let filtered = messages;
  const days = Number(dateWindowDays) || 0;
  const datedMsgs = messages.filter((x) => x.date);
  if (days > 0 && datedMsgs.length > 0) {
    const latestDateStr = datedMsgs[datedMsgs.length - 1].date;
    const cutoffMs = new Date(latestDateStr + 'T00:00:00Z').getTime() - (days - 1) * 86400000;
    filtered = messages.filter((x) => !x.date || new Date(x.date + 'T00:00:00Z').getTime() >= cutoffMs);
  }

  const speakers = Object.entries(speakerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const normalizedTranscript = filtered.length > 0
    ? filtered.map((x) => `[${x.date || ''} ${x.time}] ${x.speaker}: ${x.text}`).join('\n')
    : String(rawText || '').trim();

  return {
    isStructuredKakao: messages.length >= 2,
    totalParsedMessages: filtered.length,
    speakers,
    participantsText: speakers.map((s) => `${s.name}(${s.count}건)`).join(', '),
    latestDate: datedMsgs.length ? datedMsgs[datedMsgs.length - 1].date : null,
    normalizedTranscript
  };
}

function buildHeuristicTextSummary(text, sourceType, kakaoMeta, titleHint) {
  const lines = String(text || '').split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 4);
  const kind = sourceType === 'kakaotalk'
    ? (guessCategory(text) === '세무·자금' ? '카카오톡 세무·정산 협의' : '카카오톡 업무 협의')
    : (guessCategory(text) === '마케팅·유튜브' ? '마케팅·콘텐츠 회의' : guessCategory(text) === '세무·자금' ? '세무·재무 검토 회의' : '일반 업무 회의');

  const moneyOrDateLines = lines.filter((l) => /(\d[\d,]*\s*(?:원|만원|억|%)|계좌|\d{1,2}월\s*\d{1,2}일|\d{1,2}시|https?:\/\/)/.test(l)).slice(0, 6);
  const actionLines = lines.filter((l) => /(드릴게요|보내주세요|부탁드립|확인해|처리해|까지|진행하겠|검토해|올려주|발송)/.test(l)).slice(0, 6);
  const decisionLines = lines.filter((l) => /(확정|결정|하기로|진행합시다|합의|그렇게\s*하시죠|완료했)/.test(l)).slice(0, 4);

  return {
    meetingKind: kind,
    title: titleHint || (kakaoMeta && kakaoMeta.speakers.length ? `${kakaoMeta.speakers.slice(0, 3).map((s) => s.name).join('·')} 대화 요약` : `${kstNowParts().dateStr} ${kind}`),
    participants: (kakaoMeta && kakaoMeta.participantsText) || '직접 입력 기록',
    oneLiner: `${lines.length}개 발언/문장에서 핵심 용건과 일정·숫자 항목을 추출했습니다. (정밀 AI 요약을 원하시면 상단에서 Gemini API 키를 등록해 주세요.)`,
    summaryBullets: lines.slice(0, 4).map((l) => l.slice(0, 140)),
    decisions: decisionLines.length ? decisionLines.map((l) => l.slice(0, 140)) : ['확정 문구 자동 탐지 내역 없음 (원문 참조)'],
    actionItems: actionLines.map((l) => ({ owner: '담당 확인', task: l.slice(0, 120), due: '' })),
    keyFacts: moneyOrDateLines.map((l) => l.slice(0, 140)),
    followUps: []
  };
}

async function analyzeMeetingOrKakao(opts) {
  const {
    sourceType = 'meeting_live',
    rawText = '',
    fileName = '',
    mimeType = '',
    base64Data = '',
    dateWindowDays = 0,
    titleHint = '',
    apiKey = ''
  } = opts || {};

  const { dateStr } = kstNowParts();
  let workingText = String(rawText || '').trim();
  let kakaoMeta = null;

  if (sourceType === 'kakaotalk' && workingText) {
    kakaoMeta = parseKakaoTalkExport(workingText, dateWindowDays);
    workingText = kakaoMeta.normalizedTranscript;
  }

  const hasMedia = Boolean(base64Data && mimeType);
  if (!workingText && !hasMedia) {
    return { ok: false, error: '분석할 대화 텍스트나 녹음·이미지 파일을 넣어 주세요.' };
  }

  if (!apiKey) {
    if (hasMedia && /^audio\//i.test(mimeType) && !workingText) {
      return {
        ok: false,
        error: '음성 파일(.m4a/.mp3/.wav) 직접 청취 분석에는 상단 [Gemini AI 키 1회 등록]이 필요합니다. (또는 화면의 실시간 마이크 받아쓰기·클로바노트 텍스트는 키 없이도 바로 저장됩니다!)'
      };
    }
    const h = buildHeuristicTextSummary(workingText, sourceType, kakaoMeta, titleHint);
    return {
      ok: true,
      mode: 'smart-rule',
      doc_date: (kakaoMeta && kakaoMeta.latestDate) || dateStr,
      source_type: sourceType,
      meeting_kind: h.meetingKind,
      title: h.title,
      participants: h.participants,
      summary_json: h,
      raw_transcript: workingText
    };
  }

  // Full Gemini 2.5 Flash Multimodal Analysis (Audio / Screenshot Image / Clova Note / KakaoTalk)
  const parts = [];
  if (hasMedia) {
    const buf = Buffer.from(base64Data, 'base64');
    if (buf.length > 14 * 1024 * 1024) {
      const fileUri = await uploadGeminiLargeFile(apiKey, buf, mimeType, fileName || 'meeting_media');
      parts.push({ fileData: { mimeType, fileUri } });
    } else {
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }
  }
  if (workingText) {
    parts.push({ text: `[입력 원문 / 대화 로그]\n${workingText.slice(0, 95000)}` });
  }
  if (titleHint) {
    parts.push({ text: `[참고 제목/상황 메모]: ${titleHint}` });
  }

  const sysPrompt = [
    `당신은 대한민국 사업가 대표님의 수석 비서이자 회의록·카카오톡 대화 분석가입니다.`,
    `입력된 회의 음성, 회의 텍스트(클로바노트/실시간 받아쓰기), 또는 카카오톡 대화 내역(텍스트/캡처 이미지)을 정밀 분석해 아래 JSON 스키마로만 응답하세요.`,
    `- 만약 음성이나 캡처 이미지가 주어졌다면 먼저 대화 내용을 정확히 한국어로 전사해 transcript 필드에 담으세요 (이미 텍스트가 주어졌다면 transcript는 빈 문자열 ""로 두세요).`,
    `- meetingKind는 어떤 성격의 회의/대화였는지 직관적인 분류명(예: "신규사업·기획 회의", "거래처·외주 협의", "세무·자금 검토", "마케팅·유튜브 점검", "고객·제휴 상담", "카카오톡 실무 협의" 등)으로 지정하세요.`,
    `- actionItems에는 누가(owner), 무엇을(task), 언제까지(due) 해야 하는지 빠짐없이 뽑아주세요.`,
    `- keyFacts에는 대화에 등장한 금액, 단가, 계좌번호, 날짜/시간, 장소, 링크, 계약 조건 등 숫자와 고유 정보를 정확히 발췌하세요.`,
    `JSON 스키마:`,
    `{"meetingKind":"회의/대화 성격 분류","title":"핵심 한 줄 제목","participants":"참석자 또는 대화 상대방","oneLiner":"이 회의/대화가 어떤 내용이었는지 1~2문장 총평","summaryBullets":["핵심 논의 요약 1","요약 2","요약 3"],"decisions":["합의·결정된 사항 1"],"actionItems":[{"owner":"담당자","task":"해야 할 구체적 행동","due":"기한(언급 시)"}],"keyFacts":["중요 금액·일정·계좌·조건 등"],"followUps":["다음 미팅이나 후속 연락 때 꼭 확인할 점"],"transcript":"음성/이미지일 경우 전사 텍스트, 텍스트 입력일 경우 빈 문자열"}`
  ].join('\n');

  const ai = await callGeminiJson(apiKey, parts, sysPrompt);
  const finalTranscript = workingText || String(ai.transcript || '').trim();
  const summaryPayload = {
    meetingKind: ai.meetingKind || (sourceType === 'kakaotalk' ? '카카오톡 실무 협의' : '업무 회의'),
    title: titleHint || ai.title || `${dateStr} 회의 분석`,
    participants: ai.participants || (kakaoMeta && kakaoMeta.participantsText) || '',
    oneLiner: ai.oneLiner || '',
    summaryBullets: Array.isArray(ai.summaryBullets) ? ai.summaryBullets : [],
    decisions: Array.isArray(ai.decisions) ? ai.decisions : [],
    actionItems: Array.isArray(ai.actionItems) ? ai.actionItems : [],
    keyFacts: Array.isArray(ai.keyFacts) ? ai.keyFacts : [],
    followUps: Array.isArray(ai.followUps) ? ai.followUps : [],
    speakerStats: kakaoMeta ? kakaoMeta.speakers : []
  };

  return {
    ok: true,
    mode: 'gemini-ai',
    doc_date: (kakaoMeta && kakaoMeta.latestDate) || dateStr,
    source_type: sourceType,
    meeting_kind: summaryPayload.meetingKind,
    title: summaryPayload.title,
    participants: summaryPayload.participants,
    summary_json: summaryPayload,
    raw_transcript: finalTranscript
  };
}

function parseKakaoTalkExport(rawText, dateWindowDays) {
  return parseKakaoTalkText(rawText, dateWindowDays);
}

module.exports = {
  parseVoiceCommand,
  parseKakaoTalkExport,
  analyzeMeetingOrKakao,
  kstNowParts
};

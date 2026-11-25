# -*- coding: utf-8 -*-
"""
Renders 7 Expert-Grade Hand-Drawn Fountain-Pen + Pastel Watercolor Tax Architecture Diagrams
via Playwright Chromium SVG (`feTurbulence` + `feDisplacementMap` organic nib wobble on `#FFFFFF`)
for Unified Topic:
  〈매출 200만 원 더 올렸다가 통장에서 255만 원 증발?! — 연 매출 1억 400만 원 부가세·종소세 절벽과 초기 환급 500만 원의 비밀〉
  - Long02 (16:9 Dual-Zone 1408x768): S01..S04
  - EP05 (9:16 Shorts Square 1024x1024): S1..S3
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STUDIO_DIR = Path(__file__).resolve().parent
ASSETS_DIR = STUDIO_DIR / "assets"
ART_DIR = Path(r"C:\Users\new-s\.gemini\antigravity\brain\b2b2a393-7c08-4108-b056-d470e6bacf61")

BASE_CSS = """
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #ffffff; font-family: 'Pretendard', 'Malgun Gothic', sans-serif; overflow: hidden; }
svg { display: block; width: 100%; height: 100%; }
.ink { stroke: #18223c; stroke-width: 4.2; stroke-linecap: round; stroke-linejoin: round; }
.ink-thin { stroke: #18223c; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }
.wc-blue { fill: #dbeafe; }
.wc-cobalt { fill: #93c5fd; }
.wc-mint { fill: #d1fae5; }
.wc-emerald { fill: #6ee7b7; }
.wc-coral { fill: #ffe4e6; }
.wc-rose { fill: #fda4af; }
.wc-amber { fill: #fef3c7; }
.wc-gold { fill: #fde68a; }
.wc-slate { fill: #f1f5f9; }
.lbl { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; font-weight: 900; fill: #18223c; }
.lbl-sub { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; font-weight: 800; fill: #334155; }
.lbl-blue { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; font-weight: 900; fill: #1d4ed8; }
.lbl-red { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; font-weight: 900; fill: #be123c; }
.lbl-grn { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; font-weight: 900; fill: #047857; }
"""

SVG_DEFS = """
<defs>
  <filter id="sketch" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="2" seed="11" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.0" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs>
"""


def wrap_svg(w: int, h: int, inner: str) -> str:
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><style>{BASE_CSS}</style></head>
    <body style="width:{w}px;height:{h}px">
      <svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg">
        {SVG_DEFS}
        <rect width="{w}" height="{h}" fill="#ffffff"/>
        <g filter="url(#sketch)">{inner}</g>
      </svg>
    </body></html>"""


# ---------------------------------------------------------------------------
# 4 Dual-Zone 16:9 Expert Illustrations (1408 x 768 — Split cleanly at x=704)
# ---------------------------------------------------------------------------
LONG02_SVGS = {
    "long02_s01_cliff_paradox.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE (x: 40..660): 연매출 1억 300만 (간이과세 15%×10% - 카드 1.3%) -->
        <ellipse cx="345" cy="655" rx="255" ry="24" class="wc-mint"/>
        <rect x="85" y="92" width="520" height="82" rx="18" class="wc-mint ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="29" class="lbl-grn">연 매출 1억 300만 (간이과세 유지)</text>

        <!-- Formula Ledger Card -->
        <rect x="95" y="205" width="500" height="260" rx="20" fill="#ffffff" class="ink"/>
        <rect x="95" y="205" width="500" height="58" rx="18" class="wc-blue ink-thin"/>
        <text x="345" y="243" text-anchor="middle" font-size="23" class="lbl-blue">음식·소매 부가가치율 15% × 세율 10%</text>
        <text x="125" y="302" font-size="23" class="lbl-sub">• 산출 매출세액 (1.5%)</text>
        <text x="565" y="302" text-anchor="end" font-size="23" class="lbl">154.5만 원</text>
        <text x="125" y="344" font-size="23" class="lbl-sub">• 매입세액공제 (0.5%)</text>
        <text x="565" y="344" text-anchor="end" font-size="23" class="lbl-blue">-19.6만 원</text>
        <text x="125" y="386" font-size="23" class="lbl-sub">• 카드발행 공제 (1.3%)</text>
        <text x="565" y="386" text-anchor="end" font-size="23" class="lbl-grn">-120.5만 원</text>
        <line x1="120" y1="406" x2="570" y2="406" class="ink-thin"/>
        <text x="125" y="444" font-size="26" class="lbl">연간 실제 부가세</text>
        <text x="565" y="444" text-anchor="end" font-size="29" class="lbl-grn">단 14.4만 원!</text>

        <!-- Bottom Net Take-Home Pill -->
        <rect x="95" y="492" width="500" height="128" rx="22" class="wc-emerald ink"/>
        <text x="345" y="542" text-anchor="middle" font-size="24" class="lbl">종소세·지방세 제외 후 1년 실수령</text>
        <text x="345" y="594" text-anchor="middle" font-size="40" class="lbl-grn">연 3,153만 원 확보</text>

        <!-- RIGHT ZONE (x: 750..1370): 연매출 1억 500만 (1억 400만 초과 -> 일반과세 1/11) -->
        <ellipse cx="1065" cy="655" rx="255" ry="24" class="wc-coral"/>
        <rect x="795" y="92" width="540" height="82" rx="18" class="wc-coral ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="29" class="lbl-red">연 매출 1억 500만 (일반과세 전환!)</text>

        <!-- Formula Ledger Card -->
        <rect x="815" y="205" width="500" height="260" rx="20" fill="#ffffff" class="ink"/>
        <rect x="815" y="205" width="500" height="58" rx="18" class="wc-rose ink-thin"/>
        <text x="1065" y="243" text-anchor="middle" font-size="23" class="lbl-red">공급대가 ÷ 11 (인건비·면세원재료 불공제!)</text>
        <text x="845" y="302" font-size="23" class="lbl-sub">• 일반 매출세액 (1/11)</text>
        <text x="1285" y="302" text-anchor="end" font-size="23" class="lbl-red">954.5만 원</text>
        <text x="845" y="344" font-size="23" class="lbl-sub">• 과세매입 공제 (38%분)</text>
        <text x="1285" y="344" text-anchor="end" font-size="23" class="lbl-blue">-362.7만 원</text>
        <text x="845" y="386" font-size="23" class="lbl-sub">• 카드발행 공제 (1.3%)</text>
        <text x="1285" y="386" text-anchor="end" font-size="23" class="lbl-grn">-122.8만 원</text>
        <line x1="840" y1="406" x2="1290" y2="406" class="ink-thin"/>
        <text x="845" y="444" font-size="26" class="lbl">연간 실제 부가세</text>
        <text x="1285" y="444" text-anchor="end" font-size="29" class="lbl-red">469.0만 원 (32배↑)</text>

        <!-- Bottom Reversed Net Take-Home Pill -->
        <rect x="815" y="492" width="500" height="128" rx="22" class="wc-coral ink"/>
        <text x="1065" y="542" text-anchor="middle" font-size="24" class="lbl-red">매출 +200만 늘었는데 세후 실수령은</text>
        <text x="1065" y="594" text-anchor="middle" font-size="38" class="lbl-red">연 2,898만 (-255만 역전!)</text>
        """,
    ),
    "long02_s02_startup_refund_trap.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 창업 첫해 인테리어 5,500만 원 -> 간이과세 선택 시 환급 0원 참사! -->
        <ellipse cx="345" cy="655" rx="250" ry="24" class="wc-coral"/>
        <rect x="85" y="92" width="520" height="82" rx="18" class="wc-coral ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="28" class="lbl-red">함정 ① 초기 시설투자 큰데 ‘간이과세’ 선택</text>

        <!-- Interior & Espresso Machine Cost Box -->
        <rect x="105" y="215" width="480" height="190" rx="20" fill="#ffffff" class="ink"/>
        <rect x="130" y="242" width="200" height="135" rx="14" class="wc-amber ink-thin"/>
        <text x="230" y="295" text-anchor="middle" font-size="23" class="lbl">인테리어·주방설비</text>
        <text x="230" y="336" text-anchor="middle" font-size="28" class="lbl-blue">결제 5,500만 원</text>
        <text x="230" y="365" text-anchor="middle" font-size="19" class="lbl-sub">(부가세 500만 포함)</text>

        <path d="M348 310 L398 310" class="ink" style="stroke-width:5"/>
        <polygon points="395,296 420,310 395,324" fill="#be123c"/>

        <rect x="430" y="242" width="130" height="135" rx="14" class="wc-rose ink"/>
        <text x="495" y="295" text-anchor="middle" font-size="22" class="lbl-red">부가세 환급</text>
        <text x="495" y="344" text-anchor="middle" font-size="36" class="lbl-red">0원!</text>

        <!-- Statutory Exclusion Warning Box -->
        <rect x="105" y="435" width="480" height="185" rx="20" class="wc-coral ink"/>
        <text x="345" y="485" text-anchor="middle" font-size="26" class="lbl-red">간이과세자 = 매입 초과여도 환급 불가!</text>
        <text x="345" y="532" text-anchor="middle" font-size="22" class="lbl">게다가 기존 ‘일반과세 사업장’이 1개라도 있으면</text>
        <text x="345" y="572" text-anchor="middle" font-size="23" class="lbl-red">신규 매장은 매출 적어도 간이과세 원천 배제!</text>

        <!-- RIGHT ZONE: 초기엔 일반과세로 500만 원 전액 환급 확보! -->
        <ellipse cx="1065" cy="655" rx="250" ry="24" class="wc-mint"/>
        <rect x="795" y="92" width="540" height="82" rx="18" class="wc-mint ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="28" class="lbl-grn">해법 ① 초기 시설투자 클 땐 ‘일반과세’ 환급!</text>

        <rect x="815" y="215" width="500" height="215" rx="20" fill="#ffffff" class="ink"/>
        <rect x="845" y="248" width="215" height="148" rx="16" class="wc-blue ink-thin"/>
        <text x="952" y="296" text-anchor="middle" font-size="22" class="lbl-blue">사업자등록 먼저 내고</text>
        <text x="952" y="332" text-anchor="middle" font-size="24" class="lbl">세금계산서 수취!</text>
        <text x="952" y="370" text-anchor="middle" font-size="19" class="lbl-sub">(조기환급 신청 가능)</text>

        <path d="M1075 320 L1120 320" class="ink" style="stroke-width:5"/>
        <polygon points="1116,306 1142,320 1116,334" fill="#047857"/>

        <rect x="1150" y="248" width="140" height="148" rx="16" class="wc-emerald ink"/>
        <text x="1220" y="296" text-anchor="middle" font-size="21" class="lbl">통장 현금 환급</text>
        <text x="1220" y="344" text-anchor="middle" font-size="31" class="lbl-grn">+500만!</text>

        <rect x="815" y="458" width="500" height="162" rx="20" class="wc-mint ink"/>
        <text x="1065" y="508" text-anchor="middle" font-size="25" class="lbl-grn">전문가 공식: 내 업종 ‘매입 구조’로 선택!</text>
        <text x="1065" y="552" text-anchor="middle" font-size="22" class="lbl">초기 인테리어·설비 투자기 ➔ 일반과세 환급 유리</text>
        <text x="1065" y="590" text-anchor="middle" font-size="22" class="lbl-blue">인건비·면세원재료 높은 소규모 운영기 ➔ 간이 유리</text>
        """,
    ),
    "long02_s03_july_transition_defense.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 1억 400만 돌파 시 실제 전환 타임라인 (당해 소급 X -> 익년 7월 1일!) -->
        <ellipse cx="345" cy="655" rx="250" ry="24" class="wc-blue"/>
        <rect x="85" y="92" width="520" height="82" rx="18" class="wc-blue ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="28" class="lbl-blue">전환 시점 디테일: 당해 소급 X · 익년 7월 1일!</text>

        <!-- Timeline Diagram -->
        <rect x="95" y="210" width="500" height="405" rx="22" fill="#ffffff" class="ink"/>
        <line x1="165" y1="265" x2="165" y2="555" stroke="#2563eb" stroke-width="6"/>

        <circle cx="165" cy="285" r="16" class="wc-cobalt ink"/>
        <rect x="200" y="252" width="365" height="72" rx="14" class="wc-slate ink-thin"/>
        <text x="382" y="284" text-anchor="middle" font-size="22" class="lbl">올해(1.1~12.31) 공급대가 합산</text>
        <text x="382" y="312" text-anchor="middle" font-size="20" class="lbl-red">연 환산 1억 400만 원 이상 발생 시</text>

        <circle cx="165" cy="410" r="16" class="wc-mint ink"/>
        <rect x="200" y="376" width="365" height="72" rx="14" class="wc-mint ink-thin"/>
        <text x="382" y="408" text-anchor="middle" font-size="22" class="lbl-grn">다음 해 1.1 ~ 6.30 상반기까지</text>
        <text x="382" y="436" text-anchor="middle" font-size="20" class="lbl">간이과세 유지 (6개월 준비 골든타임!)</text>

        <circle cx="165" cy="535" r="16" class="wc-rose ink"/>
        <rect x="200" y="500" width="365" height="76" rx="14" class="wc-coral ink-thin"/>
        <text x="382" y="533" text-anchor="middle" font-size="23" class="lbl-red">다음 해 7월 1일 일반과세 전환!</text>
        <text x="382" y="562" text-anchor="middle" font-size="19" class="lbl-sub">(세무서 통지 수령 · 매입증빙 체계 필수 전환)</text>

        <!-- RIGHT ZONE: 일반과세 전환 시 부가세 반토막 내는 실무 공제 3총사 -->
        <ellipse cx="1065" cy="655" rx="255" ry="24" class="wc-mint"/>
        <rect x="790" y="92" width="550" height="82" rx="18" class="wc-mint ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="28" class="lbl-grn">일반과세 부가세 줄이는 ‘적격증빙 3총사’</text>

        <!-- 3 Stacked Defense Shields -->
        <rect x="805" y="210" width="525" height="122" rx="18" class="wc-blue ink"/>
        <text x="832" y="258" font-size="24" class="lbl-blue">① 상가 월세·관리비·공과금 세금계산서</text>
        <text x="832" y="298" font-size="19.5" class="lbl-sub">홈택스 사업용 신용카드·현금영수증 지출증빙 100% 등록</text>

        <rect x="805" y="352" width="525" height="122" rx="18" class="wc-amber ink"/>
        <text x="832" y="400" font-size="24" class="lbl">② 면세 농축수산물 ‘의제매입세액공제’</text>
        <text x="832" y="440" font-size="17.5" class="lbl-sub">쌀·정육·채소도 ‘계산서·사업용카드’ 수취 시 8/108~9/109 공제!</text>

        <rect x="805" y="494" width="525" height="122" rx="18" class="wc-emerald ink"/>
        <text x="832" y="542" font-size="24" class="lbl-grn">③ 신용카드 발행세액공제 1.3% (연 1천만 한도)</text>
        <text x="832" y="582" font-size="19.5" class="lbl-sub">직전 공급가액 10억 이하 개인사업자 필수 공제 체크!</text>
        """,
    ),
    "long02_s04_tax_shield_master.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 5월 종합소득세 + 지방소득세 10% 가산 & 노란우산 구간별 한도 -->
        <ellipse cx="345" cy="655" rx="250" ry="24" class="wc-amber"/>
        <rect x="85" y="92" width="520" height="82" rx="18" class="wc-amber ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="28" class="lbl">5월 종소세(+지방세 10%) &amp; 노란우산 한도</text>

        <rect x="95" y="210" width="500" height="230" rx="20" fill="#ffffff" class="ink"/>
        <text x="345" y="256" text-anchor="middle" font-size="23" class="lbl-red">국세청 세율에 ‘지방소득세 10%’가 더 붙습니다!</text>
        <rect x="115" y="280" width="222" height="135" rx="14" class="wc-blue ink-thin"/>
        <text x="226" y="320" text-anchor="middle" font-size="18.5" class="lbl-sub">과표 1,400만~5,000만</text>
        <text x="226" y="365" text-anchor="middle" font-size="30" class="lbl-blue">실효 16.5%</text>
        <text x="226" y="396" text-anchor="middle" font-size="16" class="lbl-sub">(종소세 15% + 지방세 1.5%)</text>

        <rect x="353" y="280" width="222" height="135" rx="14" class="wc-coral ink-thin"/>
        <text x="464" y="320" text-anchor="middle" font-size="18.5" class="lbl-sub">과표 5,000만~8,800만</text>
        <text x="464" y="365" text-anchor="middle" font-size="30" class="lbl-red">실효 26.4%</text>
        <text x="464" y="396" text-anchor="middle" font-size="16" class="lbl-sub">(종소세 24% + 지방세 2.4%)</text>

        <rect x="95" y="464" width="500" height="152" rx="20" class="wc-mint ink"/>
        <text x="345" y="510" text-anchor="middle" font-size="23" class="lbl-grn">연말 노란우산 소득공제 (사업소득 구간별 한도)</text>
        <text x="345" y="550" text-anchor="middle" font-size="20" class="lbl">4천만 이하 600만 · 6천만 이하 500만 · 1억 이하 400만</text>
        <text x="345" y="588" text-anchor="middle" font-size="20.5" class="lbl-blue">➔ 납입만으로 연 최대 99만~132만 원 세금 즉시 절감!</text>

        <!-- RIGHT ZONE: 부자생각 부가세·종소세·실수령 3초 통합 시뮬레이터 -->
        <ellipse cx="1065" cy="655" rx="250" ry="24" class="wc-mint"/>
        <rect x="790" y="92" width="550" height="82" rx="18" class="wc-blue ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="28" class="lbl-blue">내 매장 ‘간이 vs 일반 · 세후 월급’ 3초 검산!</text>

        <!-- Simulator Screen Card -->
        <rect x="820" y="205" width="490" height="395" rx="26" class="wc-cobalt ink"/>
        <rect x="844" y="232" width="442" height="340" rx="18" fill="#ffffff" class="ink-thin"/>
        <text x="1065" y="280" text-anchor="middle" font-size="25" class="lbl-blue">부자생각 세무·실수령 시뮬레이터</text>
        <line x1="870" y1="300" x2="1260" y2="300" class="ink-thin"/>
        <text x="875" y="344" font-size="23" class="lbl">✔ 간이 vs 일반 부가세·환급액 동시 비교</text>
        <text x="875" y="390" font-size="23" class="lbl">✔ 카드발행 1.3% 세액공제 자동 반영</text>
        <text x="875" y="436" font-size="23" class="lbl">✔ 8단계 종소세 + 지방소득세 10% 계산</text>
        <text x="875" y="482" font-size="23" class="lbl-grn">✔ 노란우산 절세액 &amp; 진짜 세후 월 실수령!</text>
        <rect x="905" y="505" width="320" height="48" rx="24" class="wc-emerald ink-thin"/>
        <text x="1065" y="537" text-anchor="middle" font-size="23" class="lbl">boozathink.com</text>
        <text x="1065" y="636" text-anchor="middle" font-size="25" class="lbl-blue">검색창에 ‘부자생각’ · 숫자 4개만 넣어 확인하세요</text>
        """,
    ),
}

# ---------------------------------------------------------------------------
# 3 Square 1:1 Illustrations for EP05 Shorts (1024 x 1024)
# ---------------------------------------------------------------------------
EP05_SVGS = {
    "ep05_s1_200m_paradox.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="895" rx="355" ry="30" class="wc-coral"/>
        <!-- Top Shock Header Pill -->
        <rect x="112" y="115" width="800" height="92" rx="24" class="wc-coral ink"/>
        <text x="512" y="173" text-anchor="middle" font-size="35" class="lbl-red">매출 +200만 더 팔았는데 순익 -255만 증발?!</text>

        <!-- Left Store Card: 1억 300만 (간이) -->
        <rect x="115" y="265" width="365" height="475" rx="24" class="wc-mint ink"/>
        <rect x="145" y="295" width="305" height="68" rx="16" fill="#ffffff" class="ink-thin"/>
        <text x="297" y="339" text-anchor="middle" font-size="29" class="lbl-grn">연 매출 1억 300만</text>
        <text x="297" y="405" text-anchor="middle" font-size="25" class="lbl">(간이과세 유지)</text>
        <text x="297" y="475" text-anchor="middle" font-size="26" class="lbl-sub">1년 부가세</text>
        <text x="297" y="525" text-anchor="middle" font-size="40" class="lbl-blue">단 14.4만</text>
        <line x1="155" y1="565" x2="440" y2="565" class="ink-thin"/>
        <text x="297" y="615" text-anchor="middle" font-size="25" class="lbl">세후 실수령 순익</text>
        <text x="297" y="678" text-anchor="middle" font-size="44" class="lbl-grn">3,153만 원</text>

        <!-- Center Threshold Cliff Divider -->
        <line x1="512" y1="245" x2="512" y2="760" stroke="#be123c" stroke-width="6" stroke-dasharray="12 9"/>

        <!-- Right Store Card: 1억 500만 (일반 전환) -->
        <rect x="544" y="265" width="365" height="475" rx="24" class="wc-coral ink"/>
        <rect x="574" y="295" width="305" height="68" rx="16" fill="#ffffff" class="ink-thin"/>
        <text x="726" y="339" text-anchor="middle" font-size="29" class="lbl-red">연 매출 1억 500만</text>
        <text x="726" y="405" text-anchor="middle" font-size="25" class="lbl-red">(일반과세 전환!)</text>
        <text x="726" y="475" text-anchor="middle" font-size="26" class="lbl-sub">1년 부가세</text>
        <text x="726" y="525" text-anchor="middle" font-size="40" class="lbl-red">469.0만!</text>
        <line x1="584" y1="565" x2="869" y2="565" class="ink-thin"/>
        <text x="726" y="615" text-anchor="middle" font-size="25" class="lbl">세후 실수령 순익</text>
        <text x="726" y="678" text-anchor="middle" font-size="44" class="lbl-red">2,898만 원</text>

        <!-- Bottom Cliff Criterion Pill -->
        <rect x="115" y="785" width="794" height="86" rx="22" class="wc-blue ink"/>
        <text x="512" y="840" text-anchor="middle" font-size="33" class="lbl-blue">운명을 가르는 기준선: 연 공급대가 ‘1억 400만 원’</text>
        """,
    ),
    "ep05_s2_32x_vat_anatomy.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="895" rx="355" ry="30" class="wc-blue"/>
        <rect x="110" y="115" width="804" height="90" rx="24" class="wc-amber ink"/>
        <text x="512" y="172" text-anchor="middle" font-size="34" class="lbl">왜 부가세가 14만 원 ➔ 469만 원(32배) 뛸까?</text>

        <!-- Detailed Receipt Anatomy Box -->
        <rect x="115" y="245" width="794" height="495" rx="26" fill="#ffffff" class="ink"/>
        <rect x="115" y="245" width="794" height="74" rx="24" class="wc-blue ink-thin"/>
        <text x="512" y="293" text-anchor="middle" font-size="29" class="lbl-blue">일반과세(1/11) 전환 시 놓치기 쉬운 2가지 구멍</text>

        <rect x="150" y="348" width="724" height="110" rx="18" class="wc-coral ink-thin"/>
        <text x="180" y="394" font-size="27" class="lbl-red">① 알바 인건비 · 주휴수당 = 매입세액 공제 0원!</text>
        <text x="180" y="434" font-size="23" class="lbl-sub">원천징수 인건비에는 부가세(10%)가 없어 매출세액에서 못 뺍니다</text>

        <rect x="142" y="480" width="740" height="110" rx="18" class="wc-amber ink-thin"/>
        <text x="172" y="526" font-size="26" class="lbl">② 면세 식자재(쌀·정육·채소) = 그냥 사면 공제 0원!</text>
        <text x="172" y="566" font-size="20" class="lbl-sub">반드시 ‘계산서·사업용카드’를 끊어야 의제매입세액공제(8/108~9/109) 적용!</text>

        <rect x="150" y="612" width="724" height="96" rx="18" class="wc-mint ink-thin"/>
        <text x="512" y="655" text-anchor="middle" font-size="26" class="lbl-grn">전환 시점: 당해 소급 X ➔ ‘다음 해 7월 1일’부터 전환!</text>
        <text x="512" y="690" text-anchor="middle" font-size="21" class="lbl-sub">(단, 기존 일반과세 사업장 보유자는 첫날부터 간이과세 배제)</text>

        <rect x="115" y="782" width="794" height="86" rx="22" class="wc-emerald ink"/>
        <text x="512" y="837" text-anchor="middle" font-size="31" class="lbl-grn">카드발행 공제 1.3%(연 1천만 한도)까지 반영한 정밀 검산!</text>
        """,
    ),
    "ep05_s3_refund_vs_shield.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="895" rx="355" ry="30" class="wc-mint"/>
        <rect x="110" y="115" width="804" height="90" rx="24" class="wc-mint ink"/>
        <text x="512" y="172" text-anchor="middle" font-size="33" class="lbl-grn">첫해 인테리어 5,500만? 그땐 ‘일반과세’가 정답!</text>

        <!-- Two Side-by-Side Action Cards -->
        <rect x="115" y="245" width="378" height="485" rx="24" class="wc-blue ink"/>
        <text x="304" y="308" text-anchor="middle" font-size="28" class="lbl-blue">초기 시설투자 클 때</text>
        <rect x="145" y="335" width="318" height="150" rx="18" fill="#ffffff" class="ink-thin"/>
        <text x="304" y="392" text-anchor="middle" font-size="25" class="lbl">간이과세 = 환급 0원</text>
        <text x="304" y="446" text-anchor="middle" font-size="32" class="lbl-blue">일반 = +500만 환급!</text>
        <text x="304" y="550" text-anchor="middle" font-size="24" class="lbl-sub">결제 전 사업자등록 +</text>
        <text x="304" y="590" text-anchor="middle" font-size="24" class="lbl">세금계산서 수취 필수!</text>
        <rect x="155" y="630" width="298" height="64" rx="16" class="wc-emerald ink-thin"/>
        <text x="304" y="671" text-anchor="middle" font-size="24" class="lbl">초기 자금 500만 회수</text>

        <rect x="531" y="245" width="378" height="485" rx="24" class="wc-amber ink"/>
        <text x="720" y="308" text-anchor="middle" font-size="28" class="lbl">연말 종소세 방어선</text>
        <rect x="561" y="335" width="318" height="150" rx="18" fill="#ffffff" class="ink-thin"/>
        <text x="720" y="392" text-anchor="middle" font-size="23" class="lbl-red">종소세+지방세 16.5~26.4%</text>
        <text x="720" y="446" text-anchor="middle" font-size="26" class="lbl-grn">노란우산 최대 600만 공제</text>
        <text x="720" y="550" text-anchor="middle" font-size="24" class="lbl-sub">월세 세금계산서 +</text>
        <text x="720" y="590" text-anchor="middle" font-size="24" class="lbl">의제매입공제 동시 점검!</text>
        <rect x="571" y="630" width="298" height="64" rx="16" class="wc-mint ink-thin"/>
        <text x="720" y="671" text-anchor="middle" font-size="24" class="lbl-grn">연 83만~132만 절세</text>

        <!-- Bottom Simulator CTA -->
        <rect x="115" y="778" width="794" height="90" rx="24" class="wc-cobalt ink"/>
        <text x="512" y="835" text-anchor="middle" font-size="33" class="lbl">검색창에 ‘부자생각’ · 간이 vs 일반 3초 비교!</text>
        """,
    ),
}


def render_all() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        for fname, (w, h, svg_body) in {**LONG02_SVGS, **EP05_SVGS}.items():
            pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
            pg.set_content(wrap_svg(w, h, svg_body), wait_until="networkidle")
            out_path = ASSETS_DIR / fname
            pg.screenshot(path=str(out_path), type="jpeg", quality=95)
            shutil.copy2(out_path, ART_DIR / fname)
            pg.close()
            print(f"[OK Rendered] {fname} ({w}x{h}, {out_path.stat().st_size:,} bytes)")
        b.close()


if __name__ == "__main__":
    render_all()

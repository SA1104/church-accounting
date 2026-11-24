# -*- coding: utf-8 -*-
"""
Renders 7 Crisp Hand-Drawn Fountain-Pen + Pastel Watercolor Architectural Illustrations
via Playwright Chromium SVG (with subtle organic ink-nib displacement & offset watercolor washes)
for:
  - Long01 (16:9 Dual-Zone 1408x768): S01..S04 (상가 월세 200만 원의 착시 · 13년 회수 늪 · 환산보증금 5% 폭탄 · 3초 방어 공식)
  - EP04 (1:1 Square 1024x1024): S1..S3 (알바 30분 차이 · 주 14.5h vs 15h 절벽 · 테이블오더 3.8개월 회수)
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
.ink { stroke: #18223c; stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; }
.ink-thin { stroke: #18223c; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
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
.lbl-blue { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; font-weight: 900; fill: #1d4ed8; }
.lbl-red { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; font-weight: 900; fill: #be123c; }
.lbl-grn { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; font-weight: 900; fill: #047857; }
"""

SVG_DEFS = """
<defs>
  <filter id="sketch" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
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
# 4 Dual-Zone 16:9 Illustrations (1408 x 768 — Left x:40..640 | Right x:768..1368)
# ---------------------------------------------------------------------------
LONG01_SVGS = {
    "long01_s01_rent_illusion.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: Naive "Rent 200 looks cheap!" Storefront -->
        <ellipse cx="340" cy="645" rx="235" ry="26" class="wc-blue"/>
        <!-- Storefront building -->
        <rect x="135" y="215" width="390" height="415" rx="14" class="wc-slate ink"/>
        <!-- Striped Awning -->
        <path d="M115 215 L545 215 L565 285 L95 285 Z" class="wc-cobalt ink"/>
        <line x1="190" y1="215" x2="180" y2="285" class="ink-thin"/>
        <line x1="265" y1="215" x2="260" y2="285" class="ink-thin"/>
        <line x1="340" y1="215" x2="340" y2="285" class="ink-thin"/>
        <line x1="415" y1="215" x2="420" y2="285" class="ink-thin"/>
        <line x1="490" y1="215" x2="500" y2="285" class="ink-thin"/>
        <!-- Shop window & door -->
        <rect x="170" y="325" width="195" height="205" rx="10" fill="#ffffff" class="ink"/>
        <rect x="390" y="345" width="105" height="285" rx="8" class="wc-amber ink"/>
        <circle cx="408" cy="490" r="6" fill="#18223c"/>
        <!-- Hanging Lease Tag -->
        <rect x="125" y="105" width="410" height="82" rx="18" class="wc-mint ink"/>
        <text x="330" y="156" text-anchor="middle" font-size="30" class="lbl-grn">“월세 200만? 해볼 만하네!”</text>
        <!-- Smiling founder icon -->
        <circle cx="268" cy="415" r="34" class="wc-amber ink"/>
        <path d="M254 410 Q260 403 264 410 M274 410 Q278 403 284 410" fill="none" class="ink-thin"/>
        <path d="M256 426 Q268 438 280 426" fill="none" class="ink-thin"/>
        <path d="M222 525 C222 465 314 465 314 525 Z" class="wc-cobalt ink"/>

        <!-- RIGHT ZONE: Hidden Total Fixed Cost Scale (680만원!) -->
        <ellipse cx="1068" cy="650" rx="250" ry="26" class="wc-coral"/>
        <!-- Balance Scale Pillar -->
        <rect x="1054" y="340" width="28" height="295" rx="6" class="wc-slate ink"/>
        <rect x="968" y="625" width="200" height="26" rx="10" class="wc-slate ink"/>
        <!-- Tilted beam (heavy on right!) -->
        <line x1="835" y1="330" x2="1285" y2="432" class="ink" style="stroke-width:7"/>
        <circle cx="1068" cy="382" r="18" class="wc-cobalt ink"/>
        <!-- Left light pan (12,000원 bowl) -->
        <line x1="855" y1="334" x2="825" y2="425" class="ink-thin"/>
        <line x1="855" y1="334" x2="895" y2="425" class="ink-thin"/>
        <path d="M800 425 Q860 465 920 425 Z" class="wc-mint ink"/>
        <path d="M825 425 A35 24 0 0 1 895 425 Z" class="wc-amber ink"/>
        <text x="860" y="492" text-anchor="middle" font-size="25" class="lbl-blue">건당 마진 6,240원</text>

        <!-- Right heavy pan (Fixed cost blocks: 월세 200 + 관리비 30 + 알바·공과금 450 = 680만!) -->
        <line x1="1250" y1="425" x2="1190" y2="520" class="ink-thin"/>
        <line x1="1250" y1="425" x2="1310" y2="520" class="ink-thin"/>
        <rect x="1115" y="520" width="265" height="20" rx="8" class="wc-slate ink"/>
        <!-- Stacked cost blocks -->
        <rect x="1125" y="446" width="246" height="74" rx="12" class="wc-rose ink"/>
        <text x="1248" y="492" text-anchor="middle" font-size="25" class="lbl-red">인건비·공과금 450만</text>
        <rect x="1135" y="372" width="226" height="74" rx="12" class="wc-coral ink"/>
        <text x="1248" y="418" text-anchor="middle" font-size="25" class="lbl">월세·관리비 230만</text>
        <!-- Top Alert Badge -->
        <rect x="835" y="108" width="470" height="86" rx="20" class="wc-coral ink"/>
        <text x="1070" y="161" text-anchor="middle" font-size="32" class="lbl-red">숨만 쉬어도 월 고정비 680만!</text>
        """,
    ),
    "long01_s02_13yr_payback.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 45 orders/day = only 50만원/month left -->
        <ellipse cx="340" cy="645" rx="235" ry="24" class="wc-amber"/>
        <rect x="100" y="105" width="480" height="84" rx="18" class="wc-blue ink"/>
        <text x="340" y="157" text-anchor="middle" font-size="30" class="lbl-blue">하루 42건 팔아야 겨우 ‘0원’ 본전!</text>

        <!-- Tall stack of 45 bowls/boxes on left -->
        <rect x="140" y="495" width="145" height="44" rx="8" class="wc-cobalt ink"/>
        <rect x="145" y="445" width="145" height="44" rx="8" class="wc-blue ink"/>
        <rect x="138" y="395" width="145" height="44" rx="8" class="wc-cobalt ink"/>
        <rect x="146" y="345" width="145" height="44" rx="8" class="wc-blue ink"/>
        <rect x="140" y="295" width="145" height="44" rx="8" class="wc-mint ink"/>
        <text x="212" y="585" text-anchor="middle" font-size="26" class="lbl">하루 45건 강행군</text>

        <!-- Arrow to tiny jar with 1 coin -->
        <path d="M315 425 L385 425" class="ink" style="stroke-width:6"/>
        <polygon points="385,410 412,425 385,440" fill="#18223c"/>
        <rect x="430" y="350" width="135" height="190" rx="26" fill="#ffffff" class="ink"/>
        <rect x="448" y="328" width="99" height="24" rx="8" class="wc-slate ink"/>
        <rect x="436" y="502" width="123" height="32" rx="12" class="wc-gold ink-thin"/>
        <circle cx="498" cy="472" r="22" class="wc-gold ink"/>
        <text x="498" y="590" text-anchor="middle" font-size="28" class="lbl-red">월 순익 단 50만 원</text>

        <!-- RIGHT ZONE: 8,000만원 Sunk Cost / 50만원 = 160개월 (13년 4개월!) -->
        <ellipse cx="1070" cy="645" rx="245" ry="24" class="wc-coral"/>
        <rect x="795" y="105" width="550" height="84" rx="18" class="wc-coral ink"/>
        <text x="1070" y="157" text-anchor="middle" font-size="30" class="lbl-red">시설·권리금 8천만 회수 = 13년 4개월!</text>

        <!-- Big Sunk Cost Boulder on Left of Right Zone -->
        <rect x="815" y="355" width="215" height="230" rx="22" class="wc-rose ink"/>
        <text x="922" y="452" text-anchor="middle" font-size="28" class="lbl">권리금·인테리어</text>
        <text x="922" y="498" text-anchor="middle" font-size="35" class="lbl-red">8,000만 원</text>

        <!-- Winding 160-month Calendar Stack -->
        <rect x="1075" y="275" width="250" height="310" rx="22" fill="#ffffff" class="ink"/>
        <rect x="1075" y="275" width="250" height="72" rx="20" class="wc-cobalt ink"/>
        <circle cx="1130" cy="275" r="12" fill="#ffffff" class="ink-thin"/>
        <circle cx="1270" cy="275" r="12" fill="#ffffff" class="ink-thin"/>
        <text x="1200" y="323" text-anchor="middle" font-size="28" class="lbl">원금 회수 달력</text>
        <text x="1200" y="435" text-anchor="middle" font-size="54" class="lbl-red">160개월</text>
        <text x="1200" y="495" text-anchor="middle" font-size="26" class="lbl">(무려 13.3년 노동)</text>
        <rect x="1098" y="522" width="204" height="40" rx="12" class="wc-amber ink-thin"/>
        <text x="1200" y="549" text-anchor="middle" font-size="20" class="lbl-red">2년 계약 내 회수 불가</text>
        """,
    ),
    "long01_s03_5pct_cap_bomb.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: Exceeding Lease Cap -> 5% Shield Cracks! -->
        <ellipse cx="340" cy="648" rx="235" ry="24" class="wc-coral"/>
        <rect x="90" y="102" width="500" height="84" rx="18" class="wc-coral ink"/>
        <text x="340" y="154" text-anchor="middle" font-size="30" class="lbl-red">환산보증금 초과 시 ‘5% 상한’ 소멸!</text>

        <!-- Cracked Dome Shield -->
        <path d="M145 580 C145 300 535 300 535 580" fill="none" stroke="#e11d48" stroke-width="6" stroke-dasharray="14 10"/>
        <!-- Shop inside cracked dome -->
        <rect x="235" y="415" width="210" height="175" rx="12" class="wc-slate ink"/>
        <path d="M220 415 L460 415 L445 365 L235 365 Z" class="wc-rose ink"/>
        <!-- Giant Red Rent Spike Arrow Piercing Down -->
        <path d="M340 220 L340 345" stroke="#be123c" stroke-width="10" stroke-linecap="round"/>
        <polygon points="315,255 340,205 365,255" fill="#be123c"/>
        <rect x="180" y="255" width="320" height="62" rx="14" class="wc-coral ink"/>
        <text x="340" y="295" text-anchor="middle" font-size="26" class="lbl-red">재계약 월세 +30% 통보!</text>
        <text x="340" y="632" text-anchor="middle" font-size="25" class="lbl">보증금 + (월세×100) 기준 초과</text>

        <!-- RIGHT ZONE: Under Cap -> Intact 5% Emerald Shield! -->
        <ellipse cx="1070" cy="648" rx="235" ry="24" class="wc-mint"/>
        <rect x="790" y="102" width="560" height="84" rx="18" class="wc-mint ink"/>
        <text x="1070" y="154" text-anchor="middle" font-size="29" class="lbl-grn">기준선 안쪽이면 법정 5% 상한 철통 방어!</text>

        <!-- Glowing Intact Emerald Shield Dome -->
        <path d="M865 585 C865 265 1275 265 1275 585 Z" class="wc-mint ink" style="stroke:#059669;stroke-width:6"/>
        <!-- Shop safely protected inside -->
        <rect x="965" y="415" width="210" height="170" rx="12" fill="#ffffff" class="ink"/>
        <path d="M950 415 L1190 415 L1175 365 L965 365 Z" class="wc-cobalt ink"/>
        <rect x="1035" y="475" width="70" height="110" rx="8" class="wc-amber ink"/>
        <!-- Shield Badge on top -->
        <circle cx="1070" cy="300" r="42" class="wc-emerald ink"/>
        <path d="M1050 300 L1065 316 L1094 284" fill="none" class="ink" style="stroke-width:6"/>
        <text x="1070" y="632" text-anchor="middle" font-size="25" class="lbl-grn">서울 9억 · 과밀/부산 6.9억 · 광역시 5.4억 이하</text>
        """,
    ),
    "long01_s04_3sec_shield.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: Pause Pen Before Signing Contract -->
        <ellipse cx="340" cy="648" rx="225" ry="24" class="wc-blue"/>
        <rect x="85" y="102" width="510" height="84" rx="18" class="wc-blue ink"/>
        <text x="340" y="154" text-anchor="middle" font-size="29" class="lbl-blue">도장 찍기 직전, 딱 3가지만 먼저 입력!</text>

        <!-- Lease Document & Smartphone Blueprint -->
        <rect x="115" y="245" width="235" height="335" rx="16" fill="#ffffff" class="ink"/>
        <rect x="142" y="285" width="180" height="24" rx="6" class="wc-slate ink-thin"/>
        <line x1="142" y1="340" x2="315" y2="340" class="ink-thin"/>
        <line x1="142" y1="380" x2="315" y2="380" class="ink-thin"/>
        <line x1="142" y1="420" x2="280" y2="420" class="ink-thin"/>
        <circle cx="265" cy="512" r="44" class="wc-coral ink-thin"/>
        <text x="265" y="520" text-anchor="middle" font-size="18" class="lbl-red">도장 잠깐!</text>

        <!-- Tablet showing 3 checks -->
        <rect x="365" y="295" width="225" height="295" rx="22" class="wc-cobalt ink"/>
        <rect x="383" y="320" width="189" height="245" rx="12" fill="#ffffff" class="ink-thin"/>
        <text x="477" y="370" text-anchor="middle" font-size="22" class="lbl-blue">① 손익분기 주문수</text>
        <text x="477" y="425" text-anchor="middle" font-size="22" class="lbl-grn">② 24개월 내 회수</text>
        <text x="477" y="480" text-anchor="middle" font-size="22" class="lbl">③ 5% 상한 보호</text>
        <rect x="405" y="508" width="145" height="36" rx="10" class="wc-emerald ink-thin"/>
        <text x="477" y="533" text-anchor="middle" font-size="19" class="lbl">3초 즉시 판독</text>

        <!-- RIGHT ZONE: Safe Profitable Storefront + Full Coin Jar -->
        <ellipse cx="1070" cy="648" rx="240" ry="24" class="wc-mint"/>
        <rect x="788" y="102" width="564" height="84" rx="18" class="wc-mint ink"/>
        <text x="1070" y="154" text-anchor="middle" font-size="28" class="lbl-grn">월세 비율 10% 이내 · 내 월급 지키는 가게!</text>

        <!-- Bright Storefront -->
        <rect x="850" y="275" width="270" height="315" rx="16" fill="#ffffff" class="ink"/>
        <path d="M835 275 L1135 275 L1120 225 L850 225 Z" class="wc-emerald ink"/>
        <rect x="885" y="340" width="120" height="135" rx="10" class="wc-blue ink"/>
        <rect x="1025" y="365" width="68" height="225" rx="8" class="wc-amber ink"/>

        <!-- Overflowing Gold Coin Jar beside shop -->
        <rect x="1155" y="340" width="155" height="250" rx="28" class="wc-mint ink"/>
        <rect x="1180" y="314" width="105" height="28" rx="8" class="wc-slate ink"/>
        <circle cx="1205" cy="540" r="24" class="wc-gold ink-thin"/>
        <circle cx="1255" cy="542" r="24" class="wc-gold ink-thin"/>
        <circle cx="1230" cy="500" r="24" class="wc-gold ink-thin"/>
        <circle cx="1198" cy="462" r="24" class="wc-gold ink-thin"/>
        <circle cx="1260" cy="460" r="24" class="wc-gold ink-thin"/>
        <circle cx="1232" cy="420" r="24" class="wc-gold ink-thin"/>
        <text x="1075" y="635" text-anchor="middle" font-size="26" class="lbl-blue">검색창에 ‘부자생각’ · boozathink.com</text>
        """,
    ),
}

# ---------------------------------------------------------------------------
# 3 Square 1:1 Illustrations for EP04 Shorts (1024 x 1024)
# ---------------------------------------------------------------------------
EP04_SVGS = {
    "ep04_s1_thirty_min_shock.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="885" rx="330" ry="34" class="wc-coral"/>
        <!-- Giant Analog Clock Centerpiece -->
        <circle cx="400" cy="495" r="245" fill="#ffffff" class="ink" style="stroke-width:6"/>
        <circle cx="400" cy="495" r="220" class="wc-slate ink-thin"/>
        <!-- Highlighted 30-minute red wedge -->
        <path d="M400 495 L400 275 A220 220 0 0 1 590 385 Z" class="wc-rose ink"/>
        <line x1="400" y1="495" x2="400" y2="310" class="ink" style="stroke-width:8"/>
        <line x1="400" y1="495" x2="552" y2="407" stroke="#be123c" stroke-width="8" stroke-linecap="round"/>
        <circle cx="400" cy="495" r="16" class="wc-cobalt ink"/>

        <!-- Callout Badge on 30-min wedge -->
        <rect x="465" y="155" width="465" height="92" rx="24" class="wc-coral ink"/>
        <text x="697" y="213" text-anchor="middle" font-size="35" class="lbl-red">단 ‘30분’ 더 썼을 뿐인데!</text>

        <!-- Flying Winged Coins Escaping on Right -->
        <g transform="translate(680, 465)">
          <circle cx="95" cy="60" r="50" class="wc-gold ink"/>
          <path d="M35 45 Q-8 12 42 25" class="wc-coral ink-thin"/>
          <path d="M155 45 Q198 12 148 25" class="wc-coral ink-thin"/>
          <text x="95" y="70" text-anchor="middle" font-size="25" class="lbl-red">-573만</text>
        </g>
        <g transform="translate(665, 625)">
          <circle cx="105" cy="58" r="48" class="wc-gold ink"/>
          <text x="105" y="66" text-anchor="middle" font-size="20" class="lbl-red">주휴+보험</text>
        </g>

        <!-- Bottom Comparison Pill -->
        <rect x="130" y="790" width="764" height="86" rx="22" class="wc-blue ink"/>
        <text x="512" y="845" text-anchor="middle" font-size="34" class="lbl-blue">주 14.5시간 vs 주 15.0시간 (알바 2명 기준)</text>
        """,
    ),
    "ep04_s2_wage_cliff_jump.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="895" rx="360" ry="32" class="wc-blue"/>
        <!-- Left Calm Bar: 14.5h = 65.6만원 -->
        <rect x="135" y="510" width="295" height="330" rx="22" class="wc-blue ink"/>
        <rect x="160" y="415" width="245" height="76" rx="18" class="wc-mint ink"/>
        <text x="282" y="464" text-anchor="middle" font-size="32" class="lbl-grn">주 14.5시간</text>
        <text x="282" y="645" text-anchor="middle" font-size="46" class="lbl-blue">월 65.6만</text>
        <text x="282" y="705" text-anchor="middle" font-size="27" class="lbl">주휴수당 0원</text>
        <text x="282" y="748" text-anchor="middle" font-size="27" class="lbl">산재보험만 적용</text>

        <!-- Dramatic Cliff Lightning Arrow in Center -->
        <path d="M455 540 L555 340" stroke="#be123c" stroke-width="8" stroke-dasharray="12 8"/>
        <polygon points="530,348 568,318 566,368" fill="#be123c"/>
        <rect x="315" y="135" width="275" height="76" rx="999" class="wc-coral ink"/>
        <text x="452" y="184" text-anchor="middle" font-size="30" class="lbl-red">+36.4% 급등!</text>

        <!-- Right Towering Cliff Bar: 15.0h = 89.5만원 -->
        <rect x="595" y="235" width="295" height="605" rx="22" class="wc-coral ink"/>
        <rect x="595" y="235" width="295" height="140" rx="20" class="wc-rose ink"/>
        <text x="742" y="292" text-anchor="middle" font-size="27" class="lbl-red">+주휴수당 13.5만</text>
        <text x="742" y="336" text-anchor="middle" font-size="27" class="lbl-red">+4대보험 8.8만</text>

        <rect x="620" y="140" width="245" height="76" rx="18" class="wc-amber ink"/>
        <text x="742" y="189" text-anchor="middle" font-size="32" class="lbl-red">주 15.0시간</text>
        <text x="742" y="540" text-anchor="middle" font-size="50" class="lbl-red">월 89.5만</text>
        <text x="742" y="610" text-anchor="middle" font-size="28" class="lbl">1인당 매달 +23.9만</text>
        <text x="742" y="655" text-anchor="middle" font-size="29" class="lbl-red">2명이면 연 573만!</text>

        <!-- Ground Baseline -->
        <line x1="95" y1="840" x2="930" y2="840" class="ink" style="stroke-width:7"/>
        """,
    ),
    "ep04_s3_table_order_payback.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="890" rx="350" ry="32" class="wc-mint"/>
        <!-- Top Payback Banner -->
        <rect x="115" y="125" width="794" height="92" rx="24" class="wc-mint ink"/>
        <text x="512" y="183" text-anchor="middle" font-size="35" class="lbl-grn">테이블오더 4대 도입 시 ‘3.8개월’ 본전 회수!</text>

        <!-- Sleek Cobalt Table-Order Stand on Left -->
        <rect x="145" y="320" width="310" height="235" rx="24" class="wc-cobalt ink"/>
        <rect x="168" y="343" width="264" height="188" rx="14" fill="#ffffff" class="ink-thin"/>
        <rect x="190" y="370" width="100" height="72" rx="10" class="wc-amber ink-thin"/>
        <rect x="308" y="370" width="100" height="72" rx="10" class="wc-mint ink-thin"/>
        <rect x="190" y="462" width="218" height="44" rx="12" class="wc-blue ink-thin"/>
        <text x="300" y="492" text-anchor="middle" font-size="24" class="lbl-blue">주문·결제 자동화</text>
        <!-- Stand neck & base -->
        <rect x="278" y="555" width="44" height="125" class="wc-slate ink"/>
        <rect x="205" y="680" width="190" height="28" rx="12" class="wc-slate ink"/>

        <!-- Arrow to Overflowing 3-Year Savings Vault on Right -->
        <path d="M480 505 L560 505" class="ink" style="stroke-width:7"/>
        <polygon points="555,485 590,505 555,525" fill="#059669"/>

        <rect x="605" y="305" width="295" height="405" rx="32" class="wc-emerald ink"/>
        <rect x="629" y="338" width="247" height="340" rx="20" fill="#ffffff" class="ink-thin"/>
        <text x="752" y="410" text-anchor="middle" font-size="25" class="lbl-grn">3년 누적 인건비 절감</text>
        <text x="752" y="485" text-anchor="middle" font-size="45" class="lbl-blue">+1,539만</text>
        <circle cx="698" cy="595" r="28" class="wc-gold ink-thin"/>
        <circle cx="752" cy="585" r="28" class="wc-gold ink-thin"/>
        <circle cx="806" cy="595" r="28" class="wc-gold ink-thin"/>
        <circle cx="725" cy="632" r="28" class="wc-gold ink-thin"/>
        <circle cx="780" cy="632" r="28" class="wc-gold ink-thin"/>

        <!-- Bottom CTA Bar -->
        <rect x="125" y="775" width="774" height="86" rx="24" class="wc-blue ink"/>
        <text x="512" y="829" text-anchor="middle" font-size="33" class="lbl-blue">내 매장 시간표 &amp; 내년 시급(10,700원) 3초 비교!</text>
        """,
    ),
}


def render_all() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        for fname, (w, h, svg_body) in {**LONG01_SVGS, **EP04_SVGS}.items():
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

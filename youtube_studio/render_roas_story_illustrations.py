# -*- coding: utf-8 -*-
"""
Renders 7 Empathetic Story-Driven Hand-Drawn Fountain-Pen + Pastel Watercolor Illustrations
via Playwright Chromium SVG (`feTurbulence` + `feDisplacementMap` organic nib wobble on `#FFFFFF`)
for Unified Topic (`2026-11-28`):
  〈“형! 광고 ROAS 300% 찍고 월 매출 2,700만 원 나왔어!” — 좋아하던 지인이 정산 날 월급에서 100만 원 메운 이유 & 월 +386만 원 반전 공식〉
  - Long04 (16:9 Dual-Zone 1408x768): S01..S04
  - EP07 (9:16 Shorts Square 1024x1024): S1..S3
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
    <feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="2" seed="23" result="noise"/>
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
# 4 Dual-Zone 16:9 Story Illustrations (1408 x 768 — Split cleanly at x=704)
# ---------------------------------------------------------------------------
LONG04_SVGS = {
    "long04_s01_friend_shock_story.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 퇴근 후 밤잠 줄이며 ROAS 300% · 월 2,700만 매출 찍고 기뻐하던 지인 -->
        <ellipse cx="345" cy="655" rx="255" ry="24" class="wc-mint"/>
        <rect x="80" y="92" width="530" height="82" rx="18" class="wc-mint ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="27" class="lbl-grn">“형! ROAS 300% 찍고 하루 30개씩 팔려!”</text>

        <!-- Excited Seller Character + Stacked Courier Boxes -->
        <rect x="100" y="212" width="490" height="255" rx="20" fill="#ffffff" class="ink"/>
        <!-- Smiling character on left -->
        <circle cx="205" cy="305" r="38" class="wc-amber ink"/>
        <path d="M190 298 Q196 290 202 298 M210 298 Q216 290 222 298" fill="none" class="ink-thin"/>
        <path d="M192 316 Q205 330 218 316" fill="none" class="ink-thin"/>
        <path d="M158 425 C158 358 252 358 252 425 Z" class="wc-cobalt ink"/>

        <!-- Stacked parcel boxes & dashboard -->
        <rect x="285" y="245" width="275" height="190" rx="16" class="wc-blue ink-thin"/>
        <text x="422" y="290" text-anchor="middle" font-size="20" class="lbl-blue">29,900원 수납함 × 월 900개</text>
        <text x="422" y="338" text-anchor="middle" font-size="31" class="lbl-grn">월 매출 2,691만!</text>
        <rect x="315" y="362" width="215" height="48" rx="12" class="wc-emerald ink-thin"/>
        <text x="422" y="394" text-anchor="middle" font-size="21" class="lbl">광고 ROAS 300% 달성</text>

        <rect x="100" y="492" width="490" height="126" rx="20" class="wc-slate ink"/>
        <text x="345" y="542" text-anchor="middle" font-size="21.5" class="lbl-sub">사입가 11,700원에 떼와서 29,900원에 파니까</text>
        <text x="345" y="586" text-anchor="middle" font-size="22.5" class="lbl-blue">“개당 18,200원이나 남겠지? 이제 퇴사 각이다!”</text>

        <!-- RIGHT ZONE: 한 달 뒤 정산 날 하얗게 질린 얼굴 -> 월급에서 -100만 원 마이너스! -->
        <ellipse cx="1065" cy="655" rx="255" ry="24" class="wc-coral"/>
        <rect x="778" y="92" width="574" height="82" rx="18" class="wc-coral ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="24.5" class="lbl-red">정산 날 충격: “900개 팔고 내 돈 100만 원 까먹었어…”</text>

        <rect x="815" y="212" width="500" height="255" rx="20" fill="#ffffff" class="ink"/>
        <!-- Shocked character on left -->
        <circle cx="920" cy="305" r="38" class="wc-coral ink"/>
        <circle cx="907" cy="298" r="4" fill="#18223c"/>
        <circle cx="933" cy="298" r="4" fill="#18223c"/>
        <ellipse cx="920" cy="322" rx="10" ry="12" fill="#ffffff" class="ink-thin"/>
        <path d="M873 425 C873 358 967 358 967 425 Z" class="wc-slate ink"/>

        <!-- Red settlement statement -->
        <rect x="1000" y="245" width="285" height="190" rx="16" class="wc-coral ink-thin"/>
        <text x="1142" y="290" text-anchor="middle" font-size="19.5" class="lbl-sub">카드값 · 사입비 · 광고비 정산 후</text>
        <text x="1142" y="342" text-anchor="middle" font-size="34" class="lbl-red">-100만 4천 원!</text>
        <rect x="1022" y="365" width="240" height="48" rx="12" class="wc-rose ink-thin"/>
        <text x="1142" y="397" text-anchor="middle" font-size="20" class="lbl-red">1개 팔 때마다 -1,055원 적자</text>

        <rect x="815" y="492" width="500" height="126" rx="20" class="wc-coral ink"/>
        <text x="1065" y="542" text-anchor="middle" font-size="21.5" class="lbl">밤새 택배 900개 싸고 본업 월급으로 메운 참사!</text>
        <text x="1065" y="586" text-anchor="middle" font-size="23" class="lbl-red">대체 ROAS 300%의 어디에 구멍이 있었을까?</text>
        """,
    ),
    "long04_s02_five_hidden_leaks.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 카페에서 노트북 펴고 뜯어본 29,900원 1개의 숨은 비용 5가지 -->
        <ellipse cx="345" cy="655" rx="255" ry="24" class="wc-amber"/>
        <rect x="80" y="92" width="530" height="82" rx="18" class="wc-amber ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="27" class="lbl">노트북 펴고 뜯어본 ‘29,900원 1개’의 진실</text>

        <rect x="95" y="202" width="500" height="418" rx="20" fill="#ffffff" class="ink"/>
        <rect x="95" y="202" width="500" height="56" rx="18" class="wc-blue ink-thin"/>
        <text x="345" y="239" text-anchor="middle" font-size="22" class="lbl-blue">쿠팡 로켓그로스 판매가 29,900원 원 단위 해부</text>

        <text x="122" y="292" font-size="20.5" class="lbl-sub">① 사입원가 + 입고물류비</text>
        <text x="568" y="292" text-anchor="end" font-size="21" class="lbl">-11,700원</text>

        <text x="122" y="334" font-size="21" class="lbl-red">② 판매수수료 11.88% (10.8%+VAT!)</text>
        <text x="568" y="334" text-anchor="end" font-size="21" class="lbl-red">-3,552원</text>

        <text x="122" y="376" font-size="21" class="lbl-sub">③ 로켓그로스 입출고 · 배송비</text>
        <text x="568" y="376" text-anchor="end" font-size="21" class="lbl">-3,200원</text>

        <text x="122" y="418" font-size="21" class="lbl-sub">④ 부가가치세 납부분 (매입공제 반영)</text>
        <text x="568" y="418" text-anchor="end" font-size="21" class="lbl">-1,041원</text>

        <text x="122" y="460" font-size="21" class="lbl-red">⑤ 단순변심 반품 · 불량 손실 (5%)</text>
        <text x="568" y="460" text-anchor="end" font-size="21" class="lbl-red">-1,495원</text>

        <line x1="120" y1="484" x2="570" y2="484" class="ink-thin"/>
        <text x="122" y="528" font-size="24" class="lbl">광고 전 진짜 순마진 (29.8%)</text>
        <text x="568" y="528" text-anchor="end" font-size="28" class="lbl-blue">8,912원뿐!</text>
        <text x="345" y="586" text-anchor="middle" font-size="17.5" class="lbl-red">※ 게다가 월 매출 100만↑ 시 서버이용료 월 5.5만 원 별도 차감!</text>

        <!-- RIGHT ZONE: 손익분기 ROAS 335% vs 실제 ROAS 300% 적자 역전 -->
        <ellipse cx="1065" cy="655" rx="255" ry="24" class="wc-coral"/>
        <rect x="790" y="92" width="550" height="82" rx="18" class="wc-coral ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="27" class="lbl-red">손익분기 ROAS는 335%인데 300%에 속았다!</text>

        <rect x="815" y="205" width="500" height="245" rx="20" fill="#ffffff" class="ink"/>
        <text x="1065" y="252" text-anchor="middle" font-size="22" class="lbl-blue">손익분기 ROAS 공식 = 판매가 ÷ 광고 전 순마진</text>
        <rect x="845" y="276" width="205" height="142" rx="16" class="wc-blue ink-thin"/>
        <text x="947" y="320" text-anchor="middle" font-size="20" class="lbl-sub">광고 전 남는 돈</text>
        <text x="947" y="366" text-anchor="middle" font-size="31" class="lbl-blue">+8,912원</text>
        <text x="947" y="398" text-anchor="middle" font-size="18" class="lbl-sub">(본전 ROAS 335%)</text>

        <rect x="1080" y="276" width="205" height="142" rx="16" class="wc-rose ink-thin"/>
        <text x="1182" y="320" text-anchor="middle" font-size="20" class="lbl-red">ROAS 300% 광고비</text>
        <text x="1182" y="366" text-anchor="middle" font-size="31" class="lbl-red">-9,967원</text>
        <text x="1182" y="398" text-anchor="middle" font-size="18" class="lbl-red">(29,900원 ÷ 3.0)</text>

        <rect x="815" y="476" width="500" height="144" rx="20" class="wc-coral ink"/>
        <text x="1065" y="526" text-anchor="middle" font-size="23" class="lbl">8,912원 남는데 광고비로 9,967원 지출!</text>
        <text x="1065" y="582" text-anchor="middle" font-size="33" class="lbl-red">팔수록 개당 -1,055원 자동 증발!</text>
        """,
    ),
    "long04_s03_turnaround_prescription.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 광고 끄지 않고 3가지만 바꾼 지인 대표님의 실전 처방 -->
        <ellipse cx="345" cy="655" rx="255" ry="24" class="wc-blue"/>
        <rect x="80" y="92" width="530" height="82" rx="18" class="wc-blue ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="27" class="lbl-blue">광고 안 끄고 ‘딱 3가지’만 바꾼 반전 처방!</text>

        <rect x="84" y="205" width="522" height="124" rx="18" class="wc-emerald ink"/>
        <text x="108" y="252" font-size="23" class="lbl-grn">① 스마트스토어 ‘판매자 마케팅 유입 링크’</text>
        <text x="108" y="294" font-size="16.8" class="lbl">외부 광고 손님을 전용 링크로 연결 → 수수료 4.63%로 확 절감!</text>

        <rect x="84" y="348" width="522" height="124" rx="18" class="wc-blue ink"/>
        <text x="108" y="395" font-size="23" class="lbl-blue">② 상세페이지 실측 비교표로 반품률 5% → 2%</text>
        <text x="108" y="437" font-size="16.8" class="lbl">개당 반품 손실 -897원 방어 → 본전 ROAS 335% → 246% 하락!</text>

        <rect x="84" y="491" width="522" height="124" rx="18" class="wc-amber ink"/>
        <text x="108" y="538" font-size="23" class="lbl">③ 클릭당 입찰 상한선(손익분기 CPC) 잠금!</text>
        <text x="108" y="580" font-size="16.8" class="lbl">손익분기 CPC(340원)의 70% 안전선(220원)으로 과열 입찰 차단</text>

        <!-- RIGHT ZONE: 한 달 뒤 똑같이 900개 팔고 월 -100만 -> 월 +386만 원 대역전! -->
        <ellipse cx="1065" cy="655" rx="255" ry="24" class="wc-mint"/>
        <rect x="790" y="92" width="550" height="82" rx="18" class="wc-mint ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="27" class="lbl-grn">한 달 뒤 정산 결과: 똑같이 900개 팔았는데!</text>

        <rect x="815" y="208" width="500" height="238" rx="20" fill="#ffffff" class="ink"/>
        <rect x="840" y="240" width="200" height="172" rx="16" class="wc-coral ink-thin"/>
        <text x="940" y="286" text-anchor="middle" font-size="21" class="lbl-sub">처방 전 (지난달)</text>
        <text x="940" y="338" text-anchor="middle" font-size="31" class="lbl-red">-100만 원</text>
        <text x="940" y="382" text-anchor="middle" font-size="18.5" class="lbl-red">(개당 -1,055원)</text>

        <path d="M1052 326 L1088 326" class="ink" style="stroke-width:5"/>
        <polygon points="1084,312 1108,326 1084,340" fill="#047857"/>

        <rect x="1116" y="240" width="176" height="172" rx="16" class="wc-emerald ink"/>
        <text x="1204" y="286" text-anchor="middle" font-size="21" class="lbl">처방 후 (이번 달)</text>
        <text x="1204" y="338" text-anchor="middle" font-size="31" class="lbl-grn">+386만 원!</text>
        <text x="1204" y="382" text-anchor="middle" font-size="18.5" class="lbl">(개당 +4,286원)</text>

        <rect x="815" y="472" width="500" height="146" rx="20" class="wc-mint ink"/>
        <text x="1065" y="524" text-anchor="middle" font-size="23" class="lbl">매출·판매량은 그대로인데 한 달 만에</text>
        <text x="1065" y="578" text-anchor="middle" font-size="35" class="lbl-grn">통장 수익 +486만 원 반전 성공!</text>
        """,
    ),
    "long04_s04_seller_roas_check.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 광고비 1만 원 더 충전하기 전 꼭 알아야 할 내 상품 3대 기준점 -->
        <ellipse cx="345" cy="655" rx="250" ry="24" class="wc-blue"/>
        <rect x="85" y="92" width="520" height="82" rx="18" class="wc-blue ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="27" class="lbl-blue">광고 돌리기 전 반드시 적어야 할 3가지 숫자!</text>

        <rect x="95" y="208" width="500" height="408" rx="22" fill="#ffffff" class="ink"/>
        <rect x="114" y="238" width="462" height="104" rx="16" class="wc-blue ink-thin"/>
        <text x="136" y="280" font-size="22" class="lbl-blue">① 내 상품 ‘진짜 손익분기 ROAS(%)’</text>
        <text x="136" y="318" font-size="16.8" class="lbl-sub">수수료(VAT포함)·물류·납부부가세·반품률 다 뺀 본전 기준선</text>

        <rect x="114" y="360" width="462" height="104" rx="16" class="wc-mint ink-thin"/>
        <text x="136" y="402" font-size="22" class="lbl-grn">② 최대 허용 CPA &amp; 손익분기 CPC(원)</text>
        <text x="136" y="440" font-size="16.8" class="lbl-sub">클릭당 몇 원 이상 입찰하면 적자인지 1원 단위로 상한선 확인</text>

        <rect x="114" y="482" width="462" height="104" rx="16" class="wc-amber ink-thin"/>
        <text x="136" y="524" font-size="22" class="lbl">③ 환율(위안·달러) 변동 반영 사입 원가</text>
        <text x="136" y="562" font-size="16.8" class="lbl-sub">1688·알리 사입 셀러를 위한 실시간 환율 연동 원가 계산</text>

        <!-- RIGHT ZONE: 부자생각 셀러 마진 & 손익분기 ROAS 3초 판독기 -->
        <ellipse cx="1065" cy="655" rx="250" ry="24" class="wc-mint"/>
        <rect x="790" y="92" width="550" height="82" rx="18" class="wc-mint ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="27" class="lbl-grn">부자생각에서 내 상품 마진 구멍 3초 판독!</text>

        <rect x="820" y="205" width="490" height="395" rx="26" class="wc-cobalt ink"/>
        <rect x="844" y="232" width="442" height="340" rx="18" fill="#ffffff" class="ink-thin"/>
        <text x="1065" y="280" text-anchor="middle" font-size="24" class="lbl-blue">부자생각 셀러 마진 · ROAS 계산기</text>
        <line x1="870" y1="300" x2="1260" y2="300" class="ink-thin"/>
        <text x="875" y="344" font-size="22" class="lbl">✔ 스마트스토어(일반·영세·마케팅) 비교</text>
        <text x="875" y="390" font-size="22" class="lbl">✔ 쿠팡 윙 · 로켓그로스 실효수수료 반영</text>
        <text x="875" y="436" font-size="22" class="lbl">✔ 손익분기 ROAS · 최대 CPA · 안전 CPC</text>
        <text x="875" y="482" font-size="22" class="lbl-grn">✔ 중국 위안화(CNY)·달러 환율 자동 연동!</text>
        <rect x="905" y="505" width="320" height="48" rx="24" class="wc-emerald ink-thin"/>
        <text x="1065" y="537" text-anchor="middle" font-size="23" class="lbl">boozathink.com</text>
        <text x="1065" y="636" text-anchor="middle" font-size="25" class="lbl-blue">검색창에 ‘부자생각’ · 광고비 태우기 전 꼭 확인하세요</text>
        """,
    ),
}

# ---------------------------------------------------------------------------
# 3 Square 1:1 Illustrations for EP07 Shorts (1024 x 1024)
# ---------------------------------------------------------------------------
EP07_SVGS = {
    "ep07_s1_roas300_trap.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="895" rx="355" ry="30" class="wc-coral"/>
        <rect x="100" y="115" width="824" height="92" rx="24" class="wc-coral ink"/>
        <text x="512" y="173" text-anchor="middle" font-size="32" class="lbl-red">“형! ROAS 300% 찍었어!” 좋아하다 -100만 적자?!</text>

        <!-- Left Card: Illusion -->
        <rect x="115" y="255" width="370" height="485" rx="24" class="wc-mint ink"/>
        <rect x="145" y="285" width="310" height="68" rx="16" fill="#ffffff" class="ink-thin"/>
        <text x="300" y="329" text-anchor="middle" font-size="27" class="lbl-grn">지인의 기대 (광고 리포트)</text>
        <text x="300" y="398" text-anchor="middle" font-size="23" class="lbl-sub">29,900원 × 한 달 900개</text>
        <text x="300" y="468" text-anchor="middle" font-size="25" class="lbl">광고 ROAS</text>
        <text x="300" y="520" text-anchor="middle" font-size="42" class="lbl-blue">300% 달성</text>
        <line x1="155" y1="560" x2="445" y2="560" class="ink-thin"/>
        <text x="300" y="610" text-anchor="middle" font-size="24" class="lbl">겉보기 한 달 매출</text>
        <text x="300" y="675" text-anchor="middle" font-size="42" class="lbl-grn">2,691만 원</text>

        <line x1="512" y1="240" x2="512" y2="755" stroke="#be123c" stroke-width="6" stroke-dasharray="12 9"/>

        <!-- Right Card: Harsh Reality -->
        <rect x="539" y="255" width="370" height="485" rx="24" class="wc-coral ink"/>
        <rect x="569" y="285" width="310" height="68" rx="16" fill="#ffffff" class="ink-thin"/>
        <text x="724" y="329" text-anchor="middle" font-size="27" class="lbl-red">한 달 뒤 실제 정산통장</text>
        <text x="724" y="398" text-anchor="middle" font-size="23" class="lbl-red">본전 ROAS는 335%였음!</text>
        <text x="724" y="468" text-anchor="middle" font-size="25" class="lbl">1개 팔릴 때마다</text>
        <text x="724" y="520" text-anchor="middle" font-size="40" class="lbl-red">-1,055원!</text>
        <line x1="579" y1="560" x2="869" y2="560" class="ink-thin"/>
        <text x="724" y="610" text-anchor="middle" font-size="24" class="lbl">본업 월급에서 메운 돈</text>
        <text x="724" y="675" text-anchor="middle" font-size="42" class="lbl-red">-100만 원!</text>

        <rect x="115" y="782" width="794" height="86" rx="22" class="wc-blue ink"/>
        <text x="512" y="837" text-anchor="middle" font-size="31" class="lbl-blue">밤새 택배 900개 싸고 내 돈 얹어 보낸 실화!</text>
        """,
    ),
    "ep07_s2_hidden_fees_anatomy.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="895" rx="355" ry="30" class="wc-amber"/>
        <rect x="105" y="115" width="814" height="90" rx="24" class="wc-amber ink"/>
        <text x="512" y="172" text-anchor="middle" font-size="32" class="lbl">왜 ROAS 300%인데 팔수록 적자가 났을까?</text>

        <rect x="115" y="242" width="794" height="498" rx="26" fill="#ffffff" class="ink"/>
        <rect x="148" y="275" width="728" height="128" rx="18" class="wc-coral ink-thin"/>
        <text x="178" y="325" font-size="26" class="lbl-red">① 쿠팡 수수료 10.8% + VAT = 실효 11.88%!</text>
        <text x="178" y="368" font-size="21" class="lbl-sub">수수료 3,552원 + 입출고·배송 3,200원 + 부가세·반품 2,536원</text>

        <rect x="148" y="425" width="728" height="128" rx="18" class="wc-blue ink-thin"/>
        <text x="178" y="475" font-size="26" class="lbl-blue">② 광고 전 순마진은 겨우 8,912원 (본전 335%)</text>
        <text x="178" y="518" font-size="21" class="lbl-sub">ROAS 300%면 개당 광고비 9,967원 ➔ 팔 때마다 -1,055원 손해!</text>

        <rect x="148" y="575" width="728" height="128" rx="18" class="wc-emerald ink-thin"/>
        <text x="178" y="625" font-size="26" class="lbl-grn">③ 스마트스토어 ‘마케팅 유입 링크’로 반전!</text>
        <text x="178" y="668" font-size="20.5" class="lbl-sub">수수료 4.63% 절감 + 반품 개선 + 입찰상한 220원으로 흑자 전환!</text>

        <rect x="115" y="780" width="794" height="86" rx="22" class="wc-mint ink"/>
        <text x="512" y="835" text-anchor="middle" font-size="31" class="lbl-grn">한 달 만에 -100만 적자 ➔ +386만 순수익 역전!</text>
        """,
    ),
    "ep07_s3_roas_turnaround.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="895" rx="355" ry="30" class="wc-mint"/>
        <rect x="105" y="115" width="814" height="90" rx="24" class="wc-mint ink"/>
        <text x="512" y="172" text-anchor="middle" font-size="32" class="lbl-grn">광고비 충전 전 ‘내 손익분기 ROAS’ 3초 검산!</text>

        <rect x="115" y="245" width="378" height="485" rx="24" class="wc-blue ink"/>
        <text x="304" y="308" text-anchor="middle" font-size="27" class="lbl-blue">처방 전 vs 처방 후</text>
        <rect x="145" y="335" width="318" height="150" rx="18" fill="#ffffff" class="ink-thin"/>
        <text x="304" y="392" text-anchor="middle" font-size="23" class="lbl-red">지난달: 월 -100만 원</text>
        <text x="304" y="446" text-anchor="middle" font-size="30" class="lbl-grn">이번 달: +386만 원!</text>
        <text x="304" y="548" text-anchor="middle" font-size="22.5" class="lbl-sub">본전 ROAS 335% → 246%</text>
        <text x="304" y="588" text-anchor="middle" font-size="23.5" class="lbl">똑같이 900개 팔고 역전!</text>
        <rect x="155" y="630" width="298" height="64" rx="16" class="wc-emerald ink-thin"/>
        <text x="304" y="671" text-anchor="middle" font-size="23" class="lbl">한 달 +486만 원 차이!</text>

        <rect x="531" y="245" width="378" height="485" rx="24" class="wc-amber ink"/>
        <text x="720" y="308" text-anchor="middle" font-size="27" class="lbl">부자생각 셀러 판독기</text>
        <rect x="561" y="335" width="318" height="150" rx="18" fill="#ffffff" class="ink-thin"/>
        <text x="720" y="392" text-anchor="middle" font-size="22.5" class="lbl-blue">진짜 손익분기 ROAS(%)</text>
        <text x="720" y="446" text-anchor="middle" font-size="27" class="lbl-grn">&amp; 클릭당 입찰 상한선!</text>
        <text x="720" y="548" text-anchor="middle" font-size="22.5" class="lbl-sub">쿠팡 · 스마트스토어 수수료</text>
        <text x="720" y="588" text-anchor="middle" font-size="23.5" class="lbl-grn">위안화·달러 환율 자동 연동</text>
        <rect x="571" y="630" width="298" height="64" rx="16" class="wc-mint ink-thin"/>
        <text x="720" y="671" text-anchor="middle" font-size="23" class="lbl-grn">3초 만에 적자 구멍 차단</text>

        <rect x="115" y="778" width="794" height="90" rx="24" class="wc-cobalt ink"/>
        <text x="512" y="835" text-anchor="middle" font-size="33" class="lbl">검색창에 ‘부자생각’ · 내 상품 본전 ROAS 확인!</text>
        """,
    ),
}


def render_all() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        for fname, (w, h, svg_body) in {**LONG04_SVGS, **EP07_SVGS}.items():
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

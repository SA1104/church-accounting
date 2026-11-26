# -*- coding: utf-8 -*-
"""
Renders 7 Expert Hand-Drawn Fountain-Pen + Pastel Watercolor Financial Diagrams
via Playwright Chromium SVG (`feTurbulence` + `feDisplacementMap` nib wobble on `#FFFFFF`)
for Unified Topic (`2026-11-26`):
  〈“급하다고 카드론·은행부터 먼저 누르셨나요?” 순서 한 번 거꾸로 갔다가 연 2%대 정책자금 5,050만 원 날리는 이유 & 연 4.5% 대환·국비 500만 원 공식〉
  - Long03 (16:9 Dual-Zone 1408x768): S01..S04
  - EP06 (9:16 Shorts Square 1024x1024): S1..S3
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
    <feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="2" seed="19" result="noise"/>
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
# 4 Dual-Zone 16:9 Illustrations (1408 x 768 — Split cleanly at x=704)
# ---------------------------------------------------------------------------
LONG03_SVGS = {
    "long03_s01_wrong_order_shock.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 급하다고 카드론·2금융 먼저 실행 -> 한도 -5,050만 증발! -->
        <ellipse cx="345" cy="655" rx="255" ry="24" class="wc-coral"/>
        <rect x="85" y="92" width="520" height="82" rx="18" class="wc-coral ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="28" class="lbl-red">사장님 A: 급하다고 카드론·2금융 먼저 클릭!</text>

        <rect x="95" y="205" width="500" height="255" rx="20" fill="#ffffff" class="ink"/>
        <rect x="95" y="205" width="500" height="58" rx="18" class="wc-rose ink-thin"/>
        <text x="345" y="243" text-anchor="middle" font-size="22" class="lbl-red">동일 조건: 연 매출 1.8억 · 신용 800점대 매장</text>
        <text x="125" y="302" font-size="22" class="lbl-sub">① 모바일 카드론·캐피탈 2천만 먼저 실행</text>
        <text x="125" y="344" font-size="22" class="lbl-red">② 신용점수 하락 + ‘다중채무’ 즉시 분류</text>
        <text x="125" y="386" font-size="22" class="lbl-sub">③ 지역신보·1금융 저금리 심사 한도 삭감!</text>
        <line x1="120" y1="406" x2="570" y2="406" class="ink-thin"/>
        <text x="125" y="443" font-size="24" class="lbl">평균 부담 금리</text>
        <text x="565" y="443" text-anchor="end" font-size="27" class="lbl-red">연 11.8% 고금리 늪</text>

        <rect x="95" y="488" width="500" height="132" rx="22" class="wc-coral ink"/>
        <text x="345" y="538" text-anchor="middle" font-size="23" class="lbl-red">남은 추가 조달 한도 반토막!</text>
        <text x="345" y="592" text-anchor="middle" font-size="37" class="lbl-red">3,718만 원 (-5,050만 증발!)</text>

        <!-- RIGHT ZONE: 정석 순서로 신청한 사장님 B -> 연 2~3%대 8,768만 풀확보! -->
        <ellipse cx="1065" cy="655" rx="255" ry="24" class="wc-mint"/>
        <rect x="795" y="92" width="540" height="82" rx="18" class="wc-mint ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="28" class="lbl-grn">사장님 B: ‘정책·보증서 1순위’ 정석 순서!</text>

        <rect x="815" y="205" width="500" height="255" rx="20" fill="#ffffff" class="ink"/>
        <rect x="815" y="205" width="500" height="58" rx="18" class="wc-blue ink-thin"/>
        <text x="1065" y="243" text-anchor="middle" font-size="22" class="lbl-blue">동일 조건: 연 매출 1.8억 · 신용 800점대 매장</text>
        <text x="845" y="302" font-size="22" class="lbl-grn">① 지역신보 + 지자체 이차보전 먼저 확보</text>
        <text x="845" y="344" font-size="22" class="lbl-blue">② 소진공 직접대출 별도 한도 추가 결합</text>
        <text x="845" y="386" font-size="22" class="lbl-sub">③ 주거래은행 가맹점 우대 한도 마지막 실행</text>
        <line x1="840" y1="406" x2="1290" y2="406" class="ink-thin"/>
        <text x="845" y="443" font-size="24" class="lbl">핵심 조달 금리</text>
        <text x="1285" y="443" text-anchor="end" font-size="27" class="lbl-grn">실질 연 2.1 ~ 3.4%!</text>

        <rect x="815" y="488" width="500" height="132" rx="22" class="wc-emerald ink"/>
        <text x="1065" y="538" text-anchor="middle" font-size="23" class="lbl">순서만 지켰을 뿐인데 총 조달 한도</text>
        <text x="1065" y="592" text-anchor="middle" font-size="38" class="lbl-grn">8,768만 원 풀확보!</text>
        """,
    ),
    "long03_s02_golden_ladder.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 절대 어기면 안 되는 사업자 자금 조달 3단 황금 사다리 -->
        <ellipse cx="345" cy="655" rx="255" ry="24" class="wc-blue"/>
        <rect x="85" y="92" width="520" height="82" rx="18" class="wc-blue ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="27" class="lbl-blue">절대 공식: 위에서 아래로 ‘3단 조달 사다리’</text>

        <rect x="95" y="205" width="500" height="124" rx="18" class="wc-emerald ink"/>
        <text x="118" y="253" font-size="24" class="lbl-grn">1순위 · 지자체 이차보전 + 지역신보 보증서</text>
        <text x="118" y="295" font-size="17.5" class="lbl">은행 금리에서 지자체가 1.0~2.5%p 지원 ➔ 실질 연 2.1~3.4%</text>

        <rect x="95" y="348" width="500" height="124" rx="18" class="wc-blue ink"/>
        <text x="118" y="396" font-size="24" class="lbl-blue">2순위 · 소진공 일반경영안정 · 혁신성장자금</text>
        <text x="118" y="438" font-size="18" class="lbl">운전 7,000만 / 스마트기술·제조 직접대출 최대 2억 (연 3%대)</text>

        <rect x="95" y="491" width="500" height="124" rx="18" class="wc-slate ink"/>
        <text x="125" y="539" font-size="24" class="lbl">3순위 · 주거래 시중은행 가맹점 우대 신용</text>
        <text x="125" y="581" font-size="19.5" class="lbl-sub">배달앱·카드 입금계좌를 은행 1곳으로 통합해 우대 한도 확보</text>

        <!-- RIGHT ZONE: 전산 1단계 자동 탈락 막는 필수 체크 2가지 -->
        <ellipse cx="1065" cy="655" rx="250" ry="24" class="wc-coral"/>
        <rect x="790" y="92" width="550" height="82" rx="18" class="wc-amber ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="27" class="lbl">접수 전 모르면 1초 만에 전산 거절되는 함정!</text>

        <rect x="810" y="208" width="510" height="190" rx="20" class="wc-coral ink"/>
        <text x="1065" y="258" text-anchor="middle" font-size="25" class="lbl-red">함정 ① 국세·지방세 ‘단 1만 원’ 미납도 자동 거절!</text>
        <text x="1065" y="305" text-anchor="middle" font-size="20.5" class="lbl">신청일 현재 세금 체납·4대보험 미납이 있으면</text>
        <text x="1065" y="340" text-anchor="middle" font-size="20.5" class="lbl">소진공·지역신보 전산 1단계에서 즉시 탈락됩니다.</text>
        <text x="1065" y="376" text-anchor="middle" font-size="20" class="lbl-blue">➔ 접수 직전 ‘국세·지방세 완납증명서’부터 확인!</text>

        <rect x="810" y="424" width="510" height="192" rx="20" class="wc-mint ink"/>
        <text x="1065" y="474" text-anchor="middle" font-size="25" class="lbl-grn">꿀팁 ② 1~2월 상반기 1차 본공고가 최대 승부처!</text>
        <text x="1065" y="520" text-anchor="middle" font-size="20.5" class="lbl">정책자금·이차보전 예산은 연초 상반기 1차에 집중 배정!</text>
        <text x="1065" y="556" text-anchor="middle" font-size="20.5" class="lbl-sub">현금·간이영수증 누락 없이 부가세 과세표준증명을</text>
        <text x="1065" y="590" text-anchor="middle" font-size="20.5" class="lbl-grn">성실 신고해 두어야 매출 연동 보증한도가 커집니다!</text>
        """,
    ),
    "long03_s03_refinance_and_subsidy.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 이미 연 7% 이상 고금리 쓰고 있다면? 연 4.5% 고정 대환! -->
        <ellipse cx="345" cy="655" rx="250" ry="24" class="wc-mint"/>
        <rect x="85" y="92" width="520" height="82" rx="18" class="wc-blue ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="27" class="lbl-blue">연 7%↑ 사업자대출 ➔ ‘연 4.5% 고정’ 대환!</text>

        <rect x="95" y="208" width="500" height="235" rx="20" fill="#ffffff" class="ink"/>
        <rect x="120" y="238" width="205" height="172" rx="16" class="wc-coral ink-thin"/>
        <text x="222" y="285" text-anchor="middle" font-size="22" class="lbl-sub">기존 고금리 대출</text>
        <text x="222" y="332" text-anchor="middle" font-size="33" class="lbl-red">연 9.8%</text>
        <text x="222" y="376" text-anchor="middle" font-size="21" class="lbl">(5,000만 원 기준)</text>

        <path d="M336 324 L372 324" class="ink" style="stroke-width:5"/>
        <polygon points="368,310 392,324 368,338" fill="#047857"/>

        <rect x="400" y="238" width="172" height="172" rx="16" class="wc-emerald ink"/>
        <text x="486" y="285" text-anchor="middle" font-size="21" class="lbl">소진공 저금리 대환</text>
        <text x="486" y="332" text-anchor="middle" font-size="31" class="lbl-grn">연 4.5%</text>
        <text x="486" y="376" text-anchor="middle" font-size="20" class="lbl">(10년 분할 고정)</text>

        <rect x="95" y="468" width="500" height="148" rx="20" class="wc-mint ink"/>
        <text x="345" y="518" text-anchor="middle" font-size="24" class="lbl">1년 이자 265만 원 즉시 절감!</text>
        <text x="345" y="574" text-anchor="middle" font-size="35" class="lbl-grn">10년 누적 1,644만 원 세이브!</text>

        <!-- RIGHT ZONE: 먼저 결제하면 0원 탈락! 스마트상점 500만 & 철거비 600만 사전승인 -->
        <ellipse cx="1065" cy="655" rx="255" ry="24" class="wc-amber"/>
        <rect x="790" y="92" width="550" height="82" rx="18" class="wc-coral ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="27" class="lbl-red">주의: 먼저 결제·공사하면 국비 지원금 ‘0원’!</text>

        <rect x="810" y="208" width="510" height="192" rx="20" fill="#ffffff" class="ink"/>
        <rect x="810" y="208" width="510" height="58" rx="18" class="wc-mint ink-thin"/>
        <text x="1065" y="246" text-anchor="middle" font-size="23" class="lbl-grn">스마트상점 기술보급 (키오스크·테이블오더·서빙로봇)</text>
        <text x="1065" y="302" text-anchor="middle" font-size="22" class="lbl">기기값 720만 원 도입 시 (공급가 70% 지원 기준)</text>
        <text x="1065" y="350" text-anchor="middle" font-size="30" class="lbl-blue">국비 500만 지원 · 자부담 220만!</text>
        <text x="1065" y="384" text-anchor="middle" font-size="18.5" class="lbl-red">※ 반드시 공고 신청·사전협약 완료 후 결제해야 지급 (2년 의무사용)</text>

        <rect x="810" y="424" width="510" height="192" rx="20" class="wc-amber ink"/>
        <text x="1065" y="474" text-anchor="middle" font-size="23" class="lbl">희망리턴패키지 (경영개선 · 점포철거비 최대 600만)</text>
        <text x="1065" y="522" text-anchor="middle" font-size="20" class="lbl-sub">60일 이상 운영한 유상 임차 점포 대상 실비 보조금!</text>
        <text x="1065" y="566" text-anchor="middle" font-size="19" class="lbl-red">철거 완료 후 신청 시 100% 불가 ➔ 철거 전 사전승인 필수!</text>
        """,
    ),
    "long03_s04_funding_diagnosis.jpg": (
        1408,
        768,
        """
        <!-- LEFT ZONE: 내 매장 대출·보증 잔액 1:1 차감 계산표 -->
        <ellipse cx="345" cy="655" rx="250" ry="24" class="wc-blue"/>
        <rect x="85" y="92" width="520" height="82" rx="18" class="wc-blue ink"/>
        <text x="345" y="143" text-anchor="middle" font-size="27" class="lbl-blue">은행 가기 전 꼭 확인할 3가지 숫자!</text>

        <rect x="95" y="208" width="500" height="408" rx="22" fill="#ffffff" class="ink"/>
        <rect x="120" y="238" width="450" height="104" rx="16" class="wc-blue ink-thin"/>
        <text x="144" y="280" font-size="22.5" class="lbl-blue">① 기보증 잔액 차감 후 ‘실제 보증 여력’</text>
        <text x="144" y="318" font-size="18" class="lbl-sub">기존 신보·지역신보 보증 잔액은 신규 한도에서 1:1 차감</text>

        <rect x="125" y="360" width="440" height="104" rx="16" class="wc-mint ink-thin"/>
        <text x="150" y="402" font-size="23" class="lbl-grn">② 연 4.5% 대환 대상 여부 &amp; 이자 절감액</text>
        <text x="150" y="440" font-size="19.5" class="lbl-sub">연 7% 이상 사업자대출 5,000만 원 이내 즉시 계산</text>

        <rect x="125" y="482" width="440" height="104" rx="16" class="wc-amber ink-thin"/>
        <text x="150" y="524" font-size="23" class="lbl">③ 우리 지역 신용보증재단 &amp; 이차보전 매칭</text>
        <text x="150" y="562" font-size="19.5" class="lbl-sub">전국 17개 시도별 맞춤 정책자금 적합도 자동 정렬</text>

        <!-- RIGHT ZONE: 부자생각 정책자금·대출 한도 3초 진단 라운지 -->
        <ellipse cx="1065" cy="655" rx="250" ry="24" class="wc-mint"/>
        <rect x="790" y="92" width="550" height="82" rx="18" class="wc-mint ink"/>
        <text x="1065" y="143" text-anchor="middle" font-size="27" class="lbl-grn">부자생각에서 내 매장 최저금리 순서 3초 판독!</text>

        <rect x="820" y="205" width="490" height="395" rx="26" class="wc-cobalt ink"/>
        <rect x="844" y="232" width="442" height="340" rx="18" fill="#ffffff" class="ink-thin"/>
        <text x="1065" y="280" text-anchor="middle" font-size="24" class="lbl-blue">부자생각 정책자금 · 대환 시뮬레이터</text>
        <line x1="870" y1="300" x2="1260" y2="300" class="ink-thin"/>
        <text x="875" y="344" font-size="22.5" class="lbl">✔ 내 조건 추가 조달 총한도 즉시 산출</text>
        <text x="875" y="390" font-size="22.5" class="lbl">✔ 가장 이자 싼 1·2·3순위 조달 사다리</text>
        <text x="875" y="436" font-size="22.5" class="lbl">✔ 연 4.5% 대환 시 10년 절감 이자 계산</text>
        <text x="875" y="482" font-size="22.5" class="lbl-grn">✔ 스마트상점 국비 500만 자부담 역산!</text>
        <rect x="905" y="505" width="320" height="48" rx="24" class="wc-emerald ink-thin"/>
        <text x="1065" y="537" text-anchor="middle" font-size="23" class="lbl">boozathink.com</text>
        <text x="1065" y="636" text-anchor="middle" font-size="25" class="lbl-blue">검색창에 ‘부자생각’ · 은행 가기 전 먼저 돌려보세요</text>
        """,
    ),
}

# ---------------------------------------------------------------------------
# 3 Square 1:1 Illustrations for EP06 Shorts (1024 x 1024)
# ---------------------------------------------------------------------------
EP06_SVGS = {
    "ep06_s1_cardloan_mistake.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="895" rx="355" ry="30" class="wc-coral"/>
        <rect x="105" y="115" width="814" height="92" rx="24" class="wc-coral ink"/>
        <text x="512" y="173" text-anchor="middle" font-size="33" class="lbl-red">급하다고 카드론 먼저 눌렀다가 한도 -5,050만 증발!</text>

        <!-- Left Card: Wrong Order -->
        <rect x="115" y="255" width="370" height="485" rx="24" class="wc-coral ink"/>
        <rect x="145" y="285" width="310" height="68" rx="16" fill="#ffffff" class="ink-thin"/>
        <text x="300" y="329" text-anchor="middle" font-size="27" class="lbl-red">순서 실수 (카드론 먼저)</text>
        <text x="300" y="398" text-anchor="middle" font-size="23" class="lbl-sub">신용 하락 · 다중채무 분류</text>
        <text x="300" y="468" text-anchor="middle" font-size="25" class="lbl">평균 금리</text>
        <text x="300" y="520" text-anchor="middle" font-size="40" class="lbl-red">연 11.8%</text>
        <line x1="155" y1="560" x2="445" y2="560" class="ink-thin"/>
        <text x="300" y="610" text-anchor="middle" font-size="24" class="lbl">남은 조달 한도</text>
        <text x="300" y="675" text-anchor="middle" font-size="43" class="lbl-red">3,718만 원</text>

        <line x1="512" y1="240" x2="512" y2="755" stroke="#2563eb" stroke-width="6" stroke-dasharray="12 9"/>

        <!-- Right Card: Right Order -->
        <rect x="539" y="255" width="370" height="485" rx="24" class="wc-mint ink"/>
        <rect x="569" y="285" width="310" height="68" rx="16" fill="#ffffff" class="ink-thin"/>
        <text x="724" y="329" text-anchor="middle" font-size="27" class="lbl-grn">정석 순서 (보증서 먼저)</text>
        <text x="724" y="398" text-anchor="middle" font-size="23" class="lbl-sub">이차보전 + 소진공 + 주거래</text>
        <text x="724" y="468" text-anchor="middle" font-size="25" class="lbl">핵심 금리</text>
        <text x="724" y="520" text-anchor="middle" font-size="38" class="lbl-grn">연 2.1~3.4%</text>
        <line x1="579" y1="560" x2="869" y2="560" class="ink-thin"/>
        <text x="724" y="610" text-anchor="middle" font-size="24" class="lbl">총 조달 한도</text>
        <text x="724" y="675" text-anchor="middle" font-size="43" class="lbl-grn">8,768만 원!</text>

        <rect x="115" y="782" width="794" height="86" rx="22" class="wc-blue ink"/>
        <text x="512" y="837" text-anchor="middle" font-size="31" class="lbl-blue">연 매출 1.8억 · 신용 800점대 동일 조건 비교!</text>
        """,
    ),
    "ep06_s2_three_step_ladder.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="895" rx="355" ry="30" class="wc-blue"/>
        <rect x="110" y="115" width="804" height="90" rx="24" class="wc-blue ink"/>
        <text x="512" y="172" text-anchor="middle" font-size="33" class="lbl-blue">이자 가장 싼 ‘사업자 대출 3단 정석 순서’</text>

        <rect x="115" y="242" width="794" height="498" rx="26" fill="#ffffff" class="ink"/>
        <rect x="148" y="275" width="728" height="128" rx="18" class="wc-emerald ink-thin"/>
        <text x="178" y="325" font-size="27" class="lbl-grn">1순위 · 지역신보 보증서 + 지자체 이차보전</text>
        <text x="178" y="368" font-size="22" class="lbl-sub">지자체가 이자 1.0~2.5%p 지원 ➔ 실질 연 2.1~3.4% 최저금리!</text>

        <rect x="148" y="425" width="728" height="128" rx="18" class="wc-blue ink-thin"/>
        <text x="178" y="475" font-size="27" class="lbl-blue">2순위 · 소진공 직접대출 &amp; 연 4.5% 대환대출</text>
        <text x="178" y="518" font-size="21.5" class="lbl-sub">연 9.8% 5천만 ➔ 연 4.5% 대환 시 10년 이자 1,644만 원 절감!</text>

        <rect x="148" y="575" width="728" height="128" rx="18" class="wc-amber ink-thin"/>
        <text x="178" y="625" font-size="26" class="lbl-red">필수 주의 · 세금 체납 ‘0원’ &amp; 보조금 ‘사전협약’!</text>
        <text x="178" y="668" font-size="21" class="lbl-sub">키오스크·테이블오더 먼저 결제하면 국비 500만 원 지원 불가!</text>

        <rect x="115" y="780" width="794" height="86" rx="22" class="wc-mint ink"/>
        <text x="512" y="835" text-anchor="middle" font-size="31" class="lbl-grn">순서만 지켜도 매년 이자 수백만 원이 굳습니다!</text>
        """,
    ),
    "ep06_s3_refi_and_check.jpg": (
        1024,
        1024,
        """
        <ellipse cx="512" cy="895" rx="355" ry="30" class="wc-mint"/>
        <rect x="110" y="115" width="804" height="90" rx="24" class="wc-mint ink"/>
        <text x="512" y="172" text-anchor="middle" font-size="33" class="lbl-grn">은행 가기 전 ‘내 한도·대환 이자’ 3초 판독!</text>

        <rect x="115" y="245" width="378" height="485" rx="24" class="wc-blue ink"/>
        <text x="304" y="308" text-anchor="middle" font-size="27" class="lbl-blue">연 4.5% 고정 대환</text>
        <rect x="145" y="335" width="318" height="150" rx="18" fill="#ffffff" class="ink-thin"/>
        <text x="304" y="392" text-anchor="middle" font-size="24" class="lbl-red">연 9.8% 고금리 5천만</text>
        <text x="304" y="446" text-anchor="middle" font-size="29" class="lbl-blue">➔ 연 265만 이자 절감!</text>
        <text x="304" y="548" text-anchor="middle" font-size="23" class="lbl-sub">10년 분할상환 기준</text>
        <text x="304" y="588" text-anchor="middle" font-size="24" class="lbl">누적 1,644만 세이브!</text>
        <rect x="155" y="630" width="298" height="64" rx="16" class="wc-emerald ink-thin"/>
        <text x="304" y="671" text-anchor="middle" font-size="23" class="lbl">연 7%↑ 대출 보유 대상</text>

        <rect x="531" y="245" width="378" height="485" rx="24" class="wc-amber ink"/>
        <text x="720" y="308" text-anchor="middle" font-size="27" class="lbl">스마트상점 국비지원</text>
        <rect x="561" y="335" width="318" height="150" rx="18" fill="#ffffff" class="ink-thin"/>
        <text x="720" y="392" text-anchor="middle" font-size="23" class="lbl">기기 도입비 720만 원</text>
        <text x="720" y="446" text-anchor="middle" font-size="29" class="lbl-grn">국비 최대 500만 지원!</text>
        <text x="720" y="548" text-anchor="middle" font-size="23" class="lbl-sub">결제 전 사전협약 시</text>
        <text x="720" y="588" text-anchor="middle" font-size="24" class="lbl-grn">내 부담은 220만 원뿐!</text>
        <rect x="571" y="630" width="298" height="64" rx="16" class="wc-mint ink-thin"/>
        <text x="720" y="671" text-anchor="middle" font-size="23" class="lbl-grn">17개 시도 정책자금 매칭</text>

        <rect x="115" y="778" width="794" height="90" rx="24" class="wc-cobalt ink"/>
        <text x="512" y="835" text-anchor="middle" font-size="33" class="lbl">검색창에 ‘부자생각’ · 내 매장 한도 3초 진단!</text>
        """,
    ),
}


def render_all() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        for fname, (w, h, svg_body) in {**LONG03_SVGS, **EP06_SVGS}.items():
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

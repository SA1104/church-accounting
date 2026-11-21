# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Official YouTube Channel Branding Kit (v2.0 — Pure Business & Startup Identity)
========================================================================================================
Identity Alignment (100% Distinct Sibling of SA Think & Korea Think — ZERO "Art/Drawing" Misunderstanding):
  - Korea Think : 글로벌 K-컬처 · 여행 라운지
  - SA Think    : 가계 경제 · 절세 · 부동산 데이터 연구소
  - BoozaThink  : 창업 · 자영업 · 온라인 셀러 실전 손익 & 정책자금 연구소 ("부자생각")

Outputs (staged directly to Desktop `BoozaThink_유튜브_릴스_직접업로드_대기함/00_유튜브_채널_로고_배너_세팅팩`):
  1. `BoozaThink_Profile_Logo_Dark_800x800.png`
     - Deep Executive Navy + Royal Cobalt & Gold double-ring emblem, bold `BT` + Rising Profit Bars monogram,
       `BOOZA THINK` + `부자생각 · 창업·손익 연구소`
  2. `BoozaThink_Profile_Logo_White_800x800.png`
     - Clean Studio Ivory-White + Royal Cobalt Blue fintech emblem (`boozathink.com` web palette match)
  3. `BoozaThink_Channel_Banner_2560x1440.png`
     - Non-cartoon, executive startup/profit simulator dashboard banner strictly inside YouTube's
       1546x423 All-Devices Safe Zone (Mobile + PC + TV zero crop!)
  4. 3 Transparent `400x400 PNG` Video Watermarks (`DarkGold`, `Minimal`, `CobaltWhite`) — zero pen nibs,
     pure business/profit symbol + crisp `부자생각` / `구독` CTA.
  5. `BoozaThink_유튜브_채널세팅_복사용_가이드.txt`
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STUDIO_DIR = Path(__file__).resolve().parent
OUT_DIR = STUDIO_DIR / "output" / "channel_branding"
MANUAL_BOX = Path(r"C:\Users\new-s\OneDrive\Desktop\BoozaThink_유튜브_릴스_직접업로드_대기함") / "00_유튜브_채널_로고_배너_세팅팩"

FONT_CSS = """
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; }
"""


def _profit_emblem_svg(size_w: int = 230, size_h: int = 165, dark_mode: bool = True) -> str:
    """
    Iconic Business & Profit Growth Emblem:
    3 ascending revenue/margin bars + dynamic upward profit trajectory arrow (zero pen/art icons!).
    """
    bar1 = "#60A5FA" if dark_mode else "#93C5FD"
    bar2 = "#3B82F6" if dark_mode else "#3B82F6"
    bar3 = "#F59E0B" if dark_mode else "#1D4ED8"
    arrow = "#FBBF24" if dark_mode else "#F59E0B"
    base_line = "#94A3B8" if dark_mode else "#1E293B"
    return f"""
    <svg width="{size_w}" height="{size_h}" viewBox="0 0 240 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Subtle baseline -->
      <line x1="28" y1="148" x2="212" y2="148" stroke="{base_line}" stroke-width="5" stroke-linecap="round" opacity="0.55"/>
      <!-- 3 Ascending Profit & Margin Bars -->
      <rect x="46" y="96" width="34" height="52" rx="8" fill="{bar1}"/>
      <rect x="98" y="66" width="34" height="82" rx="8" fill="{bar2}"/>
      <rect x="150" y="32" width="36" height="116" rx="8" fill="{bar3}"/>
      <!-- Crisp Upward Profit Breakthrough Arrow -->
      <path d="M40 84 L96 48 L132 60 L196 14" stroke="{arrow}" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M170 12 H198 V40" stroke="{arrow}" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>"""


def build_logo_dark_html() -> str:
    """800x800 Executive Royal Navy, Cobalt & Gold Circular Emblem (THINK Universe Family Look)."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 800px; height: 800px; overflow: hidden;
      background: #080e1e;
      display: flex; align-items: center; justify-content: center;
    }}
    .disc {{
      width: 756px; height: 756px; border-radius: 50%;
      background: radial-gradient(circle at 38% 26%, #172b56 0%, #0b132b 62%, #060b18 100%);
      border: 12px solid #f59e0b;
      box-shadow: inset 0 0 0 11px #0b132b, inset 0 0 0 15px rgba(59, 130, 246, 0.72);
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .grid-bg {{
      position: absolute; inset: 28px; border-radius: 50%;
      background-image:
        linear-gradient(rgba(255,255,255,0.038) 1.5px, transparent 1.5px),
        linear-gradient(90deg, rgba(255,255,255,0.038) 1.5px, transparent 1.5px);
      background-size: 38px 38px;
    }}
    .emblem-wrap {{ margin-top: -12px; margin-bottom: 8px; z-index: 2; }}
    .en-top {{
      font-size: 92px; font-weight: 900; letter-spacing: -0.025em; line-height: 0.94;
      color: #ffffff; z-index: 2;
      text-shadow: 0 6px 20px rgba(0,0,0,0.45);
    }}
    .en-sub {{
      font-size: 80px; font-weight: 900; letter-spacing: 0.06em; line-height: 1.02;
      color: #fbbf24; margin-top: 4px; z-index: 2;
    }}
    .ko-pill {{
      margin-top: 26px; z-index: 2;
      background: rgba(15, 23, 42, 0.92); color: #f8fafc;
      padding: 12px 36px; border-radius: 999px;
      border: 3px solid #f59e0b;
      font-size: 29px; font-weight: 800; letter-spacing: -0.015em;
    }}
    .ko-pill span {{ color: #60a5fa; font-weight: 900; }}
    </style></head><body>
      <div class="disc">
        <div class="grid-bg"></div>
        <div class="emblem-wrap">{_profit_emblem_svg(224, 158, dark_mode=True)}</div>
        <div class="en-top">BOOZA</div>
        <div class="en-sub">THINK</div>
        <div class="ko-pill"><span>부자생각</span> · 창업·손익 연구소</div>
      </div>
    </body></html>"""


def build_logo_white_html() -> str:
    """800x800 Clean Fintech White & Royal Cobalt Emblem (Matches boozathink.com Web Theme)."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 800px; height: 800px; overflow: hidden;
      background: #f8fafc;
      display: flex; align-items: center; justify-content: center;
    }}
    .disc {{
      width: 756px; height: 756px; border-radius: 50%;
      background: radial-gradient(circle at 50% 35%, #ffffff 0%, #f1f5f9 100%);
      border: 13px solid #1e3a8a;
      box-shadow: inset 0 0 0 11px #ffffff, inset 0 0 0 15px #3b82f6;
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .emblem-wrap {{ margin-top: -12px; margin-bottom: 8px; z-index: 2; }}
    .en-top {{
      font-size: 92px; font-weight: 900; letter-spacing: -0.025em; line-height: 0.94;
      color: #0f172a; z-index: 2;
    }}
    .en-sub {{
      font-size: 80px; font-weight: 900; letter-spacing: 0.06em; line-height: 1.02;
      color: #2563eb; margin-top: 4px; z-index: 2;
    }}
    .ko-pill {{
      margin-top: 26px; z-index: 2;
      background: #0f172a; color: #ffffff;
      padding: 12px 36px; border-radius: 999px;
      border: 3px solid #2563eb;
      font-size: 29px; font-weight: 800; letter-spacing: -0.015em;
    }}
    .ko-pill span {{ color: #fbbf24; font-weight: 900; }}
    </style></head><body>
      <div class="disc">
        <div class="emblem-wrap">{_profit_emblem_svg(224, 158, dark_mode=False)}</div>
        <div class="en-top">BOOZA</div>
        <div class="en-sub">THINK</div>
        <div class="ko-pill"><span>부자생각</span> · 창업·손익 연구소</div>
      </div>
    </body></html>"""


def build_channel_banner_html() -> str:
    """
    2560x1440 Executive Startup, Store Profit & Policy-Fund Simulator Dashboard Banner.
    Harmonized with SA Think's high-trust data banner architecture — 100% distinct Royal Navy/Cobalt/Amber palette!
    CRITICAL YOUTUBE SAFE ZONE:
      Center 1546 x 423 px -> left: 507px..2053px, top: 508px..931px.
      Executive card sits strictly inside (520, 518) .. (2040, 922) = 1520 x 404 px!
    """
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 2560px; height: 1440px; overflow: hidden; position: relative;
      background-color: #f4f7fb;
      background-image:
        linear-gradient(#e2e8f0 2px, transparent 2px),
        linear-gradient(90deg, #e2e8f0 2px, transparent 2px);
      background-size: 48px 48px;
    }}
    /* Strict Center Safe-Zone Executive Dashboard Card (x: 520..2040, y: 518..922) */
    .exec-card {{
      position: absolute; left: 520px; top: 518px; width: 1520px; height: 404px;
      background: linear-gradient(135deg, #0b132b 0%, #111f42 58%, #0d1833 100%);
      border: 5px solid #f59e0b;
      border-radius: 36px;
      box-shadow: 0 22px 50px rgba(11, 19, 43, 0.28), inset 0 0 0 2px rgba(96, 165, 250, 0.28);
      display: flex; align-items: center; justify-content: space-between;
      padding: 28px 38px;
    }}
    /* Left Round Brand Seal */
    .seal {{
      width: 248px; height: 248px; border-radius: 50%; flex-shrink: 0;
      background: radial-gradient(circle at 40% 30%, #1e3a8a 0%, #0b132b 75%);
      border: 6px solid #f59e0b;
      box-shadow: inset 0 0 0 5px rgba(255,255,255,0.12);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .seal .s-en1 {{ font-size: 40px; font-weight: 900; color: #ffffff; line-height: 0.95; margin-top: 6px; }}
    .seal .s-en2 {{ font-size: 35px; font-weight: 900; color: #fbbf24; letter-spacing: 0.06em; line-height: 1.02; }}

    /* Center Copy Block */
    .mid-col {{
      flex: 1; padding: 0 34px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
    }}
    .pill-row {{ display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }}
    .kicker-pill {{
      background: rgba(37, 99, 235, 0.28); color: #93c5fd;
      border: 2px solid #3b82f6; border-radius: 999px;
      padding: 6px 18px; font-size: 20px; font-weight: 800;
    }}
    .free-pill {{
      background: rgba(245, 158, 11, 0.20); color: #fde047;
      border: 2px solid #f59e0b; border-radius: 999px;
      padding: 6px 16px; font-size: 19px; font-weight: 800;
    }}
    .main-title {{
      font-size: 54px; font-weight: 900; color: #ffffff;
      letter-spacing: -0.03em; line-height: 1.12;
    }}
    .main-title span {{ color: #fbbf24; }}
    .sub-desc {{
      margin-top: 12px; font-size: 23px; font-weight: 700; color: #cbd5e1;
      letter-spacing: -0.015em;
    }}
    .cta-btn {{
      margin-top: 22px; background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
      color: #0b132b; border-radius: 999px; padding: 12px 30px;
      font-size: 24px; font-weight: 900; letter-spacing: -0.01em;
      box-shadow: 0 8px 20px rgba(245, 158, 11, 0.32);
    }}

    /* Right Live Profit & Startup Simulator Preview Widget */
    .sim-widget {{
      width: 468px; height: 334px; flex-shrink: 0;
      background: rgba(15, 23, 42, 0.88);
      border: 2.5px solid rgba(148, 163, 184, 0.35);
      border-radius: 24px; padding: 20px 22px;
      display: flex; flex-direction: column; justify-content: space-between;
    }}
    .w-head {{
      background: #1e293b; border-radius: 12px; padding: 9px 16px;
      display: flex; align-items: center; justify-content: space-between;
      font-size: 19px; font-weight: 800; color: #fde047;
    }}
    .w-head span {{ color: #93c5fd; font-size: 17px; }}
    .metric-block {{ display: flex; flex-direction: column; gap: 6px; }}
    .m-top {{ display: flex; justify-content: space-between; font-size: 19px; font-weight: 800; }}
    .m-lbl {{ color: #e2e8f0; }}
    .m-val-good {{ color: #34d399; font-weight: 900; }}
    .m-val-warn {{ color: #fb7185; font-weight: 900; }}
    .bar-track {{ width: 100%; height: 15px; background: #1e293b; border-radius: 999px; overflow: hidden; }}
    .bar-good {{ width: 78%; height: 100%; background: linear-gradient(90deg, #3b82f6, #34d399); border-radius: 999px; }}
    .bar-warn {{ width: 42%; height: 100%; background: linear-gradient(90deg, #f43f5e, #fb923c); border-radius: 999px; }}
    .w-bottom-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }}
    .mini-box {{
      border-radius: 14px; padding: 11px 14px;
      background: rgba(30, 41, 59, 0.78);
      border: 1.8px solid rgba(59, 130, 246, 0.45);
    }}
    .mini-box.gold {{ border-color: rgba(245, 158, 11, 0.55); }}
    .mb-k {{ font-size: 16px; font-weight: 700; color: #94a3b8; white-space: nowrap; }}
    .mb-v {{ margin-top: 4px; font-size: 20px; font-weight: 900; color: #ffffff; white-space: nowrap; letter-spacing: -0.02em; }}
    .mini-box.gold .mb-v {{ color: #fde047; }}
    </style></head><body>
      <div class="exec-card">
        <div class="seal">
          {_profit_emblem_svg(120, 86, dark_mode=True)}
          <div class="s-en1">BOOZA</div>
          <div class="s-en2">THINK</div>
        </div>

        <div class="mid-col">
          <div class="pill-row">
            <span class="kicker-pill">창업 · 자영업 · 온라인 셀러 실전 데이터</span>
            <span class="free-pill">올해 12.31까지 무료 개방</span>
          </div>
          <div class="main-title"><span>부자생각</span> 창업·손익 연구소</div>
          <div class="sub-desc">30개 업종 창업비용 · 배달·셀러 마진 · 정책자금 · 세금 3초 계산기</div>
          <div class="cta-btn">무료 3초 실전 시뮬레이터 ▶ boozathink.com</div>
        </div>

        <div class="sim-widget">
          <div class="w-head">
            <div>실전 창업 · 순수익 3초 판독</div>
            <span>30개 업종 기준</span>
          </div>
          <div class="metric-block">
            <div class="m-top">
              <span class="m-lbl">순서·수수료 설계 완료 매장</span>
              <span class="m-val-good">월 순익 +642만 (22.5%)</span>
            </div>
            <div class="bar-track"><div class="bar-good"></div></div>
          </div>
          <div class="metric-block">
            <div class="m-top">
              <span class="m-lbl">수수료·부가세 누락 매장</span>
              <span class="m-val-warn">월 순익 +185만 (6.4%)</span>
            </div>
            <div class="bar-track"><div class="bar-warn"></div></div>
          </div>
          <div class="w-bottom-grid">
            <div class="mini-box">
              <div class="mb-k">결제 전 사업자·통장 세팅</div>
              <div class="mb-v">+480만 부가세 환급</div>
            </div>
            <div class="mini-box gold">
              <div class="mb-k">기존대출·신용 맞춤 진단</div>
              <div class="mb-v">연 3.5% 정책자금</div>
            </div>
          </div>
        </div>
      </div>
    </body></html>"""


def build_watermark_dark_gold_html() -> str:
    """400x400 RGBA Executive Navy & Gold Subscribe Watermark (Zero pen nib — Profit Bars + 부자생각)."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 400px; height: 400px; overflow: hidden; background: transparent;
      display: flex; align-items: center; justify-content: center;
    }}
    .badge {{
      width: 376px; height: 376px; border-radius: 84px;
      background: linear-gradient(145deg, #162a58 0%, #0b132b 100%);
      border: 12px solid #f59e0b;
      box-shadow: 0 10px 24px rgba(0,0,0,0.42);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 16px;
    }}
    .ko {{
      margin-top: 6px; font-size: 74px; font-weight: 900; color: #ffffff;
      letter-spacing: -0.04em; line-height: 1.04;
    }}
    .sub-pill {{
      margin-top: 14px; background: #ef4444; color: #ffffff;
      padding: 8px 34px; border-radius: 999px; border: 4px solid #ffffff;
      font-size: 40px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.05;
    }}
    </style></head><body>
      <div class="badge">
        {_profit_emblem_svg(152, 108, dark_mode=True)}
        <div class="ko">부자생각</div>
        <div class="sub-pill">구독 +</div>
      </div>
    </body></html>"""


def build_watermark_transparent_stamp_html() -> str:
    """400x400 RGBA Pure Transparent Broadcast Corner Stamp (BOOZA THINK + 부자생각)."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 400px; height: 400px; overflow: hidden; background: transparent;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .wrap {{
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      filter: drop-shadow(0 4px 10px rgba(15,23,42,0.48));
    }}
    .en1 {{
      margin-top: 4px; font-size: 76px; font-weight: 900; color: #0f172a; line-height: 0.94;
      letter-spacing: -0.02em;
      -webkit-text-stroke: 10px #ffffff; paint-order: stroke fill;
    }}
    .en2 {{
      font-size: 72px; font-weight: 900; color: #1d4ed8; line-height: 0.98;
      letter-spacing: 0.03em; margin-top: 4px;
      -webkit-text-stroke: 10px #ffffff; paint-order: stroke fill;
    }}
    .ko-tag {{
      margin-top: 10px; background: #0b132b; color: #fbbf24;
      border: 5px solid #ffffff; border-radius: 999px;
      padding: 6px 28px; font-size: 36px; font-weight: 900;
    }}
    </style></head><body>
      <div class="wrap">
        {_profit_emblem_svg(154, 108, dark_mode=False)}
        <div class="en1">BOOZA</div>
        <div class="en2">THINK</div>
        <div class="ko-tag">부자생각</div>
      </div>
    </body></html>"""


def build_watermark_cobalt_white_html() -> str:
    """400x400 RGBA Fintech White & Royal Cobalt Subscribe Badge (Matches boozathink.com)."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 400px; height: 400px; overflow: hidden; background: transparent;
      display: flex; align-items: center; justify-content: center;
    }}
    .card {{
      width: 374px; height: 374px; border-radius: 80px;
      background: #ffffff;
      border: 12px solid #1e3a8a;
      box-shadow: 0 10px 24px rgba(15,23,42,0.32);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 14px;
    }}
    .ko {{
      margin-top: 6px; font-size: 72px; font-weight: 900; color: #0f172a;
      letter-spacing: -0.04em; line-height: 1.04;
    }}
    .sub-btn {{
      margin-top: 14px; background: #2563eb; color: #ffffff;
      border: 4px solid #0f172a; border-radius: 999px;
      padding: 8px 34px; font-size: 38px; font-weight: 900; line-height: 1.05;
    }}
    </style></head><body>
      <div class="card">
        {_profit_emblem_svg(148, 104, dark_mode=False)}
        <div class="ko">부자생각</div>
        <div class="sub-btn">구독하기</div>
      </div>
    </body></html>"""


def write_channel_setup_guide(out_txt: Path) -> None:
    guide = """[부자생각 (BoozaThink) 유튜브 채널 핸들 변경 & 공식 브랜딩 세팅 시트 (v2.0)]
================================================================================

1. 유튜브 스튜디오 [맞춤설정] 업로드 파일 안내
--------------------------------------------------------------------------------
  - [사진 (프로필 로고)]:
      추천 1) `BoozaThink_Profile_Logo_Dark_800x800.png` (네이비·골드 THINK 패밀리 시그니처)
      추천 2) `BoozaThink_Profile_Logo_White_800x800.png` (화이트·코발트블루 모던형)
  - [배너 이미지]:
      `BoozaThink_Channel_Banner_2560x1440.png` (창업·순수익·정책자금 실전 시뮬레이터 대시보드형)
  - [동영상 워터마크] (표시 시간: '전체 동영상' 선택 권장):
      추천 1) `BoozaThink_Video_Watermark_DarkGold_400x400.png`
      추천 2) `BoozaThink_Video_Watermark_Transparent_Stamp_400x400.png`
      추천 3) `BoozaThink_Video_Watermark_CobaltWhite_400x400.png`
  - [이름]: `부자생각 BoozaThink` (또는 `BoozaThink` / `부자생각`)
  - [핸들]: `@BoozaThink` (만약 선점되어 있다면 `@BoozaThinkcom`)

================================================================================

2. [설명(채널 소개글)] 칸에 그대로 복사해서 붙여넣을 문구
--------------------------------------------------------------------------------
창업과 장사, 순서와 숫자부터 알면 참 쉽습니다.

부자생각(BoozaThink)은 예비창업자, 매장 사장님, 온라인 셀러분들이
몰라서 손해 보는 돈이 없도록 초기 비용·순수익·대출·세금을 데이터로 명쾌하게 풀어드리는 실전 창업·손익 연구소입니다.

• 계약 전 실수 막는 사업자등록 · 전용 통장 · 인테리어 · 부가세 환급 순서
• 30개 업종별 초기 창업비용 · 배달/플랫폼 수수료 · 진짜 남는 월 순수익 계산
• 내 기존 대출·신용 조건에 맞는 정책자금 · 보증서 · 저금리 대환 점검
• 실제 지도 위 반경 경쟁점 · 상권 입지 손익분기 판독

올해 12월 31일까지 모든 업종 시뮬레이터와 결과 비교·저장을 무료로 열어두었습니다.
시작하기 전에 내 가게 숫자를 3초 만에 먼저 확인해 보세요!

공식 웹사이트: https://boozathink.com

================================================================================

3. [링크] 섹션 추가 추천 (최대 4개)
--------------------------------------------------------------------------------
1) 제목: 무료 3초 창업·순수익 시뮬레이터
   URL : https://boozathink.com/calculators/startup-master?utm_source=youtube&utm_medium=channel_profile

2) 제목: 창업 준비부터 첫 1년 전체 순서표
   URL : https://boozathink.com/start-guide?utm_source=youtube&utm_medium=channel_profile

3) 제목: 내 조건 정책자금·대출 한도 점검
   URL : https://boozathink.com/funding?utm_source=youtube&utm_medium=channel_profile

4) 제목: 필요한 계산기 신청 · 투표하기
   URL : https://boozathink.com/requests?utm_source=youtube&utm_medium=channel_profile
"""
    out_txt.write_text(guide, encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    MANUAL_BOX.mkdir(parents=True, exist_ok=True)

    # Remove old v1 sketch-named files from output & Desktop box so there is zero confusion!
    for folder in (OUT_DIR, MANUAL_BOX):
        for old_f in (
            "BoozaThink_Profile_Logo_Sketch_800x800.png",
            "BoozaThink_Video_Watermark_Sketch_Subscribe_400x400.png",
        ):
            (folder / old_f).unlink(missing_ok=True)

    logo_dark_path = OUT_DIR / "BoozaThink_Profile_Logo_Dark_800x800.png"
    logo_white_path = OUT_DIR / "BoozaThink_Profile_Logo_White_800x800.png"
    banner_path = OUT_DIR / "BoozaThink_Channel_Banner_2560x1440.png"
    wm_dark_path = OUT_DIR / "BoozaThink_Video_Watermark_DarkGold_400x400.png"
    wm_stamp_path = OUT_DIR / "BoozaThink_Video_Watermark_Transparent_Stamp_400x400.png"
    wm_cobalt_path = OUT_DIR / "BoozaThink_Video_Watermark_CobaltWhite_400x400.png"
    guide_path = OUT_DIR / "BoozaThink_유튜브_채널세팅_복사용_가이드.txt"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        pg_logo = browser.new_page(viewport={"width": 800, "height": 800}, device_scale_factor=1)
        pg_logo.set_content(build_logo_dark_html(), wait_until="networkidle")
        pg_logo.screenshot(path=str(logo_dark_path), type="png")

        pg_logo.set_content(build_logo_white_html(), wait_until="networkidle")
        pg_logo.screenshot(path=str(logo_white_path), type="png")
        pg_logo.close()

        pg_ban = browser.new_page(viewport={"width": 2560, "height": 1440}, device_scale_factor=1)
        pg_ban.set_content(build_channel_banner_html(), wait_until="networkidle")
        pg_ban.screenshot(path=str(banner_path), type="png")
        pg_ban.close()

        pg_wm = browser.new_page(viewport={"width": 400, "height": 400}, device_scale_factor=1)
        pg_wm.set_content(build_watermark_dark_gold_html(), wait_until="networkidle")
        pg_wm.screenshot(path=str(wm_dark_path), type="png", omit_background=True)

        pg_wm.set_content(build_watermark_transparent_stamp_html(), wait_until="networkidle")
        pg_wm.screenshot(path=str(wm_stamp_path), type="png", omit_background=True)

        pg_wm.set_content(build_watermark_cobalt_white_html(), wait_until="networkidle")
        pg_wm.screenshot(path=str(wm_cobalt_path), type="png", omit_background=True)
        pg_wm.close()

        browser.close()

    write_channel_setup_guide(guide_path)

    for src in (
        logo_dark_path,
        logo_white_path,
        banner_path,
        wm_dark_path,
        wm_stamp_path,
        wm_cobalt_path,
        guide_path,
    ):
        shutil.copy2(src, MANUAL_BOX / src.name)
        print(f"[OK v2] {src.name} ({src.stat().st_size:,} bytes) -> staged to Desktop box")


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Official YouTube Channel Branding Kit Generator
========================================================================
Generates crisp, publication-grade YouTube branding assets for `부자생각 (@BoozaThink)`:
  1. `BoozaThink_Profile_Logo_Dark_800x800.png`
     - THINK Universe dark navy & gold double-ring family emblem (harmonized with `SA Think` & `Korea Think`)
     - Custom SVG fountain-pen nib sketching a bright storefront roof + upward growth line
  2. `BoozaThink_Profile_Logo_Sketch_800x800.png`
     - Warm cream sketchbook grid paper circular emblem with navy fountain-pen line art
  3. `BoozaThink_Channel_Banner_2560x1440.png`
     - Full 2560x1440 TV canvas with strict centering inside YouTube's 1546x423 All-Devices Safe Zone
       (x: 507..2053, y: 508..931) so zero text or artwork is cropped on Mobile, Desktop, or TV!
  4. `BoozaThink_유튜브_채널세팅_복사용_가이드.txt`
     - Exact step-by-step `@BoozaThnk -> @BoozaThink` handle update guide + copy-paste Channel Info.
"""
from __future__ import annotations

import base64
import shutil
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STUDIO_DIR = Path(__file__).resolve().parent
ASSETS_DIR = STUDIO_DIR / "assets"
OUT_DIR = STUDIO_DIR / "output" / "channel_branding"
MANUAL_BOX = Path(r"C:\Users\new-s\OneDrive\Desktop\BoozaThink_유튜브_릴스_직접업로드_대기함") / "00_유튜브_채널_로고_배너_세팅팩"

FONT_CSS = """
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; }
"""


def build_logo_dark_html() -> str:
    """800x800 THINK-family dark navy & gold circular emblem (matches Korea Think & SA Think switcher look)."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 800px; height: 800px; overflow: hidden;
      background: #0b132b;
      display: flex; align-items: center; justify-content: center;
    }}
    .disc {{
      width: 760px; height: 760px; border-radius: 50%;
      background: radial-gradient(circle at 35% 28%, #1d3557 0%, #0f172a 58%, #080d1a 100%);
      border: 10px solid #f4c95d;
      box-shadow: inset 0 0 0 12px #0f172a, inset 0 0 0 16px rgba(244, 201, 93, 0.52);
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .grid-overlay {{
      position: absolute; inset: 28px; border-radius: 50%;
      background-image:
        linear-gradient(rgba(255,255,255,0.045) 1.5px, transparent 1.5px),
        linear-gradient(90deg, rgba(255,255,255,0.045) 1.5px, transparent 1.5px);
      background-size: 36px 36px;
      pointer-events: none;
    }}
    .sketch-svg {{
      width: 310px; height: 195px; margin-top: -18px; margin-bottom: 6px; z-index: 2;
    }}
    .en-top {{
      font-size: 86px; font-weight: 900; letter-spacing: -0.02em; line-height: 0.96;
      color: #ffffff; text-shadow: 0 6px 18px rgba(0,0,0,0.45); z-index: 2;
    }}
    .en-sub {{
      font-size: 78px; font-weight: 900; letter-spacing: 0.06em; line-height: 1.02;
      color: #f4c95d; margin-top: 2px; z-index: 2;
    }}
    .ko-pill {{
      margin-top: 24px; z-index: 2;
      background: #fcfbf7; color: #0f172a;
      padding: 11px 34px; border-radius: 999px;
      border: 3.5px solid #f4c95d;
      font-size: 30px; font-weight: 800; letter-spacing: -0.01em;
      box-shadow: 0 8px 20px rgba(0,0,0,0.35);
    }}
    .ko-pill span {{ color: #1d4ed8; font-weight: 900; }}
    </style></head><body>
      <div class="disc">
        <div class="grid-overlay"></div>
        <svg class="sketch-svg" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Hand-drawn storefront roof & warm window -->
          <path d="M44 128 L72 78 L188 78 L214 128 Z" fill="rgba(244,201,93,0.18)" stroke="#F4C95D" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M64 128 V176 H196 V128" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="86" y="140" width="44" height="36" rx="4" fill="rgba(56,189,248,0.25)" stroke="#93C5FD" stroke-width="5"/>
          <path d="M148 176 V142 H176 V176" stroke="#F4C95D" stroke-width="5"/>
          <!-- Dotted pen-sketch trajectory rising into fountain pen nib -->
          <path d="M26 176 Q 130 182 232 96" stroke="#60A5FA" stroke-width="5.5" stroke-dasharray="10 10" stroke-linecap="round"/>
          <!-- Crisp Golden Fountain Pen Nib at upper right -->
          <g transform="translate(242, 34) rotate(38)">
            <path d="M0 0 L22 52 L11 68 L-11 68 L-22 52 Z" fill="#F4C95D" stroke="#FFFFFF" stroke-width="4.5" stroke-linejoin="round"/>
            <line x1="0" y1="2" x2="0" y2="34" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round"/>
            <circle cx="0" cy="38" r="5.5" fill="#0F172A"/>
            <rect x="-13" y="68" width="26" height="14" rx="3" fill="#E2E8F0" stroke="#FFFFFF" stroke-width="3.5"/>
          </g>
        </svg>
        <div class="en-top">BOOZA</div>
        <div class="en-sub">THINK</div>
        <div class="ko-pill"><span>부자생각</span> · 쉬운 창업 스케치</div>
      </div>
    </body></html>"""


def build_logo_sketch_html() -> str:
    """800x800 Warm Cream Sketchbook Paper & Navy Fountain-Pen Ink Logo (Alternative Light Version)."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 800px; height: 800px; overflow: hidden;
      background: #fcfbf7;
      display: flex; align-items: center; justify-content: center;
    }}
    .disc {{
      width: 756px; height: 756px; border-radius: 50%;
      background-color: #fcfbf7;
      background-image:
        linear-gradient(#e5ecf6 2px, transparent 2px),
        linear-gradient(90deg, #e5ecf6 2px, transparent 2px);
      background-size: 36px 36px;
      border: 12px solid #18223c;
      box-shadow: inset 0 0 0 12px #fcfbf7, inset 0 0 0 17px #2563eb;
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .hl-bar {{
      position: absolute; width: 470px; height: 42px; background: #fef08a;
      border-radius: 12px; top: 470px; z-index: 1; transform: rotate(-1.5deg);
    }}
    .sketch-svg {{ width: 310px; height: 195px; margin-top: -16px; margin-bottom: 6px; z-index: 2; }}
    .en-top {{
      font-size: 86px; font-weight: 900; letter-spacing: -0.02em; line-height: 0.96;
      color: #18223c; z-index: 2;
    }}
    .en-sub {{
      font-size: 78px; font-weight: 900; letter-spacing: 0.06em; line-height: 1.04;
      color: #1d4ed8; margin-top: 2px; z-index: 2;
    }}
    .ko-pill {{
      margin-top: 24px; z-index: 2;
      background: #18223c; color: #ffffff;
      padding: 11px 34px; border-radius: 999px;
      font-size: 30px; font-weight: 800;
    }}
    .ko-pill span {{ color: #fde047; font-weight: 900; }}
    </style></head><body>
      <div class="disc">
        <div class="hl-bar"></div>
        <svg class="sketch-svg" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M44 128 L72 78 L188 78 L214 128 Z" fill="#FEF08A" stroke="#18223C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M64 128 V176 H196 V128" fill="#FFFFFF" stroke="#18223C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="86" y="140" width="44" height="36" rx="4" fill="#BFDBFE" stroke="#18223C" stroke-width="5.5"/>
          <path d="M148 176 V142 H176 V176" fill="#FDE68A" stroke="#18223C" stroke-width="5.5"/>
          <path d="M26 176 Q 130 182 232 96" stroke="#2563EB" stroke-width="6" stroke-dasharray="10 10" stroke-linecap="round"/>
          <g transform="translate(242, 34) rotate(38)">
            <path d="M0 0 L22 52 L11 68 L-11 68 L-22 52 Z" fill="#2563EB" stroke="#18223C" stroke-width="5" stroke-linejoin="round"/>
            <line x1="0" y1="2" x2="0" y2="34" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
            <circle cx="0" cy="38" r="5.5" fill="#FEF08A"/>
            <rect x="-13" y="68" width="26" height="14" rx="3" fill="#18223C"/>
          </g>
        </svg>
        <div class="en-top">BOOZA</div>
        <div class="en-sub">THINK</div>
        <div class="ko-pill"><span>부자생각</span> · 쉬운 창업 스케치</div>
      </div>
    </body></html>"""


def build_channel_banner_html(shop_b64: str, steps_b64: str) -> str:
    """
    2560x1440 Official YouTube Banner.
    CRITICAL YOUTUBE SAFE ZONE:
      Center 1546 x 423 px -> left: 507px..2053px, top: 508px..931px.
      Everything essential sits strictly inside (530, 522) .. (2030, 918)!
    """
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 2560px; height: 1440px; overflow: hidden; position: relative;
      background-color: #f8fafc;
      background-image:
        linear-gradient(#e6edf7 2px, transparent 2px),
        linear-gradient(90deg, #e6edf7 2px, transparent 2px);
      background-size: 44px 44px;
    }}
    /* Subtle ambient sketchbook frame for TV viewers outside the 423px strip */
    .tv-top-note {{
      position: absolute; top: 180px; left: 0; right: 0; text-align: center;
      font-size: 38px; font-weight: 800; color: #94a3b8; letter-spacing: 0.14em;
    }}
    .tv-bot-note {{
      position: absolute; bottom: 180px; left: 0; right: 0; text-align: center;
      font-size: 34px; font-weight: 700; color: #94a3b8; letter-spacing: 0.06em;
    }}
    /* Desktop full-width subtle cream band (y: 508..931, height: 423px) */
    .desktop-band {{
      position: absolute; left: 0; right: 0; top: 508px; height: 423px;
      background: linear-gradient(90deg, #f1f5f9 0%, #fcfbf7 18%, #fcfbf7 82%, #f1f5f9 100%);
      border-top: 4px solid #cbd5e1;
      border-bottom: 4px solid #cbd5e1;
    }}
    /* Strict All-Devices Safe Zone Container (x: 530..2030 = 1500px, y: 524..915 = 391px) */
    .safe-zone {{
      position: absolute; left: 530px; top: 524px; width: 1500px; height: 391px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 22px;
    }}
    .left-sketch-card {{
      width: 320px; height: 346px; background: #ffffff;
      border: 4.5px solid #18223c; border-radius: 26px;
      box-shadow: 8px 8px 0 #1d4ed8;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 14px; position: relative; transform: rotate(-1.5deg);
    }}
    .tape {{
      position: absolute; top: -14px; width: 108px; height: 28px;
      background: rgba(253, 224, 71, 0.88); border: 2px solid #18223c; border-radius: 6px;
    }}
    .left-sketch-card img {{ width: 255px; height: 255px; object-fit: contain; }}
    .card-cap {{ font-size: 20px; font-weight: 800; color: #18223c; margin-top: 4px; }}

    .center-copy {{
      width: 770px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
      padding-left: 18px;
    }}
    .brand-row {{ display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }}
    .brand-badge {{
      background: #18223c; color: #f4c95d; font-size: 23px; font-weight: 900;
      padding: 7px 20px; border-radius: 999px; letter-spacing: 0.03em;
    }}
    .brand-ko {{ font-size: 26px; font-weight: 800; color: #1d4ed8; }}
    .headline {{
      font-size: 56px; font-weight: 900; color: #0f172a; line-height: 1.16;
      letter-spacing: -0.03em;
    }}
    .headline .hl {{
      background: linear-gradient(transparent 56%, #fef08a 56%);
      padding: 0 6px;
    }}
    .subline {{
      margin-top: 14px; font-size: 25px; font-weight: 700; color: #334155;
      letter-spacing: -0.015em;
    }}
    .cta-row {{
      margin-top: 20px; display: flex; align-items: center; gap: 14px;
    }}
    .url-pill {{
      background: #1d4ed8; color: #ffffff; border: 3.5px solid #0f172a;
      border-radius: 999px; padding: 9px 26px; font-size: 24px; font-weight: 900;
      box-shadow: 4px 4px 0 #0f172a;
    }}
    .free-pill {{
      background: #fef9c3; color: #854d0e; border: 3px solid #eab308;
      border-radius: 999px; padding: 8px 20px; font-size: 21px; font-weight: 800;
    }}

    .right-sketch-card {{
      width: 320px; height: 346px; background: #ffffff;
      border: 4.5px solid #18223c; border-radius: 26px;
      box-shadow: 8px 8px 0 #f59e0b;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 14px; position: relative; transform: rotate(1.4deg);
    }}
    .right-sketch-card img {{ width: 262px; height: 262px; object-fit: contain; }}
    </style></head><body>
      <div class="tv-top-note">BOOZA THINK · PEN SKETCH BUSINESS LAB</div>
      <div class="desktop-band"></div>
      <div class="safe-zone">
        <div class="left-sketch-card">
          <div class="tape"></div>
          <img src="data:image/jpeg;base64,{steps_b64}" alt="단계별 스케치" />
          <div class="card-cap">1 · 2 · 3 단계별 창업 순서</div>
        </div>
        <div class="center-copy">
          <div class="brand-row">
            <span class="brand-badge">BOOZA THINK</span>
            <span class="brand-ko">부자생각 · 펜으로 그리는 쉬운 창업</span>
          </div>
          <div class="headline">막연했던 내 가게 생각,<br><span class="hl">순서대로 그려보면 참 쉽습니다</span></div>
          <div class="subline">사업자 신청 · 통장 · 상권 · 대출 · 세금까지 한눈에 선명해지는 실전 계산기</div>
          <div class="cta-row">
            <span class="url-pill">boozathink.com</span>
            <span class="free-pill">올해 12.31까지 전 업종 무료 개방</span>
          </div>
        </div>
        <div class="right-sketch-card">
          <div class="tape"></div>
          <img src="data:image/jpeg;base64,{shop_b64}" alt="완성된 내 가게" />
          <div class="card-cap">선명하게 완성되는 내 가게</div>
        </div>
      </div>
      <div class="tv-bot-note">boozathink.com — 예비 사장님과 소상공인을 위한 실전 손익 · 자금 · 세금 연구소</div>
    </body></html>"""


def write_channel_setup_guide(out_txt: Path) -> None:
    guide = """[부자생각 (BoozaThink) 유튜브 채널 핸들 변경 & 브랜딩 세팅 복사용 시트]
================================================================================

1. 어디서 '@BoozaThnk' -> '@BoozaThink'로 바꾸나요? (30초 완료)
--------------------------------------------------------------------------------
[PC 크롬 브라우저 기준 — 가장 정확함]
  ① 유튜브(https://www.youtube.com) 우측 상단 동그란 프로필 클릭 -> [계정 전환] 클릭
  ② 6개 채널 목록 중 반드시 [부자생각 (@BoozaThnk)]을 클릭해 채널 전환!
     (※ 주의: 현재 Korea Think에 체크(✓)가 되어 있으면 먼저 부자생각으로 전환해야 합니다)
  ③ 다시 우측 상단 프로필 클릭 -> [YouTube 스튜디오] 클릭 (또는 https://studio.youtube.com 접속)
  ④ 왼쪽 메뉴 아래쪽 [맞춤설정] (요술봉 모양 아이콘) 클릭
  ⑤ 한 화면에 순서대로 나오는 항목에 바로 적용:
     - [사진]: 같은 폴더의 `BoozaThink_Profile_Logo_Dark_800x800.png` 업로드
              (밝은 노트 느낌을 원하시면 `BoozaThink_Profile_Logo_Sketch_800x800.png` 선택)
     - [배너 이미지]: 같은 폴더의 `BoozaThink_Channel_Banner_2560x1440.png` 업로드
     - [이름]: `부자생각 BoozaThink` (또는 `BoozaThink` / `부자생각` 중 선호하시는 표기)
     - [핸들]: 기존 `@BoozaThnk`를 지우고 `@BoozaThink` 입력!
              (만약 이미 사용 중이라고 뜨면 SA Think(@SAThinkcom)와 통일해 `@BoozaThinkcom` 입력)
  ⑥ 우측 상단 파란색 [게시] 버튼을 누르면 즉시 반영됩니다! (기존 구독자 14명 100% 그대로 유지)

[스마트폰 유튜브 앱 기준]
  ① 우측 하단 [내 페이지(나)] -> 상단 [계정 전환] -> [부자생각 (@BoozaThnk)] 선택
  ② [채널 보기] 터치 -> 오른쪽 [연필 아이콘(채널 수정)] 터치
  ③ [이름]과 [핸들(@BoozaThink)] 수정 후 저장!

================================================================================

2. [설명(채널 소개글)] 칸에 그대로 복사해서 붙여넣을 문구
--------------------------------------------------------------------------------
막연했던 내 가게 생각, 펜으로 하나씩 그려보면 참 쉽습니다.

부자생각(BoozaThink)은 처음 창업을 준비하는 분부터 매일 매장을 운영하는 사장님, 온라인 셀러분들까지
몰라서 손해 보는 돈이 없도록 순서대로 쉽게 풀어드리는 실전 창업·손익 연구소입니다.

• 계약 전 실수 막는 사업자등록 · 전용 통장 · 인테리어 · 부가세 순서
• 30개 업종별 초기 창업비용 · 배달 수수료 · 진짜 남는 순수익 계산
• 내 기존 대출 조건에 맞는 정책자금 · 보증서 · 저금리 대환 점검
• 실제 지도 위 반경 경쟁점 · 상권 입지 점검

올해 12월 31일까지 모든 업종 시뮬레이터와 결과표 저장을 무료로 열어두었습니다.
지금 내 가게 숫자를 미리 넣어보고 선명한 계획을 그려보세요!

공식 웹사이트: https://boozathink.com

================================================================================

3. [링크] 섹션 추가 추천 (최대 4개)
--------------------------------------------------------------------------------
1) 제목: 부자생각 무료 창업·순수익 계산기
   URL : https://boozathink.com/calculators/startup-master?utm_source=youtube&utm_medium=channel_profile

2) 제목: 창업 준비부터 첫 1년 전체 순서표
   URL : https://boozathink.com/start-guide?utm_source=youtube&utm_medium=channel_profile

3) 제목: 내 조건 정책자금·대출 가능 여부 점검
   URL : https://boozathink.com/funding?utm_source=youtube&utm_medium=channel_profile

4) 제목: 필요한 계산기 직접 신청·투표하기
   URL : https://boozathink.com/requests?utm_source=youtube&utm_medium=channel_profile
"""
    out_txt.write_text(guide, encoding="utf-8")


def build_watermark_dark_gold_html() -> str:
    """
    400x400 RGBA transparent-corner YouTube Video Watermark (Option 1 — Recommended).
    Designed to remain ultra-legible even when YouTube shrinks it to ~40x40 CSS px in the player corner!
    """
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 400px; height: 400px; overflow: hidden; background: transparent;
      display: flex; align-items: center; justify-content: center;
    }}
    .badge {{
      width: 376px; height: 376px; border-radius: 84px;
      background: linear-gradient(145deg, #162447 0%, #0b132b 100%);
      border: 12px solid #f4c95d;
      box-shadow: 0 10px 24px rgba(0,0,0,0.42);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 16px;
    }}
    .pen-svg {{ width: 126px; height: 118px; margin-bottom: 4px; }}
    .ko {{
      font-size: 74px; font-weight: 900; color: #ffffff;
      letter-spacing: -0.04em; line-height: 1.04;
    }}
    .sub-pill {{
      margin-top: 14px; background: #ef4444; color: #ffffff;
      padding: 8px 34px; border-radius: 999px; border: 4px solid #ffffff;
      font-size: 40px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.05;
    }}
    </style></head><body>
      <div class="badge">
        <svg class="pen-svg" viewBox="0 0 140 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 96 L42 56 L98 56 L116 96 Z" fill="rgba(244,201,93,0.22)" stroke="#F4C95D" stroke-width="8" stroke-linejoin="round"/>
          <path d="M34 96 V120 H104 V96" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
          <g transform="translate(104, 14) rotate(36)">
            <path d="M0 0 L22 48 L11 64 L-11 64 L-22 48 Z" fill="#F4C95D" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"/>
            <line x1="0" y1="4" x2="0" y2="34" stroke="#0B132B" stroke-width="5" stroke-linecap="round"/>
            <circle cx="0" cy="38" r="6" fill="#0B132B"/>
          </g>
        </svg>
        <div class="ko">부자생각</div>
        <div class="sub-pill">구독 +</div>
      </div>
    </body></html>"""


def build_watermark_transparent_stamp_html() -> str:
    """
    400x400 RGBA pure transparent TV-bug style watermark (Option 2 — Minimalist Clean).
    Strong white outer stroke/halo so it pops over both light sketchbook paper and dark backgrounds.
    """
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 400px; height: 400px; overflow: hidden; background: transparent;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .wrap {{
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      filter: drop-shadow(0 4px 10px rgba(15,23,42,0.45));
    }}
    .pen-svg {{ width: 150px; height: 136px; margin-bottom: 4px; }}
    .en1 {{
      font-size: 76px; font-weight: 900; color: #0f172a; line-height: 0.94;
      letter-spacing: -0.02em;
      -webkit-text-stroke: 10px #ffffff; paint-order: stroke fill;
    }}
    .en2 {{
      font-size: 72px; font-weight: 900; color: #1d4ed8; line-height: 0.98;
      letter-spacing: 0.03em; margin-top: 4px;
      -webkit-text-stroke: 10px #ffffff; paint-order: stroke fill;
    }}
    .ko-tag {{
      margin-top: 10px; background: #0f172a; color: #fde047;
      border: 5px solid #ffffff; border-radius: 999px;
      padding: 6px 26px; font-size: 36px; font-weight: 900;
    }}
    </style></head><body>
      <div class="wrap">
        <svg class="pen-svg" viewBox="0 0 150 136" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(86, 12) rotate(36)">
            <path d="M0 0 L34 74 L17 98 L-17 98 L-34 74 Z" fill="#F4C95D" stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round"/>
            <path d="M0 0 L34 74 L17 98 L-17 98 L-34 74 Z" fill="#F4C95D" stroke="#0F172A" stroke-width="6" stroke-linejoin="round"/>
            <line x1="0" y1="6" x2="0" y2="50" stroke="#0F172A" stroke-width="6.5" stroke-linecap="round"/>
            <circle cx="0" cy="56" r="8" fill="#0F172A"/>
          </g>
        </svg>
        <div class="en1">BOOZA</div>
        <div class="en2">THINK</div>
        <div class="ko-tag">부자생각</div>
      </div>
    </body></html>"""


def build_watermark_sketch_subscribe_html() -> str:
    """
    400x400 RGBA Sketchbook Note Watermark (Option 3 — Warm Sketchbook Card + Red Subscribe Pill).
    """
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 400px; height: 400px; overflow: hidden; background: transparent;
      display: flex; align-items: center; justify-content: center;
    }}
    .card {{
      width: 372px; height: 372px; border-radius: 76px;
      background-color: #fcfbf7;
      background-image:
        linear-gradient(#e2e8f0 2px, transparent 2px),
        linear-gradient(90deg, #e2e8f0 2px, transparent 2px);
      background-size: 32px 32px;
      border: 12px solid #18223c;
      box-shadow: 0 10px 24px rgba(15,23,42,0.32);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 14px;
    }}
    .pen-svg {{ width: 120px; height: 112px; margin-bottom: 4px; }}
    .ko {{
      font-size: 72px; font-weight: 900; color: #0f172a;
      letter-spacing: -0.04em; line-height: 1.04;
      background: linear-gradient(transparent 58%, #fef08a 58%);
      padding: 0 8px;
    }}
    .sub-btn {{
      margin-top: 14px; background: #1d4ed8; color: #ffffff;
      border: 4px solid #0f172a; border-radius: 999px;
      padding: 8px 34px; font-size: 38px; font-weight: 900; line-height: 1.05;
    }}
    </style></head><body>
      <div class="card">
        <svg class="pen-svg" viewBox="0 0 140 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 96 L42 56 L98 56 L116 96 Z" fill="#FEF08A" stroke="#18223C" stroke-width="8" stroke-linejoin="round"/>
          <path d="M34 96 V120 H104 V96" fill="#FFFFFF" stroke="#18223C" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
          <g transform="translate(104, 14) rotate(36)">
            <path d="M0 0 L22 48 L11 64 L-11 64 L-22 48 Z" fill="#2563EB" stroke="#18223C" stroke-width="5.5" stroke-linejoin="round"/>
            <line x1="0" y1="4" x2="0" y2="34" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
            <circle cx="0" cy="38" r="6" fill="#FEF08A"/>
          </g>
        </svg>
        <div class="ko">부자생각</div>
        <div class="sub-btn">구독하기</div>
      </div>
    </body></html>"""


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    MANUAL_BOX.mkdir(parents=True, exist_ok=True)

    shop_b64 = base64.b64encode((ASSETS_DIR / "ep01_s3_bright_storefront.jpg").read_bytes()).decode("ascii")
    steps_b64 = base64.b64encode((ASSETS_DIR / "ep01_s2_easy_steps.jpg").read_bytes()).decode("ascii")

    logo_dark_path = OUT_DIR / "BoozaThink_Profile_Logo_Dark_800x800.png"
    logo_sketch_path = OUT_DIR / "BoozaThink_Profile_Logo_Sketch_800x800.png"
    banner_path = OUT_DIR / "BoozaThink_Channel_Banner_2560x1440.png"
    wm_dark_path = OUT_DIR / "BoozaThink_Video_Watermark_DarkGold_400x400.png"
    wm_stamp_path = OUT_DIR / "BoozaThink_Video_Watermark_Transparent_Stamp_400x400.png"
    wm_sketch_path = OUT_DIR / "BoozaThink_Video_Watermark_Sketch_Subscribe_400x400.png"
    guide_path = OUT_DIR / "BoozaThink_유튜브_채널세팅_복사용_가이드.txt"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        pg_logo = browser.new_page(viewport={"width": 800, "height": 800}, device_scale_factor=1)
        pg_logo.set_content(build_logo_dark_html(), wait_until="networkidle")
        pg_logo.screenshot(path=str(logo_dark_path), type="png")

        pg_logo.set_content(build_logo_sketch_html(), wait_until="networkidle")
        pg_logo.screenshot(path=str(logo_sketch_path), type="png")
        pg_logo.close()

        pg_ban = browser.new_page(viewport={"width": 2560, "height": 1440}, device_scale_factor=1)
        pg_ban.set_content(build_channel_banner_html(shop_b64, steps_b64), wait_until="networkidle")
        pg_ban.screenshot(path=str(banner_path), type="png")
        pg_ban.close()

        pg_wm = browser.new_page(viewport={"width": 400, "height": 400}, device_scale_factor=1)
        pg_wm.set_content(build_watermark_dark_gold_html(), wait_until="networkidle")
        pg_wm.screenshot(path=str(wm_dark_path), type="png", omit_background=True)

        pg_wm.set_content(build_watermark_transparent_stamp_html(), wait_until="networkidle")
        pg_wm.screenshot(path=str(wm_stamp_path), type="png", omit_background=True)

        pg_wm.set_content(build_watermark_sketch_subscribe_html(), wait_until="networkidle")
        pg_wm.screenshot(path=str(wm_sketch_path), type="png", omit_background=True)
        pg_wm.close()

        browser.close()

    write_channel_setup_guide(guide_path)

    for src in (
        logo_dark_path,
        logo_sketch_path,
        banner_path,
        wm_dark_path,
        wm_stamp_path,
        wm_sketch_path,
        guide_path,
    ):
        shutil.copy2(src, MANUAL_BOX / src.name)
        print(f"[OK] {src.name} ({src.stat().st_size:,} bytes) -> staged to Desktop box")


if __name__ == "__main__":
    main()

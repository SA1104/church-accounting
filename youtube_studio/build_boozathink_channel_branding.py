# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Official YouTube Channel Branding Kit (v3.0 — Master Brush Calligraphy Edition)
========================================================================================================
THINK Universe Unified Signature:
  - Korea Think : 힘있는 2단 붓글씨 (`KOREA THINK`)
  - SA Think    : 힘있는 일필휘지 붓글씨 (`SA` + 데이터 연구소 대시보드)
  - BoozaThink  : 힘있는 정통 먹물·골드 붓글씨 (`BOOZA THINK` 2단 워드마크 & `BT` 일필휘지 시그니처)
                  + AI 티 나는 차트/화살표/이모티콘 100% 배제!
                  + 승인된 문구 ("부자생각 창업·손익 연구소") 그대로 유지!
"""
from __future__ import annotations

import base64
import io
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter
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


def _pil_to_data_uri(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def extract_2line_brush_wordmark_uri(
    top_rgb: tuple[int, int, int],
    bot_rgb: tuple[int, int, int],
    target_w: int = 560,
    add_white_outline: bool = False,
) -> str:
    """
    Extracts `boozathink_2line_brush.jpg` (`BOOZA` / `THINK` master dry-brush calligraphy) into a razor-sharp
    transparent RGBA PNG, coloring `BOOZA` with `top_rgb` and `THINK` with `bot_rgb` while preserving every
    delicate horsehair bristle (`갈필 / 비백`).
    """
    src = Image.open(ASSETS_DIR / "boozathink_2line_brush.jpg").convert("L")
    arr_full = np.asarray(src, dtype=np.float32)
    ink_mask = arr_full < 236.0
    ys, xs = np.nonzero(ink_mask)
    pad = 18
    x0, x1 = max(0, int(xs.min()) - pad), min(src.width, int(xs.max()) + pad)
    y0, y1 = max(0, int(ys.min()) - pad), min(src.height, int(ys.max()) + pad)

    cropped = src.crop((x0, y0, x1, y1))
    scale = target_w / float(cropped.width)
    new_w = target_w
    new_h = max(32, int(round(cropped.height * scale)))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    arr = np.asarray(resized, dtype=np.float32)
    alpha = np.clip((244.0 - arr) * 1.48, 0.0, 255.0)

    # Connected-component separation between 'BOOZA' (top row) and 'THINK' (bottom row):
    # guarantees 0% color bleed even where slanted brush bristles overlap in vertical Y!
    fg_bin = (alpha > 8.0).astype(np.uint8)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(fg_bin, connectivity=8)
    is_top = np.zeros((new_h, new_w), dtype=bool)
    for lbl in range(1, num_labels):
        cy = float(centroids[lbl, 1])
        if cy < new_h * 0.48:
            is_top[labels == lbl] = True

    # Assign any ultra-faint (alpha <= 8) anti-aliased fringe pixels by gentle slanted separator
    slanted_y = (new_h * 0.49) - (np.arange(new_w, dtype=np.float32)[None, :] / float(new_w)) * (new_h * 0.06)
    fringe = ~fg_bin.astype(bool)
    is_top[fringe] = (np.arange(new_h, dtype=np.float32)[:, None] < slanted_y)[fringe]

    rgba = np.zeros((new_h, new_w, 4), dtype=np.uint8)
    rgba[is_top, 0] = top_rgb[0]
    rgba[is_top, 1] = top_rgb[1]
    rgba[is_top, 2] = top_rgb[2]

    rgba[~is_top, 0] = bot_rgb[0]
    rgba[~is_top, 1] = bot_rgb[1]
    rgba[~is_top, 2] = bot_rgb[2]
    rgba[:, :, 3] = alpha.astype(np.uint8)

    fg_im = Image.fromarray(rgba)
    if not add_white_outline:
        return _pil_to_data_uri(fg_im)

    # Optional crisp white halo for pure transparent video watermark
    pad_o = 14
    canvas = Image.new("RGBA", (new_w + pad_o * 2, new_h + pad_o * 2), (0, 0, 0, 0))
    a_pad = Image.new("L", canvas.size, 0)
    a_pad.paste(Image.fromarray(alpha.astype(np.uint8)), (pad_o, pad_o))
    dilated = a_pad.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(1.4))
    dil_arr = np.clip(np.asarray(dilated, dtype=np.float32) * 1.6, 0.0, 255.0).astype(np.uint8)
    halo = np.zeros((canvas.height, canvas.width, 4), dtype=np.uint8)
    halo[:, :, :3] = 255
    halo[:, :, 3] = dil_arr
    out = Image.fromarray(halo)
    out.alpha_composite(fg_im, (pad_o, pad_o))
    return _pil_to_data_uri(out)


def extract_bt_monogram_uri(
    ink_rgb: tuple[int, int, int],
    target_h: int = 340,
) -> tuple[str, int]:
    """
    Extracts `bt_monogram_brush.jpg` (`BT` single-breath calligraphy monogram) to transparent RGBA and returns
    `(data_uri, optical_shift_x_px)` so the heavy stroke mass of `BT` sits dead-center inside circular seals
    even with the dynamic right-sweeping `T` crossbar!
    """
    src = Image.open(ASSETS_DIR / "bt_monogram_brush.jpg").convert("L")
    arr_full = np.asarray(src, dtype=np.float32)
    ys, xs = np.nonzero(arr_full < 236.0)
    pad = 16
    x0, x1 = max(0, int(xs.min()) - pad), min(src.width, int(xs.max()) + pad)
    y0, y1 = max(0, int(ys.min()) - pad), min(src.height, int(ys.max()) + pad)

    cropped = src.crop((x0, y0, x1, y1))
    scale = target_h / float(cropped.height)
    new_h = target_h
    new_w = max(32, int(round(cropped.width * scale)))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    arr = np.asarray(resized, dtype=np.float32)
    alpha = np.clip((244.0 - arr) * 1.48, 0.0, 255.0)

    # Compute horizontal ink center-of-mass to counter the long upper-right T tail
    x_coords = np.arange(new_w, dtype=np.float32)[None, :]
    cx_mass = float((alpha * x_coords).sum() / max(1.0, alpha.sum()))
    bbox_mid = new_w * 0.5
    optical_shift_x = int(round((bbox_mid - cx_mass) * 0.65))

    rgba = np.zeros((new_h, new_w, 4), dtype=np.uint8)
    rgba[:, :, 0] = ink_rgb[0]
    rgba[:, :, 1] = ink_rgb[1]
    rgba[:, :, 2] = ink_rgb[2]
    rgba[:, :, 3] = alpha.astype(np.uint8)
    return _pil_to_data_uri(Image.fromarray(rgba)), optical_shift_x


# ---------------------------------------------------------------------------
# 1. Three Master Brush-Calligraphy Profile Logos (800x800, Zero Clip-Art!)
# ---------------------------------------------------------------------------
def build_logo_01_wordmark_dark_html(wordmark_uri: str) -> str:
    """Option 1 (Recommended): Deep Royal Navy & Gold Ring + 2-Line Brush `BOOZA THINK` + Approved Copy Pill."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 800px; height: 800px; overflow: hidden; background: #070d1b;
      display: flex; align-items: center; justify-content: center;
    }}
    .disc {{
      width: 756px; height: 756px; border-radius: 50%;
      background: radial-gradient(circle at 46% 36%, #182e5c 0%, #0b132b 64%, #060b18 100%);
      border: 13px solid #d99b26;
      box-shadow: inset 0 0 0 11px #0b132b, inset 0 0 0 15px rgba(96, 165, 250, 0.52);
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .brush-img {{
      width: 536px; height: auto; margin-top: 22px;
      filter: drop-shadow(0 10px 22px rgba(0,0,0,0.55));
    }}
    .ko-pill {{
      margin-top: 38px;
      background: rgba(11, 19, 43, 0.94); color: #f8fafc;
      padding: 13px 38px; border-radius: 999px;
      border: 3px solid #d99b26;
      font-size: 29px; font-weight: 800; letter-spacing: -0.015em;
      box-shadow: 0 8px 20px rgba(0,0,0,0.40);
    }}
    .ko-pill span {{ color: #fbbf24; font-weight: 900; }}
    </style></head><body>
      <div class="disc">
        <img src="{wordmark_uri}" class="brush-img" alt="BOOZA THINK" />
        <div class="ko-pill"><span>부자생각</span> · 창업·손익 연구소</div>
      </div>
    </body></html>"""


def build_logo_02_bt_dark_html(bt_white_uri: str, shift_x: int) -> str:
    """Option 2: Deep Royal Navy & Gold Ring + Single-Breath White Brush `BT` Monogram (SA Think Sibling)."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 800px; height: 800px; overflow: hidden; background: #070d1b;
      display: flex; align-items: center; justify-content: center;
    }}
    .disc {{
      width: 756px; height: 756px; border-radius: 50%;
      background: radial-gradient(circle at 46% 36%, #182e5c 0%, #0b132b 64%, #060b18 100%);
      border: 13px solid #d99b26;
      box-shadow: inset 0 0 0 11px #0b132b, inset 0 0 0 15px rgba(217, 155, 38, 0.42);
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .bt-img {{
      height: 365px; width: auto; margin-top: 14px;
      transform: translateX({shift_x}px);
      filter: drop-shadow(0 10px 24px rgba(0,0,0,0.55));
    }}
    .ko-pill {{
      margin-top: 34px;
      background: #f8fafc; color: #0b132b;
      padding: 13px 38px; border-radius: 999px;
      border: 3.5px solid #d99b26;
      font-size: 29px; font-weight: 900; letter-spacing: -0.015em;
    }}
    .ko-pill span {{ color: #1d4ed8; font-weight: 900; }}
    </style></head><body>
      <div class="disc">
        <img src="{bt_white_uri}" class="bt-img" alt="BT" />
        <div class="ko-pill"><span>BOOZA THINK</span> · 창업·손익 연구소</div>
      </div>
    </body></html>"""


def build_logo_03_bt_ivory_html(bt_ink_uri: str, shift_x: int) -> str:
    """Option 3: Warm Executive Ivory & Sumi Ink `BT` Brush Calligraphy + Royal Cobalt/Gold Double Ring."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 800px; height: 800px; overflow: hidden; background: #faf8f3;
      display: flex; align-items: center; justify-content: center;
    }}
    .disc {{
      width: 756px; height: 756px; border-radius: 50%;
      background: #faf8f3;
      border: 14px solid #1e3a8a;
      box-shadow: inset 0 0 0 11px #faf8f3, inset 0 0 0 15px #b48e4c;
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .bt-img {{
      height: 365px; width: auto; margin-top: 14px;
      transform: translateX({shift_x}px);
    }}
    .ko-pill {{
      margin-top: 34px;
      background: #0f172a; color: #f8fafc;
      padding: 13px 38px; border-radius: 999px;
      border: 3px solid #b48e4c;
      font-size: 29px; font-weight: 800; letter-spacing: -0.015em;
    }}
    .ko-pill span {{ color: #fbbf24; font-weight: 900; }}
    </style></head><body>
      <div class="disc">
        <img src="{bt_ink_uri}" class="bt-img" alt="BT" />
        <div class="ko-pill"><span>부자생각</span> · 창업·손익 연구소</div>
      </div>
    </body></html>"""


# ---------------------------------------------------------------------------
# 2. Executive Channel Banner (2560x1440 — Brush Seal + Approved Copy + Clean Data)
# ---------------------------------------------------------------------------
def build_channel_banner_html(wordmark_uri: str) -> str:
    """
    2560x1440 Executive Banner inside strict 1546x423 YouTube All-Devices Safe Zone.
    ZERO generic clip-art icons/arrows — Left seal features pure Master Brush `BOOZA THINK` calligraphy!
    """
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 2560px; height: 1440px; overflow: hidden; position: relative;
      background-color: #f5f7fb;
      background-image:
        linear-gradient(#e4eaf3 2px, transparent 2px),
        linear-gradient(90deg, #e4eaf3 2px, transparent 2px);
      background-size: 48px 48px;
    }}
    .exec-card {{
      position: absolute; left: 520px; top: 518px; width: 1520px; height: 404px;
      background: linear-gradient(135deg, #0b132b 0%, #122147 58%, #0c1631 100%);
      border: 5px solid #d99b26;
      border-radius: 36px;
      box-shadow: 0 22px 50px rgba(11, 19, 43, 0.28), inset 0 0 0 2px rgba(96, 165, 250, 0.24);
      display: flex; align-items: center; justify-content: space-between;
      padding: 28px 38px;
    }}
    .seal {{
      width: 252px; height: 252px; border-radius: 50%; flex-shrink: 0;
      background: radial-gradient(circle at 44% 34%, #1b3468 0%, #091024 78%);
      border: 6px solid #d99b26;
      box-shadow: inset 0 0 0 5px rgba(255,255,255,0.10);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 16px;
    }}
    .seal img {{
      width: 204px; height: auto;
      filter: drop-shadow(0 6px 14px rgba(0,0,0,0.5));
    }}

    .mid-col {{
      flex: 1; padding: 0 34px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
    }}
    .pill-row {{ display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }}
    .kicker-pill {{
      background: rgba(37, 99, 235, 0.26); color: #93c5fd;
      border: 2px solid #3b82f6; border-radius: 999px;
      padding: 6px 18px; font-size: 20px; font-weight: 800;
    }}
    .free-pill {{
      background: rgba(217, 155, 38, 0.20); color: #fde047;
      border: 2px solid #d99b26; border-radius: 999px;
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
      margin-top: 22px; background: linear-gradient(90deg, #d99b26 0%, #fbbf24 100%);
      color: #0b132b; border-radius: 999px; padding: 12px 30px;
      font-size: 24px; font-weight: 900; letter-spacing: -0.01em;
      box-shadow: 0 8px 20px rgba(217, 155, 38, 0.30);
    }}

    .sim-widget {{
      width: 468px; height: 334px; flex-shrink: 0;
      background: rgba(11, 18, 36, 0.90);
      border: 2.5px solid rgba(148, 163, 184, 0.32);
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
    .bar-track {{ width: 100%; height: 14px; background: #1e293b; border-radius: 999px; overflow: hidden; }}
    .bar-good {{ width: 78%; height: 100%; background: linear-gradient(90deg, #3b82f6, #34d399); border-radius: 999px; }}
    .bar-warn {{ width: 42%; height: 100%; background: linear-gradient(90deg, #f43f5e, #fb923c); border-radius: 999px; }}
    .w-bottom-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }}
    .mini-box {{
      border-radius: 14px; padding: 11px 14px;
      background: rgba(30, 41, 59, 0.78);
      border: 1.8px solid rgba(59, 130, 246, 0.42);
    }}
    .mini-box.gold {{ border-color: rgba(217, 155, 38, 0.55); }}
    .mb-k {{ font-size: 16px; font-weight: 700; color: #94a3b8; white-space: nowrap; }}
    .mb-v {{ margin-top: 4px; font-size: 20px; font-weight: 900; color: #ffffff; white-space: nowrap; letter-spacing: -0.02em; }}
    .mini-box.gold .mb-v {{ color: #fde047; }}
    </style></head><body>
      <div class="exec-card">
        <div class="seal">
          <img src="{wordmark_uri}" alt="BOOZA THINK" />
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


# ---------------------------------------------------------------------------
# 3. Three Pure Brush-Calligraphy Video Watermarks (400x400 Transparent PNG)
# ---------------------------------------------------------------------------
def build_wm_01_wordmark_dark_html(wordmark_uri: str) -> str:
    """Watermark Option 1 (Recommended — Matches Korea Think's Brush Squircle Watermark!)."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 400px; height: 400px; overflow: hidden; background: transparent;
      display: flex; align-items: center; justify-content: center;
    }}
    .badge {{
      width: 376px; height: 376px; border-radius: 82px;
      background: linear-gradient(145deg, #162a58 0%, #091024 100%);
      border: 12px solid #d99b26;
      box-shadow: 0 10px 24px rgba(0,0,0,0.44);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 18px;
    }}
    .wm-img {{ width: 304px; height: auto; margin-top: 6px; }}
    .sub-pill {{
      margin-top: 18px; background: #e11d48; color: #ffffff;
      padding: 8px 36px; border-radius: 999px; border: 3.5px solid #ffffff;
      font-size: 36px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.05;
    }}
    </style></head><body>
      <div class="badge">
        <img src="{wordmark_uri}" class="wm-img" alt="BOOZA THINK" />
        <div class="sub-pill">구독 +</div>
      </div>
    </body></html>"""


def build_wm_02_bt_dark_html(bt_white_uri: str, shift_x: int) -> str:
    """Watermark Option 2: `BT` Brush Monogram + `부자생각` + `구독 +`."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 400px; height: 400px; overflow: hidden; background: transparent;
      display: flex; align-items: center; justify-content: center;
    }}
    .badge {{
      width: 376px; height: 376px; border-radius: 82px;
      background: linear-gradient(145deg, #162a58 0%, #091024 100%);
      border: 12px solid #d99b26;
      box-shadow: 0 10px 24px rgba(0,0,0,0.44);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 14px;
    }}
    .bt-img {{ height: 152px; width: auto; transform: translateX({int(shift_x * 0.42)}px); }}
    .ko {{
      margin-top: 4px; font-size: 62px; font-weight: 900; color: #fbbf24;
      letter-spacing: -0.03em; line-height: 1.04;
    }}
    .sub-pill {{
      margin-top: 10px; background: #e11d48; color: #ffffff;
      padding: 6px 32px; border-radius: 999px; border: 3.5px solid #ffffff;
      font-size: 34px; font-weight: 900; line-height: 1.05;
    }}
    </style></head><body>
      <div class="badge">
        <img src="{bt_white_uri}" class="bt-img" alt="BT" />
        <div class="ko">부자생각</div>
        <div class="sub-pill">구독 +</div>
      </div>
    </body></html>"""


def build_wm_03_transparent_brush_html(outlined_wordmark_uri: str) -> str:
    """Watermark Option 3: Box-free pure transparent corner stamp with Brush `BOOZA THINK` + `부자생각`."""
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 400px; height: 400px; overflow: hidden; background: transparent;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .wrap {{
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      filter: drop-shadow(0 5px 12px rgba(15,23,42,0.45));
    }}
    .wm-img {{ width: 356px; height: auto; }}
    .ko-tag {{
      margin-top: 12px; background: #0b132b; color: #fbbf24;
      border: 5px solid #ffffff; border-radius: 999px;
      padding: 6px 30px; font-size: 36px; font-weight: 900;
    }}
    </style></head><body>
      <div class="wrap">
        <img src="{outlined_wordmark_uri}" class="wm-img" alt="BOOZA THINK" />
        <div class="ko-tag">부자생각</div>
      </div>
    </body></html>"""


def write_channel_setup_guide(out_txt: Path) -> None:
    guide = """[부자생각 (BoozaThink) 유튜브 채널 핸들 변경 & 공식 붓글씨 브랜딩 세팅 시트 (v3.0)]
================================================================================

1. 유튜브 스튜디오 [맞춤설정] 업로드 파일 안내 (차트 이모티콘 완전 제거 · 정통 붓글씨 버전)
--------------------------------------------------------------------------------
  - [사진 (프로필 로고 — 800x800 PNG)]:
      추천 1) `BoozaThink_Profile_Logo_01_NavyGold_BrushWordmark_800x800.png`
              (다크 네이비 & 골드 링 + 힘있는 2단 붓글씨 `BOOZA THINK` — Korea Think 패밀리 톤)
      추천 2) `BoozaThink_Profile_Logo_02_NavyGold_BT_Calligraphy_800x800.png`
              (다크 네이비 & 골드 링 + 일필휘지 화이트 붓글씨 `BT` — SA Think 다크 패밀리 톤)
      추천 3) `BoozaThink_Profile_Logo_03_IvoryInk_BT_Calligraphy_800x800.png`
              (웜 아이보리 & 먹물 네이비 붓글씨 `BT` — SA Think 아이보리 먹물 패밀리 톤)

  - [배너 이미지 — 2560x1440 PNG]:
      `BoozaThink_Channel_Banner_2560x1440.png`
      (좌측 붓글씨 인장 + 부자생각 창업·손익 연구소 + 우측 3초 실전 시뮬레이터 데이터 보드)

  - [동영상 워터마크 — 400x400 투명 PNG] (표시 시간: '전체 동영상' 선택 권장):
      추천 1) `BoozaThink_Video_Watermark_01_BrushWordmark_Dark_400x400.png` (2단 붓글씨 + 구독)
      추천 2) `BoozaThink_Video_Watermark_02_BT_Calligraphy_Dark_400x400.png` (BT 붓글씨 + 부자생각 + 구독)
      추천 3) `BoozaThink_Video_Watermark_03_Transparent_Brush_400x400.png` (배경 없는 투명 붓글씨 스탬프)

  - [이름]: `부자생각 BoozaThink` (또는 `BoozaThink` / `부자생각`)
  - [핸들]: `@BoozaThink` (선점되어 있을 경우 `@BoozaThinkcom`)

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

    # Clean out old v2 chart-icon files from both output and Desktop folder
    for folder in (OUT_DIR, MANUAL_BOX):
        for old_p in folder.glob("*.png"):
            old_p.unlink(missing_ok=True)

    wm_white_gold = extract_2line_brush_wordmark_uri(
        top_rgb=(255, 255, 255),
        bot_rgb=(251, 191, 36),
        target_w=560,
        add_white_outline=False,
    )
    wm_navy_cobalt_outlined = extract_2line_brush_wordmark_uri(
        top_rgb=(15, 23, 42),
        bot_rgb=(29, 78, 216),
        target_w=380,
        add_white_outline=True,
    )
    bt_white_uri, bt_shift_x = extract_bt_monogram_uri(ink_rgb=(255, 255, 255), target_h=380)
    bt_ink_uri, _ = extract_bt_monogram_uri(ink_rgb=(15, 23, 42), target_h=380)

    logo1 = OUT_DIR / "BoozaThink_Profile_Logo_01_NavyGold_BrushWordmark_800x800.png"
    logo2 = OUT_DIR / "BoozaThink_Profile_Logo_02_NavyGold_BT_Calligraphy_800x800.png"
    logo3 = OUT_DIR / "BoozaThink_Profile_Logo_03_IvoryInk_BT_Calligraphy_800x800.png"
    banner = OUT_DIR / "BoozaThink_Channel_Banner_2560x1440.png"
    wm1 = OUT_DIR / "BoozaThink_Video_Watermark_01_BrushWordmark_Dark_400x400.png"
    wm2 = OUT_DIR / "BoozaThink_Video_Watermark_02_BT_Calligraphy_Dark_400x400.png"
    wm3 = OUT_DIR / "BoozaThink_Video_Watermark_03_Transparent_Brush_400x400.png"
    guide = OUT_DIR / "BoozaThink_유튜브_채널세팅_복사용_가이드.txt"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        pg_logo = browser.new_page(viewport={"width": 800, "height": 800}, device_scale_factor=1)
        pg_logo.set_content(build_logo_01_wordmark_dark_html(wm_white_gold), wait_until="networkidle")
        pg_logo.screenshot(path=str(logo1), type="png")

        pg_logo.set_content(build_logo_02_bt_dark_html(bt_white_uri, bt_shift_x), wait_until="networkidle")
        pg_logo.screenshot(path=str(logo2), type="png")

        pg_logo.set_content(build_logo_03_bt_ivory_html(bt_ink_uri, bt_shift_x), wait_until="networkidle")
        pg_logo.screenshot(path=str(logo3), type="png")
        pg_logo.close()

        pg_ban = browser.new_page(viewport={"width": 2560, "height": 1440}, device_scale_factor=1)
        pg_ban.set_content(build_channel_banner_html(wm_white_gold), wait_until="networkidle")
        pg_ban.screenshot(path=str(banner), type="png")
        pg_ban.close()

        pg_wm = browser.new_page(viewport={"width": 400, "height": 400}, device_scale_factor=1)
        pg_wm.set_content(build_wm_01_wordmark_dark_html(wm_white_gold), wait_until="networkidle")
        pg_wm.screenshot(path=str(wm1), type="png", omit_background=True)

        pg_wm.set_content(build_wm_02_bt_dark_html(bt_white_uri, bt_shift_x), wait_until="networkidle")
        pg_wm.screenshot(path=str(wm2), type="png", omit_background=True)

        pg_wm.set_content(build_wm_03_transparent_brush_html(wm_navy_cobalt_outlined), wait_until="networkidle")
        pg_wm.screenshot(path=str(wm3), type="png", omit_background=True)
        pg_wm.close()

        browser.close()

    write_channel_setup_guide(guide)

    for src in (logo1, logo2, logo3, banner, wm1, wm2, wm3, guide):
        shutil.copy2(src, MANUAL_BOX / src.name)
        print(f"[OK v3 Brush] {src.name} ({src.stat().st_size:,} bytes) -> staged to Desktop box")


if __name__ == "__main__":
    main()

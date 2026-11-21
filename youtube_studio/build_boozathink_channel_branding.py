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
# 2. Panoramic All-Devices Channel Banner (2560x1440 — Father's Hand & Flowing Stream)
# ---------------------------------------------------------------------------
def prepare_panoramic_flow_bg_uri() -> str:
    """
    Prepares `banner_father_flow_v1.jpg` at 2560x1440 with horizontal optical framing so:
      - Joined hands + golden glow sit squarely inside x: 1560..2015, y: 512..925 (100% inside Mobile 1546x423!)
      - Flowing champagne-gold & sky-blue ribbons span continuously across Tablet (1855x423),
        PC Desktop (2560x423), and Full 16:9 Smart TV (2560x1440) with zero hard box cutoffs!
    """
    src = Image.open(ASSETS_DIR / "banner_father_flow_v1.jpg").convert("RGB")
    # Scale slightly wider (2656 x 1482) and shift -76px left & -18px up so clasped hands sit inside x <= 2015
    scaled = src.resize((2656, 1482), Image.Resampling.LANCZOS)
    framed = scaled.crop((76, 18, 76 + 2560, 18 + 1440))
    framed = framed.filter(ImageFilter.UnsharpMask(radius=1.4, percent=115, threshold=3))
    buf = io.BytesIO()
    framed.save(buf, format="JPEG", quality=95, subsampling=0)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def build_channel_banner_html(wordmark_uri: str, bg_flow_uri: str, show_device_guides: bool = False) -> str:
    """
    2560x1440 Seamless Panoramic Banner:
      - TV Full Canvas       : 2560 x 1440 (0..2560, 0..1440)
      - PC Desktop Strip     : 2560 x 423  (0..2560, 508..931)
      - Tablet Strip         : 1855 x 423  (352..2207, 508..931)
      - Mobile Safe Core     : 1546 x 423  (507..2053, 508..931)
    """
    guide_html = ""
    if show_device_guides:
        guide_html = """
        <!-- TV Full Frame (2560 x 1440) -->
        <div style="position:absolute; inset:8px; border:5px dashed rgba(248,250,252,0.75); border-radius:18px; pointer-events:none; z-index:50;">
          <span style="position:absolute; left:24px; top:18px; background:#0f172a; color:#f8fafc; border:2px solid #cbd5e1; padding:6px 18px; border-radius:999px; font-size:22px; font-weight:900;">
            TV 전체 화면 영역 (2560 × 1440)
          </span>
        </div>
        <!-- PC Desktop Strip (0..2560, y: 508..931) -->
        <div style="position:absolute; left:0; width:2560px; top:508px; height:423px; border-top:4px dashed #38bdf8; border-bottom:4px dashed #38bdf8; background:rgba(56,189,248,0.04); pointer-events:none; z-index:51;">
          <span style="position:absolute; left:24px; top:14px; background:#0284c7; color:#ffffff; padding:5px 16px; border-radius:999px; font-size:20px; font-weight:900; box-shadow:0 4px 12px rgba(0,0,0,0.4);">
            PC 모니터 영역 (2560 × 423)
          </span>
          <span style="position:absolute; right:24px; top:14px; background:#0284c7; color:#ffffff; padding:5px 16px; border-radius:999px; font-size:20px; font-weight:900;">
            PC 우측 날개 ➔
          </span>
        </div>
        <!-- Tablet Strip (x: 352..2207, y: 508..931) -->
        <div style="position:absolute; left:352px; width:1855px; top:508px; height:423px; border-left:4px dashed #34d399; border-right:4px dashed #34d399; pointer-events:none; z-index:52;">
          <span style="position:absolute; left:8px; bottom:-42px; background:#059669; color:#ffffff; padding:5px 16px; border-radius:999px; font-size:19px; font-weight:900; box-shadow:0 4px 12px rgba(0,0,0,0.4);">
            태블릿 영역 (1855 × 423)
          </span>
          <span style="position:absolute; right:8px; bottom:-42px; background:#059669; color:#ffffff; padding:5px 16px; border-radius:999px; font-size:19px; font-weight:900; box-shadow:0 4px 12px rgba(0,0,0,0.4);">
            태블릿 우측 경계
          </span>
        </div>
        <!-- Mobile All-Devices Safe Zone (x: 507..2053, y: 508..931) -->
        <div style="position:absolute; left:507px; width:1546px; top:508px; height:423px; border:5px solid #fbbf24; box-shadow:0 0 0 3px rgba(15,23,42,0.65); pointer-events:none; z-index:53;">
          <span style="position:absolute; left:18px; top:-44px; background:#fbbf24; color:#0f172a; padding:6px 20px; border-radius:999px; font-size:21px; font-weight:900; box-shadow:0 4px 14px rgba(0,0,0,0.45);">
            핸드폰(스마트폰) 핵심 안전영역 (1546 × 423 · 모든 기기 공통 노출)
          </span>
        </div>
        """

    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 2560px; height: 1440px; overflow: hidden; position: relative;
      background: #081022;
    }}
    .bg-art {{
      position: absolute; inset: 0; width: 2560px; height: 1440px;
      object-fit: cover; z-index: 1;
    }}
    /* Seamless full-canvas soft vignette strictly centered around the typography — zero rectangular div seams! */
    .text-veil {{
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 680px 320px at 980px 720px, rgba(6, 12, 28, 0.72) 0%, rgba(6, 12, 28, 0.36) 55%, rgba(6, 12, 28, 0.0) 100%);
      z-index: 2; pointer-events: none;
    }}
    /* Subtle TV-only upper/lower atmospheric captions (visible on Smart TVs, safely outside 508..931 strip) */
    .tv-top-brand {{
      position: absolute; left: 536px; top: 385px; z-index: 3;
      font-size: 22px; font-weight: 800; letter-spacing: 0.16em;
      color: rgba(226, 232, 240, 0.62);
    }}
    .tv-bot-motto {{
      position: absolute; left: 536px; top: 1008px; z-index: 3;
      font-size: 23px; font-weight: 700; letter-spacing: 0.02em;
      color: rgba(248, 250, 252, 0.68);
    }}
    /* Core Safe-Zone Content (x: 534..1560 inside 507..2053; x: 1560..2035 leaves the Joined Hands & Flow unobstructed!) */
    .safe-left-group {{
      position: absolute; left: 534px; top: 524px; width: 1030px; height: 392px;
      display: flex; align-items: center; gap: 30px; z-index: 5;
    }}
    .seal {{
      width: 224px; height: 224px; border-radius: 50%; flex-shrink: 0;
      background: radial-gradient(circle at 44% 34%, rgba(27, 52, 104, 0.92) 0%, rgba(9, 16, 36, 0.95) 80%);
      border: 5.5px solid #e5a93b;
      box-shadow: 0 14px 32px rgba(0,0,0,0.52), inset 0 0 0 4px rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center;
      padding: 14px;
    }}
    .seal img {{
      width: 184px; height: auto;
      filter: drop-shadow(0 6px 14px rgba(0,0,0,0.55));
    }}
    .mid-col {{
      display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
    }}
    .pill-row {{ display: flex; align-items: center; gap: 10px; margin-bottom: 13px; }}
    .kicker-pill {{
      background: rgba(15, 29, 62, 0.85); color: #93c5fd;
      border: 2px solid rgba(96, 165, 250, 0.72); border-radius: 999px;
      padding: 6px 18px; font-size: 19px; font-weight: 800;
    }}
    .free-pill {{
      background: rgba(217, 155, 38, 0.22); color: #fde047;
      border: 2px solid rgba(245, 180, 59, 0.80); border-radius: 999px;
      padding: 6px 16px; font-size: 18.5px; font-weight: 800;
    }}
    .main-title {{
      font-size: 55px; font-weight: 900; color: #ffffff;
      letter-spacing: -0.03em; line-height: 1.12;
      text-shadow: 0 6px 22px rgba(0,0,0,0.65);
    }}
    .main-title span {{ color: #fbbf24; }}
    .sub-desc {{
      margin-top: 12px; font-size: 22.5px; font-weight: 700; color: #e2e8f0;
      letter-spacing: -0.015em; text-shadow: 0 3px 12px rgba(0,0,0,0.65);
      white-space: nowrap;
    }}
    .cta-btn {{
      margin-top: 22px; background: linear-gradient(90deg, #e0a32e 0%, #fbbf24 100%);
      color: #0b132b; border-radius: 999px; padding: 12px 30px;
      font-size: 23.5px; font-weight: 900; letter-spacing: -0.01em;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
    }}
    </style></head><body>
      <img src="{bg_flow_uri}" class="bg-art" alt="Father Hand and Golden Flowing Stream" />
      <div class="text-veil"></div>
      <div class="tv-top-brand">BOOZA THINK · STEWARDSHIP &amp; BUSINESS LAB</div>
      <div class="safe-left-group">
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
      </div>
      <div class="tv-bot-motto">위로부터 잡아주시는 손길과 막힘없이 흐르는 선한 재정의 길 · boozathink.com</div>
      {guide_html}
    </body></html>"""


def build_4device_crop_mockup_board(clean_banner_path: Path, out_board_path: Path) -> None:
    """
    Slices the actual clean 2560x1440 banner into the exact 4 YouTube device viewports
    (Smartphone, Tablet, PC Monitor, Smart TV) and renders a clear visual inspection board!
    """
    full = Image.open(clean_banner_path).convert("RGB")
    crops = {
        "mobile": full.crop((507, 508, 2053, 931)),   # 1546 x 423
        "tablet": full.crop((352, 508, 2207, 931)),   # 1855 x 423
        "pc": full.crop((0, 508, 2560, 931)),         # 2560 x 423
        "tv": full,                                   # 2560 x 1440
    }
    uris = {}
    for k, im in crops.items():
        b = io.BytesIO()
        im.save(b, format="JPEG", quality=92)
        uris[k] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode("ascii")

    html = f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    {FONT_CSS}
    body {{
      width: 1800px; height: 1520px; background: #0f172a; color: #f8fafc;
      padding: 44px 54px; display: flex; flex-direction: column; justify-content: space-between;
    }}
    .hdr {{ display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid #334155; padding-bottom: 16px; }}
    .hdr h1 {{ font-size: 36px; font-weight: 900; color: #fbbf24; }}
    .hdr span {{ font-size: 20px; font-weight: 700; color: #94a3b8; }}
    .row-top {{ display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 10px; }}
    .card {{
      background: #1e293b; border: 2px solid #334155; border-radius: 22px; padding: 20px 24px;
      display: flex; flex-direction: column; gap: 12px;
    }}
    .lbl {{ display: flex; align-items: center; justify-content: space-between; font-size: 22px; font-weight: 900; }}
    .lbl .tag {{ font-size: 16px; font-weight: 800; padding: 4px 14px; border-radius: 999px; }}
    .card img {{ width: 100%; height: auto; border-radius: 12px; border: 2px solid #475569; }}
    .bot-grid {{ display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 28px; align-items: stretch; }}
    </style></head><body>
      <div class="hdr">
        <h1>부자생각 유튜브 배너 — 핸드폰 · 태블릿 · PC · TV 실제 노출 화면 검증</h1>
        <span>실제 업로드 파일: BoozaThink_Channel_Banner_2560x1440.png (가이드선 없는 클린 원본)</span>
      </div>

      <div class="row-top">
        <div class="card" style="border-color:#fbbf24;">
          <div class="lbl">
            <span>① 핸드폰 (모바일 앱 화면)</span>
            <span class="tag" style="background:#fbbf24; color:#0f172a;">1546 × 423 핵심 영역</span>
          </div>
          <img src="{uris['mobile']}" />
        </div>
        <div class="card" style="border-color:#34d399;">
          <div class="lbl">
            <span>② 태블릿 (아이패드·갤럭시탭 화면)</span>
            <span class="tag" style="background:#059669; color:#ffffff;">1855 × 423 확장 영역</span>
          </div>
          <img src="{uris['tablet']}" />
        </div>
      </div>

      <div class="card" style="border-color:#38bdf8;">
        <div class="lbl">
          <span>③ PC 데스크톱 모니터 (좌우 끝까지 흐르는 파노라마 영역)</span>
          <span class="tag" style="background:#0284c7; color:#ffffff;">2560 × 423 와이드 영역</span>
        </div>
        <img src="{uris['pc']}" />
      </div>

      <div class="bot-grid">
        <div class="card" style="border-color:#cbd5e1;">
          <div class="lbl">
            <span>④ 스마트 TV 전체 화면 (상하단 빛의 근원과 물결까지 전체 노출)</span>
            <span class="tag" style="background:#e2e8f0; color:#0f172a;">2560 × 1440 풀 캔버스</span>
          </div>
          <img src="{uris['tv']}" style="max-height:455px; object-fit:contain; background:#081022;" />
        </div>
        <div class="card" style="justify-content:center; gap:18px; padding:32px;">
          <div style="font-size:28px; font-weight:900; color:#fde047;">‘부자생각’ 이중 의미(富者 · 父子) 시각 설계</div>
          <div style="font-size:21px; line-height:1.55; color:#e2e8f0; font-weight:600;">
            • <b>위에서 내밀어 잡아주시는 손 (父子 · 아버지와 자녀)</b>:<br>
              핸드폰·태블릿·PC·TV 어느 기기로 접속해도 우측 핵심 자리에 따뜻한 빛 속에서 내려와 우리의 손을 잡아주는 펜 스케치가 온전히 들어옵니다.<br><br>
            • <b>막힘없이 흐르는 선한 흐름 (富者 · Flowing)</b>:<br>
              TV의 상하단 하늘부터 PC·태블릿의 좌우 날개까지 금빛과 푸른 물결이 끊기지 않고 하나로 이어져 흐르도록 전체 2560×1440 화폭을 모두 채웠습니다.
          </div>
        </div>
      </div>
    </body></html>"""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        pg = browser.new_page(viewport={"width": 1800, "height": 1520}, device_scale_factor=1)
        pg.set_content(html, wait_until="networkidle")
        pg.screenshot(path=str(out_board_path), type="png")
        browser.close()


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

    bg_flow_uri = prepare_panoramic_flow_bg_uri()

    logo1 = OUT_DIR / "BoozaThink_Profile_Logo_01_NavyGold_BrushWordmark_800x800.png"
    logo2 = OUT_DIR / "BoozaThink_Profile_Logo_02_NavyGold_BT_Calligraphy_800x800.png"
    logo3 = OUT_DIR / "BoozaThink_Profile_Logo_03_IvoryInk_BT_Calligraphy_800x800.png"
    banner = OUT_DIR / "BoozaThink_Channel_Banner_2560x1440.png"
    banner_jpg = OUT_DIR / "BoozaThink_Channel_Banner_2560x1440.jpg"
    banner_guide = OUT_DIR / "BoozaThink_Banner_4Device_Viewport_Guide_2560x1440.png"
    banner_board = OUT_DIR / "BoozaThink_Banner_4Device_Mockup_Board.png"
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
        pg_ban.set_content(build_channel_banner_html(wm_white_gold, bg_flow_uri, show_device_guides=False), wait_until="networkidle")
        pg_ban.screenshot(path=str(banner), type="png")
        pg_ban.screenshot(path=str(banner_jpg), type="jpeg", quality=95)

        pg_ban.set_content(build_channel_banner_html(wm_white_gold, bg_flow_uri, show_device_guides=True), wait_until="networkidle")
        pg_ban.screenshot(path=str(banner_guide), type="png")
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

    # Ensure PNG banner stays strictly below YouTube's 6,000,000-byte upload ceiling
    if banner.stat().st_size > 5_600_000:
        im_b = Image.open(banner).convert("RGB").quantize(colors=256, method=Image.Quantize.MEDIANCUT)
        im_b.save(banner, format="PNG", optimize=True)

    build_4device_crop_mockup_board(banner, banner_board)
    write_channel_setup_guide(guide)

    for src in (logo1, logo2, logo3, banner, banner_jpg, banner_guide, banner_board, wm1, wm2, wm3, guide):
        shutil.copy2(src, MANUAL_BOX / src.name)
        print(f"[OK v4 Flow] {src.name} ({src.stat().st_size:,} bytes) -> staged to Desktop box")


if __name__ == "__main__":
    main()

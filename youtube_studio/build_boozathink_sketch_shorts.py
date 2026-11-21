# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Fountain-Pen Live-Sketch Shorts Studio (`1080x1920`, 24fps)
====================================================================================
THINK 유니버스 공통 철학 구현:
  "막연했던 생각이 종이 위에 펜으로 한 획씩 스케치되며, 그림이 완성되는 동안
   전달하고 싶은 이야기('창업은 순서만 알면 참 쉽다')가 선명하게 완성된다."

특징:
  1. 실제 컨투어 추적 만년필 애니메이션 (`extract_doodle_layers` + `compute_kinetic_trace_path`):
     - 하얀 종이 위 일러스트에서 펜 잉크선과 수채 마커 채색층을 분리해,
       만년필 커서가 실제로 선을 따라 사각사각 그리며 완성하고 파스텔 색감이 번져 올라옵니다.
  2. 살아 숨 쉬는 손그림 호흡 모션 (6fps Flipbook Line-Boil):
     - 펜 드로잉이 끝난 뒤에도 정지된 죽은 그림이 아니라 따뜻한 손그림 특유의 미세한 선 호흡을 유지합니다.
  3. 고객 친화적 쉬운 언어 100% 준수:
     - 내부 제작 용어(`4컷 만화`, `페르소나`, `시계열`, `턴키` 등) 노출 ZERO.
     - 연말 한시 무료 개방 안내(`올해 12.31까지 전 업종 무료 개방 · boozathink.com`) 자연스럽게 결합.
  4. 저작권 걱정 0% 자체 합성 사운드:
     - 사각사각 만년필 스케치 폴리 효과음 + 따뜻한 일렉트릭 피아노 스케치북 BGM + 또렷한 한국어 내레이션.
"""
from __future__ import annotations

import asyncio
import math
import subprocess
import sys
import wave
from pathlib import Path

import edge_tts
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STUDIO_DIR = Path(__file__).resolve().parent
ASSETS_DIR = STUDIO_DIR / "assets"
OUT_DIR = STUDIO_DIR / "output" / "ep01_easy_startup_shorts"
WORK_DIR = STUDIO_DIR / "_work_ep01_shorts"
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

W, H = 1080, 1920
FPS = 24
SR = 44100
VOICE_ID = "ko-KR-InJoonNeural"
VOICE_RATE = "+7%"

SCENES = [
    {
        "id": "s1_vague_thought",
        "asset": ASSETS_DIR / "ep01_s1_vague_thought.jpg",
        "voice": (
            "내 가게 한 번 해보고 싶은데, 계약부터 세금까지 뭐부터 해야 할지 막막하셨죠? "
            "사실 겁낼 필요 전혀 없습니다."
        ),
        "step_tag": "부자생각 창업 노트 · 첫 번째 생각",
        "headline": "내 가게 해보고 싶은데,<br><span class='hl'>뭐부터 시작할지 막막하셨죠?</span>",
        "bubble": "“돈 모아서 바로 상가 계약부터 하면 되나…? 세금·통장은 언제 만들지?”",
        "note_badge": "생각 정리",
        "note_badge_bg": "#dbeafe",
        "note_badge_fg": "#1e40af",
        "note_title": "창업이 어렵게 느껴지는 진짜 이유",
        "note_body": "능력이 부족해서가 아니라, 내 눈앞에 ‘전체 순서 지도’가 없었기 때문입니다.",
        "sub_first": ("내 가게 한 번 해보고 싶은데,", "계약부터 세금까지 막막하셨죠?"),
        "sub_second": ("사실 겁낼 필요 전혀 없습니다!", "순서만 한눈에 보면 참 쉽거든요"),
        "draw_ratio": 0.62,
    },
    {
        "id": "s2_easy_steps",
        "asset": ASSETS_DIR / "ep01_s2_easy_steps.jpg",
        "voice": (
            "종이 위에 딱 세 단계만 순서대로 그려보세요. "
            "공사비 결제 전에 사업자등록과 전용 통장부터 만들어 부가세 수백만 원을 아끼고, "
            "도장 찍기 전에 정화조 용량과 정책자금 순서만 먼저 챙기는 겁니다."
        ),
        "step_tag": "부자생각 창업 노트 · 순서 그리기",
        "headline": "종이 위에 딱 <span class='hl'>세 단계만</span><br>순서대로 먼저 그려보세요",
        "bubble": "“아하! 결제 전에 사업자·통장부터 만들면 부가세 수백만 원을 아끼는구나!”",
        "note_badge": "실수 없는 3단계",
        "note_badge_bg": "#dcfce7",
        "note_badge_fg": "#166534",
        "note_title": "1) 결제 전 사업자·통장 ➔ 2) 도장 전 시설·자금 ➔ 3) 순수익 계산",
        "note_body": "이 순서만 지켜도 초보 사장님이 가장 많이 놓치는 수백만 원을 그대로 지킵니다.",
        "sub_first": ("공사비 결제 전에 사업자·전용 통장부터!", "부가세 환급 수백만 원을 아끼고,"),
        "sub_second": ("계약 도장 찍기 전 정화조·전기 용량과", "저금리 정책자금 순서만 먼저 확인하세요"),
        "draw_ratio": 0.64,
    },
    {
        "id": "s3_bright_storefront",
        "asset": ASSETS_DIR / "ep01_s3_bright_storefront.jpg",
        "voice": (
            "머릿속 막연한 생각, 숫자로 그려보면 참 쉽고 선명해집니다. "
            "서른 개 업종 창업 비용과 진짜 남는 순수익 계산기, "
            "올해 십이월 삼십일일까지만 무료로 열어두었으니 지금 부자생각에서 내 가게를 먼저 그려보세요."
        ),
        "step_tag": "부자생각 창업 노트 · 완성된 내 가게",
        "headline": "막연했던 내 가게 생각,<br><span class='hl'>그려보면 선명해집니다</span>",
        "bubble": "“얼마 들고 한 달에 얼마 남는지 미리 다 그려보고 여니까 정말 든든해요!”",
        "note_badge": "올해 12.31까지 무료 개방",
        "note_badge_bg": "#fef08a",
        "note_badge_fg": "#854d0e",
        "note_title": "boozathink.com · 30개 업종 창업·순수익 계산기",
        "note_body": "검색창에 ‘부자생각’ 또는 boozathink.com — 내 업종 숫자를 무료로 넣어보세요!",
        "sub_first": ("머릿속 막연한 내 가게 생각,", "숫자로 그려보면 참 쉽고 선명해집니다"),
        "sub_second": ("올해 12월 31일까지만 전 업종 무료 개방!", "지금 부자생각에서 내 가게를 그려보세요"),
        "draw_ratio": 0.56,
    },
]


# ---------------------------------------------------------------------------
# 1. Sketchbook Grid Paper & Sleek Navy-Gold Fountain Pen Cursor
# ---------------------------------------------------------------------------
def make_sketchbook_paper(w: int, h: int) -> Image.Image:
    rng = np.random.default_rng(202611)
    grain = rng.normal(0.0, 2.2, size=(h, w, 1)).astype(np.float32)
    base = np.full((h, w, 3), [252.0, 250.0, 244.0], dtype=np.float32) + grain
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    dr = ImageDraw.Draw(img)
    for x in range(36, w - 24, 42):
        dr.line([(x, 36), (x, h - 36)], fill=(231, 237, 246), width=1)
    for y in range(36, h - 24, 42):
        dr.line([(36, y), (w - 36, y)], fill=(231, 237, 246), width=1)
    # Subtle red notebook left margin line
    dr.line([(68, 36), (68, h - 36)], fill=(251, 207, 214), width=2)
    # Sketchbook white card area in the middle where the drawing unfolds (x: 90..990, y: 490..1370)
    dr.rounded_rectangle([84, 484, 996, 1376], radius=36, fill=(255, 255, 255), outline=(24, 34, 60), width=5)
    # Yellow masking tape at top of sketch card
    dr.rounded_rectangle([460, 466, 620, 502], radius=8, fill=(254, 240, 138), outline=(24, 34, 60), width=3)
    return img


def create_fountain_pen_cursor() -> Image.Image:
    """190x190 RGBA fountain pen sprite whose nib tip is anchored at (16, 168)."""
    img = Image.new("RGBA", (190, 190), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    # Soft drop shadow
    dr.polygon([(20, 172), (52, 154), (176, 36), (150, 14), (32, 134)], fill=(15, 23, 42, 40))
    # Royal navy pen barrel
    dr.polygon([(38, 124), (152, 10), (180, 38), (66, 152)], fill=(20, 34, 68, 255), outline=(10, 16, 34, 255))
    # Gold trim ring
    dr.line([(42, 120), (70, 148)], fill=(244, 201, 93, 255), width=7)
    dr.line([(134, 28), (162, 56)], fill=(244, 201, 93, 255), width=5)
    # Golden fountain pen nib tapering to (16, 168)
    dr.polygon([(16, 168), (38, 124), (66, 152)], fill=(244, 201, 93, 255), outline=(15, 23, 42, 255))
    dr.line([(16, 168), (44, 140)], fill=(15, 23, 42, 255), width=3)
    dr.ellipse([40, 136, 48, 144], fill=(15, 23, 42, 255))
    return img


# ---------------------------------------------------------------------------
# 2. Ink & Watercolor Layer Separation + Nearest-Neighbor Pen Contour Path
# ---------------------------------------------------------------------------
def extract_doodle_layers(img_rgb: Image.Image, target_w: int, target_h: int) -> tuple[np.ndarray, np.ndarray]:
    sw, sh = img_rgb.size
    scale = min(target_w / sw, target_h / sh)
    nw, nh = max(16, int(round(sw * scale))), max(16, int(round(sh * scale)))
    fitted = img_rgb.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (target_w, target_h), (255, 255, 255))
    canvas.paste(fitted, ((target_w - nw) // 2, (target_h - nh) // 2))

    arr = np.asarray(canvas, dtype=np.float32)
    white_m = (arr[:, :, 0] > 244) & (arr[:, :, 1] > 244) & (arr[:, :, 2] > 244)
    arr[white_m] = 255.0

    gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    inv = 255.0 - gray
    blur = np.asarray(
        Image.fromarray(inv.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=4.2)),
        dtype=np.float32,
    )
    dodge = np.minimum(255.0, (gray * 255.0) / np.maximum(8.0, 255.0 - blur))
    edge_ink = np.clip((244.0 - dodge) / 142.0, 0.0, 1.0)
    dark_ink = np.clip((188.0 - gray) / 136.0, 0.0, 1.0)
    ink = np.maximum(dark_ink, edge_ink * 0.88)
    ink[ink < 0.12] = 0.0
    return arr, ink


def compute_kinetic_trace_path(ink: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    h, w = ink.shape
    step = 4
    gh, gw = max(4, h // step), max(4, w // step)
    ink_pil = Image.fromarray((np.clip(ink, 0.0, 1.0) * 255.0).astype(np.uint8))
    small = np.asarray(ink_pil.resize((gw, gh), Image.Resampling.BILINEAR), dtype=np.float32) / 255.0

    ys, xs = np.nonzero(small > 0.22)
    m = len(xs)
    if m < 6:
        return (
            np.zeros((h, w), dtype=np.float32),
            np.array([w * 0.5], dtype=np.float32),
            np.array([h * 0.5], dtype=np.float32),
        )

    xs_f = xs.astype(np.float32)
    ys_f = ys.astype(np.float32)
    visited = np.zeros(m, dtype=bool)
    order_idx = np.empty(m, dtype=np.int32)

    cur = int(np.argmin(ys_f * 1.2 + xs_f * 0.8))
    for k in range(m):
        visited[cur] = True
        order_idx[k] = cur
        if k == m - 1:
            break
        dx = xs_f - xs_f[cur]
        dy = ys_f - ys_f[cur]
        dist2 = dx * dx + dy * dy
        dist2[visited] = 1e18
        cur = int(np.argmin(dist2))

    ord_small = np.full((gh, gw), 1.0, dtype=np.float32)
    ranks = np.linspace(0.002, 0.998, m, dtype=np.float32)
    ord_small[ys[order_idx], xs[order_idx]] = ranks

    filled = ord_small.copy()
    valid = small > 0.22
    for _ in range(3):
        for oy, ox in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)]:
            shifted_v = np.roll(np.roll(valid, oy, axis=0), ox, axis=1)
            shifted_o = np.roll(np.roll(filled, oy, axis=0), ox, axis=1)
            take = (~valid) & shifted_v
            filled[take] = shifted_o[take]
            valid = valid | take

    ord_full_pil = Image.fromarray((np.clip(filled, 0.0, 1.0) * 255.0).astype(np.uint8)).resize(
        (w, h), Image.Resampling.NEAREST
    )
    ord_full = np.asarray(ord_full_pil, dtype=np.float32) / 255.0

    px = xs_f[order_idx] * step + step * 0.5
    py = ys_f[order_idx] * step + step * 0.5
    if m > 5:
        px = np.convolve(px, np.array([0.2, 0.6, 0.2], dtype=np.float32), mode="same")
        py = np.convolve(py, np.array([0.2, 0.6, 0.2], dtype=np.float32), mode="same")
    return ord_full, px, py


# ---------------------------------------------------------------------------
# 3. Crisp Transparent UI Overlay via Playwright (Zero Broken Hangul!)
# ---------------------------------------------------------------------------
def build_overlay_html(sc: dict, sub_pair: tuple[str, str], show_note: bool) -> str:
    note_opacity = "1" if show_note else "0.0"
    note_shift = "0px" if show_note else "14px"
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      width: 1080px; height: 1920px; overflow: hidden; background: transparent;
      font-family: 'Pretendard', 'Malgun Gothic', sans-serif; position: relative;
    }}
    .top-bar {{
      position: absolute; top: 76px; left: 84px; right: 84px;
      display: flex; align-items: center; justify-content: space-between;
    }}
    .step-pill {{
      background: #18223c; color: #f4c95d; font-size: 24px; font-weight: 800;
      padding: 9px 22px; border-radius: 999px; letter-spacing: -0.01em;
    }}
    .wm {{
      font-size: 25px; font-weight: 900; color: #1d4ed8; letter-spacing: 0.02em;
    }}
    .headline {{
      position: absolute; top: 148px; left: 84px; right: 84px;
      font-size: 56px; font-weight: 900; color: #0f172a; line-height: 1.18;
      letter-spacing: -0.03em;
    }}
    .headline .hl {{
      background: linear-gradient(transparent 56%, #fef08a 56%);
      padding: 0 6px;
    }}
    .speech-bubble {{
      position: absolute; top: 320px; left: 84px; right: 84px;
      background: #ffffff; border: 4px solid #18223c; border-radius: 26px;
      padding: 22px 30px; font-size: 30px; font-weight: 800; color: #1e293b;
      line-height: 1.35; box-shadow: 6px 6px 0 #cbd5e1;
    }}
    .speech-bubble::after {{
      content: ''; position: absolute; bottom: -20px; left: 110px;
      border-width: 20px 18px 0; border-style: solid;
      border-color: #18223c transparent transparent;
    }}
    .note-card {{
      position: absolute; top: 1412px; left: 84px; right: 84px;
      background: #ffffff; border: 4.5px solid #18223c; border-radius: 28px;
      padding: 24px 30px; box-shadow: 8px 8px 0 #1d4ed8;
      opacity: {note_opacity}; transform: translateY({note_shift});
    }}
    .note-badge {{
      display: inline-block; background: {sc['note_badge_bg']}; color: {sc['note_badge_fg']};
      font-size: 22px; font-weight: 900; padding: 6px 18px; border-radius: 999px;
      border: 2.5px solid #18223c; margin-bottom: 10px;
    }}
    .note-title {{
      font-size: 31px; font-weight: 900; color: #0f172a; line-height: 1.25;
      letter-spacing: -0.02em;
    }}
    .note-body {{
      margin-top: 8px; font-size: 25px; font-weight: 700; color: #475569; line-height: 1.35;
    }}
    .sub-box {{
      position: absolute; bottom: 130px; left: 64px; right: 64px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }}
    .sub-inner {{
      background: rgba(15, 23, 42, 0.90); color: #ffffff;
      padding: 18px 32px; border-radius: 22px; text-align: center;
      font-size: 35px; font-weight: 800; line-height: 1.34;
      border: 3px solid rgba(244, 201, 93, 0.85);
      box-shadow: 0 10px 26px rgba(15, 23, 42, 0.28);
    }}
    .sub-inner .l2 {{ color: #fde047; }}
    </style></head><body>
      <div class="top-bar">
        <span class="step-pill">{sc['step_tag']}</span>
        <span class="wm">BOOZA THINK · 부자생각</span>
      </div>
      <div class="headline">{sc['headline']}</div>
      <div class="speech-bubble">{sc['bubble']}</div>
      <div class="note-card">
        <div class="note-badge">{sc['note_badge']}</div>
        <div class="note-title">{sc['note_title']}</div>
        <div class="note-body">{sc['note_body']}</div>
      </div>
      <div class="sub-box">
        <div class="sub-inner">
          <div>{sub_pair[0]}</div>
          <div class="l2">{sub_pair[1]}</div>
        </div>
      </div>
    </body></html>"""


# ---------------------------------------------------------------------------
# 4. TTS Voiceover + Original Fountain-Pen Foley + Warm Sketchbook BGM
# ---------------------------------------------------------------------------
async def _synth_tts(text: str, out_mp3: Path) -> None:
    comm = edge_tts.Communicate(text=text, voice=VOICE_ID, rate=VOICE_RATE)
    await comm.save(str(out_mp3))


def make_scene_voice_wav(scene_id: str, text: str) -> tuple[Path, float]:
    out_wav = WORK_DIR / f"{scene_id}_vo.wav"
    raw_mp3 = WORK_DIR / f"{scene_id}_vo.mp3"
    asyncio.run(_synth_tts(text, raw_mp3))
    af = (
        "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-45dB,"
        "areverse,silenceremove=start_periods=1:start_silence=0.06:start_threshold=-45dB,areverse,"
        "apad=pad_dur=0.35"
    )
    subprocess.run(
        [FFMPEG_EXE, "-y", "-i", str(raw_mp3), "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(out_wav)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    raw_mp3.unlink(missing_ok=True)
    with wave.open(str(out_wav), "rb") as wf:
        dur = wf.getnframes() / float(wf.getframerate())
    return out_wav, dur


def fft_bandpass(sig: np.ndarray, lo_hz: float, hi_hz: float, peak_hz: float | None = None, peak_gain: float = 0.0) -> np.ndarray:
    n = len(sig)
    spec = np.fft.rfft(sig)
    freqs = np.fft.rfftfreq(n, d=1.0 / SR)
    mask = ((freqs >= lo_hz) & (freqs <= hi_hz)).astype(np.float32)
    if peak_hz is not None and peak_gain > 0:
        mask *= 1.0 + peak_gain * np.exp(-0.5 * ((freqs - peak_hz) / 480.0) ** 2)
    return np.fft.irfft(spec * mask, n=n).astype(np.float32)


def sfx_fountain_pen_sketch(dur_sec: float, seed: int = 17) -> np.ndarray:
    """Warm, crisp fountain-pen-on-sketchbook strokes ('사각사각 펜 드로잉 소리')."""
    rng = np.random.default_rng(seed)
    total_n = max(128, int(round(dur_sec * SR)))
    st = np.zeros((total_n, 2), dtype=np.float32)
    t_cur = 0.05
    idx = 0
    while t_cur < dur_sec - 0.08:
        sd = float(rng.uniform(0.065, 0.135) if (idx % 4 != 3) else rng.uniform(0.15, 0.24))
        if t_cur + sd > dur_sec:
            sd = dur_sec - t_cur
        if sd < 0.035:
            break
        n = int(round(sd * SR))
        u = np.linspace(0.0, 1.0, n, dtype=np.float32)
        env = (np.maximum(0.0, np.sin(np.pi * u)) ** 0.52) * np.exp(-u * 0.30)
        raw = rng.normal(0.0, 0.75, size=n).astype(np.float32)
        f_pk = 3600.0 if (idx % 2 == 0) else 2850.0
        w = fft_bandpass(raw, 1200.0, 7200.0, peak_hz=f_pk, peak_gain=0.75)
        w = (w / (float(np.max(np.abs(w))) + 1e-6)) * env * float(rng.uniform(0.075, 0.105))
        pan = float(np.clip(0.32 + 0.36 * ((idx % 5) / 4.0), 0.25, 0.75))
        s0 = int(round(t_cur * SR))
        seg_n = min(n, total_n - s0)
        st[s0 : s0 + seg_n, 0] += w[:seg_n] * math.sqrt(1.0 - pan)
        st[s0 : s0 + seg_n, 1] += w[:seg_n] * math.sqrt(pan)
        gap = float(rng.uniform(0.018, 0.042) if (idx % 5 != 4) else rng.uniform(0.08, 0.15))
        t_cur += sd + gap
        idx += 1
    return st


def synth_warm_sketch_bgm(total_dur: float) -> np.ndarray:
    """Copyright-free warm electric-piano sketchbook progression (Cmaj7 -> Am7 -> Dm7 -> G9 @ 104 BPM)."""
    total_n = int(round((total_dur + 0.6) * SR))
    st = np.zeros((total_n, 2), dtype=np.float32)
    beat = 60.0 / 104.0
    bar = beat * 4.0
    chords = [
        [261.63, 329.63, 392.00, 493.88],  # Cmaj7
        [220.00, 261.63, 329.63, 392.00],  # Am7
        [293.66, 349.23, 440.00, 523.25],  # Dm7
        [196.00, 246.94, 349.23, 440.00],  # G7sus/G9
    ]
    t_bar = 0.0
    b_idx = 0
    while t_bar < total_dur:
        freqs = chords[b_idx % len(chords)]
        dur = min(bar * 1.02, total_dur + 0.4 - t_bar)
        if dur <= 0.05:
            break
        n = int(round(dur * SR))
        t = np.arange(n, dtype=np.float32) / SR
        env = np.minimum(1.0, t / 0.025) * np.exp(-t * 1.35)
        chord_w = np.zeros(n, dtype=np.float32)
        for fi, hz in enumerate(freqs):
            tone = np.sin(2.0 * np.pi * hz * t) * 0.78 + np.sin(2.0 * np.pi * hz * 2.0 * t) * 0.18 * np.exp(-t * 4.0)
            chord_w += tone * (0.26 if fi > 0 else 0.30)
        chord_w *= env * 0.14
        s0 = int(round(t_bar * SR))
        seg_n = min(n, total_n - s0)
        st[s0 : s0 + seg_n, 0] += chord_w[:seg_n] * 0.94
        st[s0 : s0 + seg_n, 1] += chord_w[:seg_n] * 1.06

        # Gentle upbeat plucked arpeggio note on beat 2.5 & 3.5
        for sub_beat, note_i in ((1.5, 2), (2.5, 3), (3.5, 1)):
            nt0 = t_bar + sub_beat * beat
            if nt0 + 0.35 < total_dur:
                nn = int(0.35 * SR)
                tt = np.arange(nn, dtype=np.float32) / SR
                hz_arp = freqs[note_i] * 2.0
                plink = np.sin(2.0 * np.pi * hz_arp * tt) * np.minimum(1.0, tt / 0.006) * np.exp(-tt * 7.5) * 0.045
                ns0 = int(round(nt0 * SR))
                nseg = min(nn, total_n - ns0)
                st[ns0 : ns0 + nseg, 0] += plink[:nseg] * 0.85
                st[ns0 : ns0 + nseg, 1] += plink[:nseg] * 1.15

        t_bar += bar
        b_idx += 1

    # Gentle 4-note rising THINK signature chime at the very end
    end_t = max(0.2, total_dur - 1.3)
    for dt_c, hz_c in ((0.0, 523.25), (0.14, 659.25), (0.28, 783.99), (0.44, 1046.50)):
        ct0 = end_t + dt_c
        cn = int(0.65 * SR)
        if int(ct0 * SR) + cn < total_n:
            tt = np.arange(cn, dtype=np.float32) / SR
            chime = np.sin(2.0 * np.pi * hz_c * tt) * np.minimum(1.0, tt / 0.005) * np.exp(-tt * 5.2) * 0.08
            cs0 = int(round(ct0 * SR))
            st[cs0 : cs0 + cn, 0] += chime
            st[cs0 : cs0 + cn, 1] += chime
    return st[: int(round(total_dur * SR))]


def read_stereo_wav_float(wav_path: Path) -> np.ndarray:
    with wave.open(str(wav_path), "rb") as wf:
        raw = wf.readframes(wf.getnframes())
        arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        return arr.reshape(-1, 2)


def write_stereo_wav(wav_path: Path, stereo: np.ndarray) -> None:
    clipped = np.clip(stereo, -0.98, 0.98)
    pcm = (clipped * 32767.0).astype(np.int16)
    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


# ---------------------------------------------------------------------------
# 5. Master Video + Pen-Sketch Render Pipeline
# ---------------------------------------------------------------------------
def build_ep01_shorts() -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)

    paper_base = make_sketchbook_paper(W, H)
    paper_arr = np.asarray(paper_base, dtype=np.float32)
    pen_sprite = create_fountain_pen_cursor()

    box_x, box_y, box_w, box_h = 104, 504, 872, 852
    u_grid = np.linspace(0.0, 1.0, box_w, dtype=np.float32)[None, :]
    v_grid = np.linspace(0.0, 1.0, box_h, dtype=np.float32)[:, None]
    diag_grid = u_grid * 0.65 + v_grid * 0.35

    # Pre-generate voiceovers BEFORE entering sync_playwright (avoids nested asyncio loop)
    vo_map: dict[str, tuple[Path, float]] = {}
    for sc in SCENES:
        vo_map[sc["id"]] = make_scene_voice_wav(sc["id"], sc["voice"])

    # Pre-generate transparent UI overlays per scene
    prepared_scenes = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        pg = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)

        for idx, sc in enumerate(SCENES):
            vo_wav, vo_dur = vo_map[sc["id"]]
            dur = max(8.0, vo_dur + 0.35)

            src_img = Image.open(sc["asset"]).convert("RGB")
            col_arr, ink_arr = extract_doodle_layers(src_img, box_w, box_h)
            ord_map, px_arr, py_arr = compute_kinetic_trace_path(ink_arr)

            # Render two overlay states per scene (first-half subtitle before note card, second-half subtitle + note card)
            ov1_path = WORK_DIR / f"{sc['id']}_ov1.png"
            ov2_path = WORK_DIR / f"{sc['id']}_ov2.png"

            pg.set_content(build_overlay_html(sc, sc["sub_first"], show_note=False), wait_until="networkidle")
            pg.screenshot(path=str(ov1_path), type="png", omit_background=True)

            pg.set_content(build_overlay_html(sc, sc["sub_second"], show_note=True), wait_until="networkidle")
            pg.screenshot(path=str(ov2_path), type="png", omit_background=True)

            ov1_rgba = Image.open(ov1_path).convert("RGBA")
            ov2_rgba = Image.open(ov2_path).convert("RGBA")

            prepared_scenes.append(
                {
                    **sc,
                    "vo_wav": vo_wav,
                    "dur": dur,
                    "frames": int(round(dur * FPS)),
                    "col_arr": col_arr,
                    "ink_arr": ink_arr,
                    "ord_map": ord_map,
                    "px": px_arr,
                    "py": py_arr,
                    "ov1": ov1_rgba,
                    "ov2": ov2_rgba,
                }
            )
            print(f"[Scene {idx+1}] {sc['id']} -> {dur:.2f}s ({int(round(dur * FPS))} frames)")

        browser.close()

    total_frames = sum(s["frames"] for s in prepared_scenes)
    total_dur = total_frames / float(FPS)

    silent_mp4 = WORK_DIR / "ep01_video_silent.mp4"
    cover_png = OUT_DIR / "BOOZATHINK_EP01_Cover_1080x1920.png"
    preview_s1_png = OUT_DIR / "BOOZATHINK_EP01_Preview_Drawing_Mid.png"

    cmd_vid = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-pix_fmt", "yuv420p", str(silent_mp4),
    ]
    proc = subprocess.Popen(cmd_vid, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    foley_intervals: list[tuple[float, float, int]] = []
    t_offset = 0.0

    for s_idx, sc in enumerate(prepared_scenes):
        n_frames = sc["frames"]
        dur = sc["dur"]
        t_draw_start = 0.12
        t_draw_end = dur * float(sc["draw_ratio"])
        t_col_start = t_draw_end * 0.72
        t_col_dur = max(1.1, dur * 0.24)
        foley_intervals.append((t_offset + t_draw_start, max(0.8, t_draw_end - t_draw_start), 17 + s_idx * 13))

        ord_map = sc["ord_map"]
        ink_arr = sc["ink_arr"]
        col_arr = sc["col_arr"]
        px_arr = sc["px"]
        py_arr = sc["py"]
        m_pts = len(px_arr)

        for fn in range(n_frames):
            t = fn / float(FPS)
            canvas = paper_arr.copy()
            patch_bg = canvas[box_y : box_y + box_h, box_x : box_x + box_w]

            p_draw = float(np.clip((t - t_draw_start) / max(0.2, t_draw_end - t_draw_start), 0.0, 1.0))
            revealed = np.clip((p_draw - ord_map) / 0.035, 0.0, 1.0)
            cur_ink = ink_arr * revealed

            # Fountain-pen navy ink linework (#18223C)
            ink_alpha = (0.88 * cur_ink)[:, :, None]
            navy_rgb = np.array([24.0, 34.0, 60.0], dtype=np.float32)[None, None, :]
            ink_layer = patch_bg * (1.0 - ink_alpha) + navy_rgb * ink_alpha

            # Soft pastel watercolor sweep as sketch nears completion
            p_col = float(np.clip((t - t_col_start) / t_col_dur, 0.0, 1.0))
            if p_col > 0.003:
                w_mask = np.clip((p_col * 1.25 - diag_grid) / 0.22, 0.0, 1.0)[:, :, None]
                colored = patch_bg * (col_arr / 255.0)
                drawn = ink_layer * (1.0 - w_mask) + np.minimum(colored, ink_layer + 22.0) * w_mask
            else:
                drawn = ink_layer

            # Gentle 6fps hand-drawn line-boil breathing once drawn so the illustration stays alive!
            if p_draw >= 0.995:
                boil_phase = (fn // 4) % 4
                shift_x = (1 if boil_phase in (1, 2) else -1) if boil_phase != 0 else 0
                shift_y = (1 if boil_phase == 2 else 0)
                if shift_x != 0 or shift_y != 0:
                    drawn = np.roll(np.roll(drawn, shift_y, axis=0), shift_x, axis=1)

            canvas[box_y : box_y + box_h, box_x : box_x + box_w] = drawn
            frame_rgba = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).convert("RGBA")

            # Composite crisp HTML overlay (switches to second subtitle + summary note card halfway)
            ov = sc["ov1"] if t < (dur * 0.48) else sc["ov2"]
            frame_rgba.alpha_composite(ov)

            # Draw moving Fountain Pen cursor while tracing strokes
            if 0.002 < p_draw < 0.992:
                pi = min(m_pts - 1, int(p_draw * (m_pts - 1)))
                pi_prev = max(0, pi - 3)
                pi_next = min(m_pts - 1, pi + 3)
                vx = float(px_arr[pi_next] - px_arr[pi_prev])
                vy = float(py_arr[pi_next] - py_arr[pi_prev])
                tilt = float(np.clip(vx * 0.20 - vy * 0.10, -13.0, 13.0))
                cx = box_x + int(px_arr[pi])
                cy = box_y + int(py_arr[pi])
                rot_pen = pen_sprite.rotate(-tilt, resample=Image.Resampling.BICUBIC, center=(16, 168))
                frame_rgba.paste(rot_pen, (cx - 16, cy - 168), rot_pen)

            frame_rgb = frame_rgba.convert("RGB")
            if s_idx == 1 and fn == int(n_frames * 0.42):
                frame_rgb.save(preview_s1_png, format="PNG")
            if s_idx == 2 and fn == int(n_frames * 0.88):
                frame_rgb.save(cover_png, format="PNG")

            proc.stdin.write(frame_rgb.tobytes())

        t_offset += dur

    proc.stdin.close()
    proc.wait()

    # Build master stereo audio (Voiceover + Fountain-Pen Foley + Warm Sketchbook BGM)
    master_st = synth_warm_sketch_bgm(total_dur)
    cur_t = 0.0
    for sc in prepared_scenes:
        vo_st = read_stereo_wav_float(sc["vo_wav"])
        s0 = int(round((cur_t + 0.08) * SR))
        seg_n = min(vo_st.shape[0], master_st.shape[0] - s0)
        if seg_n > 0:
            master_st[s0 : s0 + seg_n] += vo_st[:seg_n] * 1.12
        cur_t += sc["dur"]

    for f_start, f_dur, f_seed in foley_intervals:
        pen_st = sfx_fountain_pen_sketch(f_dur, seed=f_seed)
        s0 = int(round(f_start * SR))
        seg_n = min(pen_st.shape[0], master_st.shape[0] - s0)
        if seg_n > 0:
            master_st[s0 : s0 + seg_n] += pen_st[:seg_n]

    peak = float(np.max(np.abs(master_st))) + 1e-6
    if peak > 0.94:
        master_st *= 0.94 / peak

    master_wav = WORK_DIR / "ep01_master_audio.wav"
    write_stereo_wav(master_wav, master_st)

    final_mp4 = OUT_DIR / "BOOZATHINK_EP01_Easy_Startup_Order_9x16_Shorts.mp4"
    subprocess.run(
        [
            FFMPEG_EXE, "-y",
            "-i", str(silent_mp4),
            "-i", str(master_wav),
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
            "-movflags", "+faststart",
            "-shortest",
            str(final_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print(f"[DONE] Shorts MP4: {final_mp4} ({final_mp4.stat().st_size:,} bytes, {total_dur:.1f}s)")
    return final_mp4


if __name__ == "__main__":
    mp4 = build_ep01_shorts()
    import youtube_boozathink_uploader as yt_up
    yt_up.upload_ep01(privacy="public", force_api_upload=False)

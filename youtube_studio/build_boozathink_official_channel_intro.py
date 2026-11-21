# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Official Channel Intro Builder (v2.0 — Distinct Cobalt-Mint Architect Binder UI)
=========================================================================================================
100% Differentiated in Color & Structural Layout from `SA Think` (Ivory/Navy/Gold 3-bar box):
  1. [Unique BoozaThink Color System — Matches `boozathink.com` Fintech Identity]:
     - Cool Porcelain / Ice Blueprint Desk (`#EAF1FB` dot-grid) + Crisp Pure White Sketchpad
     - Primary Accent: Toss/Royal Cobalt Blue (`#2563EB`) & Deep Indigo (`#312E81`)
     - Secondary Accent: Profit Emerald-Mint (`#059669` / `#10B981`) & Coral Alert (`#E11D48`)
     - ZERO warm beige/cream paper and ZERO dark-navy + yellow-gold SA-Think bars!
  2. [Unique 16:9 Layout Structure — Asymmetric Left Sidebar Rail + Spiral-Bound Dual-Card Pad]:
     - Left Vertical Sidebar Rail (`x: 34..394`): Brush `BOOZA THINK` logo + Live 4-Step Progress Tracker
       (`01 손익 구멍 진단` -> `02 매장·배달 마진` -> `03 셀러·대출·세금` -> `04 무료 시뮬레이터`) + `boozathink.com`
     - Right Spiral-Bound Sketchpad (`x: 422..1884`): Metallic spiral rings + Two distinct side-by-side
       cards (`Zone A` -> Cobalt `➔` -> `Zone B`) + Clean white/cobalt floating caption card!
  3. [Unique 9:16 Shorts Structure — TRUE Native Top-to-Bottom Vertical Pad (NO shrunk 16:9 window!)]:
     - Top spiral-bound reporter's pad + Upper Giant Panel (`Zone A`) -> `▼` -> Lower Giant Panel (`Zone B`)
       filling the smartphone screen natively!
  4. [Audio & Brand Recognition Preserved 100%]:
     - Exact `Charon` Gemini 2.5 Studio TTS (`-14.5 LUFS`) + Speech-synced pen foley + Calm Lounge BGM (15%)
     - Midpoint Cobalt-Emerald `BOOZA THINK · 부자생각` Brush Stinger (`휙-띠리링!`) + Finale 5-Note Sonic Logo!
"""
from __future__ import annotations

import base64
import io
import math
import os
import shutil
import subprocess
import sys
import time
import wave
from pathlib import Path

import cv2
import dotenv
import httpx
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STUDIO_DIR = Path(__file__).resolve().parent
REPO_ROOT = STUDIO_DIR.parent
ASSETS_DIR = STUDIO_DIR / "assets"
OUT_DIR = STUDIO_DIR / "output" / "official_channel_intro"
RAW_WAV_DIR = OUT_DIR / "_raw_wavs"
MANUAL_INTRO_BOX = (
    Path(r"C:\Users\new-s\OneDrive\Desktop\BoozaThink_유튜브_릴스_직접업로드_대기함")
    / "01_공식_채널소개_영상팩"
)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
FPS = 24

STEP_NAV_LABELS = [
    ("01", "손익 구멍 3초 진단"),
    ("02", "창업·배달·월세·인건비"),
    ("03", "셀러·정책자금·세금"),
    ("04", "누구나 무료 시뮬레이션"),
]


def _font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    candidates = (
        [r"C:\Windows\Fonts\malgunbd.ttf", r"C:\Windows\Fonts\NanumGothicBold.ttf", r"C:\Windows\Fonts\arialbd.ttf"]
        if bold
        else [r"C:\Windows\Fonts\malgun.ttf", r"C:\Windows\Fonts\NanumGothic.ttf", r"C:\Windows\Fonts\arial.ttf"]
    )
    for c in candidates:
        if Path(c).exists():
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


# ---------------------------------------------------------------------------
# 1. Isolated Lookup of Gemini API Key & Authentic `Charon` Studio TTS Chain
# ---------------------------------------------------------------------------
def _resolve_gemini_api_key() -> str:
    dotenv.load_dotenv(REPO_ROOT / ".env", override=False)
    k = (os.getenv("GEMINI_API_KEY") or "").strip()
    if k:
        return k
    for sib in (REPO_ROOT.parent / "GOREA" / ".env", REPO_ROOT.parent / "EVEMW" / ".env"):
        if sib.exists():
            vals = dotenv.dotenv_values(sib)
            if vals.get("GEMINI_API_KEY"):
                return str(vals["GEMINI_API_KEY"]).strip()
    raise RuntimeError("GEMINI_API_KEY가 필요합니다.")


def synthesize_charon_master_wav(script_ko: str, raw_name: str, out_wav: Path) -> Path:
    RAW_WAV_DIR.mkdir(parents=True, exist_ok=True)
    raw_wav = RAW_WAV_DIR / raw_name

    if not (raw_wav.exists() and raw_wav.stat().st_size > 24000):
        api_key = _resolve_gemini_api_key()
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key={api_key}"
        prompt_txt = (
            "Read the following Korean transcript aloud verbatim in a confident, warm, trustworthy, upbeat 30s Korean "
            "business & finance YouTuber host tone (articulate, friendly, and engaging, like sharing an essential "
            "insider tool with a close friend):\n"
            f'"{script_ko}"'
        )
        payload = {
            "contents": [{"parts": [{"text": prompt_txt}]}],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Charon"}}},
            },
        }
        for attempt in range(1, 6):
            try:
                with httpx.Client(trust_env=False, timeout=90.0) as client:
                    r = client.post(url, json=payload)
                    if r.status_code in (429, 500, 503) and attempt < 5:
                        wait_s = 22 * attempt
                        print(f"  [Gemini TTS Wait] {wait_s}s (attempt {attempt})...")
                        time.sleep(wait_s)
                        continue
                    r.raise_for_status()
                    b64_pcm = r.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
                with wave.open(str(raw_wav), "wb") as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(24000)
                    wf.writeframes(base64.b64decode(b64_pcm))
                break
            except Exception:
                if attempt == 5:
                    raise
                time.sleep(16.0)

    af_chain = (
        "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-42dB,"
        "areverse,silenceremove=start_periods=1:start_silence=0.08:start_threshold=-42dB,areverse,"
        "atempo=1.04,equalizer=f=3200:t=q:w=1.2:g=2.0,loudnorm=I=-14.5:TP=-1.2:LRA=9,"
        "apad=pad_dur=0.22"
    )
    subprocess.run(
        [
            FFMPEG_EXE, "-y", "-i", str(raw_wav),
            "-af", af_chain, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(out_wav),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return out_wav


def read_stereo_wav(wav_path: Path) -> np.ndarray:
    with wave.open(str(wav_path), "rb") as wf:
        arr = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
        return arr.reshape(-1, 2)


def write_stereo_wav(wav_path: Path, st: np.ndarray) -> None:
    pcm = (np.clip(st, -0.98, 0.98) * 32767.0).astype(np.int16)
    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


def find_mid_silence_split(st: np.ndarray, lo_frac: float = 0.36, hi_frac: float = 0.64) -> int:
    mono = np.abs(st[:, 0] * 0.5 + st[:, 1] * 0.5)
    win = int(0.08 * SR)
    n = len(mono)
    i0 = max(win, int(n * lo_frac))
    i1 = min(n - win, int(n * hi_frac))
    csum = np.cumsum(np.insert(mono, 0, 0.0))
    window_means = (csum[i0 + win : i1 + win] - csum[i0 - win : i1 - win]) / float(2 * win)
    return i0 + int(np.argmin(window_means))


# ---------------------------------------------------------------------------
# 2. Master Brush Calligraphy Logo Extractor (BOOZA THINK 2-Line)
# ---------------------------------------------------------------------------
def load_boozathink_brush_rgba(
    top_rgb: tuple[int, int, int],
    bot_rgb: tuple[int, int, int],
    target_w: int,
) -> Image.Image:
    src = Image.open(ASSETS_DIR / "boozathink_2line_brush.jpg").convert("L")
    arr_full = np.asarray(src, dtype=np.float32)
    ys, xs = np.nonzero(arr_full < 236.0)
    pad = 16
    cropped = src.crop(
        (max(0, int(xs.min()) - pad), max(0, int(ys.min()) - pad), min(src.width, int(xs.max()) + pad), min(src.height, int(ys.max()) + pad))
    )
    scale = target_w / float(cropped.width)
    nw, nh = target_w, max(24, int(round(cropped.height * scale)))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    arr = np.asarray(resized, dtype=np.float32)
    alpha = np.clip((244.0 - arr) * 1.48, 0.0, 255.0)

    fg_bin = (alpha > 8.0).astype(np.uint8)
    num_labels, labels, _, centroids = cv2.connectedComponentsWithStats(fg_bin, connectivity=8)
    is_top = np.zeros((nh, nw), dtype=bool)
    for lbl in range(1, num_labels):
        if float(centroids[lbl, 1]) < nh * 0.48:
            is_top[labels == lbl] = True
    slanted_y = (nh * 0.49) - (np.arange(nw, dtype=np.float32)[None, :] / float(nw)) * (nh * 0.06)
    fringe = ~fg_bin.astype(bool)
    is_top[fringe] = (np.arange(nh, dtype=np.float32)[:, None] < slanted_y)[fringe]

    rgba = np.zeros((nh, nw, 4), dtype=np.uint8)
    rgba[is_top, :3] = top_rgb
    rgba[~is_top, :3] = bot_rgb
    rgba[:, :, 3] = alpha.astype(np.uint8)
    return Image.fromarray(rgba)


# ---------------------------------------------------------------------------
# 3. Sound Studio: Pen Foley + Calm Lounge BGM + Midpoint & Finale Sonic Logos
# ---------------------------------------------------------------------------
def fft_bandpass(sig: np.ndarray, lo_hz: float, hi_hz: float, peak_hz: float | None = None, peak_gain: float = 0.0) -> np.ndarray:
    n = len(sig)
    spec = np.fft.rfft(sig)
    freqs = np.fft.rfftfreq(n, d=1.0 / SR)
    mask = ((freqs >= lo_hz) & (freqs <= hi_hz)).astype(np.float32)
    if peak_hz is not None and peak_gain > 0:
        mask *= 1.0 + peak_gain * np.exp(-0.5 * ((freqs - peak_hz) / 480.0) ** 2)
    return np.fft.irfft(spec * mask, n=n).astype(np.float32)


def mix_into(stereo: np.ndarray, start_s: float, clip: np.ndarray, gain: float = 1.0, pan: float = 0.5) -> None:
    s0 = max(0, int(round(start_s * SR)))
    if s0 >= stereo.shape[0]:
        return
    if clip.ndim == 1:
        n = min(len(clip), stereo.shape[0] - s0)
        seg = clip[:n] * gain
        stereo[s0 : s0 + n, 0] += seg * math.sqrt(max(0.0, 1.0 - pan))
        stereo[s0 : s0 + n, 1] += seg * math.sqrt(max(0.0, pan))
    else:
        n = min(clip.shape[0], stereo.shape[0] - s0)
        stereo[s0 : s0 + n] += clip[:n] * gain


def sfx_fast_pen_flurry(dur_sec: float, seed: int = 11) -> np.ndarray:
    rng = np.random.default_rng(seed)
    total_n = max(128, int(round(dur_sec * SR)))
    st = np.zeros((total_n, 2), dtype=np.float32)
    t_cur = 0.02
    idx = 0
    while t_cur < dur_sec - 0.06:
        sd = float(rng.uniform(0.055, 0.115) if (idx % 4 != 3) else rng.uniform(0.14, 0.22))
        if t_cur + sd > dur_sec:
            sd = dur_sec - t_cur
        if sd < 0.03:
            break
        n = int(round(sd * SR))
        u = np.linspace(0.0, 1.0, n, dtype=np.float32)
        env = (np.maximum(0.0, np.sin(np.pi * u)) ** 0.48) * np.exp(-u * 0.35)
        raw = rng.normal(0.0, 0.72, size=n).astype(np.float32)
        f_pk = 4200.0 if (idx % 2 == 0) else 3050.0
        w = fft_bandpass(raw, 1350.0, 8000.0, peak_hz=f_pk, peak_gain=0.75)
        w = (w / (float(np.max(np.abs(w))) + 1e-6)) * env * float(rng.uniform(0.085, 0.125))
        pan = float(np.clip(0.28 + 0.44 * ((idx % 5) / 4.0), 0.20, 0.80))
        mix_into(st, t_cur, w, gain=1.0, pan=pan)
        t_cur += sd + float(rng.uniform(0.014, 0.032) if (idx % 5 != 4) else rng.uniform(0.07, 0.13))
        idx += 1
    return st


def sfx_mid_brand_flash(dur_sec: float = 1.25) -> np.ndarray:
    n_tot = int(round(dur_sec * SR))
    st = np.zeros((n_tot, 2), dtype=np.float32)
    rng = np.random.default_rng(77)

    wn = int(0.15 * SR)
    uw = np.linspace(0.0, 1.0, wn, dtype=np.float32)
    whoosh = fft_bandpass(rng.normal(0.0, 1.0, size=wn).astype(np.float32), 700.0, 5200.0)
    whoosh = (whoosh / (float(np.max(np.abs(whoosh))) + 1e-6)) * (uw ** 1.6) * 0.15
    mix_into(st, 0.02, whoosh, pan=0.48)

    tn = int(0.45 * SR)
    tt = np.arange(tn, dtype=np.float32) / SR
    thump = np.sin(2.0 * np.pi * (58.0 + 75.0 * np.exp(-tt * 34.0)) * tt) * np.exp(-tt * 12.0) * 0.26
    mix_into(st, 0.15, thump.astype(np.float32), pan=0.5)

    hn = int(0.26 * SR)
    uh = np.linspace(0.0, 1.0, hn, dtype=np.float32)
    hl = fft_bandpass(rng.normal(0.0, 1.0, size=hn).astype(np.float32), 1500.0, 6500.0, peak_hz=3200.0, peak_gain=0.9)
    hl = (hl / (float(np.max(np.abs(hl))) + 1e-6)) * (np.maximum(0.0, np.sin(np.pi * uh)) ** 0.8) * 0.14
    mix_into(st, 0.28, hl, pan=0.55)

    for st_t, hz, pn in [(0.16, 783.99, 0.36), (0.25, 987.77, 0.50), (0.35, 1174.66, 0.64)]:
        bn = min(int(0.68 * SR), n_tot - int(st_t * SR))
        if bn > 64:
            tb = np.arange(bn, dtype=np.float32) / SR
            bell = (np.sin(2.0 * np.pi * hz * tb) * 0.80 + np.sin(2.0 * np.pi * hz * 2.0 * tb) * 0.20) * np.exp(-tb * 6.2)
            bell *= np.minimum(1.0, tb / 0.004) * 0.16
            mix_into(st, st_t, bell.astype(np.float32), pan=pn)
    return st


def sfx_finale_boozathink_chime(dur_sec: float = 2.95) -> np.ndarray:
    n_tot = int(round(dur_sec * SR))
    st = np.zeros((n_tot, 2), dtype=np.float32)
    rng = np.random.default_rng(303)

    sw_n = int(0.52 * SR)
    u = np.linspace(0.0, 1.0, sw_n, dtype=np.float32)
    sw = fft_bandpass(rng.normal(0.0, 1.0, size=sw_n).astype(np.float32), 650.0, 4400.0)
    sw = (sw / (float(np.max(np.abs(sw))) + 1e-6)) * (np.maximum(0.0, np.sin(np.pi * u)) ** 1.2) * 0.11
    mix_into(st, 0.04, sw, pan=0.45)

    notes = [
        (0.12, 523.25, 0.34),
        (0.24, 587.33, 0.42),
        (0.36, 659.25, 0.50),
        (0.49, 783.99, 0.58),
        (0.64, 1046.50, 0.50),
    ]
    for st_t, hz, pn in notes:
        nn = min(int(1.75 * SR), n_tot - int(st_t * SR))
        if nn > 64:
            tt = np.arange(nn, dtype=np.float32) / SR
            ep = (
                np.sin(2.0 * np.pi * hz * tt) * 0.76
                + np.sin(2.0 * np.pi * hz * 2.0 * tt) * 0.19 * np.exp(-tt * 4.5)
                + np.sin(2.0 * np.pi * hz * 3.0 * tt) * 0.05 * np.exp(-tt * 9.0)
            )
            ep *= np.minimum(1.0, tt / 0.005) * np.exp(-tt * 2.6) * 0.17
            mix_into(st, st_t, ep.astype(np.float32), pan=pn)

    bn = min(int(1.85 * SR), n_tot - int(0.64 * SR))
    tb = np.arange(bn, dtype=np.float32) / SR
    bass = (np.sin(2.0 * np.pi * 130.81 * tb) * 0.85 + np.sin(2.0 * np.pi * 261.63 * tb) * 0.15) * np.minimum(1.0, tb / 0.01) * np.exp(-tb * 2.1) * 0.22
    mix_into(st, 0.64, bass.astype(np.float32), pan=0.5)
    return st


def synth_calm_lounge_bgm(total_dur: float) -> np.ndarray:
    n_tot = int(round((total_dur + 0.5) * SR))
    st = np.zeros((n_tot, 2), dtype=np.float32)
    beat = 60.0 / 88.0
    bar = beat * 4.0
    prog = [
        (146.83, [293.66, 369.99, 440.00, 523.25]),  # Dmaj9 / D7 bright modern lounge
        (123.47, [246.94, 293.66, 369.99, 440.00]),  # Bm7
        (164.81, [329.63, 392.00, 493.88, 587.33]),  # Em9
        (110.00, [220.00, 277.18, 329.63, 440.00]),  # A13
    ]
    t_bar = 0.0
    idx = 0
    while t_bar < total_dur:
        bass_hz, chord = prog[idx % len(prog)]
        dur = min(bar * 1.02, total_dur + 0.3 - t_bar)
        if dur <= 0.05:
            break
        n = int(round(dur * SR))
        t = np.arange(n, dtype=np.float32) / SR
        pad = np.zeros(n, dtype=np.float32)
        for hz in chord:
            pad += (np.sin(2.0 * np.pi * hz * t) * 0.82 + np.sin(2.0 * np.pi * hz * 2.0 * t) * 0.18 * np.exp(-t * 3.5)) * 0.24
        pad *= np.minimum(1.0, t / 0.03) * np.exp(-t * 1.05) * 0.48
        mix_into(st, t_bar, pad.astype(np.float32), pan=0.48)

        nb = min(int(beat * 1.8 * SR), n)
        tb = np.arange(nb, dtype=np.float32) / SR
        b_wave = np.sin(2.0 * np.pi * bass_hz * tb) * np.minimum(1.0, tb / 0.012) * np.exp(-tb * 2.4) * 0.28
        mix_into(st, t_bar, b_wave.astype(np.float32), pan=0.5)

        for sb, ni in ((1.0, 1), (2.0, 2), (3.0, 3), (3.5, 2)):
            nt0 = t_bar + sb * beat
            if nt0 + 0.35 < total_dur:
                nn = int(0.35 * SR)
                tt = np.arange(nn, dtype=np.float32) / SR
                hz_m = chord[ni] * 2.0
                mar = np.sin(2.0 * np.pi * hz_m * tt) * np.minimum(1.0, tt / 0.005) * np.exp(-tt * 7.2) * 0.12
                mix_into(st, nt0, mar.astype(np.float32), pan=0.36 if ni % 2 == 0 else 0.64)

        t_bar += bar
        idx += 1

    out = st[: int(round(total_dur * SR))]
    fo = min(len(out), int(1.4 * SR))
    out[-fo:] *= np.linspace(1.0, 0.0, fo, dtype=np.float32)[:, None]
    return out


# ---------------------------------------------------------------------------
# 4. BoozaThink Signature Cobalt-Silver Architect Pen & Zone Contour Tracer
# ---------------------------------------------------------------------------
def create_cobalt_pen_cursor_rgba() -> Image.Image:
    """Sleek Royal-Cobalt & Brushed-Silver Architect Pen (100% distinct from SA Think/KoreaThink pens!)."""
    img = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    dr.polygon([(16, 160), (48, 144), (168, 32), (144, 12), (28, 126)], fill=(30, 58, 138, 34))
    # Royal Cobalt barrel (#2563EB)
    dr.polygon([(34, 118), (144, 8), (170, 34), (60, 144)], fill=(37, 99, 235, 255), outline=(15, 23, 42, 255))
    # Mint-Emerald & Silver grip rings
    dr.line([(40, 112), (66, 138)], fill=(16, 185, 129, 255), width=7)
    dr.line([(48, 104), (74, 130)], fill=(241, 245, 249, 255), width=4)
    # Brushed platinum-silver nib tapering to (14, 160)
    dr.polygon([(14, 160), (34, 118), (60, 144)], fill=(226, 232, 240, 255), outline=(15, 23, 42, 255))
    dr.line([(14, 160), (40, 134)], fill=(37, 99, 235, 255), width=3)
    return img


def _trace_ink_box(img_rgb: Image.Image, target_w: int, target_h: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Fits `img_rgb` cleanly into `(target_w, target_h)` and computes nearest-neighbor stroke order."""
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
    blur = np.asarray(Image.fromarray(inv.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=4.2)), dtype=np.float32)
    dodge = np.minimum(255.0, (gray * 255.0) / np.maximum(8.0, 255.0 - blur))
    edge_ink = np.clip((244.0 - dodge) / 142.0, 0.0, 1.0)
    dark_ink = np.clip((188.0 - gray) / 136.0, 0.0, 1.0)
    ink = np.maximum(dark_ink, edge_ink * 0.88)
    ink[ink < 0.12] = 0.0

    step = 6
    gh, gw = max(4, target_h // step), max(4, target_w // step)
    small = (
        np.asarray(
            Image.fromarray((np.clip(ink, 0.0, 1.0) * 255.0).astype(np.uint8)).resize((gw, gh), Image.Resampling.BILINEAR),
            dtype=np.float32,
        )
        / 255.0
    )
    ys, xs = np.nonzero(small > 0.22)
    m = len(xs)
    if m < 6:
        return arr, ink, np.zeros((target_h, target_w), dtype=np.float32), np.array([target_w * 0.5], dtype=np.float32), np.array([target_h * 0.5], dtype=np.float32)

    xs_f, ys_f = xs.astype(np.float32), ys.astype(np.float32)
    visited = np.zeros(m, dtype=bool)
    order_idx = np.empty(m, dtype=np.int32)
    cur = int(np.argmin(xs_f * 1.2 + ys_f * 0.8))
    for k in range(m):
        visited[cur] = True
        order_idx[k] = cur
        if k == m - 1:
            break
        dist2 = (xs_f - xs_f[cur]) ** 2 + (ys_f - ys_f[cur]) ** 2
        dist2[visited] = 1e18
        cur = int(np.argmin(dist2))

    ord_s = np.full((gh, gw), 1.0, dtype=np.float32)
    ord_s[ys[order_idx], xs[order_idx]] = np.linspace(0.002, 0.998, m, dtype=np.float32)
    filled = ord_s.copy()
    valid = small > 0.22
    for _ in range(3):
        for oy, ox in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)]:
            sv = np.roll(np.roll(valid, oy, axis=0), ox, axis=1)
            so = np.roll(np.roll(filled, oy, axis=0), ox, axis=1)
            take = (~valid) & sv
            filled[take] = so[take]
            valid = valid | take

    ord_full = (
        np.asarray(
            Image.fromarray((np.clip(filled, 0.0, 1.0) * 255.0).astype(np.uint8)).resize((target_w, target_h), Image.Resampling.NEAREST),
            dtype=np.float32,
        )
        / 255.0
    )
    px = xs_f[order_idx] * step + step * 0.5
    py = ys_f[order_idx] * step + step * 0.5
    if m > 5:
        px = np.convolve(px, np.array([0.2, 0.6, 0.2], dtype=np.float32), mode="same")
        py = np.convolve(py, np.array([0.2, 0.6, 0.2], dtype=np.float32), mode="same")
    return arr, ink, ord_full, px, py


# ---------------------------------------------------------------------------
# 5. Distinct BoozaThink 16:9 Architect-Binder & Left-Sidebar Renderer
# ---------------------------------------------------------------------------
def build_16x9_architect_binder_static(
    step_idx: int,
    scene_kicker: str,
    scene_headline: str,
    left_card_title: str,
    right_card_title: str,
    brush_indigo_cobalt: Image.Image,
) -> Image.Image:
    """
    Unique BoozaThink 1920x1080 Asymmetric Layout:
      - Cool Ice-Blue Blueprint Dot-Grid Desk (`#E8F0FC`)
      - Left White/Cobalt Vertical Navigation Sidebar (`x: 32..386, y: 32..1048`)
      - Right Spiral-Bound Architect Pad (`x: 418..1888, y: 32..1048`) with metallic binder rings,
        4 colored index tabs on the right edge, and two distinct side-by-side cards (`Card A` & `Card B`)!
    """
    W, H = 1920, 1080
    img = Image.new("RGBA", (W, H), (231, 240, 252, 255))
    dr = ImageDraw.Draw(img, "RGBA")

    # Subtle cool blueprint dot-matrix across desk background
    for gx in range(24, W, 32):
        for gy in range(24, H, 32):
            dr.ellipse([gx - 1, gy - 1, gx + 2, gy + 2], fill=(191, 210, 236, 255))

    # Right-edge colored index tabs sticking out of the binder!
    tab_colors = [(37, 99, 235), (5, 150, 105), (79, 70, 229), (14, 165, 233)]
    for ti, tcol in enumerate(tab_colors):
        ty = 150 + ti * 135
        w_ext = 22 if ti == step_idx else 12
        dr.rounded_rectangle([1864, ty, 1864 + w_ext + 14, ty + 105], radius=12, fill=(*tcol, 255))

    # Drop shadow + Right Spiral-Bound White Architect Pad (x: 418..1872, y: 32..1048)
    dr.rounded_rectangle([428, 42, 1880, 1056], radius=32, fill=(30, 58, 138, 28))
    dr.rounded_rectangle([418, 32, 1872, 1048], radius=32, fill=(255, 255, 255, 255), outline=(191, 219, 254, 255), width=3)

    # Subtle ice-blue graph lines inside the right pad
    for px in range(470, 1850, 38):
        dr.line([(px, 56), (px, 1024)], fill=(241, 246, 253, 255), width=1)
    for py in range(60, 1024, 38):
        dr.line([(456, py), (1850, py)], fill=(241, 246, 253, 255), width=1)

    # Left White Fintech Sidebar Rail (x: 32..386, y: 32..1048)
    dr.rounded_rectangle([40, 42, 394, 1056], radius=30, fill=(30, 58, 138, 26))
    dr.rounded_rectangle([32, 32, 386, 1048], radius=30, fill=(255, 255, 255, 255), outline=(37, 99, 235, 255), width=3)

    # 8 Metallic Spiral Binder Rings bridging Left Sidebar & Right Architect Pad!
    for ri in range(8):
        ry = 112 + ri * 122
        dr.ellipse([370, ry - 9, 388, ry + 9], fill=(203, 213, 225, 255), outline=(100, 116, 139, 255), width=2)
        dr.ellipse([424, ry - 9, 442, ry + 9], fill=(203, 213, 225, 255), outline=(100, 116, 139, 255), width=2)
        dr.rounded_rectangle([376, ry - 5, 436, ry + 5], radius=5, fill=(148, 163, 184, 255), outline=(71, 85, 105, 255), width=1)

    # Sidebar Top: BOOZA THINK 2-Line Brush Logo (Indigo + Cobalt)
    logo_sb = brush_indigo_cobalt.resize((256, int(round(256 * brush_indigo_cobalt.height / brush_indigo_cobalt.width))), Image.Resampling.LANCZOS)
    img.alpha_composite(logo_sb, (32 + (354 - 256) // 2, 68))

    dr.rounded_rectangle([64, 248, 354, 294], radius=23, fill=(239, 246, 255, 255), outline=(147, 197, 253, 255), width=2)
    sub_b = "부자생각 · 창업·손익 연구소"
    f_sb = _font(20, True)
    dr.text((209 - dr.textlength(sub_b, font=f_sb) / 2, 258), sub_b, font=f_sb, fill=(29, 78, 216, 255))

    # Sidebar Middle: 4-Step Live Progress Stepper
    for si, (s_num, s_txt) in enumerate(STEP_NAV_LABELS):
        sy = 338 + si * 124
        is_cur = si == step_idx
        bg_c = (37, 99, 235, 255) if is_cur else (248, 250, 252, 255)
        bd_c = (29, 78, 216, 255) if is_cur else (226, 232, 240, 255)
        fg_main = (255, 255, 255, 255) if is_cur else (71, 85, 105, 255)
        num_bg = (255, 255, 255, 255) if is_cur else (226, 232, 240, 255)
        num_fg = (37, 99, 235, 255) if is_cur else (100, 116, 139, 255)

        dr.rounded_rectangle([54, sy, 364, sy + 100], radius=22, fill=bg_c, outline=bd_c, width=3 if is_cur else 2)
        dr.ellipse([70, sy + 24, 122, sy + 76], fill=num_bg)
        f_n = _font(22, True)
        dr.text((96 - dr.textlength(s_num, font=f_n) / 2, sy + 35), s_num, font=f_n, fill=num_fg)
        dr.text((138, sy + 34), s_txt, font=_font(22, True), fill=fg_main)

    # Sidebar Bottom: Domain + Free Open Access Pill
    dr.rounded_rectangle([54, 862, 364, 1018], radius=24, fill=(240, 253, 244, 255), outline=(16, 185, 129, 255), width=3)
    f_f1 = _font(19, True)
    t_f1 = "올해 12.31까지 무료 개방"
    dr.text((209 - dr.textlength(t_f1, font=f_f1) / 2, 886), t_f1, font=f_f1, fill=(5, 150, 105, 255))
    dr.rounded_rectangle([74, 928, 344, 994], radius=33, fill=(37, 99, 235, 255))
    f_u = _font(25, True)
    t_u = "boozathink.com"
    dr.text((209 - dr.textlength(t_u, font=f_u) / 2, 944), t_u, font=f_u, fill=(255, 255, 255, 255))

    # Right Architect Pad Header: Cobalt Accent Tag + Crisp Headline
    dr.rounded_rectangle([468, 58, 468 + 38 + int(dr.textlength(scene_kicker, font=_font(21, True))), 104], radius=23, fill=(239, 246, 255, 255), outline=(59, 130, 246, 255), width=2)
    dr.text((488, 68), scene_kicker, font=_font(21, True), fill=(37, 99, 235, 255))
    dr.text((468, 118), scene_headline, font=_font(40, True), fill=(15, 23, 42, 255))

    # Two Distinct Side-by-Side Drawing Cards inside the Pad!
    # Card A (Left: x=468..1128, y=194..848) & Card B (Right: x=1176..1836, y=194..848)
    dr.rounded_rectangle([468, 194, 1128, 848], radius=26, fill=(255, 255, 255, 255), outline=(147, 197, 253, 255), width=3)
    dr.rounded_rectangle([468, 194, 1128, 256], radius=24, fill=(239, 246, 255, 255))
    dr.rectangle([468, 234, 1128, 256], fill=(239, 246, 255, 255))
    dr.line([(468, 256), (1128, 256)], fill=(147, 197, 253, 255), width=2)
    dr.ellipse([492, 213, 516, 237], fill=(37, 99, 235, 255))
    dr.text((530, 209), left_card_title, font=_font(23, True), fill=(30, 58, 138, 255))

    dr.rounded_rectangle([1176, 194, 1836, 848], radius=26, fill=(255, 255, 255, 255), outline=(110, 231, 183, 255), width=3)
    dr.rounded_rectangle([1176, 194, 1836, 256], radius=24, fill=(236, 253, 245, 255))
    dr.rectangle([1176, 234, 1836, 256], fill=(236, 253, 245, 255))
    dr.line([(1176, 256), (1836, 256)], fill=(110, 231, 183, 255), width=2)
    dr.ellipse([1200, 213, 1224, 237], fill=(5, 150, 105, 255))
    dr.text((1238, 209), right_card_title, font=_font(23, True), fill=(6, 95, 70, 255))

    # Center Cobalt Arrow Connector between Card A & Card B
    dr.ellipse([1124, 492, 1180, 548], fill=(37, 99, 235, 255), outline=(255, 255, 255, 255), width=4)
    dr.polygon([(1143, 508), (1165, 520), (1143, 532)], fill=(255, 255, 255, 255))

    return img.convert("RGB")


# ---------------------------------------------------------------------------
# 6. Distinct BoozaThink TRUE NATIVE 9:16 Top-Bound Vertical Reporter's Pad
# ---------------------------------------------------------------------------
def build_9x16_vertical_pad_static(
    step_idx: int,
    scene_kicker: str,
    scene_headline: str,
    top_card_title: str,
    bot_card_title: str,
    brush_indigo_cobalt: Image.Image,
) -> Image.Image:
    """
    100% Native 1080x1920 Vertical Layout (ZERO shrunk 16:9 window!):
      - Top spiral-bound reporter's sketchpad (`#EAF2FC` outer, `#FFFFFF` inner pad)
      - Upper Giant Drawing Card (`Zone A`: y=340..888)
      - Lower Giant Drawing Card (`Zone B`: y=928..1476)
      - Clean White/Cobalt Subtitle & Emerald Free-Access Footer (`y=1504..1780`)
    """
    W, H = 1080, 1920
    img = Image.new("RGBA", (W, H), (231, 240, 252, 255))
    dr = ImageDraw.Draw(img, "RGBA")

    # Main vertical pad
    dr.rounded_rectangle([32, 76, W - 32, H - 96], radius=38, fill=(255, 255, 255, 255), outline=(147, 197, 253, 255), width=4)

    # Top metallic spiral binding loops along y=76
    for rx in range(110, W - 90, 96):
        dr.rounded_rectangle([rx - 10, 52, rx + 10, 98], radius=9, fill=(148, 163, 184, 255), outline=(71, 85, 105, 255), width=2)
        dr.ellipse([rx - 12, 88, rx + 12, 112], fill=(226, 232, 240, 255), outline=(100, 116, 139, 255), width=2)

    # Compact Header Row (Logo on left, Step Indicator + Headline on right)
    logo_v = brush_indigo_cobalt.resize((200, int(round(200 * brush_indigo_cobalt.height / brush_indigo_cobalt.width))), Image.Resampling.LANCZOS)
    img.alpha_composite(logo_v, (68, 132))

    # 4 Step pills at top-right
    for si in range(4):
        sx = 310 + si * 72
        is_c = si == step_idx
        dr.rounded_rectangle([sx, 134, sx + 58, 174], radius=20, fill=(37, 99, 235, 255) if is_c else (241, 245, 249, 255))
        t_st = f"0{si+1}"
        f_st = _font(21, True)
        dr.text((sx + 29 - dr.textlength(t_st, font=f_st) / 2, 141), t_st, font=f_st, fill=(255, 255, 255, 255) if is_c else (100, 116, 139, 255))

    dr.rounded_rectangle([618, 134, 1012, 174], radius=20, fill=(236, 253, 245, 255), outline=(16, 185, 129, 255), width=2)
    f_fr = _font(20, True)
    t_fr = "올해 12.31까지 무료 개방"
    dr.text((815 - dr.textlength(t_fr, font=f_fr) / 2, 142), t_fr, font=f_fr, fill=(5, 150, 105, 255))

    def _fit_font(txt: str, max_px: int, start_px: int, min_px: int = 19) -> ImageFont.FreeTypeFont:
        for sz in range(start_px, min_px - 1, -1):
            cand = _font(sz, True)
            if dr.textlength(txt, font=cand) <= max_px:
                return cand
        return _font(min_px, True)

    f_kick9 = _fit_font(scene_kicker, 692, 22, 18)
    f_head9 = _fit_font(scene_headline, 692, 31, 21)
    dr.text((310, 192), scene_kicker, font=f_kick9, fill=(37, 99, 235, 255))
    dr.text((310, 228), scene_headline, font=f_head9, fill=(15, 23, 42, 255))

    # Upper Giant Card (Zone A: x=68..1012, y=312..872)
    dr.rounded_rectangle([68, 312, 1012, 872], radius=28, fill=(255, 255, 255, 255), outline=(147, 197, 253, 255), width=3)
    dr.rounded_rectangle([68, 312, 1012, 374], radius=26, fill=(239, 246, 255, 255))
    dr.rectangle([68, 350, 1012, 374], fill=(239, 246, 255, 255))
    dr.line([(68, 374), (1012, 374)], fill=(147, 197, 253, 255), width=2)
    dr.ellipse([96, 331, 120, 355], fill=(37, 99, 235, 255))
    dr.text((136, 326), top_card_title, font=_font(25, True), fill=(30, 58, 138, 255))

    # Lower Giant Card (Zone B: x=68..1012, y=912..1472)
    dr.rounded_rectangle([68, 912, 1012, 1472], radius=28, fill=(255, 255, 255, 255), outline=(110, 231, 183, 255), width=3)
    dr.rounded_rectangle([68, 912, 1012, 974], radius=26, fill=(236, 253, 245, 255))
    dr.rectangle([68, 950, 1012, 974], fill=(236, 253, 245, 255))
    dr.line([(68, 974), (1012, 974)], fill=(110, 231, 183, 255), width=2)
    dr.ellipse([96, 931, 120, 955], fill=(5, 150, 105, 255))
    dr.text((136, 926), bot_card_title, font=_font(25, True), fill=(6, 95, 70, 255))

    # Downward Cobalt Connector Circle between Upper & Lower Cards
    dr.ellipse([512, 864, 568, 920], fill=(37, 99, 235, 255), outline=(255, 255, 255, 255), width=4)
    dr.polygon([(528, 885), (552, 885), (540, 904)], fill=(255, 255, 255, 255))

    # Bottom Domain Bar inside Pad (y=1702..1782)
    dr.rounded_rectangle([68, 1700, 1012, 1784], radius=42, fill=(37, 99, 235, 255))
    t_b = "무료 3초 실전 시뮬레이터 ▶ boozathink.com"
    f_b = _font(32, True)
    dr.text((540 - dr.textlength(t_b, font=f_b) / 2, 1722), t_b, font=f_b, fill=(255, 255, 255, 255))

    return img.convert("RGB")


def render_dual_format_scene(
    step_idx: int,
    asset_path: Path,
    pen_sprite: Image.Image,
    brush_indigo_cobalt: Image.Image,
    scene_kicker: str,
    scene_headline: str,
    card_a_title: str,
    card_b_title: str,
    cap_first: str,
    cap_second: str,
    cap_9_first: tuple[str, str],
    cap_9_second: tuple[str, str],
    duration_sec: float,
    highlight_brand_at: float | None = None,
    only_9x16: bool = False,
) -> tuple[list[Image.Image], list[Image.Image], list[tuple[float, float]]]:
    """
    Simultaneously renders BOTH:
      1) Distinct 16:9 Asymmetric Sidebar + Dual-Card Binder frames (`1920x1080`)
      2) Distinct Native 9:16 Top-to-Bottom Dual-Card Vertical Pad frames (`1080x1920`)
    """
    n_frames = max(12, int(round(duration_sec * FPS)))
    src_full = Image.open(asset_path).convert("RGB")
    mid_src = src_full.width // 2
    src_left = src_full.crop((0, 0, mid_src, src_full.height))
    src_right = src_full.crop((mid_src, 0, src_full.width, src_full.height))

    # 16:9 Card A & Card B inner drawing regions (628 x 568 each)
    w16, h16 = 628, 568
    if not only_9x16:
        col16_a, ink16_a, ord16_a, px16_a, py16_a = _trace_ink_box(src_left, w16, h16)
        col16_b, ink16_b, ord16_b, px16_b, py16_b = _trace_ink_box(src_right, w16, h16)
        diag16 = np.linspace(0.0, 1.0, w16, dtype=np.float32)[None, :] * 0.65 + np.linspace(0.0, 1.0, h16, dtype=np.float32)[:, None] * 0.35
        base16_arr = np.asarray(
            build_16x9_architect_binder_static(step_idx, scene_kicker, scene_headline, card_a_title, card_b_title, brush_indigo_cobalt),
            dtype=np.float32,
        )
    else:
        col16_a = ink16_a = ord16_a = px16_a = py16_a = None
        col16_b = ink16_b = ord16_b = px16_b = py16_b = diag16 = base16_arr = None

    # 9:16 Upper Card & Lower Card inner drawing regions (904 x 476 each)
    w9, h9 = 904, 476
    col9_a, ink9_a, ord9_a, px9_a, py9_a = _trace_ink_box(src_left, w9, h9)
    col9_b, ink9_b, ord9_b, px9_b, py9_b = _trace_ink_box(src_right, w9, h9)
    diag9 = np.linspace(0.0, 1.0, w9, dtype=np.float32)[None, :] * 0.65 + np.linspace(0.0, 1.0, h9, dtype=np.float32)[:, None] * 0.35

    base9_arr = np.asarray(
        build_9x16_vertical_pad_static(step_idx, scene_kicker, scene_headline, card_a_title, card_b_title, brush_indigo_cobalt),
        dtype=np.float32,
    )

    ink_rgb = np.array([24.0, 38.0, 74.0], dtype=np.float32)[None, None, :]

    t_l0, t_l1 = 0.10, duration_sec * 0.38
    t_lc0, t_lc1 = duration_sec * 0.28, duration_sec * 0.46
    t_r0, t_r1 = duration_sec * 0.48, duration_sec * 0.82
    t_rc0, t_rc1 = duration_sec * 0.72, duration_sec * 0.92
    foley_cues = [(t_l0, max(0.4, t_l1 - t_l0)), (t_r0, max(0.4, t_r1 - t_r0))]

    frames_16: list[Image.Image] = []
    frames_9: list[Image.Image] = []
    f_cap16 = _font(31, True)
    f_cap9 = _font(32, True)

    def _apply_draw(patch: np.ndarray, ink_m: np.ndarray, col_m: np.ndarray, ord_m: np.ndarray, diag_m: np.ndarray, p_d: float, p_c: float) -> np.ndarray:
        rev = np.clip((p_d - ord_m) / 0.038, 0.0, 1.0)
        ia = (0.88 * ink_m * rev)[:, :, None]
        layer = patch * (1.0 - ia) + ink_rgb * ia
        if p_c > 0.003:
            wm = np.clip((p_c * 1.25 - diag_m) / 0.22, 0.0, 1.0)[:, :, None]
            colored = patch * (col_m / 255.0)
            layer = layer * (1.0 - wm) + np.minimum(colored, layer + 20.0) * wm
        return layer

    for fn in range(n_frames):
        t = fn / float(FPS)
        c16 = base16_arr.copy() if not only_9x16 else None
        c9 = base9_arr.copy()
        pen16 = None
        pen9 = None

        if t >= t_l0:
            pl = float(np.clip((t - t_l0) / max(0.15, t_l1 - t_l0), 0.0, 1.0))
            pcl = float(np.clip((t - t_lc0) / max(0.15, t_lc1 - t_lc0), 0.0, 1.0))
            if not only_9x16:
                c16[266 : 266 + h16, 484 : 484 + w16] = _apply_draw(c16[266 : 266 + h16, 484 : 484 + w16], ink16_a, col16_a, ord16_a, diag16, pl, pcl)
            c9[384 : 384 + h9, 88 : 88 + w9] = _apply_draw(c9[384 : 384 + h9, 88 : 88 + w9], ink9_a, col9_a, ord9_a, diag9, pl, pcl)
            if pl < 0.992:
                if not only_9x16:
                    i16 = min(len(px16_a) - 1, int(pl * (len(px16_a) - 1)))
                    pen16 = (484 + int(px16_a[i16]), 266 + int(py16_a[i16]))
                i9 = min(len(px9_a) - 1, int(pl * (len(px9_a) - 1)))
                pen9 = (88 + int(px9_a[i9]), 384 + int(py9_a[i9]))

        if t >= t_r0:
            pr = float(np.clip((t - t_r0) / max(0.15, t_r1 - t_r0), 0.0, 1.0))
            pcr = float(np.clip((t - t_rc0) / max(0.15, t_rc1 - t_rc0), 0.0, 1.0))
            if not only_9x16:
                c16[266 : 266 + h16, 1192 : 1192 + w16] = _apply_draw(c16[266 : 266 + h16, 1192 : 1192 + w16], ink16_b, col16_b, ord16_b, diag16, pr, pcr)
            c9[984 : 984 + h9, 88 : 88 + w9] = _apply_draw(c9[984 : 984 + h9, 88 : 88 + w9], ink9_b, col9_b, ord9_b, diag9, pr, pcr)
            if pr < 0.992:
                if not only_9x16:
                    i16 = min(len(px16_b) - 1, int(pr * (len(px16_b) - 1)))
                    pen16 = (1192 + int(px16_b[i16]), 266 + int(py16_b[i16]))
                i9 = min(len(px9_b) - 1, int(pr * (len(px9_b) - 1)))
                pen9 = (88 + int(px9_b[i9]), 984 + int(py9_b[i9]))

        if not only_9x16:
            im16 = Image.fromarray(np.clip(c16, 0, 255).astype(np.uint8)).convert("RGBA")
            dr16 = ImageDraw.Draw(im16, "RGBA")

            # Clean White & Royal-Cobalt Subtitle Card inside 16:9 Pad (ZERO dark-navy/gold bar!)
            cur_c16 = cap_first if t < (duration_sec * 0.48) else cap_second
            dr16.rounded_rectangle([468, 876, 1836, 1018], radius=24, fill=(248, 250, 252, 255), outline=(37, 99, 235, 255), width=3)
            dr16.rounded_rectangle([468, 876, 488, 1018], radius=10, fill=(37, 99, 235, 255))
            tw16 = dr16.textlength(cur_c16, font=f_cap16)
            dr16.text((1156 - tw16 / 2, 926), cur_c16, font=f_cap16, fill=(15, 23, 42, 255))

            if highlight_brand_at is not None and abs(t - highlight_brand_at) < 0.65:
                ga = int(220 * (1.0 - abs(t - highlight_brand_at) / 0.65))
                dr16.rounded_rectangle([48, 52, 370, 304], radius=26, outline=(37, 99, 235, ga), width=6)

            if pen16 is not None:
                im16.paste(pen_sprite, (pen16[0] - 14, pen16[1] - 160), pen_sprite)
            frames_16.append(im16.convert("RGB"))

        # 9:16 Clean Subtitle Card (y=1500..1674)
        im9 = Image.fromarray(np.clip(c9, 0, 255).astype(np.uint8)).convert("RGBA")
        dr9 = ImageDraw.Draw(im9, "RGBA")
        l1_9, l2_9 = cap_9_first if t < (duration_sec * 0.48) else cap_9_second
        dr9.rounded_rectangle([68, 1500, 1012, 1676], radius=24, fill=(239, 246, 255, 255), outline=(37, 99, 235, 255), width=3)
        dr9.text((540 - dr9.textlength(l1_9, font=f_cap9) / 2, 1534), l1_9, font=f_cap9, fill=(30, 41, 59, 255))
        dr9.text((540 - dr9.textlength(l2_9, font=f_cap9) / 2, 1594), l2_9, font=f_cap9, fill=(29, 78, 216, 255))

        if pen9 is not None:
            im9.paste(pen_sprite, (pen9[0] - 14, pen9[1] - 160), pen_sprite)
        frames_9.append(im9.convert("RGB"))

    return frames_16, frames_9, foley_cues


# ---------------------------------------------------------------------------
# 7. Distinct Cobalt-Indigo-Emerald Brand Stingers & Diagonal Split Thumbnail
# ---------------------------------------------------------------------------
def render_midpoint_stinger_frame(w: int, h: int, progress: float, brush_white_mint: Image.Image) -> Image.Image:
    """
    1.25s Midpoint Stinger — Royal Cobalt Blueprint Grid (`#1E3A8A` / `#2563EB`) + White/Mint Brush Logo
    (0% SA-Think black+yellow-gold!).
    """
    p = max(0.0, min(1.0, progress))
    ease = 1.0 - (1.0 - min(1.0, p / 0.36)) ** 3
    canvas = Image.new("RGBA", (w, h), (23, 47, 115, 255))
    dr = ImageDraw.Draw(canvas, "RGBA")
    for gx in range(0, w, 48):
        dr.line([(gx, 0), (gx, h)], fill=(59, 130, 246, 48), width=1)
    for gy in range(0, h, 48):
        dr.line([(0, gy), (w, gy)], fill=(59, 130, 246, 48), width=1)

    cx, cy = w // 2, h // 2
    rx = int((480 if w > h else 460) * (0.92 + 0.08 * ease))
    ry = int((400 if w > h else 430) * (0.92 + 0.08 * ease))
    dr.rounded_rectangle([cx - rx, cy - ry, cx + rx, cy + ry], radius=56, fill=(30, 64, 175, 255), outline=(110, 231, 183, 255), width=6)

    target_lw = int((590 if w > h else 620) * (0.86 + 0.14 * ease))
    target_lh = max(32, int(round(target_lw * brush_white_mint.height / float(brush_white_mint.width))))
    logo_sc = brush_white_mint.resize((target_lw, target_lh), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo_sc, (cx - target_lw // 2, cy - target_lh // 2 - 58))

    if p > 0.22:
        hp = min(1.0, (p - 0.22) / 0.30)
        full_bw = 720 if w > h else 780
        cur_bw = max(24, int(full_bw * hp))
        by0 = cy + target_lh // 2 - 18
        dr.rounded_rectangle([cx - full_bw // 2, by0, cx - full_bw // 2 + cur_bw, by0 + 74], radius=37, fill=(16, 185, 129, 255), outline=(255, 255, 255, 255), width=4)
        if hp > 0.55:
            txt = "부자생각  ·  창업·자영업·셀러 손익 연구소"
            f_b = _font(32 if w > h else 33, True)
            dr.text((cx - dr.textlength(txt, font=f_b) / 2, by0 + 17), txt, font=f_b, fill=(255, 255, 255, 255))

    return canvas.convert("RGB")


def render_finale_stinger_frame(w: int, h: int, progress: float, brush_indigo_cobalt: Image.Image) -> Image.Image:
    """
    2.95s Finale Stinger — Cool Ice-Blue Spiral Architect Pad + Indigo/Cobalt Brush Wipe + Cobalt/Emerald CTA.
    """
    p = max(0.0, min(1.0, progress))
    canvas = Image.new("RGBA", (w, h), (232, 241, 253, 255))
    dr = ImageDraw.Draw(canvas, "RGBA")
    dr.rounded_rectangle([42, 42, w - 42, h - 42], radius=38, fill=(255, 255, 255, 255), outline=(37, 99, 235, 255), width=5)

    # Top binder rings
    for rx in range(140, w - 120, 120):
        dr.rounded_rectangle([rx - 9, 22, rx + 9, 64], radius=8, fill=(148, 163, 184, 255), outline=(71, 85, 105, 255), width=2)

    cx, cy = w // 2, h // 2
    target_lw = 650 if w > h else 720
    target_lh = int(round(target_lw * brush_indigo_cobalt.height / float(brush_indigo_cobalt.width)))
    logo_full = brush_indigo_cobalt.resize((target_lw, target_lh), Image.Resampling.LANCZOS)

    rev_w = max(2, int(target_lw * min(1.0, p / 0.44)))
    ly0 = cy - target_lh // 2 - (105 if w > h else 135)
    canvas.alpha_composite(logo_full.crop((0, 0, rev_w, target_lh)), (cx - target_lw // 2, ly0))

    if p > 0.28:
        sp = min(1.0, (p - 0.28) / 0.28)
        bw_bar = int((680 if w > h else 820) * sp)
        bx0 = cx - (340 if w > h else 410)
        by0 = ly0 + target_lh + 28
        dr.rounded_rectangle([bx0, by0, bx0 + bw_bar, by0 + 82], radius=41, fill=(37, 99, 235, 255), outline=(147, 197, 253, 255), width=4)
        if sp > 0.55:
            t1 = "부자생각  ·  boozathink.com"
            f1 = _font(38, True)
            dr.text((cx - dr.textlength(t1, font=f1) / 2, by0 + 17), t1, font=f1, fill=(255, 255, 255, 255))

        if p > 0.46:
            sp2 = min(1.0, (p - 0.46) / 0.25)
            t2 = "창업 전 예상수익부터 운영 중 새는 돈 점검까지 · 올해 12.31까지 무료 개방"
            f2 = _font(28 if w > h else 27, True)
            dr.text((cx - dr.textlength(t2, font=f2) / 2, by0 + 106), t2, font=f2, fill=(5, 150, 105, int(255 * sp2)))

    return canvas.convert("RGB")


def render_intro_thumbnail_1280x720(brush_white_mint: Image.Image, out_jpg: Path) -> Path:
    """Cobalt-Blue & Crisp White Diagonal Binder Thumbnail (0% overlap with SA Think's cream/yellow thumbnail!)."""
    buf_logo = io.BytesIO()
    brush_white_mint.save(buf_logo, format="PNG")
    logo_b64 = base64.b64encode(buf_logo.getvalue()).decode("ascii")
    art_b64 = base64.b64encode((ASSETS_DIR / "intro_s01_leak_to_clarity.jpg").read_bytes()).decode("ascii")

    html = f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      width: 1280px; height: 720px; overflow: hidden; position: relative;
      background: linear-gradient(112deg, #1e3a8a 0%, #2563eb 54%, #eaf2fc 54.2%, #eaf2fc 100%);
      font-family: 'Pretendard', 'Malgun Gothic', sans-serif;
      padding: 44px 50px; display: flex; align-items: center; justify-content: space-between;
    }}
    .left {{ width: 635px; display: flex; flex-direction: column; align-items: flex-start; gap: 18px; z-index: 2; }}
    .brand-row {{ display: flex; align-items: center; gap: 16px; }}
    .brand-row img {{ height: 84px; width: auto; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.35)); }}
    .b-pill {{ background: #10b981; color: #ffffff; font-size: 23px; font-weight: 900; padding: 8px 20px; border-radius: 999px; }}
    .main-h {{
      font-size: 54px; font-weight: 900; color: #ffffff; line-height: 1.18; letter-spacing: -0.03em;
      text-shadow: 0 6px 18px rgba(15, 23, 42, 0.35);
    }}
    .main-h span {{ color: #6ee7b7; display: block; margin-top: 4px; }}
    .sim-strip {{
      background: rgba(255, 255, 255, 0.96); color: #1e3a8a; border-radius: 20px;
      padding: 14px 22px; font-size: 24px; font-weight: 900; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
    }}
    .cta {{
      background: #0f172a; color: #ffffff; border: 3px solid #6ee7b7; border-radius: 999px;
      padding: 12px 28px; font-size: 25px; font-weight: 900;
    }}
    .right-pad {{
      width: 500px; height: 616px; background: #ffffff; border: 4px solid #3b82f6;
      border-radius: 30px; box-shadow: 0 20px 44px rgba(30, 58, 138, 0.22);
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      padding: 24px 20px; position: relative;
    }}
    .r-top {{ background: #eff6ff; color: #1d4ed8; border: 2px solid #93c5fd; border-radius: 999px; padding: 8px 22px; font-size: 22px; font-weight: 900; }}
    .right-pad img {{ width: 456px; height: 400px; object-fit: contain; }}
    .r-bot {{ background: #ecfdf5; color: #047857; border: 2px solid #6ee7b7; border-radius: 16px; padding: 10px 22px; font-size: 24px; font-weight: 900; }}
    </style></head><body>
      <div class="left">
        <div class="brand-row">
          <img src="data:image/png;base64,{logo_b64}" />
          <span class="b-pill">공식 채널 소개</span>
        </div>
        <div class="main-h">창업 전 예상수익부터<span>새는 돈 구멍까지 3초 판독!</span></div>
        <div class="sim-strip">창업비용 · 배달마진 · 셀러ROAS · 정책자금 · 세금</div>
        <div class="cta">올해 12.31 무료 개방 ▶ boozathink.com</div>
      </div>
      <div class="right-pad">
        <div class="r-top">누구나 숫자만 넣어 바로 확인</div>
        <img src="data:image/jpeg;base64,{art_b64}" />
        <div class="r-bot">부자생각 창업·손익 연구소</div>
      </div>
    </body></html>"""

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        pg = b.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
        pg.set_content(html, wait_until="networkidle")
        pg.screenshot(path=str(out_jpg), type="jpeg", quality=95)
        b.close()
    return out_jpg


# ---------------------------------------------------------------------------
# 8. Master Build Pipeline
# ---------------------------------------------------------------------------
def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    MANUAL_INTRO_BOX.mkdir(parents=True, exist_ok=True)

    script_part1 = (
        "창업을 앞두고 실제로 한 달에 얼마가 남을지 미리 계산해 보고 싶으신가요? "
        "아니면 지금 열심히 사업은 하고 있는데, 도대체 어디서 돈이 새는지 손익 구조의 구멍을 확실히 찾아내고 싶으신가요? "
        "실전 창업·손익 연구소, 부자생각이 삼 초 만에 속 시원히 보여드립니다!\n\n"
        "첫째, 서른 개 업종별 초기 창업비용과 비수기 버티는 힘을 계산해 주는 창업 마스터 시뮬레이터부터, "
        "배달앱 수수료와 포장 마진, 상가 월세 손익분기점, 주휴수당과 무인기계 전환 효과까지! "
        "내 매장에서 돈 새는 구멍을 항목별로 정확히 짚어냅니다."
    )
    script_part2 = (
        "둘째, 스마트스토어와 쿠팡 셀러의 광고 효율과 반품 손실 판독기는 물론, "
        "내 기존 대출과 신용 조건에 맞는 저금리 정책자금과 대환 진단, "
        "부가세와 종합소득세 계산기까지 한곳에서 바로 돌려볼 수 있습니다.\n\n"
        "창업하기 전에 예상 수익을 미리 계산해 보고 싶은 분도, "
        "사업하시면서 손익 구조를 확실히 점검하고 싶은 사장님도, "
        "누구나 한 번 찾아와서 가볍게 숫자만 넣어보세요. "
        "올해 십이월 삼십일일까지만 모든 시뮬레이터를 무료로 열어두었으니, "
        "지금 검색창에 부자생각을 검색해 보세요!"
    )

    print("[1/5] Loading Charon Studio Master Voice (-14.5 LUFS)...")
    wav_p1 = synthesize_charon_master_wav(script_part1, "intro_part1_charon_raw.wav", OUT_DIR / "_part1_master.wav")
    wav_p2 = synthesize_charon_master_wav(script_part2, "intro_part2_charon_raw.wav", OUT_DIR / "_part2_master.wav")

    st_p1 = read_stereo_wav(wav_p1)
    st_p2 = read_stereo_wav(wav_p2)
    split_12 = find_mid_silence_split(st_p1, lo_frac=0.38, hi_frac=0.60)
    split_34 = find_mid_silence_split(st_p2, lo_frac=0.35, hi_frac=0.58)

    vo_s1, vo_s2 = st_p1[:split_12], st_p1[split_12:]
    vo_s3, vo_s4 = st_p2[:split_34], st_p2[split_34:]

    d_s1, d_s2 = len(vo_s1) / float(SR), len(vo_s2) / float(SR)
    d_mid = 1.25
    d_s3, d_s4 = len(vo_s3) / float(SR), len(vo_s4) / float(SR)
    d_fin = 2.95

    brush_indigo_cobalt = load_boozathink_brush_rgba((23, 37, 84), (37, 99, 235), target_w=680)
    brush_white_mint = load_boozathink_brush_rgba((255, 255, 255), (110, 231, 183), target_w=680)
    pen_sprite = create_cobalt_pen_cursor_rgba()

    only_9x16 = "--shorts-only" in sys.argv
    print("[2/5] Rendering Distinct Cobalt-Mint Binder 16:9 & Native Dual-Tier 9:16 Scenes...")
    fr16_s1, fr9_s1, foley_1 = render_dual_format_scene(
        step_idx=0,
        asset_path=ASSETS_DIR / "intro_s01_leak_to_clarity.jpg",
        pen_sprite=pen_sprite,
        brush_indigo_cobalt=brush_indigo_cobalt,
        scene_kicker="STEP 01 · 창업 전 수익 예측 & 운영 중 새는 돈 진단",
        scene_headline="어디서 돈이 새는지 막막할 때, 3초 만에 손익 구멍 판독",
        card_a_title="어디서 마진이 새는지 막막한 현실",
        card_b_title="항목별 손익 구멍 진단 & 순수익 확보",
        cap_first="창업 전 예상수익이 궁금하거나, 장사 중 어디서 돈이 새는지 답답하셨나요?",
        cap_second="실전 창업·손익 연구소 ‘부자생각’이 3초 만에 손익 구조의 구멍을 찾아드립니다!",
        cap_9_first=("창업 전 예상수익이 궁금하거나,", "장사 중 어디서 돈이 새는지 답답하셨나요?"),
        cap_9_second=("실전 창업·손익 연구소 ‘부자생각’이", "3초 만에 손익 구멍을 속 시원히 찾아드립니다!"),
        duration_sec=d_s1,
        highlight_brand_at=d_s1 * 0.78,
        only_9x16=only_9x16,
    )

    fr16_s2, fr9_s2, foley_2 = render_dual_format_scene(
        step_idx=1,
        asset_path=ASSETS_DIR / "intro_s02_store_simulators.jpg",
        pen_sprite=pen_sprite,
        brush_indigo_cobalt=brush_indigo_cobalt,
        scene_kicker="STEP 02 · 매장 창업 & 오프라인 손익 시뮬레이터",
        scene_headline="30개 업종 창업비용부터 배달 수수료 · 월세 · 인건비까지",
        card_a_title="30개 업종 창업비용 · 월세 손익분기점",
        card_b_title="배달·포장 마진 & 주휴수당·키오스크 비교",
        cap_first="30개 업종 초기 창업비용과 비수기 버티는 힘, 상가 월세 손익분기점은 물론,",
        cap_second="배달앱 수수료·포장 마진, 주휴수당과 무인기계 전환 효과까지 항목별로 짚어냅니다!",
        cap_9_first=("30개 업종 창업비용·월세 손익분기점부터", "비수기를 버티는 기초 체력 계산은 물론,"),
        cap_9_second=("배달앱 수수료·포장용기 마진과", "주휴수당·키오스크 전환 효과까지 짚어냅니다!"),
        duration_sec=d_s2,
        only_9x16=only_9x16,
    )

    n_mid = int(round(d_mid * FPS))
    fr16_mid = [] if only_9x16 else [render_midpoint_stinger_frame(1920, 1080, i / float(max(1, n_mid - 1)), brush_white_mint) for i in range(n_mid)]
    fr9_mid = [render_midpoint_stinger_frame(1080, 1920, i / float(max(1, n_mid - 1)), brush_white_mint) for i in range(n_mid)]

    fr16_s3, fr9_s3, foley_3 = render_dual_format_scene(
        step_idx=2,
        asset_path=ASSETS_DIR / "intro_s03_seller_loan_tax.jpg",
        pen_sprite=pen_sprite,
        brush_indigo_cobalt=brush_indigo_cobalt,
        scene_kicker="STEP 03 · 온라인 셀러 & 정책자금 · 세금 시뮬레이터",
        scene_headline="쿠팡·스토어 마진 판독부터 저금리 정책자금 · 세금 계산까지",
        card_a_title="스마트스토어·쿠팡 광고효율 · 반품 마진",
        card_b_title="내 조건 정책자금·대환 & 부가세·종소세",
        cap_first="스마트스토어·쿠팡 셀러의 광고 효율과 반품 손실 판독기부터,",
        cap_second="내 대출 조건별 저금리 정책자금·대환 진단과 부가세·종소세 계산기까지 다 모았습니다!",
        cap_9_first=("스마트스토어·쿠팡 광고 효율과", "반품 손실 마진 판독기는 물론,"),
        cap_9_second=("내 조건별 저금리 정책자금·대환 진단과", "부가세·종소세 계산기까지 바로 돌려보세요!"),
        duration_sec=d_s3,
        only_9x16=only_9x16,
    )

    fr16_s4, fr9_s4, foley_4 = render_dual_format_scene(
        step_idx=3,
        asset_path=ASSETS_DIR / "intro_s04_open_for_everyone.jpg",
        pen_sprite=pen_sprite,
        brush_indigo_cobalt=brush_indigo_cobalt,
        scene_kicker="STEP 04 · 올해 12월 31일까지 전 업종 시뮬레이터 무료 개방",
        scene_headline="예비창업자 · 매장 사장님 · 온라인 셀러 누구나 바로 체험",
        card_a_title="창업 전 예상수익을 미리 계산할 분",
        card_b_title="사업 중 손익 구멍을 확실히 점검할 분",
        cap_first="창업 전에 미리 수익을 계산해 보고 싶은 분도, 사업 중 손익 구멍을 찾고 싶은 사장님도,",
        cap_second="올해 12월 31일까지 무료 개방된 ‘부자생각(boozathink.com)’에서 지금 바로 써보세요!",
        cap_9_first=("창업 전 수익을 미리 계산해 보고 싶은 분도,", "사업 중 손익 구멍을 찾고 싶은 사장님도,"),
        cap_9_second=("올해 12월 31일까지 무료로 열어둔", "‘부자생각’에서 지금 가볍게 사용해 보세요!"),
        duration_sec=d_s4,
        highlight_brand_at=d_s4 * 0.85,
        only_9x16=only_9x16,
    )

    n_fin = int(round(d_fin * FPS))
    fr16_fin = [] if only_9x16 else [render_finale_stinger_frame(1920, 1080, i / float(max(1, n_fin - 1)), brush_indigo_cobalt) for i in range(n_fin)]
    fr9_fin = [render_finale_stinger_frame(1080, 1920, i / float(max(1, n_fin - 1)), brush_indigo_cobalt) for i in range(n_fin)]

    # Save visual preview snapshots immediately!
    if not only_9x16:
        fr16_s2[int(len(fr16_s2) * 0.62)].save(OUT_DIR / "Preview_16x9_PenDrawing_Scene2.png")
        fr16_mid[int(len(fr16_mid) * 0.72)].save(OUT_DIR / "Preview_16x9_Midpoint_BrandStinger.png")
        fr16_fin[int(len(fr16_fin) * 0.85)].save(OUT_DIR / "Preview_16x9_Finale_BrandStinger.png")
    fr9_s2[int(len(fr9_s2) * 0.62)].save(OUT_DIR / "Preview_9x16_Shorts_Scene2.png")

    t0_s1 = 0.0
    t0_s2 = len(fr9_s1) / float(FPS)
    t0_mid = t0_s2 + len(fr9_s2) / float(FPS)
    t0_s3 = t0_mid + len(fr9_mid) / float(FPS)
    t0_s4 = t0_s3 + len(fr9_s3) / float(FPS)
    t0_fin = t0_s4 + len(fr9_s4) / float(FPS)
    total_frames = len(fr9_s1) + len(fr9_s2) + len(fr9_mid) + len(fr9_s3) + len(fr9_s4) + len(fr9_fin)
    total_dur = total_frames / float(FPS)

    print("[3/5] Mixing Master Broadcast Audio...")
    master_st = synth_calm_lounge_bgm(total_dur) * 0.15
    mix_into(master_st, t0_s1, vo_s1, gain=1.02)
    mix_into(master_st, t0_s2, vo_s2, gain=1.02)
    mix_into(master_st, t0_s3, vo_s3, gain=1.02)
    mix_into(master_st, t0_s4, vo_s4, gain=1.02)

    for idx_sc, (base_t, cues) in enumerate([(t0_s1, foley_1), (t0_s2, foley_2), (t0_s3, foley_3), (t0_s4, foley_4)]):
        for off_t, dur_p in cues:
            mix_into(master_st, base_t + off_t, sfx_fast_pen_flurry(dur_p, seed=300 + idx_sc * 19 + int(off_t * 10)), gain=0.42)

    mix_into(master_st, t0_s1 + d_s1 * 0.76, sfx_mid_brand_flash(0.90), gain=0.48)
    mix_into(master_st, t0_mid, sfx_mid_brand_flash(d_mid), gain=0.95)
    mix_into(master_st, t0_fin - 0.04, sfx_finale_boozathink_chime(d_fin), gain=0.95)

    master_wav = OUT_DIR / "_intro_master_mix.wav"
    write_stereo_wav(master_wav, master_st)

    print("[4/5] Encoding 16:9 Channel Trailer & Native 9:16 Shorts...")
    mp4_16x9 = OUT_DIR / "BOOZATHINK_Official_01_Channel_Intro_16x9_1080p.mp4"
    if not only_9x16:
        cmd_16 = [
            FFMPEG_EXE, "-y",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x1080", "-r", str(FPS), "-i", "-",
            "-i", str(master_wav),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
            str(mp4_16x9),
        ]
        p16 = subprocess.Popen(cmd_16, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for seq in (fr16_s1, fr16_s2, fr16_mid, fr16_s3, fr16_s4, fr16_fin):
            for fr in seq:
                p16.stdin.write(fr.tobytes())
        p16.stdin.close()
        p16.wait()

    mp4_9x16 = OUT_DIR / "BOOZATHINK_Official_01_Channel_Intro_9x16_Shorts.mp4"
    cmd_9 = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1080x1920", "-r", str(FPS), "-i", "-",
        "-i", str(master_wav),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
        str(mp4_9x16),
    ]
    p9 = subprocess.Popen(cmd_9, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for seq in (fr9_s1, fr9_s2, fr9_mid, fr9_s3, fr9_s4, fr9_fin):
        for fr in seq:
            p9.stdin.write(fr.tobytes())
    p9.stdin.close()
    p9.wait()

    print("[5/5] Rendering Distinct Cobalt-Split 1280x720 Thumbnail & Staging to Desktop Box...")
    thumb_jpg = render_intro_thumbnail_1280x720(
        brush_white_mint,
        OUT_DIR / "BOOZATHINK_Official_01_Channel_Intro_Thumbnail_1280x720.jpg",
    )

    for src in (mp4_16x9, mp4_9x16, thumb_jpg):
        shutil.copy2(src, MANUAL_INTRO_BOX / src.name)

    wav_p1.unlink(missing_ok=True)
    wav_p2.unlink(missing_ok=True)
    master_wav.unlink(missing_ok=True)

    print(
        f"[ALL DONE v2 Distinct] 16:9 ({mp4_16x9.stat().st_size:,} bytes) | "
        f"9:16 ({mp4_9x16.stat().st_size:,} bytes) | "
        f"Thumb ({thumb_jpg.stat().st_size:,} bytes)"
    )


if __name__ == "__main__":
    main()

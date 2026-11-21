# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Official Channel Intro / Trailer Video Builder (16:9 + 9:16 + Thumbnail)
==================================================================================================
100% Reflects KoreaThink & SAThink Proven Studio DNA + BoozaThink Core Message:
  1. [Voice]: Exact KoreaThink & SAThink confirmed #1 Host Voice (`Charon` via Gemini 2.5 Studio TTS,
     `atempo=1.04,equalizer=f=3200:t=q:w=1.2:g=2.0,loudnorm=I=-14.5:TP=-1.2:LRA=9`, full -14.5 LUFS!).
  2. [Speech-Synced Pen Drawing]: Each 16:9 illustration splits into Left (`Zone A`) & Right (`Zone B`),
     drawn sequentially by the animated pen in exact sync with narration + crisp pen-on-paper foley!
  3. [Midpoint & Finale '부자생각' Brand Recognition + Signature SFX]:
     - Opening chime when '부자생각' is introduced
     - Midpoint 1.25s `BOOZA THINK · 부자생각` Brush Calligraphy Stamp + Highlighter Slash + `휙-띠리링!` SFX
     - Finale 2.95s `BOOZA THINK · 부자생각` Brush Wipe Reveal + `boozathink.com` + 5-Note Rhodes Sonic Chime
  4. [Core Message]:
     - Concrete simulator showcase (30-industry startup cost, delivery/takeout margin, rent breakeven,
       labor/kiosk, smartstore/coupang seller ROAS, policy funds/loan refinance, VAT/income tax)
     - Warm invitation for BOTH pre-founders wanting to calculate profit beforehand AND active business
       owners wanting to pinpoint exact profit leaks (`올해 12.31까지 무료 개방`).
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
    # Read ONLY GEMINI_API_KEY string for local TTS synthesis (never loads any social/channel tokens!)
    for sib in (REPO_ROOT.parent / "GOREA" / ".env", REPO_ROOT.parent / "EVEMW" / ".env"):
        if sib.exists():
            vals = dotenv.dotenv_values(sib)
            if vals.get("GEMINI_API_KEY"):
                return str(vals["GEMINI_API_KEY"]).strip()
    raise RuntimeError("GEMINI_API_KEY가 필요합니다.")


def synthesize_charon_master_wav(script_ko: str, raw_name: str, out_wav: Path) -> Path:
    """
    Exact KoreaThink & SAThink #1 Confirmed Male Host Voice (`Charon` via `gemini-2.5-flash-preview-tts`),
    mastered at full `-14.5 LUFS` studio broadcast loudness.
    """
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
    """Finds the cleanest natural breath valley between two paragraphs inside a stereo waveform."""
    mono = np.abs(st[:, 0] * 0.5 + st[:, 1] * 0.5)
    win = int(0.08 * SR)
    n = len(mono)
    i0 = max(win, int(n * lo_frac))
    i1 = min(n - win, int(n * hi_frac))
    csum = np.cumsum(np.insert(mono, 0, 0.0))
    window_means = (csum[i0 + win : i1 + win] - csum[i0 - win : i1 - win]) / float(2 * win)
    best_idx = i0 + int(np.argmin(window_means))
    return best_idx


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
# 3. Sound Studio: Pen Foley + Calm Acoustic BGM + Midpoint & Finale Sonic Logos
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
    """KoreaThink/SAThink rapid contour-tracing pen strokes ('사각사각 빠른 펜 드로잉 효과음')."""
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
    """Mid-video '부자생각' Brand Recognition Audio Mnemonic ('휙-탁! + 띠-리-링!' 3-note sparkle)."""
    n_tot = int(round(dur_sec * SR))
    st = np.zeros((n_tot, 2), dtype=np.float32)
    rng = np.random.default_rng(77)

    # Air whoosh + soft seal thump
    wn = int(0.15 * SR)
    uw = np.linspace(0.0, 1.0, wn, dtype=np.float32)
    whoosh = fft_bandpass(rng.normal(0.0, 1.0, size=wn).astype(np.float32), 700.0, 5200.0)
    whoosh = (whoosh / (float(np.max(np.abs(whoosh))) + 1e-6)) * (uw ** 1.6) * 0.15
    mix_into(st, 0.02, whoosh, pan=0.48)

    tn = int(0.45 * SR)
    tt = np.arange(tn, dtype=np.float32) / SR
    thump = np.sin(2.0 * np.pi * (58.0 + 75.0 * np.exp(-tt * 34.0)) * tt) * np.exp(-tt * 12.0) * 0.26
    mix_into(st, 0.15, thump.astype(np.float32), pan=0.5)

    # Highlighter slash swoosh at t=0.28s
    hn = int(0.26 * SR)
    uh = np.linspace(0.0, 1.0, hn, dtype=np.float32)
    hl = fft_bandpass(rng.normal(0.0, 1.0, size=hn).astype(np.float32), 1500.0, 6500.0, peak_hz=3200.0, peak_gain=0.9)
    hl = (hl / (float(np.max(np.abs(hl))) + 1e-6)) * (np.maximum(0.0, np.sin(np.pi * uh)) ** 0.8) * 0.14
    mix_into(st, 0.28, hl, pan=0.55)

    # Crisp 3-note rising bell chord (G5 -> A5 -> D6!)
    for st_t, hz, pn in [(0.16, 783.99, 0.36), (0.25, 987.77, 0.50), (0.35, 1174.66, 0.64)]:
        bn = min(int(0.68 * SR), n_tot - int(st_t * SR))
        if bn > 64:
            tb = np.arange(bn, dtype=np.float32) / SR
            bell = (np.sin(2.0 * np.pi * hz * tb) * 0.80 + np.sin(2.0 * np.pi * hz * 2.0 * tb) * 0.20) * np.exp(-tb * 6.2)
            bell *= np.minimum(1.0, tb / 0.004) * 0.16
            mix_into(st, st_t, bell.astype(np.float32), pan=pn)
    return st


def sfx_finale_boozathink_chime(dur_sec: float = 2.95) -> np.ndarray:
    """Signature 5-note rising Rhodes/Bell + Upright Bass Finale Sonic Logo ('부-자-생-각! 딩—✨')."""
    n_tot = int(round(dur_sec * SR))
    st = np.zeros((n_tot, 2), dtype=np.float32)
    rng = np.random.default_rng(303)

    # Soft calligraphy brush sweep
    sw_n = int(0.52 * SR)
    u = np.linspace(0.0, 1.0, sw_n, dtype=np.float32)
    sw = fft_bandpass(rng.normal(0.0, 1.0, size=sw_n).astype(np.float32), 650.0, 4400.0)
    sw = (sw / (float(np.max(np.abs(sw))) + 1e-6)) * (np.maximum(0.0, np.sin(np.pi * u)) ** 1.2) * 0.11
    mix_into(st, 0.04, sw, pan=0.45)

    # 5-note rising pentatonic Rhodes + crystal bell arpeggio (C5 - D5 - E5 - G5 - C6)
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

    # Warm upright bass C3 root on final chord
    bn = min(int(1.85 * SR), n_tot - int(0.64 * SR))
    tb = np.arange(bn, dtype=np.float32) / SR
    bass = (np.sin(2.0 * np.pi * 130.81 * tb) * 0.85 + np.sin(2.0 * np.pi * 261.63 * tb) * 0.15) * np.minimum(1.0, tb / 0.01) * np.exp(-tb * 2.1) * 0.22
    mix_into(st, 0.64, bass.astype(np.float32), pan=0.5)
    return st


def synth_calm_lounge_bgm(total_dur: float) -> np.ndarray:
    """Calm Morning Coffee Acoustic/Rhodes Lounge BGM @ 84 BPM (mixed gently at 15% under -14.5 LUFS Charon!)."""
    n_tot = int(round((total_dur + 0.5) * SR))
    st = np.zeros((n_tot, 2), dtype=np.float32)
    beat = 60.0 / 84.0
    bar = beat * 4.0
    prog = [
        (130.81, [261.63, 329.63, 392.00, 493.88]),  # Cmaj7
        (110.00, [220.00, 261.63, 329.63, 392.00]),  # Am7
        (146.83, [293.66, 349.23, 440.00, 523.25]),  # Dm9
        (98.00,  [196.00, 246.94, 329.63, 392.00]),  # G13
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
# 4. Left-Right Speech-Synced Pen Tracer + Paper & Stinger Renderers
# ---------------------------------------------------------------------------
def make_paper_16x9(theme: str) -> Image.Image:
    W, H = 1920, 1080
    rng = np.random.default_rng(101 if theme == "cream" else 202)
    grain = rng.normal(0.0, 2.0, size=(H, W, 1)).astype(np.float32)
    bg_rgb = [252.0, 249.0, 240.0] if theme == "cream" else [249.0, 251.0, 254.0]
    img = Image.fromarray(np.clip(np.full((H, W, 3), bg_rgb, dtype=np.float32) + grain, 0, 255).astype(np.uint8))
    dr = ImageDraw.Draw(img)
    line_col = (235, 228, 214) if theme == "cream" else (228, 236, 246)
    for x in range(40, W - 30, 40):
        dr.line([(x, 28), (x, H - 28)], fill=line_col, width=1)
    for y in range(28, H - 24, 40):
        dr.line([(40, y), (W - 40, y)], fill=line_col, width=1)
    # Clean white drawing sheet in the center (x: 80..1840, y: 120..880)
    dr.rounded_rectangle([76, 116, 1844, 884], radius=28, fill=(255, 255, 255), outline=(20, 30, 56), width=4)
    # Subtle divider guide in the middle
    for dy in range(156, 850, 22):
        dr.line([(960, dy), (960, dy + 10)], fill=(218, 226, 238), width=2)
    return img


def create_pen_cursor_rgba() -> Image.Image:
    img = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    dr.polygon([(16, 160), (48, 144), (168, 32), (144, 12), (28, 126)], fill=(15, 23, 42, 38))
    dr.polygon([(34, 118), (144, 8), (170, 34), (60, 144)], fill=(18, 32, 66, 255), outline=(10, 16, 32, 255))
    dr.line([(38, 114), (64, 140)], fill=(245, 180, 59, 255), width=6)
    dr.polygon([(14, 160), (34, 118), (60, 144)], fill=(245, 180, 59, 255), outline=(15, 23, 42, 255))
    dr.line([(14, 160), (40, 134)], fill=(15, 23, 42, 255), width=3)
    return img


def extract_zone_trace(img_rgb: Image.Image, target_w: int, target_h: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
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

    def _trace_sub(sub_ink: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        h, w = sub_ink.shape
        step = 7
        gh, gw = max(4, h // step), max(4, w // step)
        small = np.asarray(
            Image.fromarray((np.clip(sub_ink, 0.0, 1.0) * 255.0).astype(np.uint8)).resize((gw, gh), Image.Resampling.BILINEAR),
            dtype=np.float32,
        ) / 255.0
        ys, xs = np.nonzero(small > 0.22)
        m = len(xs)
        if m < 6:
            return np.zeros((h, w), dtype=np.float32), np.array([w * 0.5], dtype=np.float32), np.array([h * 0.5], dtype=np.float32)
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
                Image.fromarray((np.clip(filled, 0.0, 1.0) * 255.0).astype(np.uint8)).resize((w, h), Image.Resampling.NEAREST),
                dtype=np.float32,
            )
            / 255.0
        )
        px = xs_f[order_idx] * step + step * 0.5
        py = ys_f[order_idx] * step + step * 0.5
        if m > 5:
            px = np.convolve(px, np.array([0.2, 0.6, 0.2], dtype=np.float32), mode="same")
            py = np.convolve(py, np.array([0.2, 0.6, 0.2], dtype=np.float32), mode="same")
        return ord_full, px, py

    mid_w = target_w // 2
    ord_l, px_l, py_l = _trace_sub(ink[:, :mid_w])
    ord_r, px_r, py_r = _trace_sub(ink[:, mid_w:])
    px_r = px_r + float(mid_w)
    return arr, ink, (ord_l, px_l, py_l), (ord_r, px_r, py_r), np.array([mid_w], dtype=np.int32)


def render_speech_synced_scene_frames(
    paper_base: Image.Image,
    asset_path: Path,
    pen_sprite: Image.Image,
    brush_badge_dark: Image.Image,
    top_pill_text: str,
    pill_rgb: tuple[int, int, int],
    left_label: str,
    right_label: str,
    cap_first: str,
    cap_second: str,
    duration_sec: float,
    highlight_brand_at: float | None = None,
) -> tuple[list[Image.Image], list[tuple[float, float]]]:
    """
    Renders 1920x1080 frames where Zone A (Left) is drawn during the first half of `duration_sec`
    and Zone B (Right) is drawn during the second half, synced with pen foley intervals!
    """
    n_frames = max(12, int(round(duration_sec * FPS)))
    bx, by, bw, bh = 96, 168, 1728, 696
    mid_w = bw // 2

    src_img = Image.open(asset_path).convert("RGB")
    col_arr, ink_arr, (ord_l, px_l, py_l), (ord_r, px_r, py_r), _ = extract_zone_trace(src_img, bw, bh)

    # Pre-stamp static paper chrome (top pill, top-right BOOZA THINK brush seal, zone sub-headers)
    static_page = paper_base.copy().convert("RGBA")
    dr_s = ImageDraw.Draw(static_page, "RGBA")
    dr_s.rounded_rectangle([76, 36, 1180, 100], radius=32, fill=(*pill_rgb, 255))
    dr_s.text((108, 49), top_pill_text, font=_font(29, True), fill=(255, 255, 255, 255))

    # Top-right persistent '부자생각' recognition pill
    dr_s.rounded_rectangle([1470, 34, 1844, 102], radius=34, fill=(11, 19, 43, 255), outline=(217, 155, 38, 255), width=3)
    static_page.alpha_composite(brush_badge_dark, (1500, 44))
    dr_s.text((1626, 49), "부자생각", font=_font(30, True), fill=(251, 191, 36, 255))

    # Clean zone tags at top of Left & Right halves of the white sheet
    dr_s.rounded_rectangle([116, 130, 116 + 460, 174], radius=14, fill=(241, 245, 249, 255), outline=(148, 163, 184, 255), width=2)
    dr_s.text((138, 137), left_label, font=_font(22, True), fill=(30, 41, 59, 255))

    dr_s.rounded_rectangle([988, 130, 988 + 480, 174], radius=14, fill=(254, 249, 195, 255), outline=(217, 155, 38, 255), width=2)
    dr_s.text((1010, 137), right_label, font=_font(22, True), fill=(133, 77, 14, 255))

    static_arr = np.asarray(static_page.convert("RGB"), dtype=np.float32)

    u_half = np.linspace(0.0, 1.0, mid_w, dtype=np.float32)[None, :]
    v_half = np.linspace(0.0, 1.0, bh, dtype=np.float32)[:, None]
    diag_half = u_half * 0.65 + v_half * 0.35
    navy_rgb = np.array([22.0, 32.0, 58.0], dtype=np.float32)[None, None, :]

    # Timing schedule inside the scene
    t_l0, t_l1 = 0.10, duration_sec * 0.38
    t_lc0, t_lc1 = duration_sec * 0.28, duration_sec * 0.46
    t_r0, t_r1 = duration_sec * 0.48, duration_sec * 0.82
    t_rc0, t_rc1 = duration_sec * 0.72, duration_sec * 0.92

    foley_cues = [(t_l0, max(0.4, t_l1 - t_l0)), (t_r0, max(0.4, t_r1 - t_r0))]
    frames: list[Image.Image] = []

    f_cap = _font(34, True)

    for fn in range(n_frames):
        t = fn / float(FPS)
        canvas = static_arr.copy()
        patch = canvas[by : by + bh, bx : bx + bw]
        active_pen = None

        # --- Left Half (Zone A) ---
        if t >= t_l0:
            pl = float(np.clip((t - t_l0) / max(0.15, t_l1 - t_l0), 0.0, 1.0))
            rev_l = np.clip((pl - ord_l) / 0.038, 0.0, 1.0)
            ink_l = (0.88 * ink_arr[:, :mid_w] * rev_l)[:, :, None]
            bg_l = patch[:, :mid_w]
            layer_l = bg_l * (1.0 - ink_l) + navy_rgb * ink_l
            pcl = float(np.clip((t - t_lc0) / max(0.15, t_lc1 - t_lc0), 0.0, 1.0))
            if pcl > 0.003:
                wm_l = np.clip((pcl * 1.25 - diag_half) / 0.22, 0.0, 1.0)[:, :, None]
                col_l = bg_l * (col_arr[:, :mid_w] / 255.0)
                layer_l = layer_l * (1.0 - wm_l) + np.minimum(col_l, layer_l + 20.0) * wm_l
            patch[:, :mid_w] = layer_l
            if pl < 0.992:
                pi = min(len(px_l) - 1, int(pl * (len(px_l) - 1)))
                active_pen = (bx + int(px_l[pi]), by + int(py_l[pi]))

        # --- Right Half (Zone B) ---
        if t >= t_r0:
            pr = float(np.clip((t - t_r0) / max(0.15, t_r1 - t_r0), 0.0, 1.0))
            rev_r = np.clip((pr - ord_r) / 0.038, 0.0, 1.0)
            ink_r = (0.88 * ink_arr[:, mid_w:] * rev_r)[:, :, None]
            bg_r = patch[:, mid_w:]
            layer_r = bg_r * (1.0 - ink_r) + navy_rgb * ink_r
            pcr = float(np.clip((t - t_rc0) / max(0.15, t_rc1 - t_rc0), 0.0, 1.0))
            if pcr > 0.003:
                wm_r = np.clip((pcr * 1.25 - diag_half) / 0.22, 0.0, 1.0)[:, :, None]
                col_r = bg_r * (col_arr[:, mid_w:] / 255.0)
                layer_r = layer_r * (1.0 - wm_r) + np.minimum(col_r, layer_r + 20.0) * wm_r
            patch[:, mid_w:] = layer_r
            if pr < 0.992:
                pi = min(len(px_r) - 1, int(pr * (len(px_r) - 1)))
                active_pen = (bx + int(px_r[pi]), by + int(py_r[pi]))

        canvas[by : by + bh, bx : bx + bw] = patch
        fr_rgba = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).convert("RGBA")
        dr = ImageDraw.Draw(fr_rgba, "RGBA")

        # Optional warm golden pulse around top-right '부자생각' seal when spoken aloud!
        if highlight_brand_at is not None and abs(t - highlight_brand_at) < 0.65:
            glow_a = int(210 * (1.0 - abs(t - highlight_brand_at) / 0.65))
            dr.rounded_rectangle([1462, 26, 1852, 110], radius=40, outline=(250, 204, 21, glow_a), width=6)

        # Bottom crisp subtitle bar
        cur_cap = cap_first if t < (duration_sec * 0.48) else cap_second
        dr.rounded_rectangle([76, 904, 1844, 1044], radius=26, fill=(11, 19, 43, 245), outline=(217, 155, 38, 255), width=4)
        tw = dr.textlength(cur_cap, font=f_cap)
        dr.text((960 - tw / 2, 951), cur_cap, font=f_cap, fill=(254, 249, 195, 255))

        if active_pen is not None:
            px_c, py_c = active_pen
            fr_rgba.paste(pen_sprite, (px_c - 14, py_c - 160), pen_sprite)

        frames.append(fr_rgba.convert("RGB"))

    return frames, foley_cues


def render_midpoint_stinger_frame(w: int, h: int, progress: float, brush_white_gold: Image.Image) -> Image.Image:
    """
    1.25s Midpoint '부자생각 BOOZA THINK' Brand Recognition Stinger (works natively at both 1920x1080 & 1080x1920!).
    """
    p = max(0.0, min(1.0, progress))
    ease = 1.0 - (1.0 - min(1.0, p / 0.36)) ** 3
    canvas = Image.new("RGBA", (w, h), (7, 13, 28, 255))
    dr = ImageDraw.Draw(canvas, "RGBA")
    cx, cy = w // 2, h // 2

    # Crisp double-gold-rimmed Deep Royal Navy seal so White BOOZA & Gold THINK pop with 100% contrast!
    seal_rx = int((470 if w > h else 460) * (0.92 + 0.08 * ease))
    seal_ry = int((410 if w > h else 440) * (0.92 + 0.08 * ease))
    dr.rounded_rectangle(
        [cx - seal_rx, cy - seal_ry, cx + seal_rx, cy + seal_ry],
        radius=64,
        fill=(14, 26, 56, 255),
        outline=(217, 155, 38, 255),
        width=7,
    )
    dr.rounded_rectangle(
        [cx - seal_rx + 14, cy - seal_ry + 14, cx + seal_rx - 14, cy + seal_ry - 14],
        radius=54,
        outline=(59, 130, 246, 180),
        width=2,
    )

    # Scale-pop of 2-line BOOZA THINK brush calligraphy
    target_lw = int((590 if w > h else 620) * (0.86 + 0.14 * ease))
    aspect = brush_white_gold.height / float(brush_white_gold.width)
    target_lh = max(32, int(round(target_lw * aspect)))
    logo_sc = brush_white_gold.resize((target_lw, target_lh), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo_sc, (cx - target_lw // 2, cy - target_lh // 2 - 58))

    # Brisk golden highlighter bar sweeping left-to-right ('부자생각 · 창업·자영업·셀러 손익 연구소')
    if p > 0.22:
        hp = min(1.0, (p - 0.22) / 0.30)
        full_bw = 720 if w > h else 780
        cur_bw = max(24, int(full_bw * hp))
        by0 = cy + target_lh // 2 - 18
        dr.rounded_rectangle(
            [cx - full_bw // 2, by0, cx - full_bw // 2 + cur_bw, by0 + 74],
            radius=37,
            fill=(251, 191, 36, 255),
            outline=(255, 255, 255, 255),
            width=4,
        )
        if hp > 0.55:
            txt = "부자생각  ·  창업·자영업·셀러 손익 연구소"
            f_b = _font(32 if w > h else 33, True)
            tw = dr.textlength(txt, font=f_b)
            dr.text((cx - tw / 2, by0 + 17), txt, font=f_b, fill=(11, 19, 43, 255))

    return canvas.convert("RGB")


def render_finale_stinger_frame(w: int, h: int, progress: float, brush_navy_gold: Image.Image) -> Image.Image:
    """
    2.95s Finale '부자생각 BOOZA THINK' Brush Wipe Stinger (harmonized with SA Think Variant 1 Brush_Ink_Sweep!).
    """
    p = max(0.0, min(1.0, progress))
    canvas = Image.new("RGBA", (w, h), (252, 249, 240, 255))
    dr = ImageDraw.Draw(canvas, "RGBA")
    for x in range(0, w, 42):
        dr.line([(x, 0), (x, h)], fill=(235, 228, 212, 180), width=1)
    for y in range(0, h, 42):
        dr.line([(0, y), (w, y)], fill=(235, 228, 212, 180), width=1)
    dr.rounded_rectangle([36, 36, w - 36, h - 36], radius=32, outline=(29, 78, 216, 255), width=5)
    dr.rounded_rectangle([50, 50, w - 50, h - 50], radius=26, outline=(217, 155, 38, 255), width=3)

    cx, cy = w // 2, h // 2
    target_lw = 650 if w > h else 720
    aspect = brush_navy_gold.height / float(brush_navy_gold.width)
    target_lh = int(round(target_lw * aspect))
    logo_full = brush_navy_gold.resize((target_lw, target_lh), Image.Resampling.LANCZOS)

    # Progressive left-to-right brush stroke wipe!
    rev_w = max(2, int(target_lw * min(1.0, p / 0.44)))
    sub_logo = logo_full.crop((0, 0, rev_w, target_lh))
    ly0 = cy - target_lh // 2 - (105 if w > h else 135)
    canvas.alpha_composite(sub_logo, (cx - target_lw // 2, ly0))

    if p > 0.28:
        sp = min(1.0, (p - 0.28) / 0.28)
        bw_bar = int((680 if w > h else 820) * sp)
        bx0 = cx - (340 if w > h else 410)
        by0 = ly0 + target_lh + 28
        dr.rounded_rectangle([bx0, by0, bx0 + bw_bar, by0 + 82], radius=41, fill=(11, 19, 43, 255), outline=(217, 155, 38, 255), width=4)
        if sp > 0.55:
            t1 = "부자생각  ·  boozathink.com"
            f1 = _font(38, True)
            tw1 = dr.textlength(t1, font=f1)
            dr.text((cx - tw1 / 2, by0 + 17), t1, font=f1, fill=(251, 191, 36, 255))

        if p > 0.46:
            sp2 = min(1.0, (p - 0.46) / 0.25)
            a2 = int(255 * sp2)
            t2 = "창업 전 예상수익부터 운영 중 새는 돈 점검까지 · 올해 12.31까지 무료 개방"
            f2 = _font(28 if w > h else 27, True)
            tw2 = dr.textlength(t2, font=f2)
            dr.text((cx - tw2 / 2, by0 + 106), t2, font=f2, fill=(30, 41, 59, a2))

    return canvas.convert("RGB")


def wrap_scene_16x9_into_9x16(
    fr_16x9: Image.Image,
    base_9x16: Image.Image,
) -> Image.Image:
    out = base_9x16.copy()
    scaled = fr_16x9.resize((1008, 567), Image.Resampling.LANCZOS)
    out.paste(scaled, (36, 560))
    return out


def make_shorts_wrapper_base(brush_white_gold: Image.Image) -> Image.Image:
    W, H = 1080, 1920
    base = Image.new("RGBA", (W, H), (252, 249, 240, 255))
    dr = ImageDraw.Draw(base, "RGBA")
    for gx in range(0, W, 44):
        dr.line([(gx, 0), (gx, H)], fill=(235, 228, 214, 255), width=1)
    for gy in range(0, H, 44):
        dr.line([(0, gy), (W, gy)], fill=(235, 228, 214, 255), width=1)

    # Top Header Card
    dr.rounded_rectangle([36, 110, W - 36, 495], radius=32, fill=(11, 19, 43, 255), outline=(217, 155, 38, 255), width=5)
    logo_top = brush_white_gold.resize((260, int(round(260 * brush_white_gold.height / brush_white_gold.width))), Image.Resampling.LANCZOS)
    base.alpha_composite(logo_top, (68, 146))

    dr.rounded_rectangle([358, 154, 1008, 214], radius=30, fill=(29, 78, 216, 255))
    dr.text((386, 167), "창업 · 자영업 · 셀러 7대 손익 시뮬레이터", font=_font(26, True), fill=(255, 255, 255, 255))
    dr.text((358, 236), "부자생각 공식 소개", font=_font(52, True), fill=(251, 191, 36, 255))

    dr.text((68, 360), "창업 전 예상수익 계산도, 장사 중 새는 돈 점검도", font=_font(34, True), fill=(255, 255, 255, 255))
    dr.text((68, 414), "숫자만 넣으면 3초 만에 한눈에 보입니다!", font=_font(34, True), fill=(147, 197, 253, 255))

    # Center Frame Border for 16:9 Drawing Stage (x: 30..1050, y: 554..1133)
    dr.rounded_rectangle([30, 554, 1050, 1133], radius=20, fill=(11, 19, 43, 255), outline=(11, 19, 43, 255), width=6)

    # Simulator Chips Grid + Bottom CTA Card
    chips = [
        ("30개 업종 창업비용·순수익", "배달·포장 수수료 마진"),
        ("상가 월세 손익분기·입지", "주휴수당·키오스크 비교"),
        ("쿠팡·스토어 광고·반품 마진", "정책자금·대환·세금 계산"),
    ]
    cy_row = 1172
    f_ch = _font(26, True)
    for left_c, right_c in chips:
        dr.rounded_rectangle([36, cy_row, 526, cy_row + 74], radius=18, fill=(255, 255, 255, 255), outline=(30, 58, 138, 255), width=3)
        dr.text((62, cy_row + 20), f"• {left_c}", font=f_ch, fill=(15, 23, 42, 255))
        dr.rounded_rectangle([554, cy_row, 1044, cy_row + 74], radius=18, fill=(255, 255, 255, 255), outline=(30, 58, 138, 255), width=3)
        dr.text((580, cy_row + 20), f"• {right_c}", font=f_ch, fill=(15, 23, 42, 255))
        cy_row += 90

    dr.rounded_rectangle([36, 1468, W - 36, 1740], radius=30, fill=(11, 19, 43, 255), outline=(217, 155, 38, 255), width=5)
    dr.rounded_rectangle([76, 1500, W - 76, 1590], radius=45, fill=(251, 191, 36, 255))
    cta_m = "무료 3초 실전 시뮬레이터 ▶ boozathink.com"
    f_cta = _font(35, True)
    tw_m = dr.textlength(cta_m, font=f_cta)
    dr.text((W // 2 - tw_m / 2, 1522), cta_m, font=f_cta, fill=(11, 19, 43, 255))

    sub_m = "올해 12월 31일까지만 모든 업종 계산기 무료 개방 · 검색창에 ‘부자생각’"
    f_sm = _font(26, True)
    tw_sm = dr.textlength(sub_m, font=f_sm)
    dr.text((W // 2 - tw_sm / 2, 1632), sub_m, font=f_sm, fill=(248, 250, 252, 255))

    return base.convert("RGB")


def render_intro_thumbnail_1280x720(brush_white_gold: Image.Image, out_jpg: Path) -> Path:
    buf_logo = io.BytesIO()
    brush_white_gold.save(buf_logo, format="PNG")
    logo_b64 = base64.b64encode(buf_logo.getvalue()).decode("ascii")
    art_b64 = base64.b64encode((ASSETS_DIR / "intro_s01_leak_to_clarity.jpg").read_bytes()).decode("ascii")

    html = f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      width: 1280px; height: 720px; overflow: hidden; position: relative;
      background-color: #fcf9f0;
      background-image: linear-gradient(#e7dfd0 1.8px, transparent 1.8px), linear-gradient(90deg, #e7dfd0 1.8px, transparent 1.8px);
      background-size: 38px 38px;
      font-family: 'Pretendard', 'Malgun Gothic', sans-serif;
      padding: 44px 52px; display: flex; align-items: center; justify-content: space-between;
    }}
    .left {{ width: 650px; display: flex; flex-direction: column; align-items: flex-start; gap: 18px; }}
    .brand-bar {{
      display: flex; align-items: center; gap: 18px;
      background: #0b132b; border: 4px solid #d99b26; border-radius: 24px;
      padding: 12px 26px; box-shadow: 7px 7px 0 #1d4ed8;
    }}
    .brand-bar img {{ height: 74px; width: auto; }}
    .brand-bar span {{ color: #fde047; font-size: 26px; font-weight: 900; }}
    .hl-box {{
      background: #fef08a; border: 5px solid #0f172a; border-radius: 26px;
      padding: 20px 28px; box-shadow: 8px 8px 0 #0f172a; width: 100%;
    }}
    .hl-box .t1 {{ font-size: 46px; font-weight: 900; color: #0f172a; line-height: 1.16; letter-spacing: -0.03em; }}
    .hl-box .t2 {{ font-size: 48px; font-weight: 900; color: #dc2626; line-height: 1.18; letter-spacing: -0.03em; margin-top: 6px; }}
    .chips {{ font-size: 25px; font-weight: 900; color: #1e3a8a; background: #ffffff; border: 4px solid #0f172a; border-radius: 18px; padding: 14px 22px; width: 100%; }}
    .cta {{
      background: #1d4ed8; color: #ffffff; border: 4px solid #0f172a; border-radius: 999px;
      padding: 12px 30px; font-size: 28px; font-weight: 900; box-shadow: 5px 5px 0 #d99b26;
    }}
    .right-card {{
      width: 492px; height: 620px; background: #ffffff; border: 6px solid #0f172a;
      border-radius: 32px; box-shadow: 12px 12px 0 #0b132b;
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      padding: 24px 20px;
    }}
    .right-card .r-tag {{ background: #dcfce7; color: #166534; border: 3px solid #0f172a; border-radius: 999px; padding: 8px 22px; font-size: 23px; font-weight: 900; }}
    .right-card img {{ width: 452px; height: 390px; object-fit: contain; }}
    .right-card .r-bot {{ font-size: 26px; font-weight: 900; color: #0f172a; background: #fef9c3; padding: 10px 22px; border-radius: 16px; border: 3px solid #d99b26; }}
    </style></head><body>
      <div class="left">
        <div class="brand-bar">
          <img src="data:image/png;base64,{logo_b64}" />
          <span>공식 채널 소개</span>
        </div>
        <div class="hl-box">
          <div class="t1">창업 전 예상수익 계산부터</div>
          <div class="t2">새는 돈 구멍까지 3초 판독!</div>
        </div>
        <div class="chips">창업비용 · 배달마진 · 셀러ROAS · 정책자금 · 세금</div>
        <div class="cta">올해 12.31까지 무료 개방 ▶ boozathink.com</div>
      </div>
      <div class="right-card">
        <div class="r-tag">누구나 숫자만 넣어 바로 확인</div>
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
# 5. Master Build Pipeline (16:9 Channel Trailer + 9:16 Shorts + Copy Sheet)
# ---------------------------------------------------------------------------
def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    MANUAL_INTRO_BOX.mkdir(parents=True, exist_ok=True)

    # Part 1 Script (Scenes 1 & 2 — before Midpoint '부자생각' Brand Stinger)
    script_part1 = (
        "창업을 앞두고 실제로 한 달에 얼마가 남을지 미리 계산해 보고 싶으신가요? "
        "아니면 지금 열심히 사업은 하고 있는데, 도대체 어디서 돈이 새는지 손익 구조의 구멍을 확실히 찾아내고 싶으신가요? "
        "실전 창업·손익 연구소, 부자생각이 삼 초 만에 속 시원히 보여드립니다!\n\n"
        "첫째, 서른 개 업종별 초기 창업비용과 비수기 버티는 힘을 계산해 주는 창업 마스터 시뮬레이터부터, "
        "배달앱 수수료와 포장 마진, 상가 월세 손익분기점, 주휴수당과 무인기계 전환 효과까지! "
        "내 매장에서 돈 새는 구멍을 항목별로 정확히 짚어냅니다."
    )

    # Part 2 Script (Scenes 3 & 4 — after Midpoint '부자생각' Brand Stinger)
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

    print("[1/5] Synthesizing KoreaThink & SAThink Confirmed Host Voice (`Charon` -14.5 LUFS)...")
    wav_p1 = synthesize_charon_master_wav(script_part1, "intro_part1_charon_raw.wav", OUT_DIR / "_part1_master.wav")
    wav_p2 = synthesize_charon_master_wav(script_part2, "intro_part2_charon_raw.wav", OUT_DIR / "_part2_master.wav")

    st_p1 = read_stereo_wav(wav_p1)
    st_p2 = read_stereo_wav(wav_p2)

    split_12 = find_mid_silence_split(st_p1, lo_frac=0.38, hi_frac=0.60)
    split_34 = find_mid_silence_split(st_p2, lo_frac=0.35, hi_frac=0.58)

    vo_s1 = st_p1[:split_12]
    vo_s2 = st_p1[split_12:]
    vo_s3 = st_p2[:split_34]
    vo_s4 = st_p2[split_34:]

    d_s1 = len(vo_s1) / float(SR)
    d_s2 = len(vo_s2) / float(SR)
    d_mid = 1.25  # Midpoint '부자생각' Brand Logo Flash + SFX!
    d_s3 = len(vo_s3) / float(SR)
    d_s4 = len(vo_s4) / float(SR)
    d_fin = 2.95  # Finale '부자생각' Brush Wipe Stinger + Sonic Logo!

    print(
        f"  Timings -> S1: {d_s1:.2f}s | S2: {d_s2:.2f}s | MidLogo: {d_mid:.2f}s | "
        f"S3: {d_s3:.2f}s | S4: {d_s4:.2f}s | FinaleLogo: {d_fin:.2f}s "
        f"(Total: {d_s1 + d_s2 + d_mid + d_s3 + d_s4 + d_fin:.2f}s)"
    )

    # Load brush calligraphy logos
    brush_white_gold = load_boozathink_brush_rgba((255, 255, 255), (251, 191, 36), target_w=640)
    brush_navy_gold = load_boozathink_brush_rgba((15, 23, 42), (29, 78, 216), target_w=680)
    badge_sm = brush_white_gold.resize((104, int(round(104 * brush_white_gold.height / brush_white_gold.width))), Image.Resampling.LANCZOS)

    paper_cream = make_paper_16x9("cream")
    paper_graph = make_paper_16x9("graph")
    pen_sprite = create_pen_cursor_rgba()

    print("[2/5] Rendering 4 Speech-Synced Sequential Pen-Drawing Scenes + Midpoint & Finale Brand Stingers...")
    fr_s1, foley_1 = render_speech_synced_scene_frames(
        paper_base=paper_cream,
        asset_path=ASSETS_DIR / "intro_s01_leak_to_clarity.jpg",
        pen_sprite=pen_sprite,
        brush_badge_dark=badge_sm,
        top_pill_text="부자생각 공식 소개 · 창업 전 예상수익 계산 & 운영 중 손익 구멍 점검",
        pill_rgb=(15, 23, 42),
        left_label="고민 1 · 어디서 돈이 새는지 막막할 때",
        right_label="해답 · 3초 만에 손익 구멍과 순수익 확인",
        cap_first="창업 전 예상수익이 궁금하거나, 장사 중 어디서 돈이 새는지 답답하셨나요?",
        cap_second="실전 창업·손익 연구소 ‘부자생각’이 3초 만에 손익 구조의 구멍을 찾아드립니다!",
        duration_sec=d_s1,
        highlight_brand_at=d_s1 * 0.78,
    )

    fr_s2, foley_2 = render_speech_synced_scene_frames(
        paper_base=paper_graph,
        asset_path=ASSETS_DIR / "intro_s02_store_simulators.jpg",
        pen_sprite=pen_sprite,
        brush_badge_dark=badge_sm,
        top_pill_text="핵심 시뮬레이터 1 · 30개 업종 창업비용 · 배달마진 · 월세 · 인건비",
        pill_rgb=(29, 78, 216),
        left_label="30개 업종 창업비용 · 월세 손익분기점",
        right_label="배달·포장 수수료 마진 & 키오스크·인건비",
        cap_first="30개 업종 초기 창업비용과 비수기 버티는 힘, 상가 월세 손익분기점은 물론,",
        cap_second="배달앱 수수료·포장 마진, 주휴수당과 무인기계 전환 효과까지 항목별로 짚어냅니다!",
        duration_sec=d_s2,
    )

    n_mid = int(round(d_mid * FPS))
    fr_mid_16 = [render_midpoint_stinger_frame(1920, 1080, i / float(max(1, n_mid - 1)), brush_white_gold) for i in range(n_mid)]
    fr_mid_9 = [render_midpoint_stinger_frame(1080, 1920, i / float(max(1, n_mid - 1)), brush_white_gold) for i in range(n_mid)]

    fr_s3, foley_3 = render_speech_synced_scene_frames(
        paper_base=paper_cream,
        asset_path=ASSETS_DIR / "intro_s03_seller_loan_tax.jpg",
        pen_sprite=pen_sprite,
        brush_badge_dark=badge_sm,
        top_pill_text="핵심 시뮬레이터 2 · 쿠팡·스토어 셀러 마진 · 정책자금 · 세금 계산기",
        pill_rgb=(21, 128, 61),
        left_label="스마트스토어·쿠팡 광고효율 · 반품 마진",
        right_label="저금리 정책자금·대환 & 부가세·종소세",
        cap_first="스마트스토어·쿠팡 셀러의 광고 효율과 반품 손실 판독기부터,",
        cap_second="내 대출 조건별 저금리 정책자금·대환 진단과 부가세·종소세 계산기까지 다 모았습니다!",
        duration_sec=d_s3,
    )

    fr_s4, foley_4 = render_speech_synced_scene_frames(
        paper_base=paper_graph,
        asset_path=ASSETS_DIR / "intro_s04_open_for_everyone.jpg",
        pen_sprite=pen_sprite,
        brush_badge_dark=badge_sm,
        top_pill_text="올해 12월 31일까지 무료 개방 · 예비창업자 · 사장님 · 셀러 누구나 환영",
        pill_rgb=(180, 83, 9),
        left_label="창업 전 수익을 미리 계산해 보고 싶은 분",
        right_label="운영 중 손익 구조를 확실히 보고 싶은 분",
        cap_first="창업 전에 미리 수익을 계산해 보고 싶은 분도, 사업 중 손익 구멍을 찾고 싶은 사장님도,",
        cap_second="올해 12월 31일까지 무료 개방된 ‘부자생각(boozathink.com)’에서 지금 바로 써보세요!",
        duration_sec=d_s4,
        highlight_brand_at=d_s4 * 0.85,
    )

    n_fin = int(round(d_fin * FPS))
    fr_fin_16 = [render_finale_stinger_frame(1920, 1080, i / float(max(1, n_fin - 1)), brush_navy_gold) for i in range(n_fin)]
    fr_fin_9 = [render_finale_stinger_frame(1080, 1920, i / float(max(1, n_fin - 1)), brush_navy_gold) for i in range(n_fin)]

    # Assemble exact frame-accurate master audio!
    t0_s1 = 0.0
    t0_s2 = len(fr_s1) / float(FPS)
    t0_mid = t0_s2 + len(fr_s2) / float(FPS)
    t0_s3 = t0_mid + len(fr_mid_16) / float(FPS)
    t0_s4 = t0_s3 + len(fr_s3) / float(FPS)
    t0_fin = t0_s4 + len(fr_s4) / float(FPS)
    total_frames = len(fr_s1) + len(fr_s2) + len(fr_mid_16) + len(fr_s3) + len(fr_s4) + len(fr_fin_16)
    total_dur = total_frames / float(FPS)

    print("[3/5] Mixing Master Broadcast Audio (-14.5 LUFS Charon + Pen Foley + Mid/Finale Brand SFX + 15% Calm BGM)...")
    master_st = synth_calm_lounge_bgm(total_dur) * 0.15

    # Voice placements (100% full broadcast clarity)
    mix_into(master_st, t0_s1, vo_s1, gain=1.02)
    mix_into(master_st, t0_s2, vo_s2, gain=1.02)
    mix_into(master_st, t0_s3, vo_s3, gain=1.02)
    mix_into(master_st, t0_s4, vo_s4, gain=1.02)

    # Synced pen-drawing foley per scene
    for idx_sc, (base_t, cues) in enumerate([(t0_s1, foley_1), (t0_s2, foley_2), (t0_s3, foley_3), (t0_s4, foley_4)]):
        for off_t, dur_p in cues:
            mix_into(master_st, base_t + off_t, sfx_fast_pen_flurry(dur_p, seed=300 + idx_sc * 19 + int(off_t * 10)), gain=0.42)

    # Subtle opening brand chime when '부자생각' is first named in Scene 1
    mix_into(master_st, t0_s1 + d_s1 * 0.76, sfx_mid_brand_flash(0.90), gain=0.48)
    # Midpoint '부자생각' Brand Stinger SFX (full clarity in speech-free interlude!)
    mix_into(master_st, t0_mid, sfx_mid_brand_flash(d_mid), gain=0.95)
    # Finale '부자생각' Brand Stinger 5-note Sonic Logo Chime!
    mix_into(master_st, t0_fin - 0.04, sfx_finale_boozathink_chime(d_fin), gain=0.95)

    master_wav = OUT_DIR / "_intro_master_mix.wav"
    write_stereo_wav(master_wav, master_st)

    # Encode 16:9 Widescreen Channel Trailer MP4
    print("[4/5] Encoding 16:9 Channel Trailer (`1920x1080`) & 9:16 Vertical Shorts (`1080x1920`)...")
    mp4_16x9 = OUT_DIR / "BOOZATHINK_Official_01_Channel_Intro_16x9_1080p.mp4"
    cmd_16 = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x1080", "-r", str(FPS), "-i", "-",
        "-i", str(master_wav),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
        str(mp4_16x9),
    ]
    p16 = subprocess.Popen(cmd_16, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for seq in (fr_s1, fr_s2, fr_mid_16, fr_s3, fr_s4, fr_fin_16):
        for fr in seq:
            p16.stdin.write(fr.tobytes())
    p16.stdin.close()
    p16.wait()

    # Save 2 preview PNG frames for visual inspection!
    fr_s2[int(len(fr_s2) * 0.62)].save(OUT_DIR / "Preview_16x9_PenDrawing_Scene2.png")
    fr_mid_16[int(len(fr_mid_16) * 0.72)].save(OUT_DIR / "Preview_16x9_Midpoint_BrandStinger.png")
    fr_fin_16[int(len(fr_fin_16) * 0.85)].save(OUT_DIR / "Preview_16x9_Finale_BrandStinger.png")

    # Encode 9:16 Vertical Shorts MP4 (full-screen vertical stingers + crisp vertical wrapper!)
    shorts_base = make_shorts_wrapper_base(brush_white_gold)
    wrap_scene_16x9_into_9x16(fr_s2[int(len(fr_s2) * 0.62)], shorts_base).save(OUT_DIR / "Preview_9x16_Shorts_Scene2.png")
    mp4_9x16 = OUT_DIR / "BOOZATHINK_Official_01_Channel_Intro_9x16_Shorts.mp4"
    cmd_9 = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1080x1920", "-r", str(FPS), "-i", "-",
        "-i", str(master_wav),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
        str(mp4_9x16),
    ]
    p9 = subprocess.Popen(cmd_9, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for kind, seq in (
        ("wrap", fr_s1),
        ("wrap", fr_s2),
        ("full", fr_mid_9),
        ("wrap", fr_s3),
        ("wrap", fr_s4),
        ("full", fr_fin_9),
    ):
        for fr in seq:
            out_fr = wrap_scene_16x9_into_9x16(fr, shorts_base) if kind == "wrap" else fr
            p9.stdin.write(out_fr.tobytes())
    p9.stdin.close()
    p9.wait()

    # Render 1280x720 Thumbnail
    print("[5/5] Rendering 1280x720 Channel Trailer Thumbnail & Copy-Paste Upload Sheet...")
    thumb_jpg = render_intro_thumbnail_1280x720(
        brush_white_gold,
        OUT_DIR / "BOOZATHINK_Official_01_Channel_Intro_Thumbnail_1280x720.jpg",
    )

    copy_txt = MANUAL_INTRO_BOX / "BOOZATHINK_Official_01_Channel_Intro_제목_설명_고정댓글_복사용.txt"
    copy_txt.write_text(
        """[부자생각 (BoozaThink) — 공식 채널 소개 영상(16:9 홈 트레일러 & 9:16 쇼츠) 업로드 시트]
================================================================================

▶ 1. 가로형 본편 (`BOOZATHINK_Official_01_Channel_Intro_16x9_1080p.mp4`)
   + 전용 썸네일 (`BOOZATHINK_Official_01_Channel_Intro_Thumbnail_1280x720.jpg`)
   ※ 업로드 후 [YouTube 스튜디오] -> [맞춤설정] -> [홈 탭 / 비구독자용 채널 트레일러]로 지정하시면 채널 대문에 고정됩니다!

[제목 (그대로 복사)]
[부자생각 공식 소개] 창업 전 예상수익 계산부터 운영 중 새는 돈 구멍까지! 무료 3초 실전 시뮬레이터

[설명 (그대로 복사)]
창업을 앞두고 실제로 한 달에 얼마가 남을지 미리 계산해 보고 싶으신가요?
아니면 지금 열심히 사업은 하고 있는데 도대체 어디서 돈이 새는지 손익 구조의 구멍을 확실히 찾아내고 싶으신가요?

예비창업자 · 매장 사장님 · 온라인 셀러를 위한 실전 창업·손익 연구소, 부자생각(boozathink.com)을 소개합니다!

• 30개 업종 실전 창업 마스터: 초기 인테리어·창업비용부터 계절 비수기 버티는 힘까지 한눈에 계산
• 매장 손익 구멍 정밀 탐지: 배달앱 수수료·포장 마진, 상가 월세 손익분기점, 주휴수당 vs 키오스크 전환 비교
• 온라인 셀러 & 자금·세금 3초 판독: 스마트스토어·쿠팡 광고 효율·반품 손실, 내 조건별 저금리 정책자금·대환 진단, 부가세·종합소득세 계산기 & 첫 1년 사업 순서표

올해 12월 31일까지만 모든 업종 시뮬레이터와 조건 비교·결과표 저장을 무료로 열어두었습니다.
창업 전이든 사업 중이든 누구나 편하게 찾아와서 내 숫자를 직접 넣어보세요!

👉 무료 3초 창업·순수익 시뮬레이터: https://boozathink.com/calculators/startup-master?utm_source=youtube&utm_medium=channel_intro
👉 배달·포장 수수료 마진 계산기: https://boozathink.com/calculators/delivery-margin?utm_source=youtube&utm_medium=channel_intro
👉 스마트스토어·쿠팡 셀러 마진 계산기: https://boozathink.com/calculators/seller-roas?utm_source=youtube&utm_medium=channel_intro
👉 정책자금·대환대출 가능 여부 점검: https://boozathink.com/funding?utm_source=youtube&utm_medium=channel_intro
👉 부자생각 공식 홈: https://boozathink.com/

#부자생각 #BoozaThink #창업시뮬레이터 #자영업순수익 #배달마진계산기 #스마트스토어마진 #정책자금 #초보창업 #손익분기점

[베스트 고정댓글 (업로드 직후 첫 댓글로 고정!)]
창업 전에 예상 수익을 미리 계산해 보고 싶은 분도, 지금 장사하시면서 어디서 마진이 새는지 확실히 점검하고 싶은 사장님도 누구나 편하게 써보실 수 있게 올해 12월 31일까지 무료로 열어두었습니다!
👉 내 가게·내 업종 3초 시뮬레이터 바로가기: https://boozathink.com/?utm_source=youtube&utm_medium=intro_pinned

================================================================================

▶ 2. 세로형 쇼츠·릴스 버전 (`BOOZATHINK_Official_01_Channel_Intro_9x16_Shorts.mp4`)

[쇼츠 제목 (그대로 복사)]
창업 전 예상수익 계산도, 장사 중 새는 돈 구멍 찾기도 3초 만에 끝내는 법! #부자생각 #Shorts

[쇼츠 설명 / 인스타 릴스 캡션 (그대로 복사)]
30개 업종 창업비용부터 배달·셀러 수수료 마진, 월세 손익분기점, 정책자금·세금까지 숫자만 넣으면 3초 만에 어디서 돈이 새는지 한눈에 보여드립니다! (올해 12.31까지 무료 개방)

👉 무료 3초 실전 시뮬레이터: https://boozathink.com/?utm_source=yt_shorts&utm_medium=intro_shorts

#부자생각 #BoozaThink #창업비용계산기 #자영업 #소상공인 #온라인셀러 #손익계산 #Shorts
""",
        encoding="utf-8",
    )

    for src in (mp4_16x9, mp4_9x16, thumb_jpg):
        shutil.copy2(src, MANUAL_INTRO_BOX / src.name)

    wav_p1.unlink(missing_ok=True)
    wav_p2.unlink(missing_ok=True)
    master_wav.unlink(missing_ok=True)

    print(
        f"[ALL DONE] 16:9 ({mp4_16x9.stat().st_size:,} bytes) | "
        f"9:16 ({mp4_9x16.stat().st_size:,} bytes) | "
        f"Thumb ({thumb_jpg.stat().st_size:,} bytes) -> staged to {MANUAL_INTRO_BOX}"
    )


if __name__ == "__main__":
    main()

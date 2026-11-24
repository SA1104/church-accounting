# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — High-CTR 16:9 Main Episode Builder (`Long01`: 상가 월세·권리금·환산보증금 함정)
=============================================================================================================
- Topic: “월세 200만 원이면 싸네?” 덜컥 계약했다가 13년 동안 원금 회수 못 하는 이유 (환산보증금 5% 상한 폭탄)
- 100% `backend/lib/calc-engine.js` (`storeLease`) verified figures:
  * 보증금 3,000만 + 월세 200만 + 관리비 30만 + 인건비·공과금 450만 = 숨만 쉬어도 월 고정비 680만 원
  * 12,000원 메뉴(변동비 48%, 건당 공헌이익 6,240원) 기준 손익분기 주문 수 = 하루 42건(월 1,308만 원)
  * 하루 45건(월 1,404만 원) 팔아도 월 순이익 단 50만 원 -> 권리금·인테리어 8,000만 원 회수에 160개월(13년 4개월)!
  * 환산보증금 `보증금 + (월세×100)` 초과 시(서울 9억·과밀/부산 6.9억·광역시 5.4억) 법정 5% 인상 상한 소멸!
- ZERO promotional spam words ('무료', '이벤트', '할인', '특가') on screen, thumbnail, or audio!
"""
from __future__ import annotations

import asyncio
import base64
import io
import os
import subprocess
import sys
import time
import wave
from pathlib import Path

import edge_tts
import httpx
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

STUDIO_DIR = Path(__file__).resolve().parent
if str(STUDIO_DIR) not in sys.path:
    sys.path.insert(0, str(STUDIO_DIR))

import build_boozathink_official_channel_intro as intro_lib  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ASSETS_DIR = STUDIO_DIR / "assets"
OUT_DIR = STUDIO_DIR / "output" / "long01_rent_trap"
RAW_WAV_DIR = OUT_DIR / "_raw_wavs"
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
SR = intro_lib.SR
FPS = intro_lib.FPS

LONG01_NAV_LABELS = [
    ("01", "월세 200만 원의 착시"),
    ("02", "원금 회수 13년의 늪"),
    ("03", "환산보증금 5% 폭탄"),
    ("04", "계약 전 3초 방어 공식"),
]

SCENES = [
    {
        "id": "long01_s01_rent",
        "asset": ASSETS_DIR / "long01_s01_rent_illusion.jpg",
        "kicker": "STEP 01 · 상가 계약 최대 착시 — 월세만 보고 도장 찍으면 안 되는 이유",
        "headline": "“월세 200만 원이면 싸네?” 숨만 쉬어도 고정비 680만 원입니다",
        "card_a": "겉으로 싸 보이는 ‘월세 200만 원’ 1층 상가",
        "card_b": "관리비·인건비·공과금 합친 실제 고정비 680만",
        "cap_first": "보증금 3천에 월세 200만 원짜리 1층 상가, 겉으로만 보면 꽤 해볼 만해 보이시죠?",
        "cap_second": "하지만 관리비 30만 원과 인건비·공과금 450만 원을 더하면 숨만 쉬어도 매달 680만 원이 나갑니다!",
        "voice": (
            "보증금 삼천에 월세 이백만 원짜리 일층 상가, 부동산 말만 들으면 꽤 싸고 해볼 만해 보이시죠? "
            "하지만 여기에 상가 관리비 삼십만 원, 최소 인건비와 전기·가스 공과금 사백오십만 원을 더하면, "
            "가게 문을 열자마자 숨만 쉬어도 매달 육백팔십만 원이 빠져나갑니다!"
        ),
        "highlight_brand": True,
    },
    {
        "id": "long01_s02_payback",
        "asset": ASSETS_DIR / "long01_s02_13yr_payback.jpg",
        "kicker": "STEP 02 · 손익분기 주문 수와 권리금·인테리어 원금 회수의 늪",
        "headline": "하루 45건 쉬지 않고 팔아도, 원금 8천만 원 회수에 13년 4개월!",
        "card_a": "하루 42건 본전 · 45건 팔아도 월 순익 단 50만 원",
        "card_b": "권리금·인테리어 8,000만 원 회수에 무려 160개월!",
        "cap_first": "12,000원 메뉴를 하루 42건 팔아야 겨우 본전이고, 하루 45건씩 팔아도 월 50만 원 남습니다.",
        "cap_second": "권리금과 인테리어에 넣은 8,000만 원을 뽑으려면 무려 160개월, 13년 4개월을 일해야 합니다!",
        "voice": (
            "만 이천 원짜리 메뉴에서 원가와 수수료를 빼면 한 그릇당 육천이백사십 원이 남는데요. "
            "하루 마흔두 건을 팔아야 겨우 영원 본전이고, 하루 마흔다섯 건씩 한 달 내내 팔아도 내 손엔 오십만 원밖에 안 남습니다. "
            "결국 권리금과 인테리어로 넣은 팔천만 원을 다 뽑으려면 무려 백육십 개월, 십삼 년 사 개월 동안 건물주를 위해 일해야 한다는 계산이 나옵니다!"
        ),
        "highlight_brand": False,
    },
    {
        "id": "long01_s03_capbomb",
        "asset": ASSETS_DIR / "long01_s03_5pct_cap_bomb.jpg",
        "kicker": "STEP 03 · 장사 잘될 때 터지는 ‘환산보증금 5% 인상 상한’ 폭탄",
        "headline": "보증금 + (월세×100) 기준 넘기면 법정 5% 보호막이 사라집니다",
        "card_a": "환산보증금 초과 시 재계약 월세 +30% 인상 통보",
        "card_b": "지역별 기준선 안쪽이면 법정 5% 상한 철통 방어",
        "cap_first": "더 무서운 건 재계약 때입니다. 보증금에 월세 곱하기 100을 더한 환산보증금이 기준을 넘기면,",
        "cap_second": "법정 5% 인상 상한 보호막이 사라져, 장사가 잘될 때 월세를 30% 올려달라 해도 막기 어렵습니다!",
        "voice": (
            "더 무서운 함정은 장사가 잘될 때 찾아오는 재계약입니다. "
            "보증금에 월세 곱하기 백을 더한 환산보증금이 서울 구억 원, 과밀억제권역과 부산 육억 구천만 원, 광역시 오억 사천만 원을 단 천만 원이라도 넘기면, "
            "법이 지켜주는 오 퍼센트 임대료 인상 상한선이 사라져 버립니다. "
            "겨우 단골을 모아놨는데 월세를 삼십 퍼센트 올려달라고 통보받아도 법으로 막기가 정말 어려워지는 거죠."
        ),
        "highlight_brand": False,
    },
    {
        "id": "long01_s04_shield",
        "asset": ASSETS_DIR / "long01_s04_3sec_shield.jpg",
        "kicker": "STEP 04 · 상가 계약 도장 찍기 전 내 돈을 지키는 3초 방어 공식",
        "headline": "계약서 도장 찍기 전 ‘부자생각’에서 딱 3가지만 먼저 돌려보세요",
        "card_a": "손익분기 주문수 · 24개월 회수 · 5% 상한 판독",
        "card_b": "월세 비율 10% 이내 · 내 월급 지키는 안전 매장",
        "cap_first": "계약서에 도장 찍기 전, 예상 매출 대비 월세가 10% 이내인지, 2년 안에 원금 회수가 되는지 꼭 따져보세요.",
        "cap_second": "검색창에 ‘부자생각(boozathink.com)’을 쳐서 보고 계신 상가 월세와 권리금을 3초 만에 판독해 보세요!",
        "voice": (
            "그래서 상가 계약서에 도장을 찍기 직전엔 반드시 세 가지를 먼저 계산해 봐야 합니다. "
            "첫째, 하루 몇 건을 팔아야 손익분기점을 넘는지. 둘째, 초기 시설비와 권리금을 이 년 안에 회수할 수 있는지. "
            "셋째, 내 상가가 오 퍼센트 상한 보호 구간 안에 있는지입니다. "
            "지금 검색창에 부자생각을 검색하셔서 보고 계신 상가의 보증금과 월세를 넣어 삼 초 만에 안전 여부를 확인해 보세요!"
        ),
        "highlight_brand": True,
    },
]


async def _edge_tts_ko(text: str, out_mp3: Path) -> None:
    comm = edge_tts.Communicate(text=text, voice="ko-KR-InJoonNeural", rate="+6%")
    await comm.save(str(out_mp3))


def make_scene_master_wav(scene_id: str, text: str) -> Path:
    RAW_WAV_DIR.mkdir(parents=True, exist_ok=True)
    raw_wav = RAW_WAV_DIR / f"{scene_id}_charon_raw.wav"
    out_wav = OUT_DIR / f"_{scene_id}_master.wav"

    used_charon = raw_wav.exists() and raw_wav.stat().st_size > 16000
    if not used_charon:
        try:
            api_key = intro_lib._resolve_gemini_api_key()
        except Exception:
            api_key = ""
        if api_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key={api_key}"
            prompt_txt = (
                "Read the following Korean transcript aloud verbatim in a confident, warm, trustworthy, articulate 30s Korean "
                "business & commercial real-estate finance YouTuber host tone:\n"
                f'"{text}"'
            )
            payload = {
                "contents": [{"parts": [{"text": prompt_txt}]}],
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Charon"}}},
                },
            }
            try:
                with httpx.Client(trust_env=False, timeout=75.0) as client:
                    r = client.post(url, json=payload)
                    if r.status_code == 429:
                        print(f"  [TTS Notice] {scene_id} Gemini 429 -> instant Studio Neural fallback")
                    else:
                        r.raise_for_status()
                        b64_pcm = r.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
                        with wave.open(str(raw_wav), "wb") as wf:
                            wf.setnchannels(1)
                            wf.setsampwidth(2)
                            wf.setframerate(24000)
                            wf.writeframes(base64.b64decode(b64_pcm))
                        used_charon = True
                        time.sleep(1.2)
            except Exception as exc:
                print(f"  [TTS Fallback] {scene_id}: {exc}")

    if used_charon:
        af = (
            "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-42dB,"
            "areverse,silenceremove=start_periods=1:start_silence=0.07:start_threshold=-42dB,areverse,"
            "atempo=1.05,equalizer=f=3200:t=q:w=1.2:g=2.0,loudnorm=I=-14.5:TP=-1.2:LRA=9,"
            "apad=pad_dur=0.26"
        )
        subprocess.run(
            [FFMPEG_EXE, "-y", "-i", str(raw_wav), "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(out_wav)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    else:
        tmp_mp3 = OUT_DIR / f"_{scene_id}_fb.mp3"
        asyncio.run(_edge_tts_ko(text, tmp_mp3))
        af_fb = (
            "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-45dB,"
            "areverse,silenceremove=start_periods=1:start_silence=0.06:start_threshold=-45dB,areverse,"
            "loudnorm=I=-14.5:TP=-1.2:LRA=9,apad=pad_dur=0.26"
        )
        subprocess.run(
            [FFMPEG_EXE, "-y", "-i", str(tmp_mp3), "-af", af_fb, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(out_wav)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        tmp_mp3.unlink(missing_ok=True)
    return out_wav


def build_clean_16x9_binder_static(
    step_idx: int,
    scene_kicker: str,
    scene_headline: str,
    left_card_title: str,
    right_card_title: str,
    brush_indigo_cobalt: Image.Image,
) -> Image.Image:
    """Renders 16:9 Cobalt-Mint Architect Binder with episode-specific 4 steps and ZERO '무료' badge."""
    intro_lib.STEP_NAV_LABELS = LONG01_NAV_LABELS
    img = intro_lib.build_16x9_architect_binder_static(
        step_idx=step_idx,
        scene_kicker=scene_kicker,
        scene_headline=scene_headline,
        left_card_title=left_card_title,
        right_card_title=right_card_title,
        brush_indigo_cobalt=brush_indigo_cobalt,
    ).convert("RGBA")
    dr = ImageDraw.Draw(img, "RGBA")
    # Overpaint sidebar bottom pill cleanly so ZERO '무료' appears anywhere on screen
    dr.rounded_rectangle([54, 862, 364, 1018], radius=24, fill=(240, 253, 244, 255), outline=(16, 185, 129, 255), width=3)
    f_f1 = intro_lib._font(19, True)
    t_f1 = "상가 월세 · 권리금 3초 판독"
    dr.text((209 - dr.textlength(t_f1, font=f_f1) / 2, 886), t_f1, font=f_f1, fill=(5, 150, 105, 255))
    dr.rounded_rectangle([74, 928, 344, 994], radius=33, fill=(37, 99, 235, 255))
    f_u = intro_lib._font(25, True)
    t_u = "boozathink.com"
    dr.text((209 - dr.textlength(t_u, font=f_u) / 2, 944), t_u, font=f_u, fill=(255, 255, 255, 255))
    return img.convert("RGB")


def render_16x9_only_scene(
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
    duration_sec: float,
    highlight_brand_at: float | None = None,
) -> tuple[list[Image.Image], list[tuple[float, float]]]:
    n_frames = max(12, int(round(duration_sec * FPS)))
    src_full = Image.open(asset_path).convert("RGB")
    mid_src = src_full.width // 2
    src_left = src_full.crop((0, 0, mid_src, src_full.height))
    src_right = src_full.crop((mid_src, 0, src_full.width, src_full.height))

    w16, h16 = 628, 568
    col16_a, ink16_a, ord16_a, px16_a, py16_a = intro_lib._trace_ink_box(src_left, w16, h16)
    col16_b, ink16_b, ord16_b, px16_b, py16_b = intro_lib._trace_ink_box(src_right, w16, h16)
    diag16 = (
        np.linspace(0.0, 1.0, w16, dtype=np.float32)[None, :] * 0.65
        + np.linspace(0.0, 1.0, h16, dtype=np.float32)[:, None] * 0.35
    )
    base16_arr = np.asarray(
        build_clean_16x9_binder_static(step_idx, scene_kicker, scene_headline, card_a_title, card_b_title, brush_indigo_cobalt),
        dtype=np.float32,
    )
    ink_rgb = np.array([24.0, 38.0, 74.0], dtype=np.float32)[None, None, :]

    t_l0, t_l1 = 0.10, duration_sec * 0.38
    t_lc0, t_lc1 = duration_sec * 0.28, duration_sec * 0.46
    t_r0, t_r1 = duration_sec * 0.48, duration_sec * 0.82
    t_rc0, t_rc1 = duration_sec * 0.72, duration_sec * 0.92
    foley_cues = [(t_l0, max(0.4, t_l1 - t_l0)), (t_r0, max(0.4, t_r1 - t_r0))]

    f_cap16 = intro_lib._font(30, True)
    frames_16: list[Image.Image] = []

    def _apply_draw(patch: np.ndarray, ink_m: np.ndarray, col_m: np.ndarray, ord_m: np.ndarray, p_d: float, p_c: float) -> np.ndarray:
        rev = np.clip((p_d - ord_m) / 0.038, 0.0, 1.0)
        ia = (0.88 * ink_m * rev)[:, :, None]
        layer = patch * (1.0 - ia) + ink_rgb * ia
        if p_c > 0.003:
            wm = np.clip((p_c * 1.25 - diag16) / 0.22, 0.0, 1.0)[:, :, None]
            colored = patch * (col_m / 255.0)
            layer = layer * (1.0 - wm) + np.minimum(colored, layer + 20.0) * wm
        return layer

    for fn in range(n_frames):
        t = fn / float(FPS)
        c16 = base16_arr.copy()
        pen16 = None

        if t >= t_l0:
            pl = float(np.clip((t - t_l0) / max(0.15, t_l1 - t_l0), 0.0, 1.0))
            pcl = float(np.clip((t - t_lc0) / max(0.15, t_lc1 - t_lc0), 0.0, 1.0))
            c16[266 : 266 + h16, 484 : 484 + w16] = _apply_draw(c16[266 : 266 + h16, 484 : 484 + w16], ink16_a, col16_a, ord16_a, pl, pcl)
            if pl < 0.992:
                i16 = min(len(px16_a) - 1, int(pl * (len(px16_a) - 1)))
                pen16 = (484 + int(px16_a[i16]), 266 + int(py16_a[i16]))

        if t >= t_r0:
            pr = float(np.clip((t - t_r0) / max(0.15, t_r1 - t_r0), 0.0, 1.0))
            pcr = float(np.clip((t - t_rc0) / max(0.15, t_rc1 - t_rc0), 0.0, 1.0))
            c16[266 : 266 + h16, 1192 : 1192 + w16] = _apply_draw(c16[266 : 266 + h16, 1192 : 1192 + w16], ink16_b, col16_b, ord16_b, pr, pcr)
            if pr < 0.992:
                i16 = min(len(px16_b) - 1, int(pr * (len(px16_b) - 1)))
                pen16 = (1192 + int(px16_b[i16]), 266 + int(py16_b[i16]))

        im16 = Image.fromarray(np.clip(c16, 0, 255).astype(np.uint8)).convert("RGBA")
        dr16 = ImageDraw.Draw(im16, "RGBA")

        cur_c16 = cap_first if t < (duration_sec * 0.48) else cap_second
        dr16.rounded_rectangle([468, 876, 1836, 1018], radius=24, fill=(248, 250, 252, 255), outline=(37, 99, 235, 255), width=3)
        dr16.rounded_rectangle([468, 876, 488, 1018], radius=10, fill=(37, 99, 235, 255))
        tw16 = dr16.textlength(cur_c16, font=f_cap16)
        dr16.text((1156 - tw16 / 2, 927), cur_c16, font=f_cap16, fill=(15, 23, 42, 255))

        if highlight_brand_at is not None and abs(t - highlight_brand_at) < 0.65:
            ga = int(220 * (1.0 - abs(t - highlight_brand_at) / 0.65))
            dr16.rounded_rectangle([48, 52, 370, 304], radius=26, outline=(37, 99, 235, ga), width=6)

        if pen16 is not None:
            im16.paste(pen_sprite, (pen16[0] - 14, pen16[1] - 160), pen_sprite)
        frames_16.append(im16.convert("RGB"))

    return frames_16, foley_cues


def render_clean_finale_stinger_frame(w: int, h: int, progress: float, brush_indigo_cobalt: Image.Image) -> Image.Image:
    p = max(0.0, min(1.0, progress))
    canvas = Image.new("RGBA", (w, h), (232, 241, 253, 255))
    dr = ImageDraw.Draw(canvas, "RGBA")
    dr.rounded_rectangle([42, 42, w - 42, h - 42], radius=38, fill=(255, 255, 255, 255), outline=(37, 99, 235, 255), width=5)

    for rx in range(140, w - 120, 120):
        dr.rounded_rectangle([rx - 9, 22, rx + 9, 64], radius=8, fill=(148, 163, 184, 255), outline=(71, 85, 105, 255), width=2)

    cx, cy = w // 2, h // 2
    target_lw = 650
    target_lh = int(round(target_lw * brush_indigo_cobalt.height / float(brush_indigo_cobalt.width)))
    logo_full = brush_indigo_cobalt.resize((target_lw, target_lh), Image.Resampling.LANCZOS)

    rev_w = max(2, int(target_lw * min(1.0, p / 0.44)))
    ly0 = cy - target_lh // 2 - 105
    canvas.alpha_composite(logo_full.crop((0, 0, rev_w, target_lh)), (cx - target_lw // 2, ly0))

    if p > 0.28:
        sp = min(1.0, (p - 0.28) / 0.28)
        bw_bar = int(680 * sp)
        bx0 = cx - 340
        by0 = ly0 + target_lh + 28
        dr.rounded_rectangle([bx0, by0, bx0 + bw_bar, by0 + 82], radius=41, fill=(37, 99, 235, 255), outline=(147, 197, 253, 255), width=4)
        if sp > 0.55:
            t1 = "부자생각  ·  boozathink.com"
            f1 = intro_lib._font(38, True)
            dr.text((cx - dr.textlength(t1, font=f1) / 2, by0 + 17), t1, font=f1, fill=(255, 255, 255, 255))

        if p > 0.46:
            sp2 = min(1.0, (p - 0.46) / 0.25)
            t2 = "상가 월세 손익분기점 · 권리금 회수기간 · 환산보증금 5% 상한 3초 판독"
            f2 = intro_lib._font(28, True)
            dr.text((cx - dr.textlength(t2, font=f2) / 2, by0 + 106), t2, font=f2, fill=(5, 150, 105, int(255 * sp2)))

    return canvas.convert("RGB")


def render_hook_thumbnail_1280x720(brush_white_mint: Image.Image, out_jpg: Path) -> Path:
    """High-CTR 1280x720 Thumbnail for Store Rent & Key-Money 13-Year Trap (ZERO '무료' text)."""
    buf_logo = io.BytesIO()
    brush_white_mint.save(buf_logo, format="PNG")
    logo_b64 = base64.b64encode(buf_logo.getvalue()).decode("ascii")

    # Crop the dramatic right-zone calendar/boulder from long01_s02_13yr_payback.jpg for crystal-clear mobile readability!
    s2_img = Image.open(ASSETS_DIR / "long01_s02_13yr_payback.jpg").convert("RGB").crop((760, 75, 1385, 680))
    buf_art = io.BytesIO()
    s2_img.save(buf_art, format="JPEG", quality=95)
    art_b64 = base64.b64encode(buf_art.getvalue()).decode("ascii")

    html = f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      width: 1280px; height: 720px; overflow: hidden; position: relative;
      background: linear-gradient(114deg, #0f172a 0%, #1e3a8a 56%, #eaf2fc 56.2%, #eaf2fc 100%);
      font-family: 'Pretendard', 'Malgun Gothic', sans-serif;
      padding: 40px 46px; display: flex; align-items: center; justify-content: space-between;
    }}
    .left {{ width: 690px; display: flex; flex-direction: column; align-items: flex-start; gap: 18px; z-index: 2; }}
    .brand-row {{ display: flex; align-items: center; gap: 16px; }}
    .brand-row img {{ height: 72px; width: auto; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.4)); }}
    .b-pill {{
      background: #e11d48; color: #ffffff; font-size: 24px; font-weight: 900;
      padding: 9px 22px; border-radius: 999px; border: 2.5px solid #fda4af;
      box-shadow: 0 8px 20px rgba(225, 29, 72, 0.35);
    }}
    .main-h {{
      font-size: 56px; font-weight: 900; color: #ffffff; line-height: 1.18; letter-spacing: -0.03em;
      text-shadow: 0 6px 20px rgba(0, 0, 0, 0.45); word-break: keep-all;
    }}
    .main-h .q {{ color: #93c5fd; font-size: 50px; display: block; margin-bottom: 6px; }}
    .main-h .shock {{ color: #fde047; display: block; margin-top: 4px; }}
    .sim-strip {{
      background: rgba(255, 255, 255, 0.96); color: #be123c; border-radius: 18px;
      padding: 13px 22px; font-size: 24px; font-weight: 900; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.28);
    }}
    .cta {{
      background: #2563eb; color: #ffffff; border: 3px solid #6ee7b7; border-radius: 999px;
      padding: 12px 28px; font-size: 25px; font-weight: 900;
    }}
    .right-pad {{
      width: 465px; height: 626px; background: #ffffff; border: 4.5px solid #2563eb;
      border-radius: 30px; box-shadow: 0 22px 46px rgba(15, 23, 42, 0.25);
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      padding: 20px 18px; position: relative;
    }}
    .r-top {{
      background: #ffe4e6; color: #be123c; border: 2.5px solid #fb7185;
      border-radius: 999px; padding: 8px 20px; font-size: 22px; font-weight: 900;
    }}
    .right-pad img {{ width: 425px; height: 435px; object-fit: contain; }}
    .r-bot {{
      background: #eff6ff; color: #1d4ed8; border: 2.5px solid #93c5fd;
      border-radius: 16px; padding: 10px 20px; font-size: 22px; font-weight: 900;
    }}
    </style></head><body>
      <div class="left">
        <div class="brand-row">
          <img src="data:image/png;base64,{logo_b64}" />
          <span class="b-pill">상가 계약 · 재계약 전 필독!</span>
        </div>
        <div class="main-h">
          <span class="q">“월세 200만 원이면 싸네?”</span>
          덜컥 계약했다가
          <span class="shock">원금 회수 13년 걸립니다!</span>
        </div>
        <div class="sim-strip">하루 42건 본전 · 권리금 회수 · 5% 상한 폭탄</div>
        <div class="cta">도장 찍기 전 3초 판독 ▶ boozathink.com</div>
      </div>
      <div class="right-pad">
        <div class="r-top">숨만 쉬어도 월 고정비 680만!</div>
        <img src="data:image/jpeg;base64,{art_b64}" />
        <div class="r-bot">부자생각 상가 임대차 손익 판독</div>
      </div>
    </body></html>"""

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        pg = b.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
        pg.set_content(html, wait_until="networkidle")
        pg.screenshot(path=str(out_jpg), type="jpeg", quality=95)
        b.close()
    return out_jpg


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("[1/5] Synthesizing 4 Scene Voiceovers (-14.5 LUFS)...")
    vo_arrays: list[np.ndarray] = []
    vo_durs: list[float] = []
    tmp_wavs: list[Path] = []
    for sc in SCENES:
        w_path = make_scene_master_wav(sc["id"], sc["voice"])
        tmp_wavs.append(w_path)
        st = intro_lib.read_stereo_wav(w_path)
        vo_arrays.append(st)
        vo_durs.append(len(st) / float(SR))

    d_mid = 1.25
    d_fin = 2.95

    brush_indigo_cobalt = intro_lib.load_boozathink_brush_rgba((23, 37, 84), (37, 99, 235), target_w=680)
    brush_white_mint = intro_lib.load_boozathink_brush_rgba((255, 255, 255), (110, 231, 183), target_w=680)
    pen_sprite = intro_lib.create_cobalt_pen_cursor_rgba()

    print("[2/5] Rendering 4 Live-Sketch 16:9 Architect Binder Scenes + Brand Stingers...")
    scene_frames: list[list[Image.Image]] = []
    scene_foleys: list[list[tuple[float, float]]] = []
    for idx, sc in enumerate(SCENES):
        frs, foley = render_16x9_only_scene(
            step_idx=idx,
            asset_path=sc["asset"],
            pen_sprite=pen_sprite,
            brush_indigo_cobalt=brush_indigo_cobalt,
            scene_kicker=sc["kicker"],
            scene_headline=sc["headline"],
            card_a_title=sc["card_a"],
            card_b_title=sc["card_b"],
            cap_first=sc["cap_first"],
            cap_second=sc["cap_second"],
            duration_sec=vo_durs[idx],
            highlight_brand_at=(vo_durs[idx] * 0.80) if sc["highlight_brand"] else None,
        )
        scene_frames.append(frs)
        scene_foleys.append(foley)

    n_mid = int(round(d_mid * FPS))
    fr16_mid = [intro_lib.render_midpoint_stinger_frame(1920, 1080, i / float(max(1, n_mid - 1)), brush_white_mint) for i in range(n_mid)]
    n_fin = int(round(d_fin * FPS))
    fr16_fin = [render_clean_finale_stinger_frame(1920, 1080, i / float(max(1, n_fin - 1)), brush_indigo_cobalt) for i in range(n_fin)]

    # Save visual inspection snapshots
    scene_frames[1][int(len(scene_frames[1]) * 0.85)].save(OUT_DIR / "Preview_Long01_Scene2.png")
    fr16_fin[int(len(fr16_fin) * 0.85)].save(OUT_DIR / "Preview_Long01_Finale.png")

    t0_s1 = 0.0
    t0_s2 = len(scene_frames[0]) / float(FPS)
    t0_mid = t0_s2 + len(scene_frames[1]) / float(FPS)
    t0_s3 = t0_mid + len(fr16_mid) / float(FPS)
    t0_s4 = t0_s3 + len(scene_frames[2]) / float(FPS)
    t0_fin = t0_s4 + len(scene_frames[3]) / float(FPS)
    total_frames = sum(len(s) for s in scene_frames) + len(fr16_mid) + len(fr16_fin)
    total_dur = total_frames / float(FPS)

    print(f"[3/5] Mixing Broadcast Audio ({total_dur:.2f}s)...")
    master_st = intro_lib.synth_calm_lounge_bgm(total_dur) * 0.15
    starts = [t0_s1, t0_s2, t0_s3, t0_s4]
    for idx_sc, base_t in enumerate(starts):
        intro_lib.mix_into(master_st, base_t, vo_arrays[idx_sc], gain=1.02)
        for off_t, dur_p in scene_foleys[idx_sc]:
            intro_lib.mix_into(
                master_st,
                base_t + off_t,
                intro_lib.sfx_fast_pen_flurry(dur_p, seed=500 + idx_sc * 23 + int(off_t * 10)),
                gain=0.42,
            )

    intro_lib.mix_into(master_st, t0_s1 + vo_durs[0] * 0.78, intro_lib.sfx_mid_brand_flash(0.90), gain=0.45)
    intro_lib.mix_into(master_st, t0_mid, intro_lib.sfx_mid_brand_flash(d_mid), gain=0.95)
    intro_lib.mix_into(master_st, t0_fin - 0.04, intro_lib.sfx_finale_boozathink_chime(d_fin), gain=0.95)

    master_wav = OUT_DIR / "_long01_master_mix.wav"
    intro_lib.write_stereo_wav(master_wav, master_st)

    print("[4/5] Encoding 1920x1080 H.264 MP4...")
    mp4_out = OUT_DIR / "BOOZATHINK_Long01_Rent_Trap_16x9_1080p.mp4"
    cmd_16 = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x1080", "-r", str(FPS), "-i", "-",
        "-i", str(master_wav),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
        str(mp4_out),
    ]
    p16 = subprocess.Popen(cmd_16, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for seq in (scene_frames[0], scene_frames[1], fr16_mid, scene_frames[2], scene_frames[3], fr16_fin):
        for fr in seq:
            p16.stdin.write(fr.tobytes())
    p16.stdin.close()
    p16.wait()

    print("[5/5] Rendering High-CTR 1280x720 Thumbnail...")
    thumb_jpg = render_hook_thumbnail_1280x720(
        brush_white_mint,
        OUT_DIR / "BOOZATHINK_Long01_Rent_Trap_Thumbnail_1280x720.jpg",
    )

    for w_p in tmp_wavs:
        w_p.unlink(missing_ok=True)
    master_wav.unlink(missing_ok=True)

    print(
        f"[LONG01 DONE] {mp4_out} ({mp4_out.stat().st_size:,} bytes, {total_dur:.2f}s) | "
        f"Thumb ({thumb_jpg.stat().st_size:,} bytes)"
    )


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Empathetic Real-Story 16:9 Main Episode Builder (`Long04`: 지인 셀러의 ‘ROAS 300%의 배신’ 실화)
=================================================================================================================================
- Unified Topic (`2026-11-28`, paired with 9:16 `EP07` Shorts):
  〈“형! 광고 ROAS 300% 찍고 월 매출 2,700만 원 나왔어!” — 퇴사 고민하던 아는 동생이 정산 날 월급에서 100만 원 메운 이유 & 한 달 만에 월 +386만 원 반전시킨 실전 공식〉
- 100% `backend/lib/calc-engine.js` (`E.seller`) verified figures:
  * 29,900원 캠핑 수납함 (사입 10,200 + 입고물류 1,500 = 11,700원) × 월 900개 판매 = 월 매출 2,691만 원
  * 쿠팡 로켓그로스 실효수수료 11.88%(10.8%+VAT = 3,552원) + 입출고·배송비 3,200원 + 납부부가세 1,041원 + 반품 손실(5% = 1,495원) 차감 시 광고 전 순마진 = 8,912원(29.8%) → 진짜 손익분기 ROAS는 335%!
  * 대행사 리포트 ROAS 300%(개당 광고비 9,967원)에 속아 물량 늘렸다가 팔 때마다 개당 -1,055원 손실 + 월 서버이용료 5.5만 원 = 월 -100만 4천 원 적자!
  * 반전 처방 3가지: ① 스마트스토어 ‘판매자 마케팅 유입 링크(수수료 4.63%)’ 전환, ② 상세페이지 실측표로 반품률 5%→2% 축소(본전 ROAS 335%→246% 하락), ③ 손익분기 CPC(340원)의 70% 안전 입찰상한(220원) 잠금 → 똑같이 900개 팔고 월 +386만 원 순수익(+486만 원 반전)!
- Dynamic Mid-Video Brand Presence:
  * 3 Inter-Scene `BOOZA THINK` Brush Logo Stingers + `휙-쿵-띠리링!` (`sfx_mid_brand_flash`)
  * 4 Mid-Scene Sidebar Emerald-Cobalt Halo + `BOOZA THINK 핵심 체크` Stamp + Crystal Chime Ping
  * Finale 2-Line Brush Wipe + 5-Note Ascending Sonic Logo Chime
- ZERO promotional spam words ('무료', '이벤트', '할인', '특가') anywhere!
"""
from __future__ import annotations

import asyncio
import base64
import io
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
OUT_DIR = STUDIO_DIR / "output" / "long04_seller_roas_story"
RAW_WAV_DIR = OUT_DIR / "_raw_wavs"
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
SR = intro_lib.SR
FPS = intro_lib.FPS

LONG04_NAV_LABELS = [
    ("01", "ROAS 300%의 비극"),
    ("02", "29,900원의 진실"),
    ("03", "+386만 반전 처방"),
    ("04", "광고 전 3초 검산"),
]

SCENES = [
    {
        "id": "long04_s01_story",
        "asset": ASSETS_DIR / "long04_s01_friend_shock_story.jpg",
        "kicker": "STEP 01 · 실제 주변에서 벌어진 일 — “형! ROAS 300% 찍고 월 매출 2,700만 원 나왔어!”",
        "headline": "퇴사까지 고민하던 아는 동생이, 정산 날 월급에서 100만 원을 메운 이유",
        "card_a": "ROAS 300% · 월 900개 판매에 들떴던 밤",
        "card_b": "정산 날 통장 결과 → 본업 월급에서 -100만 원!",
        "cap_first": "퇴근 후 밤잠 줄여가며 쿠팡·스토어를 시작한 동생이 ‘ROAS 300% 찍고 하루 30개씩 팔린다’며 기뻐했습니다.",
        "cap_second": "그런데 한 달 뒤 정산 날, 900개나 팔고도 오히려 카드값 메우느라 내 돈 100만 원이 마이너스가 났습니다!",
        "voice": (
            "얼마 전 직장 다니면서 밤잠 줄여가며 온라인 쇼핑몰을 시작한 아는 동생에게 들뜬 목소리로 전화가 왔습니다. "
            "형! 광고 효율 로아스가 드디어 삼백 퍼센트를 넘겼어! 이만 구천구백 원짜리 캠핑 수납함이 하루 서른 개씩 한 달 구백 개나 팔려서 월 매출 이천칠백만 원 찍었어, 이제 진짜 퇴사해도 될까? 라며 신나하더라고요. "
            "그런데 한 달 뒤 정산 날 다시 만났을 때 그 친구 얼굴이 하얗게 질려 있었습니다. "
            "한 달 내내 밤새워 구백 개를 팔았는데 통장에 남기는커녕, 카드값과 사입비를 메우느라 본업 월급에서 오히려 백만 원이 마이너스가 났다는 겁니다! 대체 왜 이런 일이 벌어졌을까요?"
        ),
    },
    {
        "id": "long04_s02_leaks",
        "asset": ASSETS_DIR / "long04_s02_five_hidden_leaks.jpg",
        "kicker": "STEP 02 · 그날 카페에서 노트북 펴고 한 줄씩 뜯어본 ‘29,900원 1개’의 숨은 구멍 5가지",
        "headline": "진짜 손익분기 ROAS는 335%였는데, 300% 숫자에 속아 팔수록 적자!",
        "card_a": "실효수수료 11.88% · 물류 · 부가세 · 반품 해부",
        "card_b": "본전 ROAS 335% vs 실제 300% → 개당 -1,055원",
        "cap_first": "쿠팡 수수료 10.8%에는 부가세가 별도로 붙어 실제로는 11.88%가 빠지고, 입출고비·납부부가세·반품 손실이 겹칩니다.",
        "cap_second": "광고 전 순마진은 8,912원(본전 ROAS 335%)뿐인데 개당 광고비로 9,967원을 쓰니 팔 때마다 1,055원씩 손해였던 거죠!",
        "voice": (
            "그날 바로 카페에서 노트북을 펴고 이만 구천구백 원짜리 상품 한 개에서 빠져나가는 돈을 원 단위로 전부 뜯어봤습니다. "
            "그 친구는 만 천칠백 원에 떼와서 이만 구천구백 원에 파니 만 팔천 원 넘게 남는 줄 알았는데요. "
            "초보 셀러들이 가장 많이 놓치는 게 쿠팡 수수료 십점팔 퍼센트에는 부가세가 별도로 붙어 실제로는 십일점팔팔 퍼센트, 삼천오백오십이 원이 빠진다는 점입니다. "
            "여기에 로켓그로스 입출고 배송비 삼천이백 원, 납부할 부가세 천사십일 원, 오 퍼센트 반품 손실 천사백구십오 원까지 빼고 나니 광고 전 진짜 순마진은 팔천구백십이 원뿐이었습니다! "
            "즉 본전이 되려면 로아스가 최소 삼백삼십오 퍼센트는 나와야 했는데, 삼백 퍼센트 리포트만 믿고 한 개 팔 때마다 광고비 구천구백육십칠 원을 태우니 팔릴 때마다 내 돈 천오십오 원씩을 얹어서 보내주고 있었던 겁니다!"
        ),
    },
    {
        "id": "long04_s03_turnaround",
        "asset": ASSETS_DIR / "long04_s03_turnaround_prescription.jpg",
        "kicker": "STEP 03 · 광고를 끄지 않고 ‘딱 3가지’만 고쳐서 한 달 만에 월 +386만 원 만든 처방전",
        "headline": "마케팅 유입 링크(4.63%) + 반품 방어 + 안전 입찰가 잠금으로 +486만 원 역전!",
        "card_a": "수수료 절감 링크 · 반품 개선 · 입찰상한 220원",
        "card_b": "똑같이 900개 팔고 -100만 → +386만 원 대역전!",
        "cap_first": "외부 광고 손님을 스마트스토어 ‘판매자 마케팅 유입 전용 링크’로 연결해 총 수수료를 4.63%로 확 낮췄습니다.",
        "cap_second": "상세페이지 실측표로 반품률을 2%로 줄이고 클릭당 입찰 상한을 220원으로 잠그니 월 386만 원 순수익이 남았습니다!",
        "voice": (
            "다행히 상품 자체의 수요는 확실했기 때문에 광고를 끄는 대신 그 자리에서 딱 세 가지를 고쳤습니다. "
            "첫째, 외부 광고로 데려오는 손님을 스마트스토어의 판매자 마케팅 유입 전용 링크로 연결해 판매수수료를 일 퍼센트로 낮추고 총 수수료를 사점육삼 퍼센트로 확 줄였습니다. "
            "둘째, 상세페이지 맨 위에 실측 사이즈 비교표를 넣어 단순변심 반품률을 오 퍼센트에서 이 퍼센트로 낮췄더니 본전 로아스가 이백사십육 퍼센트까지 뚝 떨어졌습니다. "
            "셋째, 전환율 이점팔 퍼센트 기준 손익분기 클릭 단가인 삼백사십 원의 칠십 퍼센트 안전선, 즉 이백이십 원으로 광고 입찰 상한선을 걸어두었습니다. "
            "결과가 어땠을까요? 다음 달 똑같이 구백 개를 팔았는데 마이너스 백만 원이던 통장에 순수익 삼백팔십육만 원이 또박또박 찍혔습니다!"
        ),
    },
    {
        "id": "long04_s04_check",
        "asset": ASSETS_DIR / "long04_s04_seller_roas_check.jpg",
        "kicker": "STEP 04 · 오늘 밤 광고비 1만 원 더 충전하기 전, 내 상품의 진짜 본전선부터 3초 검산!",
        "headline": "리포트 숫자에 속지 마세요 — 내 상품 손익분기 ROAS와 안전 CPC 3초 판독",
        "card_a": "본전 ROAS · 최대 CPA · 환율 연동 사입원가",
        "card_b": "부자생각 셀러 마진 · 손익분기 ROAS 계산기",
        "cap_first": "내 상품의 진짜 손익분기 ROAS와 클릭당 몇 원까지 입찰해도 되는지 모른 채 광고를 돌리면 밑 빠진 독이 됩니다.",
        "cap_second": "지금 검색창에 ‘부자생각(boozathink.com)’을 쳐서 내 상품 사입가와 판매가를 넣어 3초 만에 확인해 보세요!",
        "voice": (
            "지금 이 순간에도 수많은 대표님들이 광고 대행사 리포트에 찍힌 로아스 이백오십 퍼센트, 삼백 퍼센트 숫자만 보고 내 돈이 새는 줄도 모른 채 밤새 택배를 싸고 계십니다. "
            "오늘 광고비를 단 만 원이라도 더 충전하기 전에 내 상품의 진짜 손익분기 로아스는 몇 퍼센트인지, 클릭당 몇 원 이상 입찰하면 적자인지부터 꼭 확인해 보세요. "
            "지금 검색창에 부자생각을 검색하셔서 판매가와 사입 원가만 입력하시면, 스마트스토어와 쿠팡 실효 수수료부터 위안화·달러 환율 연동 원가, 안전 클릭 단가까지 삼 초 만에 선명하게 확인하실 수 있습니다!"
        ),
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
                "Read the following Korean transcript aloud verbatim in a warm, relatable, empathetic, trustworthy 30s Korean "
                "e-commerce & business mentor YouTuber tone (like telling a vivid real story about a close younger friend over coffee):\n"
                f'"{text}"'
            )
            payload = {
                "contents": [{"parts": [{"text": prompt_txt}]}],
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Charon"}}},
                },
            }
            for attempt in range(1, 4):
                try:
                    with httpx.Client(trust_env=False, timeout=80.0) as client:
                        r = client.post(url, json=payload)
                        if r.status_code == 429 and attempt < 3:
                            wait_s = 22 * attempt
                            print(f"  [Charon RPM Wait] {scene_id} waiting {wait_s}s for next minute window...")
                            time.sleep(wait_s)
                            continue
                        r.raise_for_status()
                        b64_pcm = r.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
                    with wave.open(str(raw_wav), "wb") as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2)
                        wf.setframerate(24000)
                        wf.writeframes(base64.b64decode(b64_pcm))
                    used_charon = True
                    time.sleep(4.0)
                    break
                except Exception as exc:
                    print(f"  [TTS Notice] {scene_id} attempt {attempt}: {exc}")
                    if attempt == 3:
                        break
                    time.sleep(8.0)

    if used_charon:
        af = (
            "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-42dB,"
            "areverse,silenceremove=start_periods=1:start_silence=0.07:start_threshold=-42dB,areverse,"
            "atempo=1.06,equalizer=f=3200:t=q:w=1.2:g=2.0,loudnorm=I=-14.5:TP=-1.2:LRA=9,"
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


def sfx_brand_ping_16x9(dur_sec: float = 0.58) -> np.ndarray:
    n_tot = int(round(dur_sec * SR))
    st = np.zeros((n_tot, 2), dtype=np.float32)
    for st_t, hz in [(0.0, 1046.50), (0.095, 1318.51)]:
        s0 = int(round(st_t * SR))
        bn = min(int(0.45 * SR), n_tot - s0)
        if bn > 32:
            tb = np.arange(bn, dtype=np.float32) / SR
            bell = np.sin(2.0 * np.pi * hz * tb) * np.minimum(1.0, tb / 0.004) * np.exp(-tb * 8.2) * 0.13
            st[s0 : s0 + bn, 0] += bell * 0.94
            st[s0 : s0 + bn, 1] += bell * 1.06
    return st


def render_custom_midpoint_stinger(w: int, h: int, progress: float, brush_white_mint: Image.Image, subtitle_txt: str) -> Image.Image:
    p = max(0.0, min(1.0, progress))
    ease = 1.0 - (1.0 - min(1.0, p / 0.35)) ** 3
    canvas = Image.new("RGBA", (w, h), (23, 47, 115, 255))
    dr = ImageDraw.Draw(canvas, "RGBA")
    for gx in range(0, w, 48):
        dr.line([(gx, 0), (gx, h)], fill=(59, 130, 246, 48), width=1)
    for gy in range(0, h, 48):
        dr.line([(0, gy), (w, gy)], fill=(59, 130, 246, 48), width=1)

    cx, cy = w // 2, h // 2
    rx = int(490 * (0.92 + 0.08 * ease))
    ry = int(400 * (0.92 + 0.08 * ease))
    dr.rounded_rectangle([cx - rx, cy - ry, cx + rx, cy + ry], radius=56, fill=(30, 64, 175, 255), outline=(110, 231, 183, 255), width=6)

    target_lw = int(590 * (0.86 + 0.14 * ease))
    target_lh = max(32, int(round(target_lw * brush_white_mint.height / float(brush_white_mint.width))))
    logo_sc = brush_white_mint.resize((target_lw, target_lh), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo_sc, (cx - target_lw // 2, cy - target_lh // 2 - 58))

    if p > 0.20:
        hp = min(1.0, (p - 0.20) / 0.28)
        full_bw = 740
        cur_bw = max(28, int(full_bw * hp))
        by0 = cy + target_lh // 2 - 18
        dr.rounded_rectangle([cx - full_bw // 2, by0, cx - full_bw // 2 + cur_bw, by0 + 74], radius=37, fill=(16, 185, 129, 255), outline=(255, 255, 255, 255), width=4)
        if hp > 0.52:
            f_b = intro_lib._font(31, True)
            dr.text((cx - dr.textlength(subtitle_txt, font=f_b) / 2, by0 + 18), subtitle_txt, font=f_b, fill=(255, 255, 255, 255))
    return canvas.convert("RGB")


def build_clean_16x9_binder_static(
    step_idx: int,
    scene_kicker: str,
    scene_headline: str,
    left_card_title: str,
    right_card_title: str,
    brush_indigo_cobalt: Image.Image,
) -> Image.Image:
    intro_lib.STEP_NAV_LABELS = LONG04_NAV_LABELS
    img = intro_lib.build_16x9_architect_binder_static(
        step_idx=step_idx,
        scene_kicker=scene_kicker,
        scene_headline="",
        left_card_title=left_card_title,
        right_card_title=right_card_title,
        brush_indigo_cobalt=brush_indigo_cobalt,
    ).convert("RGBA")
    dr = ImageDraw.Draw(img, "RGBA")
    for sz in range(38, 25, -1):
        fh = intro_lib._font(sz, True)
        if dr.textlength(scene_headline, font=fh) <= 1365:
            dr.text((468, 120 + (38 - sz) // 2), scene_headline, font=fh, fill=(15, 23, 42, 255))
            break

    dr.rounded_rectangle([54, 862, 364, 1018], radius=24, fill=(240, 253, 244, 255), outline=(16, 185, 129, 255), width=3)
    f_f1 = intro_lib._font(19, True)
    t_f1 = "셀러 마진 · 본전 ROAS 판독"
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
) -> tuple[list[Image.Image], list[tuple[float, float]], float]:
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
    ping_at = duration_sec * 0.48

    frames_16: list[Image.Image] = []
    f_stamp = intro_lib._font(20, True)

    def _fit_cap_font(dr_obj: ImageDraw.ImageDraw, txt: str):
        for sz in range(29, 21, -1):
            fc = intro_lib._font(sz, True)
            if dr_obj.textlength(txt, font=fc) <= 1310:
                return fc, sz
        return intro_lib._font(21, True), 21

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
        f_cap, cap_sz = _fit_cap_font(dr16, cur_c16)
        tw16 = dr16.textlength(cur_c16, font=f_cap)
        dr16.text((1160 - tw16 / 2, 947 - cap_sz * 0.65), cur_c16, font=f_cap, fill=(15, 23, 42, 255))

        if abs(t - ping_at) < 0.68:
            ga = int(245 * (1.0 - abs(t - ping_at) / 0.68))
            dr16.rounded_rectangle([48, 52, 370, 304], radius=26, outline=(16, 185, 129, ga), width=6)
            st_lbl = "BOOZA THINK 핵심 체크"
            sw = int(dr16.textlength(st_lbl, font=f_stamp)) + 36
            dr16.rounded_rectangle([1836 - sw, 58, 1836, 104], radius=23, fill=(37, 99, 235, ga), outline=(110, 231, 183, ga), width=2)
            dr16.text((1836 - sw + 18, 69), st_lbl, font=f_stamp, fill=(255, 255, 255, ga))

        if pen16 is not None:
            im16.paste(pen_sprite, (pen16[0] - 14, pen16[1] - 160), pen_sprite)
        frames_16.append(im16.convert("RGB"))

    return frames_16, foley_cues, ping_at


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
            t2 = "스마트스토어 · 쿠팡 실효수수료 · 손익분기 ROAS · 안전 CPC 3초 판독"
            f2 = intro_lib._font(27, True)
            dr.text((cx - dr.textlength(t2, font=f2) / 2, by0 + 106), t2, font=f2, fill=(5, 150, 105, int(255 * sp2)))

    return canvas.convert("RGB")


def render_hook_thumbnail_1280x720(brush_white_mint: Image.Image, out_jpg: Path) -> Path:
    """High-CTR Empathetic Story Seller ROAS Thumbnail (1280x720, ZERO spam words)."""
    buf_logo = io.BytesIO()
    brush_white_mint.save(buf_logo, format="PNG")
    logo_b64 = base64.b64encode(buf_logo.getvalue()).decode("ascii")

    s1_img = Image.open(ASSETS_DIR / "ep07_s1_roas300_trap.jpg").convert("RGB").crop((90, 235, 934, 760))
    buf_art = io.BytesIO()
    s1_img.save(buf_art, format="JPEG", quality=95)
    art_b64 = base64.b64encode(buf_art.getvalue()).decode("ascii")

    html = f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      width: 1280px; height: 720px; overflow: hidden; position: relative;
      background: linear-gradient(114deg, #0f172a 0%, #172554 55.5%, #eaf2fc 55.7%, #eaf2fc 100%);
      font-family: 'Pretendard', 'Malgun Gothic', sans-serif;
      padding: 38px 44px; display: flex; align-items: center; justify-content: space-between;
    }}
    .left {{ width: 685px; display: flex; flex-direction: column; align-items: flex-start; gap: 17px; z-index: 2; }}
    .brand-row {{ display: flex; align-items: center; gap: 16px; }}
    .brand-row img {{ height: 70px; width: auto; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.4)); }}
    .b-pill {{
      background: #e11d48; color: #ffffff; font-size: 23px; font-weight: 900;
      padding: 8px 20px; border-radius: 999px; border: 2.5px solid #fda4af;
      box-shadow: 0 8px 20px rgba(225, 29, 72, 0.35);
    }}
    .main-h {{
      font-size: 53px; font-weight: 900; color: #ffffff; line-height: 1.18; letter-spacing: -0.03em;
      text-shadow: 0 6px 20px rgba(0, 0, 0, 0.45); word-break: keep-all;
    }}
    .main-h .q {{ color: #93c5fd; font-size: 44px; display: block; margin-bottom: 6px; }}
    .main-h .shock {{ color: #fde047; display: block; margin-top: 4px; }}
    .sim-strip {{
      background: rgba(255, 255, 255, 0.96); color: #1e3a8a; border-radius: 18px;
      padding: 13px 22px; font-size: 22.5px; font-weight: 900; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.28);
    }}
    .cta {{
      background: #2563eb; color: #ffffff; border: 3px solid #6ee7b7; border-radius: 999px;
      padding: 12px 28px; font-size: 24px; font-weight: 900;
    }}
    .right-pad {{
      width: 478px; height: 630px; background: #ffffff; border: 4.5px solid #2563eb;
      border-radius: 30px; box-shadow: 0 22px 46px rgba(15, 23, 42, 0.25);
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      padding: 20px 16px; position: relative;
    }}
    .r-top {{
      background: #ffe4e6; color: #be123c; border: 2.5px solid #fb7185;
      border-radius: 999px; padding: 8px 20px; font-size: 22px; font-weight: 900;
    }}
    .right-pad img {{ width: 440px; height: 420px; object-fit: contain; }}
    .r-bot {{
      background: #ecfdf5; color: #047857; border: 2.5px solid #6ee7b7;
      border-radius: 16px; padding: 10px 18px; font-size: 21px; font-weight: 900;
    }}
    </style></head><body>
      <div class="left">
        <div class="brand-row">
          <img src="data:image/png;base64,{logo_b64}" />
          <span class="b-pill">쿠팡 · 스마트스토어 셀러 실화</span>
        </div>
        <div class="main-h">
          <span class="q">“형! ROAS 300% 찍었어!”</span>
          900개 불티나게 팔고
          <span class="shock">월급 100만 원 날린 이유</span>
        </div>
        <div class="sim-strip">실효수수료 11.88% · 본전 ROAS 335% · +386만 반전</div>
        <div class="cta">내 상품 본전 ROAS 3초 판독 ▶ boozathink.com</div>
      </div>
      <div class="right-pad">
        <div class="r-top">매출 2,691만 vs 정산 -100만!</div>
        <img src="data:image/jpeg;base64,{art_b64}" />
        <div class="r-bot">광고비 태우기 전 필수 마진 해부</div>
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
    print("[1/5] Synthesizing 4 Empathetic Story Scene Voiceovers (-14.5 LUFS)...")
    vo_arrays: list[np.ndarray] = []
    vo_durs: list[float] = []
    tmp_wavs: list[Path] = []
    for sc in SCENES:
        w_path = make_scene_master_wav(sc["id"], sc["voice"])
        tmp_wavs.append(w_path)
        st = intro_lib.read_stereo_wav(w_path)
        vo_arrays.append(st)
        vo_durs.append(len(st) / float(SR))

    d_bump1 = 0.95
    d_mid = 1.20
    d_bump3 = 0.95
    d_fin = 2.95

    brush_indigo_cobalt = intro_lib.load_boozathink_brush_rgba((23, 37, 84), (37, 99, 235), target_w=680)
    brush_white_mint = intro_lib.load_boozathink_brush_rgba((255, 255, 255), (110, 231, 183), target_w=680)
    pen_sprite = intro_lib.create_cobalt_pen_cursor_rgba()

    print("[2/5] Rendering 4 Live-Sketch 16:9 Story Scenes + 3 Inter-Scene BOOZA THINK Stingers + Finale...")
    scene_frames: list[list[Image.Image]] = []
    scene_foleys: list[list[tuple[float, float]]] = []
    scene_pings: list[float] = []
    for idx, sc in enumerate(SCENES):
        frs, foley, ping_at = render_16x9_only_scene(
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
        )
        scene_frames.append(frs)
        scene_foleys.append(foley)
        scene_pings.append(ping_at)

    n_b1 = int(round(d_bump1 * FPS))
    fr_b1 = [render_custom_midpoint_stinger(1920, 1080, i / float(max(1, n_b1 - 1)), brush_white_mint, "부자생각  ·  STEP 02 29,900원의 진실") for i in range(n_b1)]

    n_mid = int(round(d_mid * FPS))
    fr_mid = [render_custom_midpoint_stinger(1920, 1080, i / float(max(1, n_mid - 1)), brush_white_mint, "부자생각  ·  월 +386만 원 반전 처방전") for i in range(n_mid)]

    n_b3 = int(round(d_bump3 * FPS))
    fr_b3 = [render_custom_midpoint_stinger(1920, 1080, i / float(max(1, n_b3 - 1)), brush_white_mint, "부자생각  ·  광고 전 3초 본전 ROAS 판독") for i in range(n_b3)]

    n_fin = int(round(d_fin * FPS))
    fr_fin = [render_clean_finale_stinger_frame(1920, 1080, i / float(max(1, n_fin - 1)), brush_indigo_cobalt) for i in range(n_fin)]

    scene_frames[0][int(len(scene_frames[0]) * 0.49)].save(OUT_DIR / "Preview_Long04_Scene1.png")
    scene_frames[2][int(len(scene_frames[2]) * 0.88)].save(OUT_DIR / "Preview_Long04_Scene3.png")

    t0_s1 = 0.0
    t0_b1 = t0_s1 + len(scene_frames[0]) / float(FPS)
    t0_s2 = t0_b1 + len(fr_b1) / float(FPS)
    t0_mid = t0_s2 + len(scene_frames[1]) / float(FPS)
    t0_s3 = t0_mid + len(fr_mid) / float(FPS)
    t0_b3 = t0_s3 + len(scene_frames[2]) / float(FPS)
    t0_s4 = t0_b3 + len(fr_b3) / float(FPS)
    t0_fin = t0_s4 + len(scene_frames[3]) / float(FPS)

    all_seqs = (scene_frames[0], fr_b1, scene_frames[1], fr_mid, scene_frames[2], fr_b3, scene_frames[3], fr_fin)
    total_frames = sum(len(s) for s in all_seqs)
    total_dur = total_frames / float(FPS)

    print(f"[3/5] Mixing Broadcast Audio + Mid-Scene Chimes & 3 Inter-Scene Sonic Stingers ({total_dur:.2f}s)...")
    master_st = intro_lib.synth_calm_lounge_bgm(total_dur) * 0.15
    starts = [t0_s1, t0_s2, t0_s3, t0_s4]
    for idx_sc, base_t in enumerate(starts):
        intro_lib.mix_into(master_st, base_t, vo_arrays[idx_sc], gain=1.02)
        intro_lib.mix_into(master_st, base_t + scene_pings[idx_sc], sfx_brand_ping_16x9(0.58), gain=0.95)
        for off_t, dur_p in scene_foleys[idx_sc]:
            intro_lib.mix_into(
                master_st,
                base_t + off_t,
                intro_lib.sfx_fast_pen_flurry(dur_p, seed=910 + idx_sc * 37 + int(off_t * 10)),
                gain=0.42,
            )

    intro_lib.mix_into(master_st, t0_b1, intro_lib.sfx_mid_brand_flash(d_bump1), gain=0.92)
    intro_lib.mix_into(master_st, t0_mid, intro_lib.sfx_mid_brand_flash(d_mid), gain=0.96)
    intro_lib.mix_into(master_st, t0_b3, intro_lib.sfx_mid_brand_flash(d_bump3), gain=0.92)
    intro_lib.mix_into(master_st, t0_fin - 0.04, intro_lib.sfx_finale_boozathink_chime(d_fin), gain=0.96)

    master_wav = OUT_DIR / "_long04_master_mix.wav"
    intro_lib.write_stereo_wav(master_wav, master_st)

    print("[4/5] Encoding 1920x1080 H.264 MP4...")
    mp4_out = OUT_DIR / "BOOZATHINK_Long04_Seller_ROAS_Story_16x9_1080p.mp4"
    cmd_16 = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x1080", "-r", str(FPS), "-i", "-",
        "-i", str(master_wav),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
        str(mp4_out),
    ]
    p16 = subprocess.Popen(cmd_16, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for seq in all_seqs:
        for fr in seq:
            p16.stdin.write(fr.tobytes())
    p16.stdin.close()
    p16.wait()

    print("[5/5] Rendering High-CTR 1280x720 Thumbnail...")
    thumb_jpg = render_hook_thumbnail_1280x720(
        brush_white_mint,
        OUT_DIR / "BOOZATHINK_Long04_Seller_ROAS_Thumbnail_1280x720.jpg",
    )

    for w_p in tmp_wavs:
        w_p.unlink(missing_ok=True)
    master_wav.unlink(missing_ok=True)

    print(
        f"[LONG04 DONE] {mp4_out} ({mp4_out.stat().st_size:,} bytes, {total_dur:.2f}s) | "
        f"Thumb ({thumb_jpg.stat().st_size:,} bytes)"
    )


if __name__ == "__main__":
    main()

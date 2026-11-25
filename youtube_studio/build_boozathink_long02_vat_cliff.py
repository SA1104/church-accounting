# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Expert-Detail 16:9 Main Episode Builder (`Long02`: 연 매출 1억 400만 부가세·종소세 절벽 & 초기 환급 500만)
=============================================================================================================================
- Unified Topic (paired with 9:16 `EP05` Shorts):
  〈매출 200만 원 더 올렸다가 통장에서 255만 원 증발?! — 연 매출 1억 400만 원 간이·일반과세 절벽과 초기 환급 500만 원의 비밀〉
- CPA / Tax-Accountant Verified Statutory Details (`backend/lib/calc-engine.js` `vatIncome` & `facts.js`):
  1) 연 매출 1억 300만 원(음식·소매 간이과세): 부가가치율 15% × 10% = 154.5만 − 매입세액공제(0.5%) 19.6만 − 신용카드 발행세액공제(1.3%) 120.5만 = 연간 부가세 단 14.4만 원! (종소세·지방세 차감 후 세후 실수령 3,153만 원)
  2) 연 매출 1억 500만 원(1억 400만 원 기준 초과 → 일반과세 1/11): 매출세액 954.5만 − 과세매입 세액공제(38%분) 362.7만 − 카드발행 공제(1.3%) 122.8만 = 연간 부가세 469.0만 원(32.5배 급증)! 세후 실수령 2,898만 원으로 오히려 -255만 원 역전!
  3) 전문가 핵심 디테일:
     • 왜 매입공제가 적을까? 원천징수 인건비·주휴수당과 면세 농축수산물에는 부가세(10%)가 없기 때문!
     • 무조건 간이가 유리할까? NO! 창업 첫해 인테리어·설비 5,500만 원(부가세 500만 포함) 투자 시 간이과세는 ‘환급 0원’이라 일반과세로 500만 원 조기환급부터 챙겨야 함! 또한 기존 일반과세 사업장 보유자는 간이과세 원천 배제!
     • 전환 시점 & 방어 3총사: 당해 소급이 아니라 ‘다음 해 7월 1일’ 전환! ① 월세·관리비·공과금 세금계산서 및 홈택스 사업용카드 등록, ② 면세 식자재 계산서·카드 수취를 통한 ‘의제매입세액공제(8/108~9/109)’, ③ 카드발행 세액공제 1.3%(연 1,000만 원 한도, 직전 공급가액 10억 이하)!
     • 5월 종합소득세 + 지방소득세 10% 가산(실효 16.5% / 26.4%) 및 연말 노란우산 소득공제 구간별 한도(4천만 이하 600만 / 6천만 이하 500만 / 1억 이하 400만)!
- ZERO promotional spam words ('무료', '이벤트', '할인', '특가') anywhere on screen, thumbnail, or audio!
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
OUT_DIR = STUDIO_DIR / "output" / "long02_vat_cliff"
RAW_WAV_DIR = OUT_DIR / "_raw_wavs"
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
SR = intro_lib.SR
FPS = intro_lib.FPS

LONG02_NAV_LABELS = [
    ("01", "1억 400만 절벽 역전"),
    ("02", "초기 500만 환급 공식"),
    ("03", "7월 전환 · 공제 3총사"),
    ("04", "종소세 · 노란우산"),
]

SCENES = [
    {
        "id": "long02_s01_paradox",
        "asset": ASSETS_DIR / "long02_s01_cliff_paradox.jpg",
        "kicker": "STEP 01 · 연 공급대가 1억 400만 원 기준선 — 부가세 32배 급증과 세후 순익 역전 해부",
        "headline": "매출 200만 원 더 올렸는데, 통장 세후 순익은 255만 원 줄어든 이유",
        "card_a": "연 매출 1억 300만 (간이 · 부가세 14.4만 원)",
        "card_b": "연 매출 1억 500만 (일반 전환 · 부가세 469만 원)",
        "cap_first": "간이과세(음식·소매 부가가치율 15%×10%)에 카드발행 공제 1.3%를 빼면 연 부가세는 단 14만 4천 원입니다.",
        "cap_second": "하지만 1억 400만 원을 넘겨 일반과세(1/11)가 되면 인건비·면세원재료가 공제되지 않아 부가세가 469만 원으로 뜁니다!",
        "voice": (
            "연 매출 일억 삼백만 원인 매장 사장님이 연말에 조금 더 힘내서 이백만 원을 더 팔아 일억 오백만 원을 찍었습니다. "
            "그런데 세금을 다 내고 나니 통장에 남는 일 년 실수령액은 오히려 이백오십오만 원이나 줄어들었는데요, 대체 왜 그럴까요? "
            "음식점과 소매업 간이과세자는 부가가치율 십오 퍼센트에 세율 십 퍼센트를 곱한 뒤, 영점오 퍼센트 매입공제와 일점삼 퍼센트 신용카드 발행 세액공제를 빼주기 때문에 일 년 부가세가 단 십사만 사천 원뿐입니다. "
            "반면 기준선인 일억 사백만 원을 넘겨 일반과세로 전환되면 공급대가의 십일 분의 일이 매출세액으로 잡히는데, 알바 인건비와 면세 농축수산물에는 부가세가 없어 매입공제를 못 받으니 실제 부가세가 사백육십구만 원으로 무려 서른두 배나 치솟기 때문입니다!"
        ),
        "highlight_brand": True,
    },
    {
        "id": "long02_s02_refund",
        "asset": ASSETS_DIR / "long02_s02_startup_refund_trap.jpg",
        "kicker": "STEP 02 · 세무 실무 최대 오해 — “무조건 간이과세가 유리하다?” 초기 시설투자의 역설",
        "headline": "인테리어·설비 5,500만 원 쓸 때 간이과세 고르면 환급금 500만 원 소멸!",
        "card_a": "초기 시설투자 큰데 간이 선택 ➔ 환급 법적 0원",
        "card_b": "결제 전 일반과세 사업자등록 ➔ +500만 원 조기환급",
        "cap_first": "간이과세자는 매입세액이 매출세액보다 아무리 많아도 부가세 환급이 법적으로 ‘0원’입니다!",
        "cap_second": "또한 기존에 일반과세 사업장을 1개라도 보유 중이면 신규 매장은 매출이 적어도 간이과세가 원천 배제됩니다.",
        "voice": (
            "그렇다면 무조건 간이과세로 시작하는 게 정답일까요? 절대 그렇지 않습니다! "
            "창업 첫해에 인테리어와 주방 설비, 초도 물량으로 부가세 포함 오천오백만 원을 투자할 때 간이과세를 선택하면, "
            "간이과세자는 매입이 아무리 많아도 부가세 환급이 법적으로 영원이라 돌려받을 수 있던 오백만 원을 그 자리에서 고스란히 날리게 됩니다. "
            "게다가 이미 다른 곳에서 일반과세 사업장을 하나라도 운영 중이시라면, 새로 내는 가게는 매출 규모와 상관없이 첫날부터 간이과세 적용이 원천 배제된다는 점도 꼭 기억하셔야 합니다."
        ),
        "highlight_brand": False,
    },
    {
        "id": "long02_s03_defense",
        "asset": ASSETS_DIR / "long02_s03_july_transition_defense.jpg",
        "kicker": "STEP 03 · 과세유형 전환 타임라인(익년 7월 1일) & 일반과세 부가세 반토막 방어 3총사",
        "headline": "당해 소급이 아닌 ‘다음 해 7월 1일’ 전환! 6개월 안에 3가지를 세팅하세요",
        "card_a": "직전 연도 기준 ‘다음 해 7월 1일’ 과세유형 전환",
        "card_b": "월세 세금계산서 · 의제매입공제 · 카드발행 1.3%",
        "cap_first": "올해 매출이 1억 400만 원을 넘어도 올해 세금이 소급 폭증하지 않고 ‘다음 해 7월 1일’부터 전환됩니다.",
        "cap_second": "전환 전 상가 월세 세금계산서, 면세 식자재 계산서(의제매입공제 8/108~9/109), 사업용 카드 등록을 완비하세요!",
        "voice": (
            "여기서 많은 사장님이 착각하시는 핵심 디테일이 하나 더 있습니다. "
            "올해 매출이 일억 사백만 원을 넘겼다고 해서 올해 치 부가세를 소급해서 더 내는 게 아니라, 다음 해 상반기까지는 간이과세가 유지되고 다음 해 칠월 일일부터 일반과세로 전환됩니다! "
            "이 육 개월의 골든타임 동안 세 가지를 반드시 세팅하셔야 합니다. "
            "첫째, 상가 월세와 관리비, 전기·통신비 세금계산서를 빠짐없이 챙기고 홈택스에 사업용 신용카드를 등록하세요. "
            "둘째, 쌀이나 정육, 채소 같은 면세 식자재도 반드시 계산서나 사업용 카드로 결제해 백팔 분의 팔에서 백구 분의 구를 빼주는 의제매입 세액공제를 챙기셔야 합니다. "
            "셋째, 직전 공급가액 십억 이하 개인사업자에게 연 천만 원 한도로 적용되는 일점삼 퍼센트 신용카드 발행 세액공제까지 누락 없이 반영해야 합니다."
        ),
        "highlight_brand": False,
    },
    {
        "id": "long02_s04_master",
        "asset": ASSETS_DIR / "long02_s04_tax_shield_master.jpg",
        "kicker": "STEP 04 · 5월 종합소득세(+지방소득세 10%) 실효세율 & 연말 노란우산 구간별 절세 공식",
        "headline": "종소세+지방세(16.5%~26.4%)와 노란우산 한도까지 3초 만에 동시 검산!",
        "card_a": "과표 구간별 지방세 10% 가산 & 노란우산 한도",
        "card_b": "부자생각 간이 vs 일반 · 세후 월 실수령 판독기",
        "cap_first": "종합소득세에는 항상 지방소득세 10%가 함께 붙어 15% 구간은 16.5%, 24% 구간은 26.4%가 빠져나갑니다.",
        "cap_second": "검색창에 ‘부자생각(boozathink.com)’을 쳐서 내 매장 간이·일반 유불리와 세후 월 실수령액을 3초 만에 확인하세요!",
        "voice": (
            "마지막으로 부가세 뒤에는 오월 종합소득세가 기다리고 있습니다. "
            "국세청 종합소득세율에는 항상 지방소득세 십 퍼센트가 추가로 붙기 때문에, 과세표준 천사백만 원 초과 구간은 실효 십육점오 퍼센트, 오천만 원 초과 구간은 무려 이십육점사 퍼센트가 세금으로 빠져나갑니다. "
            "연말이 지나기 전에 사업소득 사천만 원 이하는 연 육백만 원, 육천만 원 이하는 연 오백만 원 한도까지 노란우산 소득공제를 채워 넣으면 매년 백만 원 안팎의 세금을 즉시 아낄 수 있습니다. "
            "내 매장 매출과 매입 비중에서 간이와 일반 중 어디가 유리한지, 세금 다 떼고 내 통장에 진짜 얼마가 남는지 지금 검색창에 부자생각을 쳐서 삼 초 만에 정밀 검산해 보세요!"
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
                "Read the following Korean transcript aloud verbatim in a confident, warm, authoritative, articulate 30s Korean "
                "tax & business finance YouTuber host tone (clear diction on numbers and percentages):\n"
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


def build_clean_16x9_binder_static(
    step_idx: int,
    scene_kicker: str,
    scene_headline: str,
    left_card_title: str,
    right_card_title: str,
    brush_indigo_cobalt: Image.Image,
) -> Image.Image:
    intro_lib.STEP_NAV_LABELS = LONG02_NAV_LABELS
    img = intro_lib.build_16x9_architect_binder_static(
        step_idx=step_idx,
        scene_kicker=scene_kicker,
        scene_headline=scene_headline,
        left_card_title=left_card_title,
        right_card_title=right_card_title,
        brush_indigo_cobalt=brush_indigo_cobalt,
    ).convert("RGBA")
    dr = ImageDraw.Draw(img, "RGBA")
    # Overpaint headline with auto-fitted font if needed & clean sidebar bottom pill (ZERO '무료')
    dr.rectangle([464, 114, 1852, 182], fill=(255, 255, 255, 255))
    for sz in range(38, 26, -1):
        fh = intro_lib._font(sz, True)
        if dr.textlength(scene_headline, font=fh) <= 1365:
            dr.text((468, 120 + (38 - sz) // 2), scene_headline, font=fh, fill=(15, 23, 42, 255))
            break

    dr.rounded_rectangle([54, 862, 364, 1018], radius=24, fill=(240, 253, 244, 255), outline=(16, 185, 129, 255), width=3)
    f_f1 = intro_lib._font(19, True)
    t_f1 = "부가세 · 종소세 실수령 판독"
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

    frames_16: list[Image.Image] = []

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
            t2 = "간이·일반 부가세 · 카드 1.3% 공제 · 종합소득세 · 노란우산 실수령 3초 판독"
            f2 = intro_lib._font(27, True)
            dr.text((cx - dr.textlength(t2, font=f2) / 2, by0 + 106), t2, font=f2, fill=(5, 150, 105, int(255 * sp2)))

    return canvas.convert("RGB")


def render_hook_thumbnail_1280x720(brush_white_mint: Image.Image, out_jpg: Path) -> Path:
    """High-CTR Expert Tax Paradox Thumbnail (1280x720, ZERO spam words)."""
    buf_logo = io.BytesIO()
    brush_white_mint.save(buf_logo, format="PNG")
    logo_b64 = base64.b64encode(buf_logo.getvalue()).decode("ascii")

    # Use the crisp comparison diagram from ep05_s1_200m_paradox.jpg cropped to the dual store cards!
    s1_img = Image.open(ASSETS_DIR / "ep05_s1_200m_paradox.jpg").convert("RGB").crop((90, 240, 934, 760))
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
      font-size: 54px; font-weight: 900; color: #ffffff; line-height: 1.18; letter-spacing: -0.03em;
      text-shadow: 0 6px 20px rgba(0, 0, 0, 0.45); word-break: keep-all;
    }}
    .main-h .q {{ color: #93c5fd; font-size: 46px; display: block; margin-bottom: 6px; }}
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
          <span class="b-pill">연 매출 1억 400만 절벽 해부</span>
        </div>
        <div class="main-h">
          <span class="q">매출 200만 원 더 올렸다가</span>
          부가세 32배 터져서
          <span class="shock">순익 255만 원 증발?!</span>
        </div>
        <div class="sim-strip">초기환급 500만 · 의제매입 · 카드 1.3% · 종소세</div>
        <div class="cta">간이 vs 일반 3초 실수령 검산 ▶ boozathink.com</div>
      </div>
      <div class="right-pad">
        <div class="r-top">부가세 14.4만 vs 469만 원!</div>
        <img src="data:image/jpeg;base64,{art_b64}" />
        <div class="r-bot">익년 7월 전환 · 세무 디테일 완벽 정리</div>
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
    print("[1/5] Synthesizing 4 Expert Tax Scene Voiceovers (-14.5 LUFS)...")
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
            highlight_brand_at=(vo_durs[idx] * 0.82) if sc["highlight_brand"] else None,
        )
        scene_frames.append(frs)
        scene_foleys.append(foley)

    n_mid = int(round(d_mid * FPS))
    fr16_mid = [intro_lib.render_midpoint_stinger_frame(1920, 1080, i / float(max(1, n_mid - 1)), brush_white_mint) for i in range(n_mid)]
    n_fin = int(round(d_fin * FPS))
    fr16_fin = [render_clean_finale_stinger_frame(1920, 1080, i / float(max(1, n_fin - 1)), brush_indigo_cobalt) for i in range(n_fin)]

    scene_frames[0][int(len(scene_frames[0]) * 0.88)].save(OUT_DIR / "Preview_Long02_Scene1.png")
    scene_frames[2][int(len(scene_frames[2]) * 0.88)].save(OUT_DIR / "Preview_Long02_Scene3.png")

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
                intro_lib.sfx_fast_pen_flurry(dur_p, seed=700 + idx_sc * 29 + int(off_t * 10)),
                gain=0.42,
            )

    intro_lib.mix_into(master_st, t0_s1 + vo_durs[0] * 0.80, intro_lib.sfx_mid_brand_flash(0.90), gain=0.45)
    intro_lib.mix_into(master_st, t0_mid, intro_lib.sfx_mid_brand_flash(d_mid), gain=0.95)
    intro_lib.mix_into(master_st, t0_fin - 0.04, intro_lib.sfx_finale_boozathink_chime(d_fin), gain=0.95)

    master_wav = OUT_DIR / "_long02_master_mix.wav"
    intro_lib.write_stereo_wav(master_wav, master_st)

    print("[4/5] Encoding 1920x1080 H.264 MP4...")
    mp4_out = OUT_DIR / "BOOZATHINK_Long02_VAT_Cliff_Masterclass_16x9_1080p.mp4"
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
        OUT_DIR / "BOOZATHINK_Long02_VAT_Cliff_Thumbnail_1280x720.jpg",
    )

    for w_p in tmp_wavs:
        w_p.unlink(missing_ok=True)
    master_wav.unlink(missing_ok=True)

    print(
        f"[LONG02 DONE] {mp4_out} ({mp4_out.stat().st_size:,} bytes, {total_dur:.2f}s) | "
        f"Thumb ({thumb_jpg.stat().st_size:,} bytes)"
    )


if __name__ == "__main__":
    main()

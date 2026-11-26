# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Series Live-Sketch Shorts Builder (`EP02` & `EP03`, `1080x1920`, 24fps)
==================================================================================================
- Distinct Cobalt-Mint Architect Spiral Pad (`#EAF1FB` blueprint dot-grid + `#2563EB` Cobalt + `#059669` Mint)
- Live Fountain-Pen Contour Tracing + Pastel Watercolor Reveal + 6fps Hand-Drawn Line-Boil
- Studio `Charon` Gemini 2.5 TTS (`-14.5 LUFS`) + Speech-Synced Pen Foley + Sketchbook BGM
- Finale `BOOZA THINK · 부자생각` Brush Calligraphy Stinger + 5-Note Sonic Logo Chime
- ZERO promotional spam words ('무료', '이벤트', '할인' in titles/covers) & 100% `calc-engine.js` verified numbers!
"""
from __future__ import annotations

import argparse
import asyncio
import base64
import math
import os
import subprocess
import sys
import time
import wave
from pathlib import Path

import cv2
import dotenv
import edge_tts
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
RAW_WAV_DIR = STUDIO_DIR / "output" / "_series_raw_wavs"
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

W, H = 1080, 1920
FPS = 24
SR = 44100

EPISODES: dict[str, dict] = {
    "ep02": {
        "out_dir": STUDIO_DIR / "output" / "ep02_abc_compare_shorts",
        "work_dir": STUDIO_DIR / "_work_ep02_shorts",
        "mp4_name": "BOOZATHINK_EP02_ABC_Compare_9x16_Shorts.mp4",
        "cover_name": "BOOZATHINK_EP02_Cover_1080x1920.png",
        "preview_name": "BOOZATHINK_EP02_Preview_Mid.png",
        "cover_scene_idx": 2,
        "scenes": [
            {
                "id": "ep02_s1_three_choices",
                "asset": ASSETS_DIR / "ep02_s1_three_choices.jpg",
                "voice": (
                    "카페를 할까, 치킨집을 할까, 아니면 무인매장을 할까? "
                    "모아둔 창업 자금은 딱 한 번뿐인데, 도대체 어디가 내 통장에 진짜 더 남을지 가장 고민되시죠?"
                ),
                "step_tag": "부자생각 실전 비교 · EP.02",
                "headline": "카페 할까, 치킨 할까, 무인 할까?<br><span class='hl'>같은 돈인데 어디가 더 남을까?</span>",
                "bubble": "“모아둔 자본금은 딱 한 번뿐인데… 세 가지 중에 뭘 골라야 후회 안 할까요?”",
                "note_badge": "사장님 최대 고민",
                "note_badge_bg": "#dbeafe",
                "note_badge_fg": "#1e40af",
                "note_title": "매출 크기만 보면 100% 착시가 생깁니다",
                "note_body": "업종마다 원가율·인건비·비수기 낙폭이 달라 세후 순수익으로 나란히 비교해야 합니다.",
                "sub_first": ("카페 할까, 치킨집 할까, 무인매장 할까?", "모아둔 자본금은 딱 한 번뿐인데,"),
                "sub_second": ("도대체 어디가 내 통장에 더 남을지", "계약 전에 가장 많이 고민되시죠?"),
                "draw_ratio": 0.64,
            },
            {
                "id": "ep02_s2_hidden_variables",
                "asset": ASSETS_DIR / "ep02_s2_hidden_variables.jpg",
                "voice": (
                    "막상 세 가지를 나란히 계산해 보면 결과가 완전히 다릅니다. "
                    "커피는 원가율이 낮지만 인건비와 겨울 한파가 무섭고, "
                    "치킨은 배달 수수료가 크며, 무인매장은 상품 원가율이 오십팔 퍼센트에 달하거든요."
                ),
                "step_tag": "부자생각 손익 해부 · 3가지 함정",
                "headline": "A안·B안·C안 나란히 놓고 보면<br><span class='hl'>숨어 있던 비용 구멍이 보입니다</span>",
                "bubble": "“커피는 겨울 한파가 무섭고, 치킨은 배달비, 무인은 원가율이 58%나 되네!”",
                "note_badge": "업종별 핵심 변수",
                "note_badge_bg": "#fef3c7",
                "note_badge_fg": "#92400e",
                "note_title": "카페(인건비·한파) vs 치킨(수수료) vs 무인(원가율 58%)",
                "note_body": "겉보기 매출이 아니라 대출 원리금·세금·겨울 비수기까지 뺀 진짜 월 실수령액을 봐야 합니다.",
                "sub_first": ("커피는 피크 인건비와 겨울 비수기,", "치킨은 배달 수수료와 배달비 부담,"),
                "sub_second": ("무인매장은 인건비 아끼는 대신", "상품 원가율이 무려 58%에 달합니다!"),
                "draw_ratio": 0.64,
            },
            {
                "id": "ep02_s3_abc_workbench",
                "asset": ASSETS_DIR / "ep02_s3_abc_workbench.jpg",
                "voice": (
                    "이제 감으로 찍지 마세요! 부자생각에서 후보 업종들을 에이안, 비안, 씨안으로 저장해 두고, "
                    "다시 불러와 월세나 주문 수만 살짝 바꿔 비교해 보세요. "
                    "내 돈을 지켜줄 진짜 일등 답안이 삼 초 만에 보입니다."
                ),
                "step_tag": "부자생각 워크벤치 · 조건 저장·비교",
                "headline": "A안·B안·C안 저장해 두고<br><span class='hl'>불러와서 월세·매출만 바꿔보세요!</span>",
                "bubble": "“저장한 조건을 다시 불러와 숫자만 바꾸니 1등 후보가 3초 만에 딱 나오네요!”",
                "note_badge": "A·B·C안 동시 비교",
                "note_badge_bg": "#dcfce7",
                "note_badge_fg": "#166534",
                "note_title": "boozathink.com · 조건 저장 & 실시간 증감 비교",
                "note_body": "검색창에 ‘부자생각’ — 후보 업종을 A·B·C안으로 저장하고 내 동네 월세로 바로 비교해 보세요!",
                "sub_first": ("고민 중인 후보를 A·B·C안으로 저장하고", "다시 불러와 월세·주문 수만 바꿔보세요!"),
                "sub_second": ("검색창에 ‘부자생각’ · boozathink.com", "내 통장에 더 남는 1등 답안이 3초 만에 보입니다"),
                "draw_ratio": 0.58,
            },
        ],
    },
    "ep03": {
        "out_dir": STUDIO_DIR / "output" / "ep03_delivery_leak_shorts",
        "work_dir": STUDIO_DIR / "_work_ep03_shorts",
        "mp4_name": "BOOZATHINK_EP03_Delivery_Margin_Leak_9x16_Shorts.mp4",
        "cover_name": "BOOZATHINK_EP03_Cover_1080x1920.png",
        "preview_name": "BOOZATHINK_EP03_Preview_Mid.png",
        "cover_scene_idx": 1,
        "scenes": [
            {
                "id": "ep03_s1_busy_empty_wallet",
                "asset": ASSETS_DIR / "ep03_s1_busy_empty_wallet.jpg",
                "voice": (
                    "한 달 매출 삼천만 원을 찍는데, 정작 사장님 통장에는 백육십만 원밖에 안 남는다면 믿어지시나요? "
                    "이만 오천 원짜리 메뉴를 하루 마흔 건씩 팔아도 왜 돈이 안 모이는지 실제 숫자로 뜯어봤습니다."
                ),
                "step_tag": "부자생각 손익 진단 · EP.03",
                "headline": "월 매출 3,000만 원 찍는데,<br><span class='hl'>왜 내 통장엔 163만 원뿐일까?</span>",
                "bubble": "“하루 40건씩 한 달 내내 쉬지도 않고 팔았는데… 정산 날 통장 보고 숨이 막혔어요.”",
                "note_badge": "배달 매장의 역설",
                "note_badge_bg": "#ffe4e6",
                "note_badge_fg": "#9f1239",
                "note_title": "25,000원 메뉴 × 하루 40건 × 30일 = 월 매출 3,000만 원",
                "note_body": "겉으론 대박집 같지만, 주문 1건당 빠져나가는 5가지 구멍을 모르면 남는 돈이 없습니다.",
                "sub_first": ("월 매출 3,000만 원을 찍는데도", "통장에 163만 원밖에 안 남는 이유!"),
                "sub_second": ("25,000원 메뉴 하루 40건씩 팔아도", "왜 돈이 새는지 실제 숫자로 뜯어봤습니다"),
                "draw_ratio": 0.64,
            },
            {
                "id": "ep03_s2_five_fee_leaks",
                "asset": ASSETS_DIR / "ep03_s2_five_fee_leaks.jpg",
                "voice": (
                    "이만 오천 원 한 건에서 식자재와 포장비 구천오백 원, 앱 수수료 이천칠백 원, "
                    "사장님 부담 배달비 삼천오백 원, 쿠폰과 부가세까지 빼면 오천오백이십칠 원만 남습니다. "
                    "여기서 월세와 알바비 오백만 원을 빼면 진짜 백육십삼만 원뿐인 거죠."
                ),
                "step_tag": "부자생각 영수증 해부 · 5대 누수",
                "headline": "25,000원 한 건 팔 때마다<br><span class='hl'>19,473원이 먼저 빠져나갑니다</span>",
                "bubble": "“원가 9,500원에 수수료·배달비 6,200원, 쿠폰·부가세까지 빼니 5,527원 남네?!”",
                "note_badge": "건당 마진 정밀 해부",
                "note_badge_bg": "#dbeafe",
                "note_badge_fg": "#1e40af",
                "note_title": "건당 5,527원 × 1,200건 − 고정비 500만 = 월 163만 원",
                "note_body": "원가·포장 9,500 + 중개·결제수수료 2,700 + 배달비 3,500 + 쿠폰 1,500 + 부가세 2,273원",
                "sub_first": ("식자재·포장 9,500원에 앱 수수료 2,700원,", "배달비 3,500원·쿠폰·부가세까지 다 빼면"),
                "sub_second": ("건당 남는 돈은 겨우 5,527원!", "월세·알바비 빼면 진짜 163만 원뿐입니다"),
                "draw_ratio": 0.65,
            },
            {
                "id": "ep03_s3_plugged_profit_jar",
                "asset": ASSETS_DIR / "ep03_s3_plugged_profit_jar.jpg",
                "voice": (
                    "이럴 때 무작정 할인쿠폰을 더 뿌리면 적자만 커집니다. "
                    "사이드 세트로 객단가를 높이고 포장 할인으로 배달비 구멍만 줄여도, "
                    "주문이 두 건 줄어든 채로 월 순수익은 사백구십오만 원으로 세 배가 뜁니다. "
                    "지금 부자생각에서 내 메뉴 마진 구멍부터 삼 초 만에 확인해 보세요!"
                ),
                "step_tag": "부자생각 처방전 · 목표마진 역산",
                "headline": "주문 늘리기보다 <span class='hl'>새는 구멍 3곳</span>만<br>잡아도 순수익이 3배 뜁니다!",
                "bubble": "“세트 구성과 포장 할인으로 바꾸니 주문이 2건 줄어도 월 495만 원이 남네요!”",
                "note_badge": "월 163만 ➔ 월 495만 원",
                "note_badge_bg": "#dcfce7",
                "note_badge_fg": "#166534",
                "note_title": "boozathink.com · 배달 순수익 & 목표 메뉴가 역산기",
                "note_body": "검색창에 ‘부자생각’ — 내 메뉴 가격과 수수료를 넣어 새는 구멍과 적정가를 바로 찾아보세요!",
                "sub_first": ("사이드 세트와 포장 할인으로 구멍만 막아도", "주문이 2건 줄면서 월 순익은 495만 원으로 3배!"),
                "sub_second": ("검색창에 ‘부자생각’ · boozathink.com", "내 메뉴 진짜 마진과 적정 가격을 확인하세요"),
                "draw_ratio": 0.58,
            },
        ],
    },
    "ep04": {
        "out_dir": STUDIO_DIR / "output" / "ep04_wage_cliff_shorts",
        "work_dir": STUDIO_DIR / "_work_ep04_shorts",
        "mp4_name": "BOOZATHINK_EP04_30Min_Wage_Cliff_9x16_Shorts.mp4",
        "cover_name": "BOOZATHINK_EP04_Cover_1080x1920.png",
        "preview_name": "BOOZATHINK_EP04_Preview_Mid.png",
        "cover_scene_idx": 1,
        "scenes": [
            {
                "id": "ep04_s1_thirty_min_shock",
                "asset": ASSETS_DIR / "ep04_s1_thirty_min_shock.jpg",
                "voice": (
                    "사장님, 지금 알바생 일주일에 열다섯 시간 쓰고 계신가요? "
                    "시간표에서 단 삼십 분만 줄여 열네 시간 반으로 짰다면, "
                    "알바 두 명 기준 일 년에 오백칠십삼만 원이 그대로 굳었을 겁니다!"
                ),
                "step_tag": "부자생각 인건비 주의보 · EP.04",
                "headline": "알바 시간표 <span class='hl'>‘딱 30분’</span> 잘못 짜서<br>1년에 573만 원 더 나갑니다!",
                "bubble": "“주 14시간 반이랑 주 15시간이 설마 얼마나 차이 나겠어?” 했다가 깜짝 놀랐어요!",
                "note_badge": "사장님 필수 점검",
                "note_badge_bg": "#ffe4e6",
                "note_badge_fg": "#9f1239",
                "note_title": "주 14.5시간 vs 주 15.0시간 — 단 30분의 인건비 절벽",
                "note_body": "시간표 30분 차이로 주휴수당과 4대보험 사업주 부담금이 한꺼번에 붙기 시작합니다.",
                "sub_first": ("사장님, 지금 알바 주 15시간 쓰고 계신가요?", "시간표에서 단 ‘30분’만 줄여 14.5시간으로 짰다면"),
                "sub_second": ("알바 2명 기준 1년에 573만 원이", "사장님 통장에 그대로 굳었을 겁니다!"),
                "draw_ratio": 0.64,
            },
            {
                "id": "ep04_s2_wage_cliff_jump",
                "asset": ASSETS_DIR / "ep04_s2_wage_cliff_jump.jpg",
                "voice": (
                    "올해 최저시급 만 삼백이십 원 기준, 주 열네 시간 반은 월 육십오만 육천 원이지만, "
                    "딱 삼십 분 넘겨 열다섯 시간이 되는 순간 주휴수당과 사대보험이 동시에 붙어 "
                    "월 팔십구만 오천 원으로 삼십육 퍼센트나 치솟습니다!"
                ),
                "step_tag": "부자생각 실전 검산 · 주 15시간 절벽",
                "headline": "주 14.5시간 <span class='hl'>65.6만</span> vs 15시간 <span class='hl'>89.5만</span><br>30분 차이로 매달 36% 급등!",
                "bubble": "“주휴수당 13만 5천 원에 4대보험 8만 8천 원까지 동시에 붙어 매달 24만 원이 더 나가네?!”",
                "note_badge": "2026 최저시급 10,320원 검산",
                "note_badge_bg": "#dbeafe",
                "note_badge_fg": "#1e40af",
                "note_title": "1인당 월 +238,803원 · 알바 2명이면 연 573만 원 차이!",
                "note_body": "내년 시급(10,700원 예고안) 기준으로는 알바 2명 시 연간 약 600만 원까지 벌어집니다.",
                "sub_first": ("주 14.5시간은 월 65만 6천 원이지만,", "딱 30분 넘겨 15시간이 되는 순간"),
                "sub_second": ("주휴수당+4대보험이 동시에 터져", "월 89만 5천 원으로 36.4%나 치솟습니다!"),
                "draw_ratio": 0.65,
            },
            {
                "id": "ep04_s3_table_order_payback",
                "asset": ASSETS_DIR / "ep04_s3_table_order_payback.jpg",
                "voice": (
                    "피크 시간 주문 동선을 테이블오더 네 대로 줄여 시간표만 조정해도, "
                    "삼점 팔 개월이면 기기값 본전을 뽑고 삼 년간 천오백삼십구만 원을 아낍니다. "
                    "지금 부자생각에서 내 매장 시간표부터 삼 초 만에 점검해 보세요!"
                ),
                "step_tag": "부자생각 해법 · 인건비 vs 자동화",
                "headline": "테이블오더 4대로 피크시간 줄이면<br><span class='hl'>3.8개월 만에 기기값 본전</span> 회수!",
                "bubble": "“주문·결제 동선만 줄였는데 넉 달도 안 돼 본전 뽑고 3년간 1,539만 원 아끼네요!”",
                "note_badge": "3.8개월 원금 회수",
                "note_badge_bg": "#dcfce7",
                "note_badge_fg": "#166534",
                "note_title": "boozathink.com · 주휴수당 & 테이블오더 손익 비교기",
                "note_body": "검색창에 ‘부자생각’ — 내 매장 알바 시간표와 내년 시급 인상분까지 3초 만에 비교해 보세요!",
                "sub_first": ("테이블오더 4대로 피크시간 동선만 줄여도", "3.8개월이면 본전 뽑고 3년간 1,539만 원 절감!"),
                "sub_second": ("검색창에 ‘부자생각’ · boozathink.com", "내 매장 알바 시간표부터 3초 만에 비교해 보세요"),
                "draw_ratio": 0.58,
            },
        ],
    },
    "ep05": {
        "out_dir": STUDIO_DIR / "output" / "ep05_vat_cliff_shorts",
        "work_dir": STUDIO_DIR / "_work_ep05_shorts",
        "mp4_name": "BOOZATHINK_EP05_VAT_Cliff_Master_9x16_Shorts.mp4",
        "cover_name": "BOOZATHINK_EP05_Cover_1080x1920.png",
        "preview_name": "BOOZATHINK_EP05_Preview_Mid.png",
        "cover_scene_idx": 0,
        "scenes": [
            {
                "id": "ep05_s1_200m_paradox",
                "asset": ASSETS_DIR / "ep05_s1_200m_paradox.jpg",
                "voice": (
                    "매출을 이백만 원 더 올렸을 뿐인데, 세금이 폭증해서 내 통장 실수령액은 오히려 이백오십오만 원이나 깎인다면 믿어지시나요? "
                    "운명을 가르는 기준선은 바로 연 공급대가 일억 사백만 원입니다!"
                ),
                "step_tag": "부자생각 세무 정밀해부 · EP.05",
                "headline": "매출 <span class='hl'>200만 원</span> 더 올렸다가<br>통장 순익 <span class='hl'>255만 원</span> 증발?!",
                "bubble": "“연 매출 1억 300만 원에서 1억 500만 원 됐을 뿐인데 세금이 왜 이렇게 뛰죠?!”",
                "note_badge": "연 공급대가 1억 400만 절벽",
                "note_badge_bg": "#ffe4e6",
                "note_badge_fg": "#9f1239",
                "note_title": "1억 300만(실수령 3,153만) vs 1억 500만(실수령 2,898만)",
                "note_body": "간이과세(부가세 14.4만 원)에서 일반과세(부가세 469만 원)로 바뀌며 세후 순익이 역전됩니다.",
                "sub_first": ("매출을 200만 원 더 올렸을 뿐인데,", "내 통장 순익은 오히려 255만 원 깎인 이유!"),
                "sub_second": ("간이·일반 운명을 가르는 기준선,", "연 공급대가 ‘1억 400만 원’ 절벽입니다!"),
                "draw_ratio": 0.64,
            },
            {
                "id": "ep05_s2_32x_vat_anatomy",
                "asset": ASSETS_DIR / "ep05_s2_32x_vat_anatomy.jpg",
                "voice": (
                    "간이과세일 땐 일점삼 퍼센트 카드발행 공제 덕분에 부가세가 연 십사만 원뿐이지만, "
                    "기준을 넘겨 다음 해 칠월 일일 일반과세로 바뀌면 인건비와 면세 원재료는 매입공제가 안 돼 부가세가 서른두 배나 치솟습니다!"
                ),
                "step_tag": "세무사급 디테일 · 32배 급증 원리",
                "headline": "인건비·면세원재료 <span class='hl'>공제 구멍</span>과<br>‘다음 해 7월 1일’ 전환 법칙!",
                "bubble": "“원천징수 인건비엔 부가세가 없고, 면세 식자재도 계산서를 끊어야 의제매입공제가 되네요!”",
                "note_badge": "익년 7.1 전환 · 의제매입공제",
                "note_badge_bg": "#dbeafe",
                "note_badge_fg": "#1e40af",
                "note_title": "당해 소급 X · 다음 해 7월 1일 전환 전 증빙 세팅 필수!",
                "note_body": "쌀·정육·채소 계산서(의제매입 8/108~9/109) + 월세 세금계산서 + 카드발행 1.3% 공제를 챙기세요.",
                "sub_first": ("간이일 땐 카드공제 1.3%로 연 14만 원뿐이지만", "다음 해 7월 1일 일반과세로 전환되는 순간"),
                "sub_second": ("인건비·면세원재료 공제 구멍 때문에", "연 부가세가 469만 원으로 32배 치솟습니다!"),
                "draw_ratio": 0.65,
            },
            {
                "id": "ep05_s3_refund_vs_shield",
                "asset": ASSETS_DIR / "ep05_s3_refund_vs_shield.jpg",
                "voice": (
                    "반대로 첫해 인테리어에 오천오백만 원을 쓸 땐 일반과세여야 오백만 원 환급을 챙길 수 있죠! "
                    "지방소득세 십 퍼센트를 합친 종소세와 연말 노란우산 절세액까지, 지금 부자생각에서 내 매장 세후 실수령액을 삼 초 만에 검산해 보세요!"
                ),
                "step_tag": "초기 500만 환급 vs 연말 종소세 방어",
                "headline": "첫해 시설투자 클 땐 <span class='hl'>일반과세 환급!</span><br>내 매장 유불리 3초 정밀 검산",
                "bubble": "“간이과세는 인테리어 부가세 환급이 0원이라니! 사업자 내기 전에 비교하길 정말 잘했네요!”",
                "note_badge": "간이 vs 일반 · 실수령 판독",
                "note_badge_bg": "#dcfce7",
                "note_badge_fg": "#166534",
                "note_title": "boozathink.com · 부가세(간이·일반) & 종소세 실수령 계산기",
                "note_body": "검색창에 ‘부자생각’ — 카드 1.3% 공제·지방소득세·노란우산 한도까지 한 번에 비교해 보세요!",
                "sub_first": ("첫해 인테리어 5,500만 원 쓸 땐", "일반과세여야 500만 원 환급을 다 챙깁니다!"),
                "sub_second": ("검색창에 ‘부자생각’ · boozathink.com", "간이 vs 일반 유불리와 세후 월급을 확인하세요"),
                "draw_ratio": 0.58,
            },
        ],
    },
    "ep06": {
        "out_dir": STUDIO_DIR / "output" / "ep06_loan_order_shorts",
        "work_dir": STUDIO_DIR / "_work_ep06_shorts",
        "mp4_name": "BOOZATHINK_EP06_Loan_Order_Refi_9x16_Shorts.mp4",
        "cover_name": "BOOZATHINK_EP06_Cover_1080x1920.png",
        "preview_name": "BOOZATHINK_EP06_Preview_Mid.png",
        "cover_scene_idx": 0,
        "mid_stingers": True,
        "scenes": [
            {
                "id": "ep06_s1_cardloan_mistake",
                "asset": ASSETS_DIR / "ep06_s1_cardloan_mistake.jpg",
                "voice": (
                    "사장님, 운영 자금이 급하다고 스마트폰으로 카드론이나 이금융권부터 먼저 누르셨나요? "
                    "대출 순서 한 번 거꾸로 갔을 뿐인데, 연 이 퍼센트대 정책자금 한도 오천오십만 원이 그 자리에서 증발합니다!"
                ),
                "step_tag": "부자생각 자금 주의보 · EP.06",
                "headline": "급하다고 <span class='hl'>카드론 먼저</span> 눌렀다가<br>저금리 한도 <span class='hl'>5,050만 원</span> 증발!",
                "bubble": "“똑같은 연 매출 1억 8천만 원 매장인데, 왜 옆집은 연 2%대 8천만 원이 나오고 나는 거절이죠?!”",
                "note_badge": "동일 조건 한도 역전",
                "note_badge_bg": "#ffe4e6",
                "note_badge_fg": "#9f1239",
                "note_title": "순서 실수 3,718만(연 11.8%) vs 정석 순서 8,768만(연 2~3%대)",
                "note_body": "고금리 카드론·캐피탈을 먼저 실행하면 다중채무로 분류되어 보증서 한도가 깎입니다.",
                "sub_first": ("운영 자금 급하다고 카드론부터 누르면", "신용 하락과 다중채무로 즉시 분류되어"),
                "sub_second": ("연 2%대 정책·보증서 한도 5,050만 원이", "앉은 자리에서 그대로 날아갑니다!"),
                "draw_ratio": 0.64,
            },
            {
                "id": "ep06_s2_three_step_ladder",
                "asset": ASSETS_DIR / "ep06_s2_three_step_ladder.jpg",
                "voice": (
                    "사업자 자금은 무조건 일순위로 지자체 이차보전과 지역신보 보증서를 먼저 받고, "
                    "이순위로 소진공 직접대출이나 연 사점오 퍼센트 고정 대환대출을 결합해야 합니다. "
                    "단, 세금 체납이 만 원이라도 있으면 자동 거절되고 키오스크 보조금도 결제 전 사전협약이 필수입니다!"
                ),
                "step_tag": "부자생각 황금 공식 · 3단 사다리",
                "headline": "1순위 <span class='hl'>지역신보 이차보전</span>부터!<br>키오스크 국비 500만은 결제 전 신청",
                "bubble": "“연 9.8% 대출 5천만 원을 연 4.5% 대환으로 바꾸니 10년 이자만 1,644만 원 아끼네요!”",
                "note_badge": "3단 조달 & 사전협약 철칙",
                "note_badge_bg": "#dbeafe",
                "note_badge_fg": "#1e40af",
                "note_title": "지역신보(연 2~3%대) ➔ 소진공·4.5% 대환 ➔ 주거래은행 순서!",
                "note_body": "국세·지방세 완납 확인 필수! 스마트상점 국비 500만 원도 먼저 결제하면 지원 불가입니다.",
                "sub_first": ("1순위 지역신보 이차보전, 2순위 소진공·4.5% 대환!", "순서만 지켜도 한도와 금리가 완전히 달라집니다"),
                "sub_second": ("세금 체납 0원 확인 & 키오스크 결제 전 사전협약으로", "국비 최대 500만 원까지 빠짐없이 챙기세요!"),
                "draw_ratio": 0.65,
            },
            {
                "id": "ep06_s3_refi_and_check",
                "asset": ASSETS_DIR / "ep06_s3_refi_and_check.jpg",
                "voice": (
                    "은행 창구에 가기 전에 내 매출과 기존 대출 잔액으로 추가 한도가 얼마 남았는지, "
                    "사점오 퍼센트 대환으로 이자를 얼마나 아낄 수 있는지 지금 부자생각에서 삼 초 만에 먼저 진단해 보세요!"
                ),
                "step_tag": "은행 가기 전 3초 한도·대환 진단",
                "headline": "내 매장 <span class='hl'>최저금리 순서</span>와 한도,<br>은행 가기 전 3초 만에 확인하세요!",
                "bubble": "“기보증 잔액 차감 후 실제 한도랑 17개 시도별 정책자금 순서가 한눈에 딱 나오네요!”",
                "note_badge": "한도 · 4.5% 대환 · 보조금",
                "note_badge_bg": "#dcfce7",
                "note_badge_fg": "#166534",
                "note_title": "boozathink.com · 사업자 대출 한도 & 정책자금 매칭기",
                "note_body": "검색창에 ‘부자생각’ — 내 조건 최저금리 순서와 연 4.5% 대환 절감액을 바로 확인하세요!",
                "sub_first": ("연 9.8% 대출 5천만 원 대환 시 10년 1,644만 원 절감!", "은행 가기 전 내 실제 한도부터 먼저 확인하세요"),
                "sub_second": ("검색창에 ‘부자생각’ · boozathink.com", "내 매장 맞춤 최저금리 조달 순서를 알려드립니다"),
                "draw_ratio": 0.58,
            },
        ],
    },
}


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
    return ""


async def _fallback_edge_tts(text: str, out_mp3: Path) -> None:
    comm = edge_tts.Communicate(text=text, voice="ko-KR-InJoonNeural", rate="+7%")
    await comm.save(str(out_mp3))


def make_scene_voice_wav(scene_id: str, text: str, work_dir: Path) -> tuple[Path, float]:
    RAW_WAV_DIR.mkdir(parents=True, exist_ok=True)
    raw_wav = RAW_WAV_DIR / f"{scene_id}_charon_raw.wav"
    out_wav = work_dir / f"{scene_id}_master.wav"

    used_charon = raw_wav.exists() and raw_wav.stat().st_size > 16000
    if not used_charon:
        api_key = _resolve_gemini_api_key()
        if api_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key={api_key}"
            prompt_txt = (
                "Read the following Korean transcript aloud verbatim in a confident, warm, trustworthy, upbeat 30s Korean "
                "business & finance YouTuber host tone (articulate, clear, friendly, brisk Shorts pacing):\n"
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
                    with httpx.Client(trust_env=False, timeout=75.0) as client:
                        r = client.post(url, json=payload)
                        if r.status_code == 429 and attempt < 3:
                            wait_s = 22 * attempt
                            print(f"  [Charon RPM Wait] {scene_id} waiting {wait_s}s for next minute window...")
                            time.sleep(wait_s)
                            continue
                        if r.status_code in (500, 503) and attempt < 3:
                            time.sleep(6 * attempt)
                            continue
                        r.raise_for_status()
                        b64_pcm = r.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
                    with wave.open(str(raw_wav), "wb") as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2)
                        wf.setframerate(24000)
                        wf.writeframes(base64.b64decode(b64_pcm))
                    used_charon = True
                    time.sleep(3.0)
                    break
                except Exception as exc:
                    print(f"  [TTS Notice] {scene_id} attempt {attempt}: {exc}")
                    break

    if used_charon:
        af = (
            "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-42dB,"
            "areverse,silenceremove=start_periods=1:start_silence=0.07:start_threshold=-42dB,areverse,"
            "atempo=1.06,equalizer=f=3200:t=q:w=1.2:g=2.0,loudnorm=I=-14.5:TP=-1.2:LRA=9,"
            "apad=pad_dur=0.28"
        )
        subprocess.run(
            [FFMPEG_EXE, "-y", "-i", str(raw_wav), "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(out_wav)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    else:
        tmp_mp3 = work_dir / f"{scene_id}_fb.mp3"
        asyncio.run(_fallback_edge_tts(text, tmp_mp3))
        af_fb = (
            "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-45dB,"
            "areverse,silenceremove=start_periods=1:start_silence=0.06:start_threshold=-45dB,areverse,"
            "loudnorm=I=-14.5:TP=-1.2:LRA=9,apad=pad_dur=0.28"
        )
        subprocess.run(
            [FFMPEG_EXE, "-y", "-i", str(tmp_mp3), "-af", af_fb, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(out_wav)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        tmp_mp3.unlink(missing_ok=True)

    with wave.open(str(out_wav), "rb") as wf:
        dur = wf.getnframes() / float(wf.getframerate())
    return out_wav, dur


def load_boozathink_brush_rgba(top_rgb: tuple[int, int, int], bot_rgb: tuple[int, int, int], target_w: int) -> Image.Image:
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


def make_sketchbook_paper(w: int, h: int) -> Image.Image:
    base = np.zeros((h, w, 3), dtype=np.float32)
    ys = np.linspace(0.0, 1.0, h, dtype=np.float32)[:, None]
    base[:, :, 0] = 231.0 - 9.0 * ys
    base[:, :, 1] = 240.0 - 6.0 * ys
    base[:, :, 2] = 252.0 - 2.0 * ys
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    dr = ImageDraw.Draw(img)
    dr.rounded_rectangle([34, 42, w - 34, h - 38], radius=38, fill=(248, 251, 255), outline=(147, 197, 253), width=3)
    for rx in range(118, w - 110, 92):
        dr.ellipse([rx - 12, 34, rx + 12, 56], fill=(219, 234, 254), outline=(59, 130, 246), width=2)
        dr.rounded_rectangle([rx - 5, 16, rx + 5, 48], radius=4, fill=(148, 163, 184), outline=(51, 65, 85), width=2)
    for x in range(64, w - 56, 36):
        for y in range(74, h - 56, 36):
            dr.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(191, 214, 245))
    dr.rounded_rectangle([92, 492, 1004, 1384], radius=36, fill=(214, 229, 250))
    dr.rounded_rectangle([84, 484, 996, 1376], radius=36, fill=(255, 255, 255), outline=(37, 99, 235), width=5)
    dr.rounded_rectangle([420, 464, 660, 502], radius=999, fill=(209, 250, 229), outline=(5, 150, 105), width=3)
    return img


def create_fountain_pen_cursor() -> Image.Image:
    img = Image.new("RGBA", (190, 190), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    dr.polygon([(20, 172), (52, 154), (176, 36), (150, 14), (32, 134)], fill=(23, 37, 84, 42))
    dr.polygon([(38, 124), (152, 10), (180, 38), (66, 152)], fill=(37, 99, 235, 255), outline=(23, 37, 84, 255))
    dr.line([(42, 120), (70, 148)], fill=(16, 185, 129, 255), width=7)
    dr.line([(134, 28), (162, 56)], fill=(226, 232, 240, 255), width=5)
    dr.polygon([(16, 168), (38, 124), (66, 152)], fill=(226, 232, 240, 255), outline=(23, 37, 84, 255))
    dr.line([(16, 168), (44, 140)], fill=(30, 58, 138, 255), width=3)
    dr.ellipse([40, 136, 48, 144], fill=(37, 99, 235, 255))
    return img


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
      background: #2563eb; color: #ffffff; font-size: 24px; font-weight: 800;
      padding: 9px 22px; border-radius: 999px; letter-spacing: -0.01em;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.22);
    }}
    .wm {{
      font-size: 24px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.02em;
      background: #ffffff; border: 2.5px solid #93c5fd; padding: 7px 18px; border-radius: 999px;
    }}
    .headline {{
      position: absolute; top: 152px; left: 84px; right: 84px;
      font-size: 51px; font-weight: 900; color: #0f172a; line-height: 1.20;
      letter-spacing: -0.03em; word-break: keep-all;
    }}
    .headline .hl {{
      background: linear-gradient(transparent 56%, #a7f3d0 56%);
      color: #1e3a8a;
      padding: 0 6px;
    }}
    .speech-bubble {{
      position: absolute; top: 318px; left: 84px; right: 84px;
      background: #ffffff; border: 3.5px solid #2563eb; border-radius: 26px;
      padding: 20px 28px; font-size: 28px; font-weight: 800; color: #172554;
      line-height: 1.35; box-shadow: 6px 6px 0 #bfdbfe; word-break: keep-all;
    }}
    .speech-bubble::after {{
      content: ''; position: absolute; bottom: -20px; left: 110px;
      border-width: 20px 18px 0; border-style: solid;
      border-color: #2563eb transparent transparent;
    }}
    .note-card {{
      position: absolute; top: 1408px; left: 84px; right: 84px;
      background: #ffffff; border: 4px solid #2563eb; border-radius: 28px;
      padding: 22px 28px; box-shadow: 8px 8px 0 #93c5fd;
      opacity: {note_opacity}; transform: translateY({note_shift});
    }}
    .note-badge {{
      display: inline-block; background: {sc['note_badge_bg']}; color: {sc['note_badge_fg']};
      font-size: 21px; font-weight: 900; padding: 5px 16px; border-radius: 999px;
      border: 2.5px solid #2563eb; margin-bottom: 9px;
    }}
    .note-title {{
      font-size: 28px; font-weight: 900; color: #172554; line-height: 1.25;
      letter-spacing: -0.02em; word-break: keep-all;
    }}
    .note-body {{
      margin-top: 7px; font-size: 23px; font-weight: 700; color: #334155; line-height: 1.34;
      word-break: keep-all;
    }}
    .sub-box {{
      position: absolute; bottom: 112px; left: 56px; right: 56px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }}
    .sub-inner {{
      background: rgba(255, 255, 255, 0.97); color: #0f172a;
      padding: 16px 28px; border-radius: 24px; text-align: center;
      font-size: 31px; font-weight: 900; line-height: 1.34;
      border: 3.5px solid #2563eb;
      box-shadow: 0 12px 28px rgba(30, 58, 138, 0.16);
      word-break: keep-all;
    }}
    .sub-inner .l2 {{ color: #059669; }}
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


def render_finale_stinger_frame(w: int, h: int, progress: float, brush_indigo_cobalt: Image.Image) -> Image.Image:
    ys = np.linspace(0.0, 1.0, h, dtype=np.float32)[:, None]
    bg = np.zeros((h, w, 3), dtype=np.float32)
    bg[:, :, 0] = 236.0 + 18.0 * (1.0 - ys)
    bg[:, :, 1] = 244.0 + 10.0 * (1.0 - ys)
    bg[:, :, 2] = 254.0
    img = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).convert("RGBA")
    dr = ImageDraw.Draw(img)

    for x in range(80, w - 60, 48):
        for y in range(80, h - 60, 48):
            dr.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(191, 219, 254, 255))

    card_w, card_h = int(w * 0.86), int(h * 0.62)
    cx0, cy0 = (w - card_w) // 2, (h - card_h) // 2
    dr.rounded_rectangle([cx0 + 10, cy0 + 14, cx0 + card_w + 10, cy0 + card_h + 14], radius=44, fill=(191, 219, 254, 150))
    dr.rounded_rectangle([cx0, cy0, cx0 + card_w, cy0 + card_h], radius=44, fill=(255, 255, 255, 255), outline=(37, 99, 235, 255), width=5)

    p_in = min(1.0, progress / 0.30)
    ease = 1.0 - (1.0 - p_in) ** 3
    lw = int(w * 0.56 * (0.88 + 0.12 * ease))
    lh = max(24, int(round(brush_indigo_cobalt.height * (lw / float(brush_indigo_cobalt.width)))))
    logo = brush_indigo_cobalt.resize((lw, lh), Image.Resampling.LANCZOS)

    reveal_w = max(1, int(round(lw * min(1.0, progress / 0.34))))
    revealed = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
    revealed.paste(logo.crop((0, 0, reveal_w, lh)), (0, 0))
    lx = (w - lw) // 2
    ly = cy0 + int(card_h * 0.12)
    img.paste(revealed, (lx, ly), revealed)

    if progress > 0.20:
        f_ko = _font(56, True)
        ko_txt = "부자생각"
        bb = dr.textbbox((0, 0), ko_txt, font=f_ko)
        dr.text(((w - (bb[2] - bb[0])) // 2, ly + lh + 26), ko_txt, font=f_ko, fill=(23, 37, 84, 255))

        f_sub = _font(28, True)
        sub_txt = "예비창업자 · 매장 사장님 · 셀러 실전 손익 연구소"
        bbs = dr.textbbox((0, 0), sub_txt, font=f_sub)
        dr.text(((w - (bbs[2] - bbs[0])) // 2, ly + lh + 104), sub_txt, font=f_sub, fill=(5, 150, 105, 255))

    if progress > 0.36:
        pw, ph = 660, 88
        px0 = (w - pw) // 2
        py0 = cy0 + card_h - ph - 82
        dr.rounded_rectangle([px0, py0, px0 + pw, py0 + ph], radius=999, fill=(37, 99, 235, 255))
        f_cta = _font(32, True)
        cta_txt = "검색창에 ‘부자생각’ · boozathink.com"
        bbc = dr.textbbox((0, 0), cta_txt, font=f_cta)
        dr.text((px0 + (pw - (bbc[2] - bbc[0])) // 2, py0 + (ph - (bbc[3] - bbc[1])) // 2 - 3), cta_txt, font=f_cta, fill=(255, 255, 255, 255))

    return img.convert("RGB")


def fft_bandpass(sig: np.ndarray, lo_hz: float, hi_hz: float, peak_hz: float | None = None, peak_gain: float = 0.0) -> np.ndarray:
    n = len(sig)
    spec = np.fft.rfft(sig)
    freqs = np.fft.rfftfreq(n, d=1.0 / SR)
    mask = ((freqs >= lo_hz) & (freqs <= hi_hz)).astype(np.float32)
    if peak_hz is not None and peak_gain > 0:
        mask *= 1.0 + peak_gain * np.exp(-0.5 * ((freqs - peak_hz) / 480.0) ** 2)
    return np.fft.irfft(spec * mask, n=n).astype(np.float32)


def sfx_fountain_pen_sketch(dur_sec: float, seed: int = 17) -> np.ndarray:
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
        w = (w / (float(np.max(np.abs(w))) + 1e-6)) * env * float(rng.uniform(0.070, 0.098))
        pan = float(np.clip(0.32 + 0.36 * ((idx % 5) / 4.0), 0.25, 0.75))
        s0 = int(round(t_cur * SR))
        seg_n = min(n, total_n - s0)
        st[s0 : s0 + seg_n, 0] += w[:seg_n] * math.sqrt(1.0 - pan)
        st[s0 : s0 + seg_n, 1] += w[:seg_n] * math.sqrt(pan)
        gap = float(rng.uniform(0.018, 0.042) if (idx % 5 != 4) else rng.uniform(0.08, 0.15))
        t_cur += sd + gap
        idx += 1
    return st


def sfx_shorts_brand_flash(dur_sec: float = 0.92) -> np.ndarray:
    """Snappy 0.92s Mid-Video Brand Flash ('휙-쿵-띠리링!') for inter-scene BOOZA THINK stingers."""
    n_tot = int(round(dur_sec * SR))
    st = np.zeros((n_tot, 2), dtype=np.float32)
    rng = np.random.default_rng(77)

    wn = min(int(0.14 * SR), n_tot)
    uw = np.linspace(0.0, 1.0, wn, dtype=np.float32)
    whoosh = fft_bandpass(rng.normal(0.0, 1.0, size=wn).astype(np.float32), 750.0, 5400.0)
    whoosh = (whoosh / (float(np.max(np.abs(whoosh))) + 1e-6)) * (uw ** 1.5) * 0.16
    st[:wn, 0] += whoosh * 0.95
    st[:wn, 1] += whoosh * 1.05

    tn = min(int(0.36 * SR), max(0, n_tot - int(0.11 * SR)))
    if tn > 32:
        s_th = int(0.11 * SR)
        tt = np.arange(tn, dtype=np.float32) / SR
        thump = np.sin(2.0 * np.pi * (62.0 + 78.0 * np.exp(-tt * 36.0)) * tt) * np.exp(-tt * 13.0) * 0.24
        st[s_th : s_th + tn, 0] += thump
        st[s_th : s_th + tn, 1] += thump

    for st_t, hz, l_g, r_g in [(0.13, 783.99, 1.08, 0.92), (0.22, 987.77, 1.0, 1.0), (0.31, 1174.66, 0.92, 1.08)]:
        s0 = int(round(st_t * SR))
        bn = min(int(0.55 * SR), n_tot - s0)
        if bn > 64:
            tb = np.arange(bn, dtype=np.float32) / SR
            bell = (np.sin(2.0 * np.pi * hz * tb) * 0.80 + np.sin(2.0 * np.pi * hz * 2.0 * tb) * 0.20) * np.exp(-tb * 6.8)
            bell *= np.minimum(1.0, tb / 0.004) * 0.17
            st[s0 : s0 + bn, 0] += bell * l_g
            st[s0 : s0 + bn, 1] += bell * r_g
    return st


def sfx_brand_ping(dur_sec: float = 0.55) -> np.ndarray:
    """Subtle 2-note crystal chime ping when the mid-scene BOOZA THINK badge & insight card pop."""
    n_tot = int(round(dur_sec * SR))
    st = np.zeros((n_tot, 2), dtype=np.float32)
    for st_t, hz in [(0.0, 1046.50), (0.09, 1318.51)]:
        s0 = int(round(st_t * SR))
        bn = min(int(0.42 * SR), n_tot - s0)
        if bn > 32:
            tb = np.arange(bn, dtype=np.float32) / SR
            bell = np.sin(2.0 * np.pi * hz * tb) * np.minimum(1.0, tb / 0.004) * np.exp(-tb * 8.5) * 0.11
            st[s0 : s0 + bn, 0] += bell * 0.95
            st[s0 : s0 + bn, 1] += bell * 1.05
    return st


def render_shorts_mid_stinger_frame(w: int, h: int, progress: float, brush_white_mint: Image.Image, tag_txt: str) -> Image.Image:
    """0.92s Native 9:16 Royal-Cobalt Blueprint BOOZA THINK Mid-Video Logo Stinger."""
    p = max(0.0, min(1.0, progress))
    ease = 1.0 - (1.0 - min(1.0, p / 0.34)) ** 3
    canvas = Image.new("RGBA", (w, h), (23, 47, 115, 255))
    dr = ImageDraw.Draw(canvas, "RGBA")
    for gx in range(0, w, 48):
        dr.line([(gx, 0), (gx, h)], fill=(59, 130, 246, 52), width=1)
    for gy in range(0, h, 48):
        dr.line([(0, gy), (w, gy)], fill=(59, 130, 246, 52), width=1)

    cx, cy = w // 2, h // 2
    rx = int(455 * (0.90 + 0.10 * ease))
    ry = int(390 * (0.90 + 0.10 * ease))
    dr.rounded_rectangle([cx - rx, cy - ry, cx + rx, cy + ry], radius=52, fill=(30, 64, 175, 255), outline=(110, 231, 183, 255), width=6)

    target_lw = int(600 * (0.85 + 0.15 * ease))
    target_lh = max(32, int(round(target_lw * brush_white_mint.height / float(brush_white_mint.width))))
    logo_sc = brush_white_mint.resize((target_lw, target_lh), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo_sc, (cx - target_lw // 2, cy - target_lh // 2 - 64))

    if p > 0.18:
        hp = min(1.0, (p - 0.18) / 0.28)
        full_bw = 760
        cur_bw = max(32, int(full_bw * hp))
        by0 = cy + target_lh // 2 - 12
        dr.rounded_rectangle([cx - full_bw // 2, by0, cx - full_bw // 2 + cur_bw, by0 + 76], radius=38, fill=(16, 185, 129, 255), outline=(255, 255, 255, 255), width=4)
        if hp > 0.52:
            f_b = _font(32, True)
            dr.text((cx - dr.textlength(tag_txt, font=f_b) / 2, by0 + 18), tag_txt, font=f_b, fill=(255, 255, 255, 255))
    return canvas.convert("RGB")


def sfx_finale_chime(dur_sec: float = 2.3) -> np.ndarray:
    n = int(round(dur_sec * SR))
    st = np.zeros((n, 2), dtype=np.float32)
    notes = [(0.04, 523.25), (0.15, 659.25), (0.26, 783.99), (0.38, 987.77), (0.52, 1046.50)]
    for t0, hz in notes:
        s0 = int(round(t0 * SR))
        ln = min(int(1.3 * SR), n - s0)
        if ln <= 0:
            continue
        t = np.arange(ln, dtype=np.float32) / SR
        bell = (np.sin(2.0 * np.pi * hz * t) * 0.72 + np.sin(2.0 * np.pi * hz * 2.0 * t) * 0.22 * np.exp(-t * 5.0))
        bell *= np.minimum(1.0, t / 0.006) * np.exp(-t * 3.1) * 0.16
        st[s0 : s0 + ln, 0] += bell * 0.96
        st[s0 : s0 + ln, 1] += bell * 1.04
    return st


def synth_warm_sketch_bgm(total_dur: float) -> np.ndarray:
    total_n = int(round((total_dur + 0.6) * SR))
    st = np.zeros((total_n, 2), dtype=np.float32)
    beat = 60.0 / 106.0
    bar = beat * 4.0
    chords = [
        [261.63, 329.63, 392.00, 493.88],
        [220.00, 261.63, 329.63, 392.00],
        [293.66, 349.23, 440.00, 523.25],
        [196.00, 246.94, 349.23, 440.00],
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
        chord_w *= env * 0.12
        s0 = int(round(t_bar * SR))
        seg_n = min(n, total_n - s0)
        st[s0 : s0 + seg_n, 0] += chord_w[:seg_n] * 0.94
        st[s0 : s0 + seg_n, 1] += chord_w[:seg_n] * 1.06

        for sub_beat, note_i in ((1.5, 2), (2.5, 3), (3.5, 1)):
            nt0 = t_bar + sub_beat * beat
            if nt0 + 0.35 < total_dur:
                nn = int(0.35 * SR)
                tt = np.arange(nn, dtype=np.float32) / SR
                hz_arp = freqs[note_i] * 2.0
                plink = np.sin(2.0 * np.pi * hz_arp * tt) * np.minimum(1.0, tt / 0.006) * np.exp(-tt * 7.5) * 0.04
                ns0 = int(round(nt0 * SR))
                nseg = min(nn, total_n - ns0)
                st[ns0 : ns0 + nseg, 0] += plink[:nseg] * 0.85
                st[ns0 : ns0 + nseg, 1] += plink[:nseg] * 1.15

        t_bar += bar
        b_idx += 1
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


def build_episode(ep_key: str) -> Path:
    cfg = EPISODES[ep_key]
    out_dir: Path = cfg["out_dir"]
    work_dir: Path = cfg["work_dir"]
    out_dir.mkdir(parents=True, exist_ok=True)
    work_dir.mkdir(parents=True, exist_ok=True)

    paper_base = make_sketchbook_paper(W, H)
    paper_arr = np.asarray(paper_base, dtype=np.float32)
    pen_sprite = create_fountain_pen_cursor()
    brush_indigo_cobalt = load_boozathink_brush_rgba((23, 37, 84), (37, 99, 235), target_w=640)
    brush_white_mint = load_boozathink_brush_rgba((255, 255, 255), (110, 231, 183), target_w=640)
    use_mid_stingers = bool(cfg.get("mid_stingers", False))
    mid_dur = 0.92 if use_mid_stingers else 0.0
    mid_frames = int(round(mid_dur * FPS)) if use_mid_stingers else 0

    box_x, box_y, box_w, box_h = 104, 504, 872, 852
    u_grid = np.linspace(0.0, 1.0, box_w, dtype=np.float32)[None, :]
    v_grid = np.linspace(0.0, 1.0, box_h, dtype=np.float32)[:, None]
    diag_grid = u_grid * 0.65 + v_grid * 0.35

    vo_map: dict[str, tuple[Path, float]] = {}
    for sc in cfg["scenes"]:
        vo_map[sc["id"]] = make_scene_voice_wav(sc["id"], sc["voice"], work_dir)

    prepared_scenes = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        pg = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)

        for idx, sc in enumerate(cfg["scenes"]):
            vo_wav, vo_dur = vo_map[sc["id"]]
            dur = max(7.5, vo_dur + 0.30)

            src_img = Image.open(sc["asset"]).convert("RGB")
            col_arr, ink_arr = extract_doodle_layers(src_img, box_w, box_h)
            ord_map, px_arr, py_arr = compute_kinetic_trace_path(ink_arr)

            ov1_path = work_dir / f"{sc['id']}_ov1.png"
            ov2_path = work_dir / f"{sc['id']}_ov2.png"

            pg.set_content(build_overlay_html(sc, sc["sub_first"], show_note=False), wait_until="networkidle")
            pg.screenshot(path=str(ov1_path), type="png", omit_background=True)

            pg.set_content(build_overlay_html(sc, sc["sub_second"], show_note=True), wait_until="networkidle")
            pg.screenshot(path=str(ov2_path), type="png", omit_background=True)

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
                    "ov1": Image.open(ov1_path).convert("RGBA"),
                    "ov2": Image.open(ov2_path).convert("RGBA"),
                }
            )
            print(f"[{ep_key.upper()} Scene {idx+1}] {sc['id']} -> {dur:.2f}s ({int(round(dur * FPS))} frames)")

        browser.close()

    fin_dur = 2.25
    fin_frames = int(round(fin_dur * FPS))
    num_mid_breaks = max(0, len(prepared_scenes) - 1) if use_mid_stingers else 0
    total_frames = sum(s["frames"] for s in prepared_scenes) + num_mid_breaks * mid_frames + fin_frames
    total_dur = total_frames / float(FPS)

    silent_mp4 = work_dir / f"{ep_key}_silent.mp4"
    cover_png = out_dir / cfg["cover_name"]
    preview_png = out_dir / cfg["preview_name"]
    cover_s_idx = int(cfg["cover_scene_idx"])

    cmd_vid = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-pix_fmt", "yuv420p", str(silent_mp4),
    ]
    proc = subprocess.Popen(cmd_vid, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    foley_intervals: list[tuple[float, float, int]] = []
    mid_stinger_times: list[float] = []
    ping_times: list[float] = []
    vo_start_times: list[float] = []
    t_offset = 0.0
    mid_labels = ["부자생각  ·  핵심 조달 공식", "부자생각  ·  3초 한도 진단"]

    for s_idx, sc in enumerate(prepared_scenes):
        vo_start_times.append(t_offset)
        n_frames = sc["frames"]
        dur = sc["dur"]
        t_draw_start = 0.10
        t_draw_end = dur * float(sc["draw_ratio"])
        t_col_start = t_draw_end * 0.70
        t_col_dur = max(1.0, dur * 0.24)
        foley_intervals.append((t_offset + t_draw_start, max(0.8, t_draw_end - t_draw_start), 41 + s_idx * 19))
        if use_mid_stingers:
            ping_times.append(t_offset + dur * 0.46)

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

            ink_alpha = (0.88 * cur_ink)[:, :, None]
            navy_rgb = np.array([24.0, 34.0, 60.0], dtype=np.float32)[None, None, :]
            ink_layer = patch_bg * (1.0 - ink_alpha) + navy_rgb * ink_alpha

            p_col = float(np.clip((t - t_col_start) / t_col_dur, 0.0, 1.0))
            if p_col > 0.003:
                w_mask = np.clip((p_col * 1.25 - diag_grid) / 0.22, 0.0, 1.0)[:, :, None]
                colored = patch_bg * (col_arr / 255.0)
                drawn = ink_layer * (1.0 - w_mask) + np.minimum(colored, ink_layer + 22.0) * w_mask
            else:
                drawn = ink_layer

            if p_draw >= 0.995:
                boil_phase = (fn // 4) % 4
                shift_x = (1 if boil_phase in (1, 2) else -1) if boil_phase != 0 else 0
                shift_y = 1 if boil_phase == 2 else 0
                if shift_x != 0 or shift_y != 0:
                    drawn = np.roll(np.roll(drawn, shift_y, axis=0), shift_x, axis=1)

            canvas[box_y : box_y + box_h, box_x : box_x + box_w] = drawn
            frame_rgba = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).convert("RGBA")

            ov = sc["ov1"] if t < (dur * 0.46) else sc["ov2"]
            frame_rgba.alpha_composite(ov)

            # Mid-scene BOOZA THINK top-right badge glow when core formula pops
            if use_mid_stingers and abs(t - dur * 0.46) < 0.34:
                ga = int(230 * (1.0 - abs(t - dur * 0.46) / 0.34))
                dr_g = ImageDraw.Draw(frame_rgba, "RGBA")
                dr_g.rounded_rectangle([676, 82, 998, 140], radius=29, outline=(16, 185, 129, ga), width=5)

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
            if s_idx == 0 and fn == int(n_frames * 0.45):
                frame_rgb.save(preview_png, format="PNG")
            if s_idx == cover_s_idx and fn == int(n_frames * 0.88):
                frame_rgb.save(cover_png, format="PNG")

            proc.stdin.write(frame_rgb.tobytes())

        t_offset += dur

        if use_mid_stingers and s_idx < len(prepared_scenes) - 1:
            mid_stinger_times.append(t_offset)
            lbl_m = mid_labels[min(s_idx, len(mid_labels) - 1)]
            for mfi in range(mid_frames):
                fr_m = render_shorts_mid_stinger_frame(W, H, mfi / float(max(1, mid_frames - 1)), brush_white_mint, lbl_m)
                proc.stdin.write(fr_m.tobytes())
            t_offset += mid_frames / float(FPS)

    # Finale Brand Stinger Frames
    fin_start_t = t_offset
    for fi in range(fin_frames):
        fr_fin = render_finale_stinger_frame(W, H, fi / float(max(1, fin_frames - 1)), brush_indigo_cobalt)
        proc.stdin.write(fr_fin.tobytes())

    proc.stdin.close()
    proc.wait()

    # Audio Master Mix
    master_st = synth_warm_sketch_bgm(total_dur)
    for s_idx, sc in enumerate(prepared_scenes):
        vo_st = read_stereo_wav_float(sc["vo_wav"]) * 1.02
        s0 = int(round(vo_start_times[s_idx] * SR))
        seg_n = min(len(vo_st), len(master_st) - s0)
        if seg_n > 0:
            master_st[s0 : s0 + seg_n] += vo_st[:seg_n]

    for f_start, f_dur, f_seed in foley_intervals:
        pen_st = sfx_fountain_pen_sketch(f_dur, seed=f_seed)
        s0 = int(round(f_start * SR))
        seg_n = min(len(pen_st), len(master_st) - s0)
        if seg_n > 0:
            master_st[s0 : s0 + seg_n] += pen_st[:seg_n]

    for pt in ping_times:
        ping_st = sfx_brand_ping(0.55)
        s0 = int(round(pt * SR))
        seg_n = min(len(ping_st), len(master_st) - s0)
        if seg_n > 0:
            master_st[s0 : s0 + seg_n] += ping_st[:seg_n]

    for mt in mid_stinger_times:
        flash_st = sfx_shorts_brand_flash(mid_dur) * 0.95
        s0 = int(round(mt * SR))
        seg_n = min(len(flash_st), len(master_st) - s0)
        if seg_n > 0:
            master_st[s0 : s0 + seg_n] += flash_st[:seg_n]

    fin_chime = sfx_finale_chime(fin_dur)
    s_fin = int(round(max(0.0, fin_start_t - 0.04) * SR))
    seg_fin = min(len(fin_chime), len(master_st) - s_fin)
    if seg_fin > 0:
        master_st[s_fin : s_fin + seg_fin] += fin_chime[:seg_fin]

    master_wav = work_dir / f"{ep_key}_master_audio.wav"
    write_stereo_wav(master_wav, master_st)

    final_mp4 = out_dir / cfg["mp4_name"]
    subprocess.run(
        [
            FFMPEG_EXE, "-y",
            "-i", str(silent_mp4),
            "-i", str(master_wav),
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            "-shortest",
            str(final_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    silent_mp4.unlink(missing_ok=True)
    master_wav.unlink(missing_ok=True)
    print(f"[{ep_key.upper()} DONE] {final_mp4} ({final_mp4.stat().st_size:,} bytes, {total_dur:.2f}s)")
    return final_mp4


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ep", default="all", choices=["ep02", "ep03", "ep04", "ep05", "ep06", "all"])
    args = parser.parse_args()
    targets = ["ep02", "ep03", "ep04", "ep05", "ep06"] if args.ep == "all" else [args.ep]
    for k in targets:
        build_episode(k)

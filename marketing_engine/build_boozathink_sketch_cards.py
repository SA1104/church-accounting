# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — 1080x1350 Pen-Sketch Feed Card Builder (4 Daily Slots)
================================================================================
Renders crisp 4:5 (`1080x1350`) notebook pen-sketch story cards for:
  - Slot 1 (`08:20 KST` · 출근길 예비창업자·온라인 셀러)
  - Slot 2 (`12:15 KST` · 점심시간 직장인 창업·순서 노트)
  - Slot 3 (`15:15 KST` · 오후 브레이크타임 매장 사장님 순익·수수료 점검)
  - Slot 4 (`22:30 KST` · 마감 후 심야 내 가게 자본금·대출 설계)

Outputs to:
  1) `backend/public/promo-cards/` (First-party `https://boozathink.com/promo-cards/...` for Threads/Meta API)
  2) `C:\\Users\\new-s\\OneDrive\\Desktop\\BoozaThink_유튜브_릴스_직접업로드_대기함\\02_스레드_인스타_X_스케치카드_대기함\\`
"""
from __future__ import annotations

import base64
import shutil
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

MKT_DIR = Path(__file__).resolve().parent
REPO_ROOT = MKT_DIR.parent
ASSETS_DIR = REPO_ROOT / "youtube_studio" / "assets"
PUBLIC_CARDS_DIR = REPO_ROOT / "backend" / "public" / "promo-cards"
MANUAL_CARDS_BOX = Path(r"C:\Users\new-s\OneDrive\Desktop\BoozaThink_유튜브_릴스_직접업로드_대기함") / "02_스레드_인스타_X_스케치카드_대기함"

CARDS = [
    {
        "slot": "0820_morning",
        "filename": "card01_0820_morning.png",
        "asset": "ep01_s1_vague_thought.jpg",
        "kicker": "출근길 1분 창업 스케치 · 막연한 생각 정리",
        "headline": "내 사업 해보고 싶은데,<br><span class='hl'>뭐부터 할지 막막할 때</span>",
        "quote": "“돈 모아서 상가부터 보러 다니면 될까요?”",
        "points": [
            ("첫째 · 내 업종 기본 숫자 보기", "30개 업종별 표준 면적·초기 비용·원가율부터 한눈에 확인"),
            ("둘째 · 온라인 셀러 vs 매장 비교", "스마트스토어·쿠팡 수수료와 오프라인 고정비 차이를 미리 계산"),
            ("셋째 · 결과표 저장해 두고 비교", "올해 12.31까지 무료 개방된 계산기에서 여러 조건을 비교함에 담기"),
        ],
        "target_url": "https://boozathink.com/calculators/startup-master",
        "x_caption": (
            "출근길에 문득 ‘언젠가 내 가게 해보고 싶다’는 생각이 든다면 상가부터 보러 다니지 마세요.\n\n"
            "• 30개 업종별 초기 비용·원가율 먼저 그려보기\n"
            "• 배달·세금 뺀 진짜 남는 순수익 확인하기\n"
            "• 올해 12.31까지 전 업종 시뮬레이터 무료 개방:\n"
            "https://boozathink.com/calculators/startup-master?utm_source=x&utm_medium=slot_0820"
        ),
        "threads_caption": (
            "언젠가 내 가게, 내 브랜드를 해보고 싶은데 어디서부터 손대야 할지 막막하셨나요?\n\n"
            "창업이 어렵게 느껴지는 건 능력이 부족해서가 아니라 ‘전체 순서 지도’를 한눈에 본 적이 없기 때문입니다.\n\n"
            "1) 내가 생각한 업종의 평균 초기 비용과 적정 월세선 확인\n"
            "2) 재료비·수수료·세금을 다 빼고 통장에 진짜 남는 돈 계산\n"
            "3) 비수기가 와도 몇 달을 버틸 수 있는지 안전선 점검\n\n"
            "올해 12월 31일까지만 모든 업종 계산과 결과 이미지 저장을 무료로 열어두었으니 출근길 1분만 투자해 내 가게를 먼저 그려보세요:\n"
            "https://boozathink.com/calculators/startup-master?utm_source=threads&utm_medium=slot_0820"
        ),
    },
    {
        "slot": "1215_lunch",
        "filename": "card02_1215_lunch.png",
        "asset": "ep01_s2_easy_steps.jpg",
        "kicker": "점심시간 3분 창업 순서 · 몰라서 놓치는 돈 막기",
        "headline": "공사 결제 전에 통장부터!<br><span class='hl'>순서 하나로 아끼는 500만 원</span>",
        "quote": "“인테리어 계약금 먼저 보내고 나중에 사업자 내면 안 되나요?”",
        "points": [
            ("1단계 · 결제 전 사업자등록 먼저", "인테리어·집기 결제 전 사업자번호로 세금계산서를 받아야 부가세 환급"),
            ("2단계 · 사업용 통장·카드 분리", "홈택스에 전용 계좌·카드를 등록해야 첫해 세금 신고 때 누락 제로"),
            ("3단계 · 첫 1년 달력 한 장에 정리", "1월·7월 부가세부터 5월 종합소득세까지 날짜별로 쉽게 확인"),
        ],
        "target_url": "https://boozathink.com/start-guide",
        "x_caption": (
            "점심시간 1분 체크! 인테리어 공사비 5,000만 원 결제하기 전에 ‘이 순서’만 지키면 부가세 500만 원을 아낍니다.\n\n"
            "1) 결제 전 사업자등록 먼저 신청\n"
            "2) 사업용 통장·카드 발급 후 홈택스 등록\n"
            "3) 반드시 세금계산서 발행 조건 확인\n\n"
            "계약부터 첫 1년 전체 순서표(올해 무료 개방):\n"
            "https://boozathink.com/start-guide?utm_source=x&utm_medium=slot_1215"
        ),
        "threads_caption": (
            "초보 사장님들이 가장 많이 아쉬워하는 순간 1위가 바로 ‘사업자등록 전에 급하게 결제한 인테리어·집기 비용’입니다.\n\n"
            "순서만 살짝 바꾸면 참 쉽습니다:\n"
            "• 도장 찍고 결제하기 전 사업자등록증부터 신청하기\n"
            "• 사업용 통장·카드 발급받아 홈택스에 먼저 등록하기\n"
            "• 공사비·커피머신·간판 모두 사업자번호로 세금계산서 받기\n\n"
            "처음 가게를 열 때부터 1년 차 세금 신고까지 놓치기 쉬운 순서를 한눈에 보실 수 있게 정리해 두었습니다 (올해 12.31까지 전 도구 무료 개방):\n"
            "https://boozathink.com/start-guide?utm_source=threads&utm_medium=slot_1215"
        ),
    },
    {
        "slot": "1515_breaktime",
        "filename": "card03_1515_breaktime.png",
        "asset": "ep01_s2_easy_steps.jpg",
        "kicker": "오후 브레이크타임 점검 · 바쁜데 남는 돈이 적다면",
        "headline": "매출은 찍히는데 왜 빠듯할까?<br><span class='hl'>배달·포장 마진 1분 점검</span>",
        "quote": "“하루 100건 파는데 정산일에 통장을 보면 왜 이것밖에 안 남죠?”",
        "points": [
            ("수수료 + 배달비 + 용기값 분해", "중개수수료뿐 아니라 배달 분담금·포장용기·할인쿠폰을 따로 계산"),
            ("포장 주문 비중 10%의 마법", "배달 분담금이 빠지는 포장 주문을 늘릴 때 살아나는 순익 확인"),
            ("고금리 사업자 대출 갈아타기 점검", "연 7% 이상 대출을 소상공인 저금리 대환 요건으로 낮출 수 있는지 체크"),
        ],
        "target_url": "https://boozathink.com/calculators/delivery-margin",
        "x_caption": (
            "식당·카페 브레이크타임 1분 점검! 주문은 계속 들어오는데 정산일에 남는 돈이 적다면 메뉴 1그릇당 실제 마진부터 쪼개보세요.\n\n"
            "• 앱 중개수수료 + 배달비 + 포장용기 + 쿠폰 분담금\n"
            "• 포장 주문 비중 올릴 때 늘어나는 월 순익 즉시 계산\n\n"
            "무료 배달·포장 마진 계산기(올해 12.31까지 무료 개방):\n"
            "https://boozathink.com/calculators/delivery-margin?utm_source=x&utm_medium=slot_1515"
        ),
        "threads_caption": (
            "오후 브레이크타임에 잠깐 숨 돌리시는 사장님들께 꼭 권해드리는 1분 숫자 점검입니다.\n\n"
            "하루 종일 바쁘게 조리했는데 월말 통장이 빠듯하다면, 메뉴 가격에서 원가만 빼서 보고 계실 가능성이 높습니다.\n\n"
            "• 배달앱 중개수수료 + 결제수수료\n"
            "• 사장님 부담 배달대행비 + 보온·포장용기 원가\n"
            "• 노출용 할인쿠폰 분담금\n\n"
            "내 주력 메뉴 숫자를 넣어 한 그릇당 진짜 남는 금액을 확인해 보세요 (올해 12.31까지 무료 개방 · 결과표 저장 지원):\n"
            "https://boozathink.com/calculators/delivery-margin?utm_source=threads&utm_medium=slot_1515"
        ),
    },
    {
        "slot": "2230_night",
        "filename": "card04_2230_night.png",
        "asset": "ep01_s3_bright_storefront.jpg",
        "kicker": "마감 후 심야 설계 · 내 자본금에 맞는 안전한 출발",
        "headline": "내 돈과 기존 대출 조건으로<br><span class='hl'>무리 없이 여는 내 가게 그림</span>",
        "quote": "“기존에 받아둔 대출이 조금 있는데 창업자금이 얼마나 나올까요?”",
        "points": [
            ("기존 대출 종류별 한도 영향 반영", "정책자금·은행신용·주담대·카드론 보유 여부에 따른 추가 한도 추산"),
            ("추천 지역 · 실제 지도 반경 확인", "내 업종에 유리한 상권 유형과 주변 동종 매장 밀집도를 지도에서 점검"),
            ("비수기 방어력까지 미리 확인", "매출이 25% 줄어드는 달에도 버틸 수 있는 안전한 월세선 계산"),
        ],
        "target_url": "https://boozathink.com/funding",
        "x_caption": (
            "하루를 마무리하며 내 가게 창업을 고민 중이라면, 무리한 영끌 대신 내 기존 대출·신용 조건에서 가능한 안전 자금선부터 그려보세요.\n\n"
            "• 기존 대출 종류별 보증서·정책자금 가능 범위 점검\n"
            "• 비수기에도 버티는 적정 월세·자기자본 비율 확인\n\n"
            "올해 12.31까지 무료 개방:\n"
            "https://boozathink.com/funding?utm_source=x&utm_medium=slot_2230"
        ),
        "threads_caption": (
            "가게 문을 열기 전 가장 든든한 무기는 ‘많이 빌리는 것’이 아니라 ‘내가 감당할 수 있는 안전한 숫자를 미리 알고 시작하는 것’입니다.\n\n"
            "부자생각에서는 현재 보유하신 자기자본과 기존 대출 종류(정책자금·은행신용·담보 등)를 함께 넣어:\n"
            "1) 추가로 활용 가능한 저금리 보증서·정책자금 범위와\n"
            "2) 매달 원리금을 갚고도 내 인건비 이상이 남는 안전 매출선을 한눈에 그려볼 수 있습니다.\n\n"
            "올해 12월 31일까지만 모든 세부 진단을 무료로 열어두었으니 오늘 밤 편하게 확인해 보세요:\n"
            "https://boozathink.com/funding?utm_source=threads&utm_medium=slot_2230"
        ),
    },
]


def build_card_html(c: dict, img_b64: str) -> str:
    rows_html = "".join(
        f"""<div class="pt-row">
              <div class="pt-num">{i+1}</div>
              <div class="pt-txt">
                <div class="pt-t">{t}</div>
                <div class="pt-d">{d}</div>
              </div>
            </div>"""
        for i, (t, d) in enumerate(c["points"])
    )
    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      width: 1080px; height: 1350px; overflow: hidden; position: relative;
      background-color: #fcfbf7;
      background-image:
        linear-gradient(#e6edf7 1.8px, transparent 1.8px),
        linear-gradient(90deg, #e6edf7 1.8px, transparent 1.8px);
      background-size: 40px 40px;
      font-family: 'Pretendard', 'Malgun Gothic', sans-serif;
      padding: 54px 64px;
      display: flex; flex-direction: column; justify-content: space-between;
    }}
    .top-row {{ display: flex; align-items: center; justify-content: space-between; }}
    .kicker {{
      background: #18223c; color: #f4c95d; font-size: 22px; font-weight: 800;
      padding: 8px 20px; border-radius: 999px;
    }}
    .brand {{ font-size: 24px; font-weight: 900; color: #1d4ed8; }}
    .headline {{
      margin-top: 18px; font-size: 52px; font-weight: 900; color: #0f172a;
      line-height: 1.18; letter-spacing: -0.03em;
    }}
    .headline .hl {{ background: linear-gradient(transparent 56%, #fef08a 56%); padding: 0 6px; }}
    .mid-grid {{
      margin-top: 22px; display: flex; gap: 26px; align-items: stretch; height: 470px;
    }}
    .sketch-box {{
      width: 440px; background: #ffffff; border: 4.5px solid #18223c; border-radius: 28px;
      box-shadow: 8px 8px 0 #1d4ed8; padding: 18px;
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    }}
    .sketch-box img {{ width: 360px; height: 360px; object-fit: contain; }}
    .quote {{
      font-size: 20px; font-weight: 800; color: #334155; text-align: center;
      background: #f1f5f9; border-radius: 14px; padding: 10px 14px; width: 100%;
    }}
    .points-box {{
      flex: 1; display: flex; flex-direction: column; justify-content: space-between;
    }}
    .pt-row {{
      background: #ffffff; border: 3.5px solid #18223c; border-radius: 22px;
      padding: 18px 20px; display: flex; gap: 16px; align-items: flex-start;
      box-shadow: 5px 5px 0 #cbd5e1;
    }}
    .pt-num {{
      width: 38px; height: 38px; border-radius: 50%; background: #1d4ed8; color: #ffffff;
      font-size: 21px; font-weight: 900; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 2px;
    }}
    .pt-t {{ font-size: 24px; font-weight: 900; color: #0f172a; }}
    .pt-d {{ margin-top: 5px; font-size: 19px; font-weight: 700; color: #475569; line-height: 1.35; }}
    .footer-cta {{
      margin-top: 22px; background: #18223c; color: #ffffff; border-radius: 26px;
      padding: 24px 30px; display: flex; align-items: center; justify-content: space-between;
      border: 3.5px solid #0f172a;
    }}
    .f-left .f-free {{
      display: inline-block; background: #fef08a; color: #854d0e; font-size: 19px; font-weight: 900;
      padding: 4px 14px; border-radius: 999px; margin-bottom: 6px;
    }}
    .f-left .f-msg {{ font-size: 24px; font-weight: 800; color: #f8fafc; }}
    .f-url {{
      background: #2563eb; color: #ffffff; font-size: 25px; font-weight: 900;
      padding: 12px 26px; border-radius: 999px; border: 2.5px solid #93c5fd;
    }}
    </style></head><body>
      <div>
        <div class="top-row">
          <span class="kicker">{c['kicker']}</span>
          <span class="brand">BOOZA THINK · 부자생각</span>
        </div>
        <div class="headline">{c['headline']}</div>
      </div>
      <div class="mid-grid">
        <div class="sketch-box">
          <img src="data:image/jpeg;base64,{img_b64}" alt="스케치" />
          <div class="quote">{c['quote']}</div>
        </div>
        <div class="points-box">
          {rows_html}
        </div>
      </div>
      <div class="footer-cta">
        <div class="f-left">
          <div class="f-free">올해 12월 31일까지만 전 업종 무료 개방</div>
          <div class="f-msg">검색창에 ‘부자생각’ — 내 가게 숫자를 직접 그려보세요</div>
        </div>
        <div class="f-url">boozathink.com</div>
      </div>
    </body></html>"""


def render_all_sketch_cards() -> list[dict]:
    PUBLIC_CARDS_DIR.mkdir(parents=True, exist_ok=True)
    MANUAL_CARDS_BOX.mkdir(parents=True, exist_ok=True)
    rendered = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        pg = browser.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=1)

        for c in CARDS:
            b64 = base64.b64encode((ASSETS_DIR / c["asset"]).read_bytes()).decode("ascii")
            out_pub = PUBLIC_CARDS_DIR / c["filename"]
            pg.set_content(build_card_html(c, b64), wait_until="networkidle")
            pg.screenshot(path=str(out_pub), type="png")

            shutil.copy2(out_pub, MANUAL_CARDS_BOX / c["filename"])
            cap_txt = MANUAL_CARDS_BOX / f"{Path(c['filename']).stem}_스레드_X_복사문구.txt"
            cap_txt.write_text(
                f"[슬롯: {c['slot']}]\n"
                f"▶ 이미지 파일: {c['filename']}\n"
                f"▶ 퍼스트파티 이미지 URL: https://boozathink.com/promo-cards/{c['filename']}\n\n"
                f"[스레드(Threads) / 인스타 본문 복사용]\n{c['threads_caption']}\n\n"
                f"[X(트위터) 본문 복사용]\n{c['x_caption']}\n",
                encoding="utf-8",
            )
            print(f"[Card OK] {c['filename']} ({out_pub.stat().st_size:,} bytes)")
            rendered.append({**c, "local_path": str(out_pub)})

        browser.close()
    return rendered


if __name__ == "__main__":
    render_all_sketch_cards()

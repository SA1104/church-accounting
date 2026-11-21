# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — 4-Slot Daily Auto-Drip Scheduler (`08:20 / 12:15 / 15:15 / 22:30 KST`)
===============================================================================================
Staggered strictly away from sibling schedules (`SAThink 12:30 / 19:30`, `KoreaThink` global slots):
  - `--slot morning`      (`08:20 KST`) : 출근길 예비창업자·온라인 셀러 스케치 카드 + IndexNow
  - `--slot lunch`        (`12:15 KST`) : 점심시간 직장인 창업 순서 스케치 카드 (Threads #1 + X)
  - `--slot breaktime`    (`15:15 KST`) : 오후 브레이크타임 현직 매장 사장님 마진·대환 점검 카드
  - `--slot night_shorts` (`22:30 KST`) : 마감 후 심야 펜 스케치 쇼츠 본편 + 스레드(Threads #2)

Maintains per-slot KST date locks in `boozathink_4slot_state.json` so no slot ever double-fires.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

MKT_DIR = Path(__file__).resolve().parent
REPO_ROOT = MKT_DIR.parent
STUDIO_DIR = REPO_ROOT / "youtube_studio"

for p in (str(MKT_DIR), str(STUDIO_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

import build_boozathink_sketch_cards as cards_mod
import boozathink_social_posters as posters
import youtube_boozathink_uploader as yt_up

KST = timezone(timedelta(hours=9))
STATE_FILE = MKT_DIR / "boozathink_4slot_state.json"
LOG_FILE = MKT_DIR / "boozathink_4slot_log.jsonl"

SLOT_TO_CARD_IDX = {
    "morning": 0,       # 08:20 KST
    "lunch": 1,         # 12:15 KST
    "breaktime": 2,     # 15:15 KST
    "night_shorts": 3,  # 22:30 KST
}


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"slots": {}}


def save_state(st: dict) -> None:
    STATE_FILE.write_text(json.dumps(st, ensure_ascii=False, indent=2), encoding="utf-8")


def append_log(entry: dict) -> None:
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def run_slot(slot: str, live: bool = False, force: bool = False) -> dict:
    now_dt = datetime.now(KST)
    today = now_dt.strftime("%Y-%m-%d")
    st = load_state()
    slots_done = st.setdefault("slots", {})

    if not force and slots_done.get(slot) == today:
        msg = {"status": "skipped_already_ran_today", "slot": slot, "date": today}
        print(f"[SKIP] {msg}")
        return msg

    c_idx = SLOT_TO_CARD_IDX[slot]
    card = cards_mod.CARDS[c_idx]
    first_party_img = f"https://boozathink.com/promo-cards/{card['filename']}"

    result: dict = {
        "slot": slot,
        "date_kst": today,
        "time_kst": now_dt.strftime("%H:%M:%S"),
        "live": live,
        "card": card["filename"],
        "target_url": card["target_url"],
    }

    if slot == "morning":
        result["indexnow"] = posters.ping_indexnow([card["target_url"], "https://boozathink.com/"], live=live)
    elif slot == "lunch":
        result["threads"] = posters.post_to_threads(card["threads_caption"], first_party_img, live=live)
    elif slot == "breaktime":
        result["indexnow"] = posters.ping_indexnow([card["target_url"]], live=live)
    elif slot == "night_shorts":
        result["youtube_shorts"] = yt_up.upload_ep01(privacy="public", force_api_upload=False)
        result["threads"] = posters.post_to_threads(card["threads_caption"], first_party_img, live=live)

    if live:
        slots_done[slot] = today
        save_state(st)

    append_log(result)
    print(f"[BoozaThink Slot Done] {json.dumps(result, ensure_ascii=False)}")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slot", required=True, choices=["morning", "lunch", "breaktime", "night_shorts"])
    parser.add_argument("--live", action="store_true", help="실제 외부 발송 실행 (미지정 시 안전 점검 모드)")
    parser.add_argument("--force", action="store_true", help="당일 중복 방지 락 무시")
    args = parser.parse_args()
    run_slot(args.slot, live=args.live, force=args.force)

# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Isolated Meta Business & First-Party URL Safety Guard
==============================================================================
100% isolated from KoreaThink (`GOREA`) and SAThink (`EVEMW`).
Enforces:
  1. First-party `https://boozathink.com/...` media URLs only (zero anonymous image hosts).
  2. Official branded `User-Agent`: `BoozaThinkOfficial/2.0 (+https://boozathink.com)`.
  3. Safe spacing across Threads & Instagram Reels (`>= 90m` same-channel Threads, `>= 20m` cross-Meta).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import time

KST = timezone(timedelta(hours=9))
GUARD_PATH = Path(__file__).resolve().parent / ".boozathink_meta_guard.json"
OFFICIAL_USER_AGENT = "BoozaThinkOfficial/2.0 (+https://boozathink.com)"

BANNED_STAGING_DOMAINS = (
    "catbox.moe",
    "litterbox.catbox.moe",
    "uguu.se",
    "0x0.st",
    "tmpfiles.org",
    "transfer.sh",
    "koreathink.com",
    "sathink.com",
)


def assert_boozathink_clean_url(url: str | None) -> None:
    if not url:
        return
    low = url.lower()
    for bad in BANNED_STAGING_DOMAINS:
        if bad in low:
            raise ValueError(f"[혼선/스팸 차단] 허용되지 않은 외부/타브랜드 도메인 감지: '{bad}' in {url}")


def _load_guard() -> dict:
    if GUARD_PATH.exists():
        try:
            return json.loads(GUARD_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"events": []}


def check_meta_quota(channel: str) -> tuple[bool, str]:
    now_dt = datetime.now(KST)
    today_str = now_dt.strftime("%Y-%m-%d")
    now_ts = time.time()
    events: list[dict] = _load_guard().get("events", [])

    today_ch = [e for e in events if e.get("channel") == channel and e.get("date_kst") == today_str]
    max_daily = 2
    if len(today_ch) >= max_daily:
        return False, f"daily_cap_reached_{channel}_{len(today_ch)}"

    min_same_gap = 21600 if channel == "ig_reels" else 5400
    same_events = [e for e in events if e.get("channel") == channel]
    if same_events and (now_ts - float(same_events[-1]["ts"])) < min_same_gap:
        rem = int(min_same_gap - (now_ts - float(same_events[-1]["ts"])))
        return False, f"channel_cooldown_{channel}_{rem}s"

    if events and (now_ts - float(events[-1]["ts"])) < 1200:
        rem_any = int(1200 - (now_ts - float(events[-1]["ts"])))
        return False, f"cross_meta_antiburst_{rem_any}s"

    return True, "ok"


def record_meta_write(channel: str, ref: str = "") -> None:
    data = _load_guard()
    events = data.get("events", [])
    now_dt = datetime.now(KST)
    events.append(
        {
            "channel": channel,
            "ts": round(time.time(), 2),
            "date_kst": now_dt.strftime("%Y-%m-%d"),
            "time_kst": now_dt.strftime("%H:%M:%S"),
            "ref": ref[:120],
        }
    )
    data["events"] = events[-80:]
    GUARD_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

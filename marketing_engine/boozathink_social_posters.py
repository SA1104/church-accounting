# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Strictly Isolated Social Publishers (X / Threads / IndexNow)
======================================================================================
ZERO-MIX GUARANTEE:
  - Reads ONLY `BOOZATHINK_*` variables from `Boozathink/.env`.
  - NEVER reads or falls back to `GOREA/.env` or `EVEMW/.env`.
  - When `BOOZATHINK_*` credentials are not yet set, safely runs in `staged_ready` mode.
"""
from __future__ import annotations

import os
from pathlib import Path
import time
import dotenv
import httpx

import boozathink_meta_guard as guard

MKT_DIR = Path(__file__).resolve().parent
REPO_ROOT = MKT_DIR.parent
dotenv.load_dotenv(REPO_ROOT / ".env", override=False)


def post_to_threads(text: str, first_party_image_url: str | None = None, live: bool = False) -> dict:
    user_id = os.environ.get("BOOZATHINK_THREADS_USER_ID", "").strip()
    token = os.environ.get("BOOZATHINK_THREADS_ACCESS_TOKEN", "").strip()

    if first_party_image_url:
        guard.assert_boozathink_clean_url(first_party_image_url)

    if not live or not user_id or not token:
        return {
            "status": "staged_ready" if (not user_id or not token) else "dry_run",
            "reason": "BOOZATHINK_THREADS_* env not configured yet" if not token else "dry_run_mode",
        }

    ok, reason = guard.check_meta_quota("threads")
    if not ok:
        return {"status": "skipped_guard", "reason": reason}

    headers = {"User-Agent": guard.OFFICIAL_USER_AGENT}
    payload: dict[str, str] = {"text": text, "access_token": token}
    if first_party_image_url:
        payload["media_type"] = "IMAGE"
        payload["image_url"] = first_party_image_url
    else:
        payload["media_type"] = "TEXT"

    with httpx.Client(timeout=30.0, headers=headers) as client:
        r1 = client.post(f"https://graph.threads.net/v1.0/{user_id}/threads", data=payload)
        r1.raise_for_status()
        creation_id = r1.json()["id"]
        time.sleep(3.0)
        r2 = client.post(
            f"https://graph.threads.net/v1.0/{user_id}/threads_publish",
            data={"creation_id": creation_id, "access_token": token},
        )
        r2.raise_for_status()
        pub_id = r2.json().get("id", "")

    guard.record_meta_write("threads", ref=pub_id)
    return {"status": "published", "id": pub_id}


def ping_indexnow(urls: list[str], live: bool = False) -> dict:
    key = os.environ.get("BOOZATHINK_INDEXNOW_KEY", "").strip()
    if not live or not key:
        return {"status": "staged_ready", "urls": len(urls)}

    for u in urls:
        guard.assert_boozathink_clean_url(u)

    body = {
        "host": "boozathink.com",
        "key": key,
        "keyLocation": f"https://boozathink.com/{key}.txt",
        "urlList": urls,
    }
    with httpx.Client(timeout=15.0, headers={"User-Agent": guard.OFFICIAL_USER_AGENT}) as client:
        resp = client.post("https://api.indexnow.org/indexnow", json=body)
        return {"status": "pinged", "http_status": resp.status_code, "urls": len(urls)}

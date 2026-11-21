# -*- coding: utf-8 -*-
"""
BOOZA THINK (부자생각) — Isolated YouTube Brand Channel OAuth Linker & Hard-Locked Uploader
===========================================================================================
100% isolated from sibling brands (`Korea Think`, `SA Think`, `엘림금융컨설팅`, `모없어?!`, `서라버로`).

사용법:
  1) 최초 1회 브랜드 채널 연동 (브라우저 팝업 2단계에서 반드시 '부자생각 / BoozaThink' 채널 선택!):
     `python youtube_studio/youtube_boozathink_uploader.py --auth`
  2) 현재 연결된 채널 검증 확인:
     `python youtube_studio/youtube_boozathink_uploader.py --verify-channel`
  3) 1호 펜 스케치 쇼츠 업로드 대기함 스테이징 (또는 `--force-api-upload`로 API 즉시 업로드):
     `python youtube_studio/youtube_boozathink_uploader.py --upload-ep01 --privacy public`
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

STUDIO_DIR = Path(__file__).resolve().parent
OUT_SHORTS_DIR = STUDIO_DIR / "output" / "ep01_easy_startup_shorts"
TOKEN_FILE = STUDIO_DIR / "youtube_boozathink_token.json"
CHANNEL_LOCK_FILE = STUDIO_DIR / "boozathink_channel_lock.json"
CLIENT_SECRET = STUDIO_DIR / "client_secret.json"
MANUAL_UPLOAD_BOX = Path(r"C:\Users\new-s\OneDrive\Desktop\BoozaThink_유튜브_릴스_직접업로드_대기함")

SCOPES = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]

# Hard-blocked sibling channels under ullalla11@gmail.com (NEVER allow cross-uploading!)
FORBIDDEN_CHANNEL_IDS = {
    "UCkfP9HxTMyhG3HWbObrll_g",  # SA Think (@SAThinkcom)
}
FORBIDDEN_HANDLES_OR_TITLES = (
    "koreathink",
    "korea think",
    "sathink",
    "sa think",
    "elimfc",
    "엘림금융",
    "sa_srbr",
    "서라버로",
    "모없어",
)
ALLOWED_MARKERS = (
    "부자생각",
    "boozathink",
    "boozathnk",  # pre-typo-fix handle compatibility
)


def _resolve_client_secret() -> Path:
    env_p = os.environ.get("BOOZATHINK_YT_CLIENT_SECRET", "").strip()
    if env_p and Path(env_p).exists():
        return Path(env_p)
    if CLIENT_SECRET.exists():
        return CLIENT_SECRET
    raise FileNotFoundError(
        "YouTube OAuth 클라이언트 파일(`youtube_studio/client_secret.json`)이 아직 없습니다.\n"
        "BoozaThink 전용 Google Cloud 프로젝트(일일 10,000 유닛 쿼터 독립 확보 권장)에서 OAuth 데스크톱 클라이언트 JSON을 내려받아\n"
        "`c:\\Users\\new-s\\OneDrive\\Desktop\\Boozathink\\youtube_studio\\client_secret.json` 위치에 저장해 주세요."
    )


def get_youtube_client(interactive_auth: bool = False):
    import httplib2
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    _orig_decompress = httplib2._decompressContent

    def _safe_decompress(response, new_content, *args, **kwargs):
        if not new_content:
            return new_content
        return _orig_decompress(response, new_content, *args, **kwargs)

    httplib2._decompressContent = _safe_decompress

    creds = None
    if TOKEN_FILE.exists() and not interactive_auth:
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token and not interactive_auth:
            creds.refresh(Request())
        else:
            if not interactive_auth:
                raise RuntimeError(
                    "부자생각(BoozaThink) 전용 유튜브 토큰(`youtube_boozathink_token.json`)이 아직 없습니다.\n"
                    "`python youtube_studio/youtube_boozathink_uploader.py --auth` 명령으로 1회 브랜드 채널 로그인을 진행해 주세요."
                )
            secret_path = _resolve_client_secret()
            flow = InstalledAppFlow.from_client_secrets_file(str(secret_path), SCOPES)
            creds = flow.run_local_server(
                port=8768,  # Distinct port from SA Think (8765) so zero port collision
                open_browser=True,
                authorization_prompt_message="BOOZATHINK_AUTH_URL_READY: {url}",
            )
        TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")

    yt = build("youtube", "v3", credentials=creds)
    assert_boozathink_channel_identity(yt, on_auth=interactive_auth)
    return yt


def assert_boozathink_channel_identity(yt, on_auth: bool = False) -> dict:
    """
    2-Layer Multi-Channel Hard-Lock:
      1) Rejects any known sibling channel (`Korea Think`, `SA Think`, `엘림금융컨설팅`, `서라버로`, `모없어?!`).
      2) Requires positive match on `부자생각` / `BoozaThink` (or pinned `boozathink_channel_lock.json` channel_id).
    """
    resp = yt.channels().list(part="snippet", mine=True).execute()
    items = resp.get("items") or []
    if not items:
        if on_auth and TOKEN_FILE.exists():
            TOKEN_FILE.unlink(missing_ok=True)
        raise RuntimeError("연결된 유튜브 채널 정보를 찾을 수 없습니다.")

    ch = items[0]
    ch_id = ch.get("id", "")
    snip = ch.get("snippet") or {}
    title = str(snip.get("title", "")).strip()
    custom_url = str(snip.get("customUrl", "")).strip()
    combined = f"{title} {custom_url}".lower()

    if ch_id in FORBIDDEN_CHANNEL_IDS or any(bad in combined for bad in FORBIDDEN_HANDLES_OR_TITLES):
        if TOKEN_FILE.exists():
            TOKEN_FILE.unlink(missing_ok=True)
        raise RuntimeError(
            f"[채널 오선택 차단!] 현재 선택된 채널은 '{title} ({custom_url})' 입니다!\n"
            f"다른 브랜드 채널과 절대 섞이지 않도록 토큰을 즉시 파기했습니다.\n"
            f"다시 `--auth` 실행 후 구글 계정 밑의 '부자생각 (@BoozaThink)' 채널을 정확히 클릭해 주세요."
        )

    if CHANNEL_LOCK_FILE.exists():
        locked = json.loads(CHANNEL_LOCK_FILE.read_text(encoding="utf-8"))
        expected_id = locked.get("channel_id", "")
        if expected_id and ch_id != expected_id:
            raise RuntimeError(
                f"[채널 ID 불일치 차단!] 잠금된 부자생각 채널 ID({expected_id})와 현재 토큰 채널 ID({ch_id})가 다릅니다!"
            )

    if not any(ok in combined for ok in ALLOWED_MARKERS):
        if TOKEN_FILE.exists() and on_auth:
            TOKEN_FILE.unlink(missing_ok=True)
        raise RuntimeError(
            f"[미확인 채널 차단!] 연결된 채널 '{title} ({custom_url})'에서 '부자생각' 또는 'BoozaThink' 표기를 확인하지 못했습니다."
        )

    if on_auth or not CHANNEL_LOCK_FILE.exists():
        CHANNEL_LOCK_FILE.write_text(
            json.dumps(
                {"channel_id": ch_id, "title": title, "custom_url": custom_url},
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
    return {"channel_id": ch_id, "title": title, "custom_url": custom_url}


def stage_for_manual_youtube_and_reels(
    mp4_path: Path,
    thumb_path: Path | None,
    title: str,
    description: str,
    pinned_comment: str,
    tags: list[str],
    subfolder: str = "01_쇼츠_릴스_업로드_대기함",
) -> Path:
    box = MANUAL_UPLOAD_BOX / subfolder
    box.mkdir(parents=True, exist_ok=True)
    dst_mp4 = box / mp4_path.name
    shutil.copy2(mp4_path, dst_mp4)
    if thumb_path and thumb_path.exists():
        shutil.copy2(thumb_path, box / thumb_path.name)

    meta_txt = box / f"{mp4_path.stem}_제목_설명_고정댓글_복사용.txt"
    meta_content = (
        f"[부자생각 (BoozaThink) — 유튜브 쇼츠 & 인스타 릴스 & 스레드 복사용 시트]\n"
        f"========================================================================\n"
        f"▶ 영상 파일: {dst_mp4.name}\n\n"
        f"▶ 유튜브 쇼츠 제목 (그대로 복사):\n{title}\n\n"
        f"▶ 유튜브 설명란 / 인스타 릴스 캡션 (그대로 복사):\n{description}\n\n"
        f"▶ 조회수 전환율을 높이는 베스트 고정댓글 (업로드 직후 첫 댓글로 고정!):\n{pinned_comment}\n\n"
        f"▶ 추천 태그:\n{', '.join(tags)}\n"
    )
    meta_txt.write_text(meta_content, encoding="utf-8")
    print(f"[대기함 저장 완료] {dst_mp4}")
    return dst_mp4


def upload_shorts_package(
    mp4_path: Path,
    thumb_path: Path | None,
    title: str,
    description: str,
    pinned_comment: str,
    tags: list[str],
    privacy: str = "public",
    force_api_upload: bool = False,
) -> str:
    from googleapiclient.http import MediaFileUpload

    stage_for_manual_youtube_and_reels(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title=title,
        description=description,
        pinned_comment=pinned_comment,
        tags=tags,
    )
    if not force_api_upload:
        print(
            "[Direct Upload Safe Mode] 바탕화면 `BoozaThink_유튜브_릴스_직접업로드_대기함`에 영상과 복사용 텍스트를 준비했습니다.\n"
            "(초기 채널 노출 가점 극대화 & 일일 API 쿼터 보호 모드 — API 직접 업로드는 `--force-api-upload` 추가)"
        )
        return "STAGED_FOR_MANUAL_UPLOAD"

    yt = get_youtube_client(interactive_auth=False)
    body = {
        "snippet": {
            "title": title[:100],
            "description": description,
            "tags": tags,
            "categoryId": "27",  # Education / Business
            "defaultLanguage": "ko",
            "defaultAudioLanguage": "ko",
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }
    media = MediaFileUpload(str(mp4_path), mimetype="video/mp4", resumable=True)
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    resp = None
    while resp is None:
        _, resp = req.next_chunk()
    vid_id = resp["id"]
    print(f"[YouTube 업로드 완료] https://youtube.com/shorts/{vid_id} ({title})")
    return vid_id


def upload_ep01(privacy: str = "public", force_api_upload: bool = False) -> str:
    mp4_path = OUT_SHORTS_DIR / "BOOZATHINK_EP01_Easy_Startup_Order_9x16_Shorts.mp4"
    thumb_path = OUT_SHORTS_DIR / "BOOZATHINK_EP01_Cover_1080x1920.png"
    if not mp4_path.exists():
        raise FileNotFoundError(f"1호 쇼츠 영상이 아직 생성되지 않았습니다: {mp4_path}")

    title = "내 가게 창업, 순서만 알면 참 쉽습니다 — 계약 전 꼭 먼저 챙길 3가지 #부자생각 #Shorts"
    description = (
        "막막해 보이던 내 가게 준비도 순서와 숫자부터 알면 훨씬 쉽고 명확해집니다.\n\n"
        "1) 인테리어 결제 전 사업자등록·사업용 통장 먼저 만들어 부가세 환급 챙기기\n"
        "2) 임대차 계약서 도장 찍기 전 정화조·전기 용량과 정책자금 신청 순서 확인하기\n"
        "3) 30개 업종별 초기 비용과 배달·세금 뺀 진짜 순수익 먼저 계산해 보기\n\n"
        "올해 12월 31일까지만 모든 업종 계산기와 결과표 이미지 저장을 무료로 열어두었습니다.\n"
        "내 업종과 자본금을 넣고 3초 만에 실제 순수익과 안전 자금선을 확인해 보세요.\n\n"
        "무료 창업·순수익 시뮬레이터: https://boozathink.com/calculators/startup-master?utm_source=yt_shorts&utm_medium=ep01\n"
        "창업 준비부터 첫 1년 전체 순서표: https://boozathink.com/start-guide?utm_source=yt_shorts&utm_medium=ep01\n\n"
        "#부자생각 #BoozaThink #초보창업 #소자본창업 #자영업 #개인사업자 #창업순서 #창업비용계산기 #Shorts"
    )
    pinned_comment = (
        "내 가게 차릴 때 얼마가 들고 한 달에 실제로 얼마가 남을지 막막하셨다면,\n"
        "올해 12월 31일까지 무료로 열어둔 부자생각 창업 계산기에서 내 업종 숫자를 먼저 넣어보세요!\n"
        "👉 무료 창업·순수익 계산기: https://boozathink.com/calculators/startup-master?utm_source=yt_shorts&utm_medium=ep01_comment\n"
        "👉 계약부터 첫 1년 전체 순서표: https://boozathink.com/start-guide?utm_source=yt_shorts&utm_medium=ep01_comment"
    )
    tags = [
        "부자생각",
        "BoozaThink",
        "초보창업",
        "소자본창업",
        "창업순서",
        "개인사업자등록",
        "부가세환급",
        "창업비용계산기",
        "자영업순수익",
        "Shorts",
    ]
    return upload_shorts_package(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title=title,
        description=description,
        pinned_comment=pinned_comment,
        tags=tags,
        privacy=privacy,
        force_api_upload=force_api_upload,
    )


def upload_intro(privacy: str = "public", force_api_upload: bool = False) -> tuple[str, str]:
    intro_dir = STUDIO_DIR / "output" / "official_channel_intro"
    mp4_16 = intro_dir / "BOOZATHINK_Official_01_Channel_Intro_16x9_1080p.mp4"
    mp4_9 = intro_dir / "BOOZATHINK_Official_01_Channel_Intro_9x16_Shorts.mp4"
    thumb = intro_dir / "BOOZATHINK_Official_01_Channel_Intro_Thumbnail_1280x720.jpg"
    if not mp4_16.exists() or not mp4_9.exists():
        raise FileNotFoundError(f"공식 채널 소개 영상이 아직 생성되지 않았습니다: {intro_dir}")

    r16 = upload_shorts_package(
        mp4_path=mp4_16,
        thumb_path=thumb,
        title="[부자생각 공식 소개] 창업 전 예상수익 계산부터 운영 중 새는 돈 구멍까지! 무료 3초 실전 시뮬레이터",
        description=(
            "창업을 앞두고 실제로 한 달에 얼마가 남을지 미리 계산해 보고 싶으신가요?\n"
            "아니면 지금 열심히 사업은 하고 있는데 도대체 어디서 돈이 새는지 손익 구조의 구멍을 확실히 찾아내고 싶으신가요?\n\n"
            "예비창업자 · 매장 사장님 · 온라인 셀러를 위한 실전 창업·손익 연구소, 부자생각(boozathink.com)을 소개합니다!\n\n"
            "• 30개 업종 실전 창업 마스터: 초기 인테리어·창업비용부터 비수기 버티는 힘까지 계산\n"
            "• 매장 손익 구멍 정밀 탐지: 배달·포장 수수료 마진, 상가 월세 손익분기점, 주휴수당 vs 키오스크 비교\n"
            "• 온라인 셀러 & 자금·세금 판독: 쿠팡·스토어 광고 효율·반품 손실, 저금리 정책자금·대환 진단, 부가세·종소세 계산기\n\n"
            "올해 12월 31일까지만 모든 업종 시뮬레이터를 무료로 열어두었으니 누구나 편하게 찾아와 사용해 보세요!\n\n"
            "👉 부자생각 무료 3초 시뮬레이터: https://boozathink.com/?utm_source=youtube&utm_medium=channel_intro\n\n"
            "#부자생각 #BoozaThink #창업시뮬레이터 #자영업순수익 #배달마진계산기 #스마트스토어마진 #정책자금"
        ),
        pinned_comment=(
            "창업 전에 예상 수익을 미리 계산해 보고 싶은 분도, 사업 중 어디서 돈이 새는지 확실히 점검하고 싶은 사장님도 누구나 무료로 써보실 수 있습니다 (올해 12.31까지 무료 개방)!\n"
            "👉 https://boozathink.com/?utm_source=youtube&utm_medium=intro_pinned"
        ),
        tags=["부자생각", "BoozaThink", "창업시뮬레이터", "자영업순수익", "배달마진", "스마트스토어", "정책자금", "손익계산기"],
        privacy=privacy,
        force_api_upload=force_api_upload,
    )
    r9 = upload_shorts_package(
        mp4_path=mp4_9,
        thumb_path=None,
        title="창업 전 예상수익 계산도, 장사 중 새는 돈 구멍 찾기도 3초 만에 끝내는 법! #부자생각 #Shorts",
        description=(
            "30개 업종 창업비용부터 배달·셀러 수수료 마진, 월세 손익분기점, 정책자금·세금까지 3초 만에 확인해 보세요! (올해 12.31까지 무료 개방)\n\n"
            "👉 무료 3초 실전 시뮬레이터: https://boozathink.com/?utm_source=yt_shorts&utm_medium=intro_shorts\n\n"
            "#부자생각 #BoozaThink #창업비용계산기 #자영업 #소상공인 #온라인셀러 #Shorts"
        ),
        pinned_comment="내 업종·매장 손익 구멍 3초 무료 판독기 👉 https://boozathink.com/?utm_source=yt_shorts&utm_medium=intro_shorts_pinned",
        tags=["부자생각", "BoozaThink", "창업계산기", "자영업", "온라인셀러", "Shorts"],
        privacy=privacy,
        force_api_upload=force_api_upload,
    )
    return r16, r9


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--auth", action="store_true", help="최초 1회 부자생각(@BoozaThink) 브랜드 채널 전용 OAuth 연동")
    parser.add_argument("--verify-channel", action="store_true", help="현재 연결된 토큰이 부자생각 채널인지 2중 검증")
    parser.add_argument("--upload-intro", action="store_true", help="공식 채널 소개 영상(16:9 + 9:16) 대기함/API 업로드")
    parser.add_argument("--upload-ep01", action="store_true", help="1호 펜 스케치 쇼츠 스테이징 또는 업로드")
    parser.add_argument("--privacy", default="public", choices=["public", "unlisted", "private"])
    parser.add_argument("--force-api-upload", action="store_true", help="대기함 저장과 동시에 YouTube API 직접 업로드 실행")
    args = parser.parse_args()

    if args.auth:
        yt_c = get_youtube_client(interactive_auth=True)
        info = assert_boozathink_channel_identity(yt_c, on_auth=True)
        print(f"[연동 완료 & 채널 잠금 설정됨] {info}")
    elif args.verify_channel:
        yt_c = get_youtube_client(interactive_auth=False)
        info = assert_boozathink_channel_identity(yt_c, on_auth=False)
        print(f"[검증 통과] 안전하게 부자생각 채널에 연결되어 있습니다: {info}")
    elif args.upload_intro:
        upload_intro(privacy=args.privacy, force_api_upload=args.force_api_upload)
    elif args.upload_ep01:
        upload_ep01(privacy=args.privacy, force_api_upload=args.force_api_upload)
    else:
        print("Ready. Options: --auth | --verify-channel | --upload-intro | --upload-ep01 [--force-api-upload]")

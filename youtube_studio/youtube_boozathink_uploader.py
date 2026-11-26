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
from datetime import datetime, timedelta, timezone
import json
import os
import shutil
import sys
from pathlib import Path

os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
KST = timezone(timedelta(hours=9))
WEEKDAY_KO = ("월", "화", "수", "목", "금", "토", "일")

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


def resolve_date_subfolder(target_date: str | None = None, label: str = "유튜브_릴스_업로드") -> str:
    if target_date:
        dt = datetime.strptime(target_date.strip()[:10], "%Y-%m-%d")
    else:
        dt = datetime.now(KST)
    wd = WEEKDAY_KO[dt.weekday()]
    return f"{dt.strftime('%Y-%m-%d')}_{wd}_{label}"


def _on_rm_error(func, path, _exc):
    import stat
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        pass


def clean_uploaded_date_folders(date_prefix: str) -> list[Path]:
    """Deletes any folder in MANUAL_UPLOAD_BOX matching the given date prefix (e.g. '2026-11-23' or '2026-11-24')."""
    key = date_prefix.strip()
    if not key or not MANUAL_UPLOAD_BOX.exists():
        return []
    removed: list[Path] = []
    for sub in sorted(MANUAL_UPLOAD_BOX.iterdir()):
        if sub.is_dir() and (sub.name.startswith(key) or key in sub.name):
            shutil.rmtree(sub, onexc=_on_rm_error)
            removed.append(sub)
            print(f"[업로드 완료 폴더 삭제됨] {sub}")
    if not removed:
        print(f"[안내] '{key}'와 일치하는 대기함 폴더가 없습니다.")
    return removed


def stage_for_manual_youtube_and_reels(
    mp4_path: Path,
    thumb_path: Path | None,
    title: str,
    description: str,
    pinned_comment: str,
    tags: list[str],
    subfolder: str | None = None,
    alt_titles: list[str] | None = None,
    target_date: str | None = None,
) -> Path:
    folder_name = subfolder or resolve_date_subfolder(target_date)
    box = MANUAL_UPLOAD_BOX / folder_name
    box.mkdir(parents=True, exist_ok=True)
    dst_mp4 = box / mp4_path.name
    shutil.copy2(mp4_path, dst_mp4)
    if thumb_path and thumb_path.exists():
        shutil.copy2(thumb_path, box / thumb_path.name)

    alt_block = ""
    if alt_titles:
        alt_block = (
            "▶ 취향대로 골라 쓰는 대체 제목 후보:\n"
            + "\n".join(f"  {idx+1}) {t}" for idx, t in enumerate(alt_titles))
            + "\n\n"
        )

    meta_txt = box / f"{mp4_path.stem}_제목_설명_고정댓글_복사용.txt"
    meta_content = (
        f"[부자생각 (BoozaThink) — 유튜브 & 인스타 릴스 & 스레드 복사용 시트]\n"
        f"========================================================================\n"
        f"▶ 영상 파일: {dst_mp4.name}\n\n"
        f"▶ 1순위 추천 제목 (그대로 복사):\n{title}\n\n"
        f"{alt_block}"
        f"▶ 유튜브 설명란 / 인스타 릴스 캡션 (그대로 복사):\n{description}\n\n"
        f"▶ 조회수 전환율을 높이는 고정댓글 (업로드 직후 첫 댓글로 고정!):\n{pinned_comment}\n\n"
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
    subfolder: str | None = None,
    alt_titles: list[str] | None = None,
    target_date: str | None = None,
) -> str:
    from googleapiclient.http import MediaFileUpload

    stage_for_manual_youtube_and_reels(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title=title,
        description=description,
        pinned_comment=pinned_comment,
        tags=tags,
        subfolder=subfolder,
        alt_titles=alt_titles,
        target_date=target_date,
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


def upload_ep01(privacy: str = "public", force_api_upload: bool = False, target_date: str | None = None) -> str:
    mp4_path = OUT_SHORTS_DIR / "BOOZATHINK_EP01_Easy_Startup_Order_9x16_Shorts.mp4"
    thumb_path = OUT_SHORTS_DIR / "BOOZATHINK_EP01_Cover_1080x1920.png"
    if not mp4_path.exists():
        raise FileNotFoundError(f"1호 쇼츠 영상이 아직 생성되지 않았습니다: {mp4_path}")

    title = "내 가게 창업, 순서만 알면 참 쉽습니다 — 계약 전 꼭 먼저 챙길 3가지 | 부자생각 #Shorts"
    description = (
        "막막해 보이던 내 가게 준비도 순서와 숫자부터 알면 훨씬 쉽고 명확해집니다.\n\n"
        "1) 인테리어 결제 전 사업자등록·사업용 통장 먼저 만들어 부가세 환급 챙기기\n"
        "2) 임대차 계약서 도장 찍기 전 정화조·전기 용량과 정책자금 신청 순서 확인하기\n"
        "3) 30개 업종별 초기 비용과 배달·세금 뺀 진짜 순수익 먼저 계산해 보기\n\n"
        "내 업종과 자본금을 넣어 한 달 실제 순수익과 안전 자금선을 미리 점검해 보세요.\n"
        "• 부자생각 창업·손익 연구소: https://boozathink.com\n\n"
        "#부자생각 #BoozaThink #초보창업 #소자본창업 #자영업 #개인사업자 #창업순서 #손익계산 #Shorts"
    )
    pinned_comment = (
        "내 가게 차릴 때 실제로 얼마가 들고 한 달에 얼마가 남을지 막막하셨다면,\n"
        "검색창에 ‘부자생각(boozathink.com)’을 쳐서 내 업종 숫자를 직접 넣어 확인해 보세요!"
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
        subfolder=resolve_date_subfolder(target_date, "EP01_창업순서_쇼츠"),
    )


def upload_intro(privacy: str = "public", force_api_upload: bool = False, target_date: str | None = None) -> tuple[str, str]:
    intro_dir = STUDIO_DIR / "output" / "official_channel_intro"
    mp4_16 = intro_dir / "BOOZATHINK_Official_01_Channel_Intro_16x9_1080p.mp4"
    mp4_9 = intro_dir / "BOOZATHINK_Official_01_Channel_Intro_9x16_Shorts.mp4"
    thumb = intro_dir / "BOOZATHINK_Official_01_Channel_Intro_Thumbnail_1280x720.jpg"
    if not mp4_16.exists() or not mp4_9.exists():
        raise FileNotFoundError(f"공식 채널 소개 영상이 아직 생성되지 않았습니다: {intro_dir}")

    folder = resolve_date_subfolder(target_date, "공식_채널소개_영상팩")
    r16 = upload_shorts_package(
        mp4_path=mp4_16,
        thumb_path=thumb,
        title="창업 전 예상수익부터 장사 중 새는 돈 구멍까지, 숫자로 한눈에 잡는 법 | 부자생각",
        alt_titles=[
            "매출은 나오는데 왜 통장에 돈이 안 남을까? 내 가게 손익 구멍 3초 진단법 | 부자생각",
            "계약 도장 찍기 전 꼭 계산해 봐야 할 진짜 순수익 이야기 — 부자생각 창업·손익 연구소",
        ],
        description=(
            "창업을 앞두고 실제로 한 달에 얼마가 남을지 미리 계산해 보고 싶으신가요?\n"
            "아니면 지금 열심히 사업은 하고 있는데 도대체 어디서 돈이 새는지 손익 구조의 구멍을 확실히 찾아내고 싶으신가요?\n\n"
            "예비창업자 · 매장 사장님 · 온라인 셀러를 위한 실전 창업·손익 연구소, 부자생각입니다.\n\n"
            "• 30개 업종 실전 창업 설계: 초기 인테리어·창업비용부터 비수기 버티는 현금흐름까지\n"
            "• 매장 손익 구멍 정밀 점검: 배달·포장 수수료 마진, 상가 월세 손익분기점, 주휴수당 vs 키오스크 비교\n"
            "• 온라인 셀러 & 자금·세금 계산: 쿠팡·스토어 광고 효율·반품 손실, 저금리 정책자금·대환 진단, 부가세·종소세 실수령\n\n"
            "검색창에 ‘부자생각’을 검색하시거나 아래 주소에서 내 가게 숫자를 직접 넣어 확인해 보세요.\n"
            "• 부자생각 창업·손익 연구소: https://boozathink.com\n\n"
            "#부자생각 #BoozaThink #자영업순수익 #소자본창업 #배달마진 #스마트스토어 #정책자금 #손익계산"
        ),
        pinned_comment=(
            "창업 전에 예상 수익을 미리 따져보고 싶은 분도, 지금 운영하는 매장에서 어디서 돈이 새는지 확실히 점검하고 싶은 사장님도\n"
            "검색창에 ‘부자생각(boozathink.com)’을 쳐서 내 업종 숫자를 편하게 넣어 확인해 보세요!"
        ),
        tags=["부자생각", "BoozaThink", "자영업순수익", "소자본창업", "배달마진", "스마트스토어", "정책자금", "손익계산"],
        privacy=privacy,
        force_api_upload=force_api_upload,
        subfolder=folder,
    )
    r9 = upload_shorts_package(
        mp4_path=mp4_9,
        thumb_path=None,
        title="창업 전 예상수익도, 장사 중 새는 돈 구멍도 3초 만에 찾는 법 | 부자생각 #Shorts",
        description=(
            "30개 업종 창업비용부터 배달·셀러 수수료 마진, 월세 손익분기점, 정책자금·세금까지 숫자로 선명하게 점검해 보세요.\n\n"
            "• 부자생각 창업·손익 연구소: https://boozathink.com\n\n"
            "#부자생각 #BoozaThink #소자본창업 #자영업 #소상공인 #온라인셀러 #Shorts"
        ),
        pinned_comment="내 업종 예상수익과 매장 손익 구멍 점검은 검색창에 ‘부자생각(boozathink.com)’을 검색해 보세요!",
        tags=["부자생각", "BoozaThink", "소자본창업", "자영업", "온라인셀러", "Shorts"],
        privacy=privacy,
        force_api_upload=force_api_upload,
        subfolder=folder,
    )
    return r16, r9


def upload_ep02(privacy: str = "public", force_api_upload: bool = False, target_date: str | None = None) -> str:
    ep_dir = STUDIO_DIR / "output" / "ep02_abc_compare_shorts"
    mp4_path = ep_dir / "BOOZATHINK_EP02_ABC_Compare_9x16_Shorts.mp4"
    thumb_path = ep_dir / "BOOZATHINK_EP02_Cover_1080x1920.png"
    if not mp4_path.exists():
        raise FileNotFoundError(f"EP02 쇼츠 영상이 아직 생성되지 않았습니다: {mp4_path}")

    return upload_shorts_package(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title="카페 할까 치킨집 할까 무인매장 할까? 같은 돈으로 A·B·C안 비교해 본 진짜 순수익 | 부자생각 #Shorts",
        alt_titles=[
            "창업 전 꼭 해봐야 할 A안·B안·C안 동시 비교 — 내 통장에 진짜 더 남는 업종은? | 부자생각 #Shorts",
            "남들 말만 믿고 계약하지 마세요! 카페 vs 배달치킨 vs 무인매장 실제 손익 비교법 | 부자생각 #Shorts",
        ],
        description=(
            "카페를 할까, 치킨집을 할까, 무인매장을 할까 고민될 때 겉보기 매출만 보면 100% 착시가 생깁니다.\n\n"
            "• A안 테이크아웃 커피: 원가율은 낮지만 피크타임 인건비와 겨울 한파 비수기 점검 필수\n"
            "• B안 배달 치킨 매장: 매출 규모는 크지만 앱 중개·결제수수료와 사장님 부담 배달비 비중 확인\n"
            "• C안 무인 아이스크림·밀키트: 인건비는 적지만 상품 매입 원가율(약 58%)과 계절 편차 계산 필수\n\n"
            "부자생각에서 고민 중인 후보를 A·B·C안으로 저장해 두고, 다시 불러와 내 동네 월세와 주문 수를 살짝 바꿔가며 비교해 보세요.\n"
            "• 부자생각 창업·손익 연구소: https://boozathink.com/calculators/startup-master\n\n"
            "#부자생각 #BoozaThink #업종비교 #카페창업 #치킨창업 #무인매장 #소자본창업 #자영업순수익 #Shorts"
        ),
        pinned_comment=(
            "고민 중인 창업 후보가 2~3개 있으시다면 감으로 찍지 마시고,\n"
            "검색창에 ‘부자생각(boozathink.com)’을 쳐서 A안·B안·C안을 나란히 저장해 내 동네 월세 기준으로 비교해 보세요!"
        ),
        tags=["부자생각", "BoozaThink", "업종비교", "카페창업", "치킨창업", "무인매장", "소자본창업", "자영업순수익", "Shorts"],
        privacy=privacy,
        force_api_upload=force_api_upload,
        subfolder=resolve_date_subfolder(target_date, "EP02_업종ABC비교_쇼츠"),
    )


def upload_ep03(privacy: str = "public", force_api_upload: bool = False, target_date: str | None = None) -> str:
    ep_dir = STUDIO_DIR / "output" / "ep03_delivery_leak_shorts"
    mp4_path = ep_dir / "BOOZATHINK_EP03_Delivery_Margin_Leak_9x16_Shorts.mp4"
    thumb_path = ep_dir / "BOOZATHINK_EP03_Cover_1080x1920.png"
    if not mp4_path.exists():
        raise FileNotFoundError(f"EP03 쇼츠 영상이 아직 생성되지 않았습니다: {mp4_path}")

    return upload_shorts_package(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title="월 매출 3,000만 원 찍는데 왜 사장님 통장엔 163만 원밖에 안 남을까? | 부자생각 #Shorts",
        alt_titles=[
            "배달 주문은 밀려오는데 통장이 텅 비는 진짜 이유 — 25,000원 메뉴 1건의 비밀 | 부자생각 #Shorts",
            "쿠폰 더 뿌리기 전에 멈추세요! 배달 매출 3천만 원 매장의 숨은 돈 구멍 3초 해부 | 부자생각 #Shorts",
        ],
        description=(
            "25,000원짜리 메뉴를 하루 40건씩 한 달 1,200건 팔면 월 매출은 정확히 3,000만 원입니다.\n"
            "그런데 왜 정산 날 사장님 통장에는 163만 원밖에 안 남을까요?\n\n"
            "• 25,000원 1건당 빠져나가는 돈: 식자재·포장 9,500원 + 중개·결제수수료 2,700원 + 배달비 3,500원 + 쿠폰·광고 1,500원 + 부가세 2,273원\n"
            "• 건당 순수익 5,527원 × 1,200건 − 매장 고정비(월세·공과금·알바) 500만 원 = 월 163만 원!\n\n"
            "무작정 할인쿠폰을 더 뿌리는 대신 사이드 세트 구성과 포장 할인 비율만 조정해도 월 순수익이 3배 가까이 달라집니다.\n"
            "• 내 메뉴 배달 순수익·적정가 3초 역산: https://boozathink.com/calculators/delivery-margin\n\n"
            "#부자생각 #BoozaThink #배달마진 #배달의민족 #쿠팡이츠 #자영업순수익 #외식창업 #손익계산 #Shorts"
        ),
        pinned_comment=(
            "배달 매출은 나오는데 정산 날 통장에 남는 돈이 적어 답답하셨다면,\n"
            "검색창에 ‘부자생각(boozathink.com)’을 쳐서 내 메뉴 1건당 실제로 얼마가 남는지 지금 3초 만에 확인해 보세요!"
        ),
        tags=["부자생각", "BoozaThink", "배달마진", "배달수수료", "자영업순수익", "외식창업", "배달의민족", "쿠팡이츠", "Shorts"],
        privacy=privacy,
        force_api_upload=force_api_upload,
        subfolder=resolve_date_subfolder(target_date, "EP03_배달마진구멍_쇼츠"),
    )


def upload_long01(
    privacy: str = "public",
    force_api_upload: bool = False,
    target_date: str | None = None,
    shared_label: str = "유튜브본편_쇼츠_업로드팩",
) -> str:
    long_dir = STUDIO_DIR / "output" / "long01_rent_trap"
    mp4_path = long_dir / "BOOZATHINK_Long01_Rent_Trap_16x9_1080p.mp4"
    thumb_path = long_dir / "BOOZATHINK_Long01_Rent_Trap_Thumbnail_1280x720.jpg"
    if not mp4_path.exists():
        raise FileNotFoundError(f"Long01 본편 영상이 아직 생성되지 않았습니다: {mp4_path}")

    return upload_shorts_package(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title="“월세 200만 원이면 싸네?” 덜컥 계약했다가 원금 회수에 13년 걸리는 이유 (환산보증금 5% 폭탄) | 부자생각",
        alt_titles=[
            "상가 계약서 도장 찍기 전 안 보면 평생 후회합니다 — 월세 200만 원 매장의 숨은 함정 3가지 | 부자생각",
            "장사 잘되는데 왜 남는 돈이 없을까? 권리금 회수 160개월의 늪과 환산보증금 5% 상한선 해부 | 부자생각",
        ],
        description=(
            "보증금 3,000만 원에 월세 200만 원짜리 1층 상가, 겉으로만 보면 꽤 해볼 만해 보이시죠?\n"
            "하지만 도장을 찍기 전에 실제 고정비와 원금 회수 기간을 계산해 보지 않으면 무서운 착시에 빠지기 쉽습니다.\n\n"
            "• 숨만 쉬어도 나가는 월 고정비: 월세 200만 + 관리비 30만 + 최소 인건비·공과금 450만 = 매달 680만 원\n"
            "• 손익분기 주문 수: 12,000원 메뉴(건당 마진 6,240원) 기준 하루 42건을 팔아야 겨우 ‘0원’ 본전\n"
            "• 원금 회수의 늪: 하루 45건씩 쉬지 않고 팔아도 월 순이익 50만 원 → 권리금·시설비 8,000만 원 회수에 160개월(13년 4개월) 소요\n"
            "• 환산보증금 폭탄: 보증금 + (월세×100)이 지역 기준(서울 9억·과밀/부산 6.9억·광역시 5.4억)을 넘기면 법정 5% 인상 상한 보호 소멸\n\n"
            "계약서 도장 찍기 전, 보고 계신 상가의 보증금·월세·권리금을 넣어 손익분기 주문 수와 5% 상한 보호 여부를 3초 만에 확인해 보세요.\n"
            "• 상가 월세 손익분기 & 환산보증금 판독기: https://boozathink.com/calculators/store-rent-breakeven\n\n"
            "#부자생각 #BoozaThink #상가계약 #월세계산 #권리금회수 #환산보증금 #상가임대차보호법 #소자본창업 #자영업순수익"
        ),
        pinned_comment=(
            "보고 계신 상가가 진짜 내 월급을 지켜줄 자리인지 헷갈리신다면,\n"
            "도장 찍기 직전 ‘부자생각(boozathink.com)’ 상가 월세 판독기에 보증금·월세·권리금을 넣어 원금 회수 개월 수와 5% 상한 보호 여부부터 꼭 확인해 보세요!"
        ),
        tags=[
            "부자생각",
            "BoozaThink",
            "상가계약주의사항",
            "상가월세계산",
            "권리금회수",
            "환산보증금",
            "상가임대차보호법",
            "손익분기점계산",
            "초보창업",
            "자영업순수익",
        ],
        privacy=privacy,
        force_api_upload=force_api_upload,
        subfolder=resolve_date_subfolder(target_date, shared_label),
    )


def upload_ep04(
    privacy: str = "public",
    force_api_upload: bool = False,
    target_date: str | None = None,
    shared_label: str = "유튜브본편_쇼츠_업로드팩",
) -> str:
    ep_dir = STUDIO_DIR / "output" / "ep04_wage_cliff_shorts"
    mp4_path = ep_dir / "BOOZATHINK_EP04_30Min_Wage_Cliff_9x16_Shorts.mp4"
    thumb_path = ep_dir / "BOOZATHINK_EP04_Cover_1080x1920.png"
    if not mp4_path.exists():
        raise FileNotFoundError(f"EP04 쇼츠 영상이 아직 생성되지 않았습니다: {mp4_path}")

    return upload_shorts_package(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title="알바 시간표 ‘딱 30분’ 잘못 짜서 1년에 573만 원 더 나가는 이유 (주 15시간 절벽) | 부자생각 #Shorts",
        alt_titles=[
            "주 14.5시간 vs 주 15시간, 단 30분 차이로 인건비가 36% 급등합니다! | 부자생각 #Shorts",
            "사장님들 가장 많이 놓치는 주휴수당·4대보험 절벽과 테이블오더 3.8개월 본전 회수 공식 | 부자생각 #Shorts",
        ],
        description=(
            "알바 시간표에서 주 14.5시간과 주 15시간은 단 ‘30분’ 차이이지만, 매달 나가는 실제 인건비는 완전히 달라집니다.\n\n"
            "• 2026 최저시급(10,320원) 기준 주 14.5시간: 월 약 65만 6천 원 (주휴수당 미발생 · 산재보험만 적용)\n"
            "• 주 15.0시간 도달 순간: 주휴수당(약 13.5만 원) + 4대보험 사업주 부담분(약 8.8만 원) 동시 발생 → 월 약 89만 5천 원 (+36.4% 급등!)\n"
            "• 알바 2명 기준 연간 약 573만 원 차이 (내년 10,700원 시급 예고안 기준 연 약 600만 원 차이)\n"
            "• 피크타임 주문 동선을 테이블오더 4대로 보완하면 약 3.8개월 만에 기기값 원금 회수, 3년 누적 약 1,539만 원 절감!\n\n"
            "내 매장 근무 시간표와 테이블오더·키오스크 전환 손익을 3초 만에 비교해 보세요.\n"
            "• 주휴수당 절벽 & 무인화 손익 비교기: https://boozathink.com/calculators/labor-automation\n\n"
            "#부자생각 #BoozaThink #주휴수당 #주15시간 #알바인건비 #테이블오더 #키오스크 #자영업인건비 #소상공인 #Shorts"
        ),
        pinned_comment=(
            "지금 우리 매장 시간표에서 주휴수당·4대보험이 얼마나 붙고 있는지 궁금하시다면,\n"
            "검색창에 ‘부자생각(boozathink.com)’을 쳐서 알바 시간표와 테이블오더 회수 기간을 3초 만에 비교해 보세요!"
        ),
        tags=[
            "부자생각",
            "BoozaThink",
            "주휴수당계산기",
            "주15시간알바",
            "자영업인건비",
            "테이블오더",
            "키오스크비용",
            "최저시급",
            "소상공인",
            "Shorts",
        ],
        privacy=privacy,
        force_api_upload=force_api_upload,
        subfolder=resolve_date_subfolder(target_date, shared_label),
    )


def upload_long02(
    privacy: str = "public",
    force_api_upload: bool = False,
    target_date: str | None = None,
    shared_label: str = "유튜브본편_쇼츠_부가세절벽팩",
) -> str:
    long_dir = STUDIO_DIR / "output" / "long02_vat_cliff"
    mp4_path = long_dir / "BOOZATHINK_Long02_VAT_Cliff_Masterclass_16x9_1080p.mp4"
    thumb_path = long_dir / "BOOZATHINK_Long02_VAT_Cliff_Thumbnail_1280x720.jpg"
    if not mp4_path.exists():
        raise FileNotFoundError(f"Long02 본편 영상이 아직 생성되지 않았습니다: {mp4_path}")

    return upload_shorts_package(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title="매출 200만 원 더 올렸다가 통장에서 255만 원 증발?! — 연 매출 1억 400만 원 부가세 절벽과 초기 환급 500만 원의 비밀 | 부자생각",
        alt_titles=[
            "“무조건 간이과세가 유리하다?” 큰 오산입니다! 간이 vs 일반과세 전환 시점·의제매입공제·종소세 완벽 정리 | 부자생각",
            "연 매출 1억 300만 vs 1억 500만 실제 세금 비교 — 부가세 32배 급증 막는 세무 디테일 4가지 | 부자생각",
        ],
        description=(
            "연 매출 1억 300만 원(간이과세) 매장이 연말에 200만 원을 더 팔아 1억 500만 원(일반과세 전환 구간)이 되었을 때,\n"
            "왜 세후 통장 실수령액은 오히려 255만 원이나 줄어드는지 국세청 산식 그대로 정밀 해부했습니다.\n\n"
            "• 1억 300만 원(음식·소매 간이과세): 부가가치율 15%×10%(154.5만) − 매입공제 0.5%(19.6만) − 신용카드 발행공제 1.3%(120.5만) = 연 부가세 약 14.4만 원\n"
            "• 1억 500만 원(일반과세 1/11 전환 시): 매출세액 954.5만 − 과세매입 공제(38%분 362.7만) − 카드발행 공제 1.3%(122.8만) = 연 부가세 약 469만 원 (원천징수 인건비·면세 원재료 불공제 때문!)\n"
            "• 꼭 알아야 할 실무 디테일 4가지:\n"
            "  1) 초기 인테리어·설비 5,500만 원(부가세 500만 포함) 투자 시 간이과세는 ‘환급 0원’ → 초기 시설투자가 클 땐 일반과세 조기환급이 유리 (기존 일반과세 사업장 보유 시 간이과세 배제 주의)\n"
            "  2) 1억 400만 원 초과 시 당해 연도 소급이 아니라 ‘다음 해 7월 1일’부터 일반과세로 전환 (6개월 준비 기간)\n"
            "  3) 일반과세 전환 전 상가 월세·공과금 세금계산서, 면세 농축수산물 계산서·사업용카드 수취(의제매입세액공제 8/108~9/109), 카드발행 공제 1.3%(연 1,000만 원 한도) 필수 세팅\n"
            "  4) 5월 종합소득세에는 지방소득세 10%가 가산(16.5% / 26.4%)되므로 연말 전 사업소득 구간별 노란우산 한도(최대 600만 원) 점검\n\n"
            "내 매장 매출·매입 구조에서 간이와 일반 중 어디가 유리한지, 세후 월 실수령액은 얼마인지 3초 만에 비교해 보세요.\n"
            "• 개인사업자 부가세(간이·일반) & 종소세 실수령 시뮬레이터: https://boozathink.com/calculators/vat-income-tax\n\n"
            "#부자생각 #BoozaThink #간이과세자 #일반과세자 #1억400만원 #부가가치세 #의제매입세액공제 #종합소득세 #노란우산공제 #개인사업자세금"
        ),
        pinned_comment=(
            "올해 우리 매장 매출에서 간이과세와 일반과세 세금이 정확히 얼마 차이 나는지, 초기 인테리어 부가세 환급과 노란우산 절세액은 얼마인지 궁금하시다면\n"
            "검색창에 ‘부자생각(boozathink.com)’을 쳐서 숫자 4개만 넣어 세후 월 실수령액을 바로 검산해 보세요!"
        ),
        tags=[
            "부자생각",
            "BoozaThink",
            "간이과세자기준",
            "1억400만원",
            "일반과세전환",
            "부가세환급",
            "의제매입세액공제",
            "신용카드발행세액공제",
            "개인사업자종합소득세",
            "노란우산공제",
        ],
        privacy=privacy,
        force_api_upload=force_api_upload,
        subfolder=resolve_date_subfolder(target_date, shared_label),
    )


def upload_ep05(
    privacy: str = "public",
    force_api_upload: bool = False,
    target_date: str | None = None,
    shared_label: str = "유튜브본편_쇼츠_부가세절벽팩",
) -> str:
    ep_dir = STUDIO_DIR / "output" / "ep05_vat_cliff_shorts"
    mp4_path = ep_dir / "BOOZATHINK_EP05_VAT_Cliff_Master_9x16_Shorts.mp4"
    thumb_path = ep_dir / "BOOZATHINK_EP05_Cover_1080x1920.png"
    if not mp4_path.exists():
        raise FileNotFoundError(f"EP05 쇼츠 영상이 아직 생성되지 않았습니다: {mp4_path}")

    return upload_shorts_package(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title="매출 200만 원 더 올렸다가 통장 순익 255만 원 증발하는 이유 (연 1억 400만 부가세 절벽) | 부자생각 #Shorts",
        alt_titles=[
            "부가세 14만 원 ➔ 469만 원(32배 급증)! 간이·일반 전환 시점과 초기 환급 500만 원 공식 | 부자생각 #Shorts",
            "무작정 간이과세 고르면 500만 원 날립니다 — 세무사도 강조하는 간이 vs 일반 핵심 디테일 | 부자생각 #Shorts",
        ],
        description=(
            "연 매출 1억 300만 원(간이과세)에서 1억 500만 원(일반과세 전환)이 되었을 뿐인데 왜 통장 실수령액은 오히려 255만 원 줄어들까요?\n\n"
            "• 간이과세(음식·소매 1.5% − 카드발행 공제 1.3%): 연 부가세 약 14.4만 원\n"
            "• 일반과세(다음 해 7월 1일 전환, 1/11): 원천징수 인건비·면세 식자재 불공제로 연 부가세 약 469만 원!\n"
            "• 반대로 첫해 인테리어·설비 5,500만 원 투자 시엔 간이과세 환급이 ‘0원’이므로 일반과세로 500만 원 환급부터 챙기는 것이 핵심입니다.\n\n"
            "내 매장 조건에서 간이 vs 일반 유불리와 종소세·지방소득세 뺀 진짜 세후 월급을 3초 만에 비교해 보세요.\n"
            "• 간이·일반 부가세 & 종소세 실수령 계산기: https://boozathink.com/calculators/vat-income-tax\n\n"
            "#부자생각 #BoozaThink #간이과세자 #일반과세자 #부가가치세 #의제매입세액공제 #종합소득세 #개인사업자세금 #자영업 #Shorts"
        ),
        pinned_comment=(
            "자세한 전환 타임라인(익년 7월 1일)과 의제매입세액공제·노란우산 절세법은 채널 본편 영상에 담아두었고,\n"
            "내 매장 숫자 계산은 검색창에 ‘부자생각(boozathink.com)’을 쳐서 3초 만에 바로 비교해 보실 수 있습니다!"
        ),
        tags=[
            "부자생각",
            "BoozaThink",
            "간이과세자",
            "일반과세자",
            "1억400만원",
            "부가세계산기",
            "부가세환급",
            "의제매입세액공제",
            "개인사업자세금",
            "Shorts",
        ],
        privacy=privacy,
        force_api_upload=force_api_upload,
        subfolder=resolve_date_subfolder(target_date, shared_label),
    )


def upload_long03(
    privacy: str = "public",
    force_api_upload: bool = False,
    target_date: str | None = None,
    shared_label: str = "유튜브본편_쇼츠_정책자금대환팩",
) -> str:
    long_dir = STUDIO_DIR / "output" / "long03_policy_loan_ladder"
    mp4_path = long_dir / "BOOZATHINK_Long03_Policy_Loan_Ladder_16x9_1080p.mp4"
    thumb_path = long_dir / "BOOZATHINK_Long03_Policy_Loan_Thumbnail_1280x720.jpg"
    if not mp4_path.exists():
        raise FileNotFoundError(f"Long03 본편 영상이 아직 생성되지 않았습니다: {mp4_path}")

    return upload_shorts_package(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title="“급하다고 카드론·은행부터 먼저 누르셨나요?” 순서 한 번 틀렸다가 저금리 정책자금 5,050만 원 날리는 이유 & 연 4.5% 대환 공식 | 부자생각",
        alt_titles=[
            "왜 옆집 사장님은 연 2%대로 8,700만 원 받았는데 나는 거절일까? 사업자 대출 ‘3단 황금 조달 순서’ 총정리 | 부자생각",
            "연 9.8% 대출 5천만 원 ➔ 연 4.5% 대환으로 10년 이자 1,644만 원 아끼는 법 & 스마트상점 국비 500만 원 주의점 | 부자생각",
        ],
        description=(
            "똑같이 연 매출 1억 8,000만 원에 신용점수 800점대인 매장이라도, 어디서부터 자금을 실행했느냐에 따라 조달 가능한 한도와 금리가 완전히 갈립니다.\n\n"
            "• 순서 실수(모바일 카드론·2금융 먼저 실행): 신용 하락 + 다중채무 분류로 추가 한도가 3,718만 원으로 깎이고 평균 금리 상승\n"
            "• 정석 조달 사다리(위에서 아래로 실행):\n"
            "  1) 1순위: 지자체 이자지원(이차보전 1.0~2.5%p) + 지역신용보증재단 보증서 (실질 연 2.1~3.4%대 확보)\n"
            "  2) 2순위: 소상공인시장진흥공단 일반경영안정·혁신성장 직접대출 결합 (보증서 대리대출과 한도 별도 산정 검토)\n"
            "  3) 3순위: 배달앱·카드 매출 입금계좌를 주거래 시중은행 한 곳으로 통합해 가맹점 우대 한도 실행\n"
            "• 이미 연 7% 이상 고금리 사업자대출 보유 시: 소진공 저금리 대환대출(연 4.5% 고정·10년 분할) 전환 시 5,000만 원(연 9.8%) 기준 10년 누적 이자 약 1,644만 원 절감\n"
            "• 필수 주의사항: 신청일 현재 국세·지방세 체납이 소액이라도 있으면 1단계 자동 거절되며, 스마트상점(최대 500만)·점포철거비(최대 600만) 국비 보조금은 결제·공사 전 사전협약이 필수입니다.\n\n"
            "은행 창구에 가기 전 내 조건에서 실제로 추가 조달 가능한 한도와 가장 이자 싼 순서를 3초 만에 확인해 보세요.\n"
            "• 사업자 대출 한도 & 최저금리 조달 순서 라운지: https://boozathink.com/funding\n"
            "• 17개 시도 정책자금 & 4.5% 대환 매칭기: https://boozathink.com/calculators/policy-funds\n\n"
            "#부자생각 #BoozaThink #소상공인정책자금 #지역신용보증재단 #저금리대환대출 #사업자대출순서 #이차보전 #스마트상점 #소상공인자금 #자영업"
        ),
        pinned_comment=(
            "은행이나 재단에 가시기 전에 내 매출과 기존 보증·대출 잔액 기준 추가 한도가 얼마 남았는지, 연 4.5% 대환으로 이자를 얼마나 아낄 수 있는지 궁금하시다면\n"
            "검색창에 ‘부자생각(boozathink.com)’을 쳐서 3초 만에 내 매장 최저금리 조달 순서부터 확인해 보세요!"
        ),
        tags=[
            "부자생각",
            "BoozaThink",
            "소상공인정책자금",
            "사업자대출순서",
            "지역신용보증재단",
            "소진공직접대출",
            "저금리대환대출",
            "이차보전",
            "스마트상점보조금",
            "개인사업자대출",
        ],
        privacy=privacy,
        force_api_upload=force_api_upload,
        subfolder=resolve_date_subfolder(target_date, shared_label),
    )


def upload_ep06(
    privacy: str = "public",
    force_api_upload: bool = False,
    target_date: str | None = None,
    shared_label: str = "유튜브본편_쇼츠_정책자금대환팩",
) -> str:
    ep_dir = STUDIO_DIR / "output" / "ep06_loan_order_shorts"
    mp4_path = ep_dir / "BOOZATHINK_EP06_Loan_Order_Refi_9x16_Shorts.mp4"
    thumb_path = ep_dir / "BOOZATHINK_EP06_Cover_1080x1920.png"
    if not mp4_path.exists():
        raise FileNotFoundError(f"EP06 쇼츠 영상이 아직 생성되지 않았습니다: {mp4_path}")

    return upload_shorts_package(
        mp4_path=mp4_path,
        thumb_path=thumb_path,
        title="급하다고 카드론 먼저 눌렀다가 연 2%대 정책자금 5,050만 원 날리는 이유! (사업자 대출 순서) | 부자생각 #Shorts",
        alt_titles=[
            "똑같은 매출인데 왜 옆집만 연 2%대 8천만 원 나왔을까? 사업자 대출 3단 황금 순서 | 부자생각 #Shorts",
            "연 9.8% 대출 ➔ 연 4.5% 대환으로 이자 1,644만 원 아끼는 법 & 키오스크 국비 500만 원 주의점 | 부자생각 #Shorts",
        ],
        description=(
            "운영자금이 급하다고 스마트폰 카드론·2금융부터 먼저 실행하면 다중채무로 분류되어 연 2~3%대 정책·보증서 한도가 크게 깎입니다.\n\n"
            "• 1순위: 지자체 이차보전 + 지역신용보증재단 보증서 (실질 연 2.1~3.4%)\n"
            "• 2순위: 소진공 직접대출 & 연 7%↑ 대출 보유 시 연 4.5% 고정 저금리 대환대출 (5천만 원 기준 10년 이자 약 1,644만 원 절감)\n"
            "• 필수 체크: 국세·지방세 체납 0원 확인 & 키오스크 국비 500만 원은 반드시 결제 전 사전협약 신청!\n\n"
            "은행 가기 전 내 매장 실제 추가 한도와 최저금리 조달 순서를 3초 만에 확인해 보세요.\n"
            "• 사업자 대출 한도 & 정책자금 진단: https://boozathink.com/funding\n\n"
            "#부자생각 #BoozaThink #소상공인정책자금 #사업자대출 #지역신보 #대환대출 #스마트상점 #소상공인 #자영업 #Shorts"
        ),
        pinned_comment=(
            "자세한 3단 조달 사다리와 국비 보조금 사전승인 주의사항은 채널 본편 영상에 담아두었고,\n"
            "내 매장 추가 한도와 4.5% 대환 절감액은 검색창에 ‘부자생각(boozathink.com)’에서 3초 만에 확인하실 수 있습니다!"
        ),
        tags=[
            "부자생각",
            "BoozaThink",
            "소상공인정책자금",
            "사업자대출",
            "지역신용보증재단",
            "저금리대환대출",
            "스마트상점",
            "이차보전",
            "자영업대출",
            "Shorts",
        ],
        privacy=privacy,
        force_api_upload=force_api_upload,
        subfolder=resolve_date_subfolder(target_date, shared_label),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--auth", action="store_true", help="최초 1회 부자생각(@BoozaThink) 브랜드 채널 전용 OAuth 연동")
    parser.add_argument("--verify-channel", action="store_true", help="현재 연결된 토큰이 부자생각 채널인지 2중 검증")
    parser.add_argument("--upload-intro", action="store_true", help="공식 채널 소개 영상(16:9 + 9:16) 대기함/API 업로드")
    parser.add_argument("--upload-ep01", action="store_true", help="1호 펜 스케치 쇼츠 스테이징 또는 업로드")
    parser.add_argument("--upload-ep02", action="store_true", help="2호 업종 A·B·C안 비교 쇼츠 스테이징 또는 업로드")
    parser.add_argument("--upload-ep03", action="store_true", help="3호 배달 마진 구멍 해부 쇼츠 스테이징 또는 업로드")
    parser.add_argument("--upload-ep04", action="store_true", help="4호 알바 30분 주휴수당 절벽 쇼츠 스테이징 또는 업로드")
    parser.add_argument("--upload-ep05", action="store_true", help="5호 부가세 1억 400만 절벽 쇼츠 스테이징 또는 업로드")
    parser.add_argument("--upload-ep06", action="store_true", help="6호 정책자금 조달순서·4.5%% 대환 쇼츠 스테이징 또는 업로드")
    parser.add_argument("--upload-long01", action="store_true", help="1호 본편(16:9) 상가 월세·권리금 13년 함정 스테이징 또는 업로드")
    parser.add_argument("--upload-long02", action="store_true", help="2호 본편(16:9) 부가세·종소세 절벽 심층 해부 스테이징 또는 업로드")
    parser.add_argument("--upload-long03", action="store_true", help="3호 본편(16:9) 정책자금 조달순서·4.5%% 대환 스테이징 또는 업로드")
    parser.add_argument("--upload-today-pack", action="store_true", help="본편(Long01) + 쇼츠(EP04) 일자별 통합 대기함 패키징")
    parser.add_argument("--upload-vat-pack", action="store_true", help="본편(Long02) + 쇼츠(EP05) 동일주제 부가세절벽 통합 패키징")
    parser.add_argument("--upload-loan-pack", action="store_true", help="본편(Long03) + 쇼츠(EP06) 동일주제 정책자금·대환 통합 패키징")
    parser.add_argument("--date", default=None, help="일자별 대기함 폴더 날짜 지정 (예: 2026-11-26)")
    parser.add_argument("--clean-date", default=None, help="업로드 완료된 일자 폴더 전체 삭제 (예: 2026-11-25)")
    parser.add_argument("--privacy", default="public", choices=["public", "unlisted", "private"])
    parser.add_argument("--force-api-upload", action="store_true", help="대기함 저장과 동시에 YouTube API 직접 업로드 실행")
    args = parser.parse_args()

    if args.clean_date:
        clean_uploaded_date_folders(args.clean_date)
    elif args.auth:
        yt_c = get_youtube_client(interactive_auth=True)
        info = assert_boozathink_channel_identity(yt_c, on_auth=True)
        print(f"[연동 완료 & 채널 잠금 설정됨] {info}")
    elif args.verify_channel:
        yt_c = get_youtube_client(interactive_auth=False)
        info = assert_boozathink_channel_identity(yt_c, on_auth=False)
        print(f"[검증 통과] 안전하게 부자생각 채널에 연결되어 있습니다: {info}")
    elif args.upload_intro:
        upload_intro(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_ep01:
        upload_ep01(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_ep02:
        upload_ep02(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_ep03:
        upload_ep03(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_ep04:
        upload_ep04(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_ep05:
        upload_ep05(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_ep06:
        upload_ep06(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_long01:
        upload_long01(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_long02:
        upload_long02(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_long03:
        upload_long03(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_today_pack:
        upload_long01(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
        upload_ep04(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_vat_pack:
        upload_long02(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
        upload_ep05(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    elif args.upload_loan_pack:
        upload_long03(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
        upload_ep06(privacy=args.privacy, force_api_upload=args.force_api_upload, target_date=args.date)
    else:
        print("Ready. Options: --auth | --verify-channel | --upload-loan-pack [--date YYYY-MM-DD] | --clean-date YYYY-MM-DD")

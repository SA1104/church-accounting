# Booza Think Data Catalog (플랫폼 표준 데이터 카탈로그)

본 문서는 수집원(Provider) 및 원천 데이터 포맷과 무관하게 플랫폼 내부에서 영구 보존되고 지식 파이프라인에서 참조할 **공통 표준 필드 언어**를 정의합니다.

---

## 1. 표준 명명 규칙 (Naming Conventions)
- **PascalCase** / **snake_case**: API 및 JSON 스펙에서는 `snake_case`를 사용하며, 지식 온톨로지 매핑 개념에서는 `PascalCase`를 표준으로 합니다.
- **표준 도메인 통일**: 외부 원천 필드(예: `aptName`, `단지명`, `complex_nm`)는 플랫폼 코어 수집 시점에 데이터 카탈로그 표준 필드로 반드시 변환 및 적재됩니다.

---

## 2. 공통 데이터 카탈로그 필드 사전 (Standard Fields Dictionary)

### 1) 공간 및 위치 정보 (Spatial & Location)
- `region_code` (법정동/행정동 코드)
- `region_name` (지역 한글명)
- `latitude` (위도 좌표값)
- `longitude` (경도 좌표값)
- `address` (도로명 또는 지번 상세 주소)

### 2) 거래 및 재무 수치 (Transactional & Financial)
- `trade_price` (거래 실거래 가격 - 원화 원천 값 정규화)
- `trade_date` (계약 체결 일자 - YYYY-MM-DD 포맷 통일)
- `amount` (회계 전표 또는 송금 금액)
- `currency` (화폐 단위 - ISO 4217 표준 코드 사용, 예: KRW, USD)

### 3) 개체 기본 명칭 (General Entity Metadata)
- `entity_name` (개체명, 예: 아파트명, 회사명, 교회명)
- `building_year` (준공 연도 또는 설립 연도 - YYYY)
- `floor_level` (층수)
- `net_area` (전용 면적 - ㎡ 기준 정밀도 통일)

---

## 3. 원천 데이터 ➔ 표준 카탈로그 매핑 예시 (Mapping Matrix)

| 원천 시스템 (Source Provider) | 원천 필드명 (Raw Field) | 표준 카탈로그 필드명 (Standard Catalog) | 데이터 타입 (Data Type) |
| :--- | :--- | :--- | :--- |
| 국토교통부 실거래 Open API | `아파트` | `entity_name` | VARCHAR |
| 국토교통부 실거래 Open API | `거래금액` | `trade_price` | NUMERIC |
| 국토교통부 실거래 Open API | `년`, `월`, `일` 조합 | `trade_date` | DATE |
| KB 부동산 시세 API | `kbPrice` | `trade_price` | NUMERIC |
| Naver 부동산 크롤링 | `apt_name` | `entity_name` | VARCHAR |
| DART 공시 Open API | `corp_name` | `entity_name` | VARCHAR |
| KIS 증권 OpenAPI | `stck_prpr` (현재가) | `trade_price` | NUMERIC |

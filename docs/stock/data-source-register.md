# Stock Think 공식 데이터 출처 등록부

Stock Think의 데이터 정확성과 법적 안정성을 보장하기 위해 승인된 공식 데이터 출처만 사용합니다.

| 코드 | 출처 | 용도 | 2A 판정 |
|---|---|---|---|
| `KRX_OPEN_API` | [한국거래소 Open API](http://openapi.krx.co.kr/) | 종목 마스터, KOSPI·KOSDAQ 일별 OHLCV, 지수 | 공식·우선 사용 |
| `FSC_STOCK_PRICE_API` | [공공데이터포털 금융위원회](https://apis.data.go.kr/) | KOSPI·KOSDAQ 일별 OHLCV 보조 | 보조 출처 |
| `NXT_OFFICIAL` | [넥스트레이드](https://www.nextrade.co.kr/) | 거래대상 종목, 시장 세션, 지연 시세 | 약관·제공 방식 추가 확인 |
| `KIS_OPEN_API` | [한국투자증권 Open API](https://apiportal.koreainvestment.com/) | KRX·NXT 및 해외 시세 후보 | 계정·Key·재배포 조건 확인 |
| `OPENDART` | [금융감독원 OpenDART](https://opendart.fss.or.kr/) | 기업코드, 공시, 재무제표 | 공식·우선 사용 |
| `BOK_ECOS` | [한국은행 ECOS](https://ecos.bok.or.kr/) | 한국 기준금리, 환율, 물가, 통화·금융지표 | 공식·우선 사용 |
| `FRED` | [Federal Reserve Bank of St. Louis](https://fred.stlouisfed.org/) | 미국 거시지표 시계열 | 공식·우선 사용 |
| `BLS` | [미국 노동통계국](https://www.bls.gov/) | CPI·고용 등 원기관 발표 | 공식·우선 사용 |
| `US_TREASURY` | [미국 재무부](https://home.treasury.gov/) | 미국 국채 수익률 곡선 | 공식·우선 사용 |
| `EIA` | [미국 에너지정보청](https://www.eia.gov/) | WTI 등 원유·에너지 가격 | 공식·우선 사용 |
| `US_MARKET_PROVIDER` | 미선정 | 미국 주가·지수 종가 | Provider 선정 필요 |
| `NEWS_PROVIDER` | 미선정 | 미국·한국 주요 경제기사 | 라이선스 검토 필요 |

## 출처별 상세 정보

### KRX Open API
* 제공기관: 한국거래소
* 도메인: openapi.krx.co.kr
* 인증: AUTH_KEY
* 상태: NEEDS_API_KEY
* 설명: 한국거래소가 직접 제공하는 API. 개별 서비스 이용신청 필요.

### 금융위원회 주식시세정보
* 제공기관: 금융위원회
* 플랫폼: 공공데이터포털
* 도메인: apis.data.go.kr
* 인증: serviceKey
* 상태: OPTIONAL_FALLBACK_NEEDS_KEY
* 설명: 공공데이터포털에서 제공하는 금융위원회 주식시세정보 API.
### NXT_OFFICIAL (넥스트레이드)
* 공식 명칭: 넥스트레이드 대체거래소
* 공식 URL: 확인 필요
* 데이터 범위: 대체거래소 거래 종목, 체결 시세
* 갱신 주기: 실시간 또는 장 마감 후
* 시간대: KST
* 지연 여부: 15분 지연 또는 종가만 수집 예정
* 인증 방식: 확인 필요
* API Key 필요 여부: 확인 필요
* 호출 제한: 확인 필요
* 재배포 가능 여부: 확인 필요
* 원문 저장 가능 여부: 확인 필요
* Stock Think 사용 컬럼: NXT 거래대상 여부, 프리마켓 종가, 애프터마켓 종가
* 장애 시 대체 출처: KIS_OPEN_API
* 현재 판정: `NEEDS_TERMS_REVIEW`

### KIS_OPEN_API (한국투자증권)
* 공식 명칭: KIS Developers
* 공식 URL: https://apiportal.koreainvestment.com/
* 데이터 범위: 국내외 주식 현재가, 호가, OHLCV
* 갱신 주기: 실시간
* 시간대: KST, EST 등
* 지연 여부: 실시간 (계좌 연동 시)
* 인증 방식: OAuth2 (App Key / Secret)
* API Key 필요 여부: 필요
* 호출 제한: 초당 20회 등
* 재배포 가능 여부: B2C 서비스 단순 표출 가능 여부 검토 필요 (라이선스)
* 원문 저장 가능 여부: 확인 필요
* Stock Think 사용 컬럼: 장중 틱, 임시 종가
* 장애 시 대체 출처: KRX_OPEN_API
* 현재 판정: `NEEDS_API_KEY`

### FRED
* 공식 명칭: Federal Reserve Economic Data
* 공식 URL: https://fred.stlouisfed.org/
* 데이터 범위: 미국 주요 경제지표 (금리, CPI, 실업률 등)
* 갱신 주기: 지표별 상이
* 시간대: EST/EDT, GMT
* 지연 여부: 원기관 발표와 동시 또는 약간 지연
* 인증 방식: API Key
* API Key 필요 여부: 필요
* 호출 제한: 초당 일정 횟수 제한 (확인 필요)
* 재배포 가능 여부: 가능 (출처 표기 권장)
* 원문 저장 가능 여부: 가능
* Stock Think 사용 컬럼: value, date, vintage_date
* 장애 시 대체 출처: 원기관 직접 크롤링
* 현재 판정: `APPROVED`

### BOK_ECOS
* 공식 명칭: 한국은행 경제통계시스템 (ECOS)
* 공식 URL: https://ecos.bok.or.kr/
* 데이터 범위: 한국 거시경제, 기준금리, 물가, 통화량 등
* 갱신 주기: 지표별 상이 (일, 월, 분기)
* 시간대: KST
* 지연 여부: 공식 발표 즉시
* 인증 방식: API Key
* API Key 필요 여부: 필요
* 호출 제한: 일일 제한 존재
* 재배포 가능 여부: 출처 명시 후 가능
* 원문 저장 가능 여부: 가능
* Stock Think 사용 컬럼: 통계값, 일자
* 장애 시 대체 출처: 없음
* 현재 판정: `APPROVED`

(기타 출처에 대한 세부 사항은 공급 계약 확정 후 추가 기록 예정)

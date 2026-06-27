# Booza Think Platform OS - Data Source Map Specification

본 문서는 Booza Think Platform OS의 핵심 경쟁력인 **데이터 공급망(Data Supply Chain)**을 명시하고, 각 Think 서비스별 수집 데이터 항목의 정밀 규격 및 **Intelligence Engine**의 다차원 여론 분석 모델을 정의합니다.

---

## 📈 1. 서비스별 데이터 공급망 (Data Supply Chain Maps)

### [1] Stock Think (주식 분석 서비스) - 상세 정의

#### 1) 주가 (Stock Price)
* **출처**: 한국거래소(KRX) / 증권사 OpenAPI (한국투자증권 등)
* **수집 방식**: WebSocket 실시간 스트리밍 & REST API 일 배치
* **수집 주기**: 장중 실시간 (1초 미만), 장 마감 후 일별 종가 적재
* **라이선스/사용 제한**: 상업용 라이선스 유료 계약 필요, 재배포 제한
* **저장 방식**: PostgreSQL 시계열 파티셔닝 테이블
* **정규화 방식**: 표준 OHLCV (Open, High, Low, Close, Volume) 스키마 매핑
* **품질 검증 방식**: 전일 종가 및 당일 시가 갭 검증 (임계치 30% 초과 시 데이터 누락 감사 발송)
* **활용 Engine**: Data Engine ➔ Prediction Engine ➔ Decision Engine
* **중요도**: 최고 (High)
* **향후 구현 우선순위**: 1순위 (최우선)

#### 2) 재무제표 (Financial Statements)
* **출처**: 금융감독원 전자공시시스템 (DART) Open API
* **수집 방식**: JSON REST API 수집
* **수집 주기**: 분기별 실적 공시일 기준 (연 4회)
* **라이선스/사용 제한**: 비상업/상업적 오픈 API 허용 범위 준수
* **저장 방식**: JSONB 구조화 데이터 적재
* **정규화 방식**: 분기 매출, 영업이익, 당기순이익, 자산/부채 비율 계정과목 표준 맵핑
* **품질 검증 방식**: 복식 부기 자산=부채+자본 검산 규칙 적용
* **활용 Engine**: Data Engine ➔ Standardization Engine ➔ Decision Engine
* **중요도**: 높음 (Medium-High)
* **향후 구현 우선순위**: 2순위

#### 3) 공시 (Public Disclosure)
* **출처**: DART 및 KRX 공시 채널
* **수집 방식**: RSS RSS Feed 및 OpenAPI 폴링
* **수집 주기**: 실시간 공시 모니터링 (5분 간격)
* **라이선스/사용 제한**: DART 이용약관 준수
* **저장 방식**: 텍스트 및 메타데이터 DB 보관
* **정규화 방식**: 공시 대분류(유상증자, 특허권, M&A 등) 코드화 정규화
* **품질 검증 방식**: 공시 발송 문서 체크섬(MD5) 중복 검증
* **활용 Engine**: Data Engine ➔ Cleaning Engine ➔ Intelligence Engine
* **중요도**: 높음 (Medium-High)
* **향후 구현 우선순위**: 3순위

#### 4) 기술지표 (Technical Indicators)
* **출처**: 자체 계산 모듈 (TA-Lib 결합)
* **수집 방식**: 주가 테이블 기반 인메모리 수치 연산
* **수집 주기**: 실시간 주가 수신 시 즉시 연산 (초 단위)
* **라이선스/사용 제한**: 자체 지적 자산
* **저장 방식**: Redis In-Memory Cache
* **정규화 방식**: MACD, RSI, Bollinger Bands 표준 수치 데이터 매핑
* **품질 검증 방식**: 기술적 수치 범위(RSI: 0~100) 아웃라이어 정합성 검사
* **활용 Engine**: Simulation Engine ➔ Prediction Engine
* **중요도**: 중간 (Medium)
* **향후 구현 우선순위**: 2순위

#### 5) 커뮤니티/SNS 댓글 (Investor Sentiment Data)
* **출처**: 네이버 토론방, 팍스넷, X(트위터), 네이버 금융 댓글
* **수집 방식**: Web HTML Scraper (크롤러)
* **수집 주기**: 1시간 간격 배치 수집
* **라이선스/사용 제한**: 스크래핑 제약 및 크롤링 차단 대응(IP 회전), 내부 비공개 활용 한정
* **저장 방식**: 비정형 텍스트 로깅 테이블
* **정규화 방식**: 동의어 사전 매칭 및 스팸 제거 정규화
* **품질 검증 방식**: 기계적 반복 글(스팸/광고) 정규식 필터링
* **활용 Engine**: Cleaning Engine ➔ Standardization Engine ➔ Intelligence Engine
* **중요도**: 중간 (Medium)
* **향후 구현 우선순위**: 4순위

*기타 환율, 금리, 뉴스, 증권사 리포트, 유튜브 자막 등도 위 규격을 따라 설계됩니다.*

---

### [2] Estate Think (부동산 분석 서비스) - 상세 정의

#### 1) 실거래가 (Actual Transaction Price)
* **출처**: 국토교통부 실거래가 공개시스템 Open API
* **수집 방식**: XML/JSON REST API 수집
* **수집 주기**: 매일 오전 일배치 수집 (최근 1개월 계약분 대상)
* **라이선스/사용 제한**: 국토교통부 오픈 API 라이선스 동의 범위 내
* **저장 방식**: PostgreSQL 부동산 거래 마스터 테이블
* **정규화 방식**: 법정동 코드, 아파트 번호, 평형(㎡) 기준 가격 정규화
* **품질 검증 방식**: 평당 단가 극단값(아웃라이어) 예외 제어
* **활용 Engine**: Data Engine ➔ Prediction Engine ➔ Decision Engine
* **중요도**: 최고 (High)
* **향후 구현 우선순위**: 1순위 (최우선)

#### 2) 호갱노노/직방/네이버 댓글 (Apartment Reviews & Forum Comments)
* **출처**: 호갱노노 입주민 리뷰 게시판, 네이버 부동산 게시판
* **수집 방식**: Selenium/Playwright headless 브라우저 크롤링
* **수집 주기**: 일별 수집 (새벽 시간대 가동)
* **라이선스/사용 제한**: 상업적 목적 직접 공개 금지, 내부 데이터 마이닝용으로만 활용
* **저장 방식**: NoSQL/MongoDB 또는 PostgreSQL JSONB 필드
* **정규화 방식**: 아파트 단지 ID 기준 댓글 텍스트 매핑
* **품질 검증 방식**: 광고성 분양 대행 글 키워드 자동 마스킹
* **활용 Engine**: Cleaning Engine ➔ Intelligence Engine
* **중요도**: 높음 (Medium-High)
* **향후 구현 우선순위**: 2순위

#### 3) KB 시세 / 네이버 호가 (KB Market Price & Ask Price)
* **출처**: KB부동산 API / 네이버 부동산 크롤링
* **수집 방식**: REST API 및 DOM 분석 파서
* **수집 주기**: 주간 단위 (매주 금요일 업데이트분 수집)
* **라이선스/사용 제한**: 이용 규칙 및 서비스 약관 준수
* **저장 방식**: 단지별 면적별 시세 추이 테이블
* **정규화 방식**: 거래 시세(하한가/일반가/상한가) 표준 변수화
* **품질 검증 방식**: 실거래가 대비 호가 비율의 과도한 이격률 검사 (30% 이상 이격 시 플래그 설정)
* **활용 Engine**: Data Engine ➔ Simulation Engine ➔ Prediction Engine
* **중요도**: 높음 (Medium-High)
* **향후 구현 우선순위**: 2순위

*기타 경매 정보, 학군 데이터, 교통(철도/도로 개발계획) 호재, GIS 지리 정보 등도 위 규격을 따라 설계됩니다.*

---

### [3] Church Think (교회 행정/회계)
* **수집 대상**: 전표(Vouchers), 증빙 영수증 이미지, 계정과목 예산 내역
* **출처**: 내부 회계 전산 서버 및 사용자 사진 업로드
* **수집 방식**: HTTP POST 파일 첨부 및 REST API 데이터 수령
* **수집 주기**: 사용자 입력 시 실시간 기동
* **저장 방식**: PostgreSQL 로컬 트랜잭션 DB 및 Supabase Object Storage (이미지)
* **품질 검증**: 복식 부기 차대변 일치 검증, OCR 문자 인식 정합성 확인
* **활용 Engine**: Data Engine ➔ Cleaning Engine ➔ Decision Engine
* **중요도**: 최고 (High)
* **향후 구현 우선순위**: 상시 기동

### [4] Mission Think (선교 협력)
* **수집 대상**: 선교지 활동 보고서, 선교사 프로필, 선교 헌금 및 후원금 기부 이력
* **출처**: 선교사 모바일 앱 전송 데이터 및 재정부 후원금 데이터
* **수집 방식**: 모바일 JSON 데이터 전송 및 배치 동기화
* **수집 주기**: 주간/월간 단위 보고서 적재
* **저장 방식**: 텍스트 데이터 보관 및 메타데이터 매핑
* **품질 검증**: 후원 연동 시 계좌 유효성 검증
* **활용 Engine**: Data Engine ➔ Media Engine ➔ Distribution Engine
* **중요도**: 중간 (Medium)
* **향후 구현 우선순위**: 장기 추진 과제

---

## 🧠 2. Intelligence Engine 분석 모형 명세

Intelligence Engine은 정형 지표 계산을 넘어 텍스트 분석에 특화된 인사이트 도출을 목표로 하며, 아래의 11가지 분석 단계를 통과합니다.

1. **Keyword Extraction**: 문서/댓글 텍스트에서 품사(POS) 태깅을 통해 의미 있는 명사/형용사 구 추출.
2. **Keyword Standardization**: 형태소가 다르거나 오타가 섞인 단어를 통일.
3. **Synonym Mapping**: 동의어 사전을 바탕으로 같은 대상어 맵핑 (예: "역세권", "지하철역 부근" ➔ "지하철 인접").
4. **Sentiment Analysis**: 감성 사전을 바탕으로 텍스트의 극성(긍정/부정/중립) 및 0.0 ~ 1.0 점수 부여.
5. **Mention Volume**: 기간별 키워드의 출현 빈도 및 공유 지수 계산.
6. **Satisfaction Score**: 감성 분석 결과를 가중 평균하여 만족도 환산 (0 ~ 100점).
7. **Importance Score**: TF-IDF 및 키워드가 문서 내에서 지니는 영향도를 지수화하여 중요도 책정.
8. **Trend Analysis**: 급상승 키워드 감지 알고리즘 적용 (전일 대비 급증한 검색/언급 단어 포착).
9. **Comparison Analysis**: 경쟁사, 경쟁 주식, 인접 아파트 단지 간의 키워드 및 여론 만족도 비교 분석.
10. **Root Cause Analysis**: 부정 감성이 최고조인 문장에서 원인이 되는 대상 단어 쌍 감지 (예: "주차장" + "최악").
11. **Insight Discovery**: 상기 지표들을 결합하여 의사결정의 핵심 포인트 요약 및 자연어 결론 도출.

---

## 📊 3. 다차원 여론 시각화 버블 분석 모델 (Visual Bubble Model)

Intelligence Engine이 도출한 여론 인사이트를 다음과 같은 6대 다차원 버블 차트 공간 매트릭스로 통합합니다.

* **X축 (X-Axis)**: **언급량 (Mention Volume)** - 여론의 관심도 크기
* **Y축 (Y-Axis)**: **만족도 (Satisfaction Score)** - 긍정률/만족도 비례 점수
* **버블 크기 (Bubble Size)**: **중요도 (Importance Score)** - 사용자의 실제 핵심 의사결정에 미치는 비중의 정도
* **버블 색상 (Bubble Color)**: **감성 상태 또는 대분류 카테고리 (Sentiment / Category)** - 빨강(부정), 초록(긍정), 회색(중립) 또는 토픽 테마색
* **시간 흐름 (Time Series)**: 기간 선택에 따른 버블의 이동 궤적 시각화 (여론 트렌드 동적 변화 추적)
* **비교 매트릭스 (Comparison)**: 동일 화면에 여러 종목/여러 아파트 단지를 버블로 동시 맵핑하여 위치상 격차 분석

### 🏢 아키텍처 공통 활용처
- **Estate Think**: 특정 아파트 입주민 댓글 분석 시 `X축(교통 언급량) / Y축(교통 만족도) / 크기(학군 중요도)`로 매핑하여 단지의 미래 가치 진단.
- **Stock Think**: 종목 토론방 여론 분석 시 `X축(매수 언급량) / Y축(투자자 심리 만족도) / 크기(주가 영향력)`로 매핑하여 여론 과열 징후 포착.
- **Company Think / VOC**: 고객 컴플레인 VOC 데이터 분석 시 `X축(기능별 불만 발생량) / Y축(처리 만족도) / 크기(리텐션 영향도)`로 매핑하여 우선 해결 제품 백로그 순위 자동 산출.

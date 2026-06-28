# Booza Think Domain Model (도메인 모델 스펙)

본 문서는 플랫폼 내의 핵심 도메인들을 일관된 형식(Entity, Attribute, Relationship, Event, Document, Rule)으로 격리 정의하여, 여러 Product가 독자적으로 확장하고 상호 연동될 수 있는 데이터 바인딩 뼈대를 제공합니다.

---

## ⛪ 1. Church Domain (교회 재정 및 행정)

### 1) Entity (개체)
- `Voucher` (전표), `Ledger` (장부), `Organization` (테넌트/교회), `Department` (위원회), `Member` (사용자)

### 2) Attribute (속성)
- `Amount` (금액), `Category` (계정과목), `Status` (결재상태: DRAFT, SUBMITTED, APPROVED, REJECTED), `FiscalYear` (회기년도)

### 3) Relationship (관계)
- `BelongsTo` (부서 소속), `ApprovedBy` (결재인 관계), `ManagedBy` (관리 권한)

### 4) Event (이벤트)
- `Transaction` (자금 집행 거래), `Audit` (감사 지적), `PeriodLock` (결산 마감)

### 5) Document (문서)
- `Receipt` (영수증 증빙 파일), `SettlementReport` (결산 보고서), `AuditReport` (감사 의견서)

### 6) Rule (규칙)
- 예산 범위를 초과하는 지출 전표 상신 시 경고(Warning) 및 2단계 결재선 강제 규칙.

---

## 📈 2. Stock Domain (주식 분석 및 가치 평가)

### 1) Entity (개체)
- `Company` (상장 회사), `StockItem` (주식 종목), `Index` (주가 지수), `Market` (거래소)

### 2) Attribute (속성)
- `Ticker` (종목코드), `Price` (주가: OHLCV), `MarketCap` (시가총액), `PER` / `PBR` / `ROE` (재무 비율)

### 3) Relationship (관계)
- `IsComponentOf` (지수 구성 요소), `CompetesWith` (동종 업계 경쟁사)

### 4) Event (이벤트)
- `Trade` (체결 거래), `EarningsCall` (실적 발표), `StockSplit` (액면 분할), `Disclosure` (공시 발생)

### 5) Document (문서)
- `FinancialStatement` (재무제표), `Prospectus` (투자설명서), `BrokerReport` (증권사 리포트)

### 6) Rule (규칙)
- 3개 분기 연속 영업이익 적자 발생 시 '투자 주의' 경고 및 위험 점수 상향 규칙.

---

## 🏠 3. Estate Domain (부동산 실거래 및 입지)

### 1) Entity (개체)
- `Apartment` (아파트), `Complex` (단지), `Building` (동), `Parcel` (필지)

### 2) Attribute (속성)
- `Price` (실거래가/호가), `Area` (전용면적), `Floor` (층수), `Latitude` / `Longitude` (위경도 좌표)

### 3) Relationship (관계)
- `IsLocatedIn` (지역 행정구역 매핑), `IsAdjacentTo` (지하철역 등 인프라 인접)

### 4) Event (이벤트)
- `TradeContract` (매매/전세 계약 체결), `Auction` (법원 경매 개시), `Remodeling` (재건축 연한 도달)

### 5) Document (문서)
- `Registry謄本` (등기사항전부증명서), `BuildingLedger` (건축물대장), `AuctionNotice` (경매 공고장)

### 6) Rule (규칙)
- 최근 3개월 내 평균 실거래가 대비 20% 이상 급락한 거래 포착 시 급매 여부 정량 필터링 규칙.

---

## 🌐 4. Mission Domain (해외 선교 및 구제)

### 1) Entity (개체)
- `Country` (선교 국가), `Missionary` (선교사), `Project` (사역 프로젝트), `Sponsor` (후원자)

### 2) Attribute (속성)
- `SecurityLevel` (여행안전 등급), `InflationRate` (인플레이션율), `ExchangeRate` (환율)

### 3) Relationship (관계)
- `SupportedBy` (후원 연계), `PartneredWith` (현지 협력 교회)

### 4) Event (이벤트)
- `BorderClosure` (국경 통제), `FundTransfer` (후원금 송금), `Incident` (안전 위해 상황 발생)

### 5) Document (문서)
- `Visa` (사역 비자 파일), `ActivityReport` (선교 활동 보고서), `BudgetProposal` (선교지 재정 청구서)

### 6) Rule (규칙)
- 국가 외교부 안전경보 3단계(철수권고) 이상 발령 시 선교지 자금 송금 보류 및 긴급 대피 절차 권고.

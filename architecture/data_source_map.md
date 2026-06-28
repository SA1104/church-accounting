# Booza Think Platform OS - Data Source Map Specification (16대 속성 표준 개정판)

본 문서는 플랫폼 데이터 공급망의 각 데이터 피드별 규격과 관리 주체, 정량 등급을 16대 필수 메타데이터 속성 기준으로 재정의한 정적 명세서입니다.

---

## 📈 1. Stock Think (주식 분석)

### [1] Stock Price (주가)
1. **Data Name**: 실시간/일별 주가 시세 정보
2. **Provider**: 한국거래소 (KRX) / 증권사 OpenAPI (한국투자증권)
3. **Owner**: 금융 투자 의사결정 위원회 (Stock Committee)
4. **License**: 상업용 유료 라이선스 계약 (재배포 불가)
5. **Cost**: 월 500,000 KRW
6. **Collection Method**: WebSocket 실시간 스트리밍 및 REST API 일 배치
7. **Frequency**: 장중 실시간 (초 단위), 배치 (매일 16:00)
8. **Raw Format**: JSON / CSV
9. **Standard Model**: OHLCV (Open-High-Low-Close-Volume) 표준 시계열 모델
10. **Data Catalog Mapping**: `trade_price`, `trade_date`, `entity_name`
11. **Ontology Mapping**: Entity (StockItem) -> Attribute (Price) -> Event (Trade)
12. **Quality Score**: 98점 (정확성 최고 수준 검증 완료)
13. **Last Update**: 2026-06-28 00:00:00
14. **Review Date**: 2026-12-31 (반기 주기 검토)
15. **Status**: ACTIVE
16. **Description**: 국내 유가증권시장(KOSPI) 및 코스닥(KOSDAQ)의 종목별 일별 거래 시세 원천 데이터

---

## 🏠 2. Estate Think (부동산 분석)

### [2] Trade Price (부동산 실거래가)
1. **Data Name**: 국토교통부 아파트/오피스텔 매매 실거래 정보
2. **Provider**: 국토교통부 실거래가 공개시스템 Open API
3. **Owner**: 부동산 가치 평가 위원회 (Estate Committee)
4. **License**: 공공데이터 활성화 무료 라이선스 (이용약관 준수)
5. **Cost**: 0 KRW (무료 제공)
6. **Collection Method**: XML/JSON REST API 수집
7. **Frequency**: 일별 오전 04:00 정기 배치
8. **Raw Format**: XML
9. **Standard Model**: 지역법정동/평형별 실거래 계약 표준 스키마
10. **Data Catalog Mapping**: `trade_price`, `trade_date`, `entity_name`, `region_code`
11. **Ontology Mapping**: Entity (Apartment) -> Attribute (Price) -> Event (TradeContract)
12. **Quality Score**: 95점 (신고 취소 건에 대한 사후 배치 정정 처리율 99% 이상)
13. **Last Update**: 2026-06-28 04:00:00
14. **Review Date**: 2026-09-30
15. **Status**: ACTIVE
16. **Description**: 전국 아파트 및 다세대 주택의 전월별 실제 거래 체결 건수 및 신고 가격 원천 데이터

---

## ⛪ 3. Church Think (교회 재정)

### [3] Voucher Ledger (회계 전표 데이터)
1. **Data Name**: 각 부서별 회계 지출/수입 전표 명세서
2. **Provider**: Church Accounting Frontend Input / PWA OCR Parser
3. **Owner**: 당회 회계 재정 위원회 (Finance Committee)
4. **License**: 자체 조직 내부 독점 소유 라이선스
5. **Cost**: 0 KRW (자체 생산 데이터)
6. **Collection Method**: 기안자 실시간 전표 등록 및 OCR 영수증 추출 파이프라인
7. **Frequency**: 실시간 (사용자 입력 시 즉시 적재)
8. **Raw Format**: JSON (데이터베이스 레코드)
9. **Standard Model**: 표준 복식부기 전표 구조 모델
10. **Data Catalog Mapping**: `amount`, `trade_date`, `entity_name` (부서명)
11. **Ontology Mapping**: Organization (Church) -> Person (Accountant) -> Event (Transaction)
12. **Quality Score**: 99점 (전표 차대변 잔액 상시 검산 및 승인 절차 검증)
13. **Last Update**: 2026-06-27T18:22:00Z
14. **Review Date**: 2026-12-31
15. **Status**: ACTIVE
16. **Description**: 신길교회 예산 가용 상태 및 실지출 내역에 대한 내부 원인 증빙 데이터베이스

# Booza Think Ontology Strategy (공통 온톨로지 전략 설계서)

---

## 1. 온톨로지 구축 목적 (Purpose)

Booza Think Platform OS는 다양한 종류의 Think Product(교회, 주식, 부동산, 선교 등)를 수용합니다. 이들은 겉보기에는 각자 전혀 다른 데이터 구조를 사용하는 것처럼 보이지만, 플랫폼 코어 레이어에서는 이들을 일관되게 분석하고 의사결정 파이프라인에 공급할 수 있도록 **공통 온톨로지 스키마**로 추상화하여 관리해야 합니다.

---

## 2. 공통 온톨로지 분류 모델 (8 Core Classes)

모든 개별 프로덕트의 데이터 엔티티는 아래 8가지 플랫폼 표준 온톨로지 개념으로 변환 및 매핑되어 처리됩니다.

1. **Entity (개체)**: 도메인의 핵심 비즈니스 요소 (예: `Apartment`, `StockItem`, `Voucher`, `MissionCountry`)
2. **Relationship (관계)**: 개체 간의 논리적 연관성 (예: `BelongsTo`, `PurchasedBy`, `ApprovedBy`)
3. **Attribute (속성)**: 개체의 세부 성질 및 데이터 값 (예: `PER`, `Price`, `Amount`, `Denomination`)
4. **Event (이벤트)**: 시간 흐름에 따른 행동 및 상태 변화 (예: `Transaction`, `Audit`, `StockSplit`, `BorderClosure`)
5. **Document (문서)**: 증빙 및 분석 문서 객체 (예: `Receipt`, `FinancialStatement`, `InsightReport`, `VisaDocument`)
6. **Location (위치)**: 물리적/지리적 공간 정보 (예: `Region`, `Coordinate`, `Address`, `MissionArea`)
7. **Organization (조직)**: 테넌트 및 외부 법인체 (예: `Church`, `ListedCompany`, `Sponsor`, `Ministry`)
8. **Person (인물)**: 계정 유저 및 관련 인물 (예: `Accountant`, `Auditor`, `Investor`, `Missionary`)

---

## 3. 지식 변환의 정규화 예시

- **Church Think**:
  - `전표` ➔ **Event (Transaction)**
  - `영수증 이미지` ➔ **Document (Receipt)**
  - `신길교회` ➔ **Organization (Church)**
- **Stock Think**:
  - `삼성전자` ➔ **Entity (StockItem)**
  - `재무제표` ➔ **Document (FinancialStatement)**
  - `매수 일자` ➔ **Event (Transaction)**

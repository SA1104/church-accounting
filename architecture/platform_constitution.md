# Booza Think Platform Constitution (플랫폼 헌법)

---

## 0. Platform Mission (최상위 사명)

> **우리는 AI를 만드는 회사가 아니다.**
> **우리는 데이터를 지식으로, 지식을 통찰로, 통찰을 행동으로 연결하여 사람들의 중요한 결정을 더 현명하게 돕는 플랫폼(Decision Intelligence Platform)을 만든다.**

AI는 우리의 궁극적인 목적이 아니며, 오직 사람의 더 나은 의사결정을 지원하기 위한 기술적 수단입니다. 앞으로 개발되는 모든 기능과 설계는 반드시 아래의 단 한 가지 핵심 질문을 통과해야 합니다.
> **"이 기능은 사용자의 중요한 의사결정을 더 현명하게 돕는가?"**

만약 이 사명을 만족하지 못한다면, 해당 기능은 플랫폼에 존재할 수 없으며 개발하지 않습니다.

---

## 1. 플랫폼 핵심 개발 헌장 (Core Development Principles)

### Principle 1: Product First, Platform Second
사용자는 "Booza Think"라는 거대한 추상적 플랫폼을 사용하지 않고, 개별 서비스(Church Think, Stock Think 등)를 먼저 사용합니다. 플랫폼은 철저히 무대 뒤에서 제품들을 통합 제어하고 자원을 중개하는 인프라 역할만 수행합니다.

### Principle 2: Loose Coupling (느슨한 결합)
각 Think 서비스는 마켓플레이스에서 활성화 여부에 따라 상호 간 의존성이 전혀 없이 완벽히 분리되어 독자 가동될 수 있는 격리 구성을 가져야 합니다.

### Principle 3: Shared Core (공통 엔진 집중화)
인증, 워크플로우 제어, 의사결정 알고리즘, 미디어 생성, 청구 및 사용량 수집 등 모든 인텔리전스 인프라는 플랫폼 코어 엔진이 처리하며, 제품 영역은 순수한 비즈니스 로직과 화면 제어만 담당합니다.

### Principle 4: Future Proof (지속 확장형 규격)
향후 수십, 수백 개의 서비스(Education Think, Legal Think 등)가 추가되더라도 공통 엔진 및 데이터베이스 아키텍처를 변경하지 않고 플러그인 로드 방식과 데이터 소스 매핑 정보 등록만으로 구동되도록 설계합니다.

### Principle 5: Data First (데이터 구조 우선제)
데이터 공급망(Data Supply Chain)과 데이터 메타데이터 규약이 정의되기 전에는 어떠한 의사결정 기능이나 UI 화면 설계도 착수할 수 없습니다.

### Principle 6: Insight over Statistics (지표를 넘어선 통찰)
단순한 긍정/부정 통계치나 워드 클라우드를 그리는 통계 소프트웨어에 그치지 않고, 다차원 분석 맵을 통한 우선순위 권장 및 실행 행동 권고(Strategic Insight)를 최종 출력물로 합니다.

### Principle 7: Decision Driven Platform (사람 중심 추천 설계)
모든 데이터 파이프라인의 최종 종착지는 설명 가능한 AI(XAI) 분석이 가미된 `Decision Engine`을 경유해야 합니다. AI는 독자적으로 최종 명령(Command)을 내리지 않으며, 사람에게 대안적 추천(Recommendation)을 제공하고 최종 선택권은 인간에게 귀속됩니다.

---

## 2. 플랫폼 7대 레이어 아키텍처 (7 Platform Layers)

플랫폼 코어와 모든 제품군은 아래 7가지 계층 모델을 명확히 구분하여 통합 설계합니다.

- **Layer 1: Platform (플랫폼 코어)**: 테넌트 인증, 결제, 시스템 보안, 통합 레지스트리 제공.
- **Layer 2: Domain (도메인 추상화)**: 제품별 엔티티, 관계, 비즈니스 룰 사전의 정의 및 매핑.
- **Layer 3: Dataset (데이터 수집 및 적재)**: 외부 공급망 데이터 수집 및 16대 메타데이터 맵핑.
- **Layer 4: Knowledge (지식 변환)**: 8대 온톨로지 변환 표준에 따른 도메인 지식 그래프 및 개념 매핑.
- **Layer 5: Decision (의사결정 판단)**: 12대 속성의 `Decision Object` 연산 및 80점 이상의 품질 필터링.
- **Layer 6: Product (개별 프로덕트)**: Church Think, Stock Think 등 마켓플레이스 활성 플러그인 도메인 서비스.
- **Layer 7: Experience (경험 레이어)**: 글래스모피즘 UI, 실시간 PWA 모바일 알림, 다중 채널 피드 유통.

---

## 3. 플랫폼 최종 철학 가치 사슬 (Value Chain)

모든 설계와 기능 구현은 플랫폼 가치 사슬을 강화해야 하며, 신뢰(Trust)를 훼손하는 코드는 거부됩니다.

```
Data (데이터 수집)
     ↓
Knowledge (지식화)
     ↓
Insight (통찰 발굴)
     ↓
Decision (현명한 추천)
     ↓
Action (즉각적 행동 착수)
     ↓
Trust (신뢰 획득 및 아카이브)
```
- **Trust**는 Booza Think 플랫폼이 축적하는 궁극적인 최상위 무형 자산입니다.

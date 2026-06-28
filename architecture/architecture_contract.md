# Booza Think Architecture Contract (아키텍처 규약 및 레이어 스펙)

---

## 1. 플랫폼 4대 레이어 정의 (4-Layer Structure)

플랫폼은 무한한 Think Product 확장을 지원하기 위해 4개의 계층으로 물리적/논리적 역할을 분리합니다.

```
┌────────────────────────────────────────────────────────┐
│             Layer 4: Experience Layer (경험)            │
│  - Web, Mobile, PWA, PDF, PPT, Webhook, Email, SNS     │
├────────────────────────────────────────────────────────┤
│              Layer 3: Product Layer (제품)             │
│  - Church, Stock, Estate, Mission, Education Think 등  │
├────────────────────────────────────────────────────────┤
│            Layer 2: Core Engine Layer (엔진)           │
│  - Data, Cleaning, Standardization, Decision Engine 등 │
├────────────────────────────────────────────────────────┤
│            Layer 1: Platform Layer (플랫폼 코어)        │
│  - Auth, Database, Security, Billing, Plugin, Workflow │
└────────────────────────────────────────────────────────┘
```

---

## 2. 레이어 간 상호 운용 규칙 (Interaction Rules)

1. **상위 레이어는 하위 레이어의 상세 구조에 의존하지 않는다**:
   Experience Layer는 Product Layer의 상세 로직에 직접 관여하지 않으며 오직 REST API나 Webhook 인터페이스를 통해서만 연동합니다.
2. **Product Layer의 완전 격리**:
   `Church Think`와 `Stock Think` 등 개별 제품은 타 제품의 데이터베이스 테이블을 직접 조인(Join)하거나 공유 자원을 수정할 수 없으며, 모든 크로스 도메인 질의는 공통 플랫폼 API 스텁을 경유해야 합니다.
3. **Core Engine의 불변성**:
   새로운 제품이 도입되더라도 Layer 2의 18대 엔진 자체에 제품 종속적인 비즈니스 코드를 직접 삽입하는 것은 엄격히 금지됩니다. 모든 도메인 특화 동작은 플러그인 레지스트리를 통한 메타데이터 매핑으로 처리합니다.

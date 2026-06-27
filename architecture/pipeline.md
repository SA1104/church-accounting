# Booza Think Platform OS - Data Processing Pipeline Specification

Booza Think Platform OS는 원천 데이터가 획득된 시점부터 최종 배포 및 실행에 이르는 전 과정을 15단계의 직렬/병렬 복합 파이프라인으로 연결하여 처리합니다.

---

## ⛓️ 15대 플랫폼 파이프라인 순서도

```text
  1. Data (수집)
       ▼
  2. Cleaning (정제)
       ▼
  3. Standardization (용어 표준화)
       ▼
  4. Intelligence (의미 추출 및 감성 분석)
       ▼
  5. Knowledge (지식 결합 및 색인)
       ▼
  6. AI (LLM 논리 추론)
       ▼
  7. Decision (최종 추천 / 경고 / 보류 판정)
       ▼
  8. Simulation (모의 시나리오 분석)
       ▼
  9. Prediction (미래 수치 시계열 예측)
       ▼
 10. Learning (결과 피드백 강화 학습)
       ▼
 11. Media (미디어 원고 오브젝트 생성)
       ▼
 12. Distribution (채널 배포 및 자동 업로드)
       ▼
 13. Workflow (생명주기 스케줄 오케스트레이션)
       ▼
 14. Automation (자동화 큐 스케줄 워커 집행)
```

---

## 🛠️ JSON 동적 파이프라인 명세
모든 파이프라인은 데이터베이스(`platform_workflows`)에 JSON 정의 문서로 관리되어, 서비스별 요구 조건에 맞게 단계별 순서를 가변적으로 스킵하거나 조정할 수 있습니다.
```json
[
  "data",
  "cleaning",
  "standardization",
  "intelligence",
  "knowledge",
  "ai",
  "decision",
  "simulation",
  "prediction",
  "learning",
  "media",
  "distribution",
  "workflow",
  "automation"
]
```
각 서비스(App)는 이 공통 파이프라인 구조를 상속받고, 해당 파이프라인 흐름 위에서만 비즈니스 로직을 작성합니다.

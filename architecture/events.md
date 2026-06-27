# Booza Think Platform OS - Event Bus Specification

모든 Core Engine은 처리의 완료 상태를 알리는 이벤트를 발행하고, 다음 단계 엔진은 이를 비동기로 수신(Subscribe)하여 흐름을 자율적으로 통제하는 비동기 분산 메시지 버스 모델을 지향합니다.

---

## 🔔 표준 이벤트 계약 코드 (Standard Event Codes)

| 이벤트 구분명 | 발생 주체 (Engine) | 발생 시점 |
| :--- | :--- | :--- |
| **DATA_COLLECTED** | Data Engine | 외부 또는 내부 데이터 수집이 성공적으로 완료되었을 때 |
| **DATA_CLEANED** | Cleaning Engine | 수집 데이터의 노이즈, 중복, 결측치 정제가 끝났을 때 |
| **DATA_STANDARDIZED** | Standardization Engine | 온톨로지, 동의어 결합을 거쳐 표준 용어로 통일되었을 때 |
| **INTELLIGENCE_EXTRACTED** | Intelligence Engine | 텍스트 분석, 감성 분석 및 중요도 평점이 산출되었을 때 |
| **KNOWLEDGE_UPDATED** | Knowledge Engine | 플랫폼 지식 보관소에 그래프 데이터 및 색인 업데이트가 완료되었을 때 |
| **AI_COMPLETED** | AI Engine | LLM 추론 및 자연어 논리가 성공적으로 생성되었을 때 |
| **DECISION_COMPLETED** | Decision Engine | 룰 임계치 검증 및 추천, 경고, 보류(HOLD) 판정이 확정되었을 때 |
| **SIMULATION_COMPLETED** | Simulation Engine | 시나리오 예측에 따른 모의 분석 시뮬레이션이 끝났을 때 |
| **PREDICTION_COMPLETED** | Prediction Engine | 시계열 및 데이터 미래 예측 수치 생성이 끝났을 때 |
| **LEARNING_UPDATED** | Learning Engine | 실제 결과 피드백을 통해 모델 가중치 갱신이 완료되었을 때 |
| **MEDIA_CREATED** | Media Engine | 대본, 보고서, 블로그 등의 미디어 최종 원고가 조립되었을 때 |
| **MEDIA_PUBLISHED** | Distribution Engine | 유튜브, 블로그, SNS 등 외부 타겟 채널로 실제 발행이 완료되었을 때 |
| **WORKFLOW_FINISHED** | Workflow Engine | 지정된 JSON 워크플로우 전 단계 파이프라인 처리가 끝났을 때 |
| **AUTOMATION_FINISHED** | Automation Engine | 예약 수집 배치 및 백그라운드 큐 실행 스케줄이 정상 완수되었을 때 |

# Booza Think Decision Intelligence (의사결정 인텔리전스 규격)

---

## 1. AI의 역할 정의 (AI as a Recommender)

Booza Think Platform에서 AI는 사람이 내리는 중대한 결정을 마음대로 대신(Command) 내릴 수 없습니다. 
AI는 분석 정보와 지식 그래프를 기반으로 **'신뢰도 높은 추천(Recommendation)'**과 **'합당한 대안책(Alternatives)'**을 구성하는 비서 역할을 맡으며, 최종 승인 및 반려 등의 행동 주권은 무조건 **인간(User)**에게 귀속됩니다.

---

## 2. 의사결정 객체 연동 스키마 표준

모든 Think Product는 반드시 공통 규격인 `Decision Object`를 산출물로 내보내야 합니다.

- **Score (의사결정 지수)**: 0 ~ 100 사이의 판단 점수
- **Confidence (신뢰도)**: AI 엔진의 추천 판단 확률 (0.00 ~ 1.00)
- **Risk / Opportunity (위험 및 기회 요인)**: 잠재적인 위해 요소와 개선 가능 요약
- **Recommendation (추천 행동)**: 최우선 추천 행동 계획
- **Alternatives (대안책)**: 차선책 제안 리스트
- **Reason & Evidence (이유 및 근거)**: 결정이 나온 온톨로지 매핑 정량 근거와 룰셋
- **Expected Impact (기대 영향)**: 추천 실행 시 발생 가능한 결과 시뮬레이션 수치
- **Priority & Timeline (우선순위 및 마일스톤)**: 긴급도와 시간 계획

---

## 3. Product별 특화 매핑 규격 (Product Spec Mapping)

각 Product의 최종 액션 상태값은 다음의 대응을 따릅니다.

| Product | Action Status (예시) | XAI 핵심 근거 (Evidence) |
| :--- | :--- | :--- |
| **Church Think** | 승인 / 보류 / 반려 | 예산 과목 한도 잔액, 결재선 직분 적격성 |
| **Stock Think** | 매수 / 관망 / 매도 | 분기 재무제표 변동성, 수급 집중도 수치 |
| **Estate Think** | 매수 / 보류 / 매도 | 국토부 실거래가 시계열 동향, 전세가율 한계치 |
| **Mission Think** | 파견 / 보류 / 주의 | 국가별 치안 안전 등급, 외교부 경보 레벨 |

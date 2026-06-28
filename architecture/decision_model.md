# Booza Think Decision Model Standard (표준 의사결정 모델)

---

## 1. 플랫폼 공통 의사결정 모델 (Unified Decision Model)

Booza Think Platform OS의 모든 Think Product는 제각기 다른 형태의 의사결정 결과를 출력하지 않고, 아래 정의된 11대 속성을 가진 **공통 의사결정 포맷**으로 구조화된 결과를 출력해야 합니다. 이 표준화 모델을 통해 UI Layer 및 알림 Engine 등에서 단일 템플릿으로 분석 정보를 시각화할 수 있습니다.

---

## 2. 의사결정 11대 속성 정의 (Decision Model Attributes)

1. **Decision Score (의사결정 점수)**: 0 ~ 100 사이의 직관적 종합 추천 점수
2. **Confidence (판단 신뢰도)**: 판단 모델의 수학적 신뢰 확률 (0.00 ~ 1.00)
3. **Risk (위험 요인)**: 의사결정 실행 시 발생할 수 있는 주요 부작용이나 잠재 위협 설명
4. **Opportunity (기회 요인)**: 의사결정을 통한 개선 기대 효과 및 추가 창출 가치
5. **Recommendation (최종 권고안)**: AI 가 추천하는 최우선 조치 및 행동 계획
6. **Alternative (차선책 제안)**: 권고안 실행이 불가할 때 대체할 수 있는 옵션 리스트
7. **Reason (이유)**: 판단이 도출된 논리적 추론 과정의 텍스트 설명
8. **Evidence (정량 근거)**: 온톨로지 지식 그래프 및 원천 데이터의 통계 근거 목록
9. **Expected Impact (기대 영향)**: 의사결정을 적용했을 때 예측되는 시뮬레이션 지표 변화
10. **Priority (우선순위)**: 긴급도와 중요도 분류 (HIGH, MEDIUM, LOW)
11. **Action & Timeline (실행 시간 계획)**: 행동 착수 시기 및 이행 로드맵 정보

---

## 3. Product별 데이터 바인딩 양식

```json
{
  "decision_score": 92,
  "confidence": 0.89,
  "risk": "예산 집행 한도 임계치 도달 위험",
  "opportunity": "찬양팀 장비 현대화로 예배 품질 개선",
  "recommendation": "전표 최종 결재 승인",
  "alternative": "집행 금액의 20%를 예비비로 충당하여 부분 승인",
  "reason": "찬양팀 신규 믹서기 구입 전표이며, 찬양위원회 예산 한도 내에서 정상 가용한 지출임.",
  "evidence": ["부서 예산 잔액: 1,200,000원", "신청액: 950,000원"],
  "expected_impact": "찬양팀 장비 만족도 30% 향상 기대",
  "priority": "HIGH",
  "action": "승인 완료 및 자금 집행 의뢰",
  "timeline": "3영업일 이내 이체"
}
```

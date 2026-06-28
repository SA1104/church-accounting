# Booza Think Decision Object Specification (의사결정 객체 상세 규격)

---

## 1. Decision Object 12대 속성 정의 (Attributes)

모든 Think Product는 의사결정 파이프라인 연산 결과를 아래 12가지 필수 속성 필드를 만족하는 단일 규격의 **`Decision Object`** 형식으로 반환해야 합니다.

1. **decision_score**: 종합 추천 의사결정 점수 (0 ~ 100)
2. **confidence**: 의사결정 신뢰 확률값 (0.00 ~ 1.00)
3. **risk**: 잠재적 위험 요인 설명문구
4. **opportunity**: 개선 기대 효과 및 기회요소 설명
5. **recommendation**: AI가 권장하는 최우선 조치 행동
6. **alternative**: 대안적 행동 계획 리스트
7. **reason**: 의사결정 판단 근거 논리 설명
8. **evidence**: 온톨로지 매핑 정량 증거 데이터 리스트
9. **expected_impact**: 조치 취득 시 예상되는 장기 지표 시뮬레이션 지수
10. **priority**: 긴급/중요도 등급 (`HIGH`, `MEDIUM`, `LOW`)
11. **action**: 트리거될 시스템 행동 명칭
12. **timeline**: 행동 권장 완료 목표 시기

---

## 2. Decision Lifecycle (의사결정 생명주기)

플랫폼을 흐르는 모든 의사결정은 아래의 생명주기 라이프사이클을 순차적으로 거치며 상태 변화가 데이터베이스에 추적 저장됩니다.

```
Generated ➔ Reviewed ➔ Approved ➔ Executed ➔ Measured ➔ Learned ➔ Archived
```

1. **Generated (생성)**: AI 엔진에 의해 의사결정 초안 및 추천서가 생성된 상태.
2. **Reviewed (검토)**: 기안 담당자 또는 실무자가 초안을 확인 및 수정한 상태.
3. **Approved (승인)**: 의사결정 승인 권한자(부서장, 당회장, 총무 등)가 결재 완료한 상태.
4. **Executed (실행)**: 결재 결과를 기반으로 지출, 매수, 이체 등의 실제 시스템 액션이 트리거된 상태.
5. **Measured (측정)**: 액션 수행 후 예상 지표 변동성 등의 결과 데이터를 수집한 상태.
6. **Learned (학습)**: 실제 결과와 예상 추천 수치 간의 편차를 학습 및 평가 모델에 피드백한 상태.
7. **Archived (보존)**: 이력 관리를 위해 영구 감사 아카이브 저장소로 이관 완료된 상태.

---

## 3. Decision History (의사결정 이력 관리 및 추적)

- 모든 의사결정 이벤트는 `decision_histories` 테이블에 적재되어, 무엇을 왜 추천했는지(Reason & Evidence)와 최종 실행 여부(Status) 및 실제 결산 피드백 차이점(Learned Deviation)을 추적 가능하도록 감사 로깅 체계를 유지합니다.

---

## 4. JSON Schema 규약

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DecisionObject",
  "type": "object",
  "required": [
    "decision_score",
    "confidence",
    "risk",
    "opportunity",
    "recommendation",
    "reason",
    "evidence",
    "expected_impact",
    "priority",
    "action",
    "timeline"
  ],
  "properties": {
    "decision_score": { "type": "integer", "minimum": 0, "maximum": 100 },
    "confidence": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
    "risk": { "type": "string" },
    "opportunity": { "type": "string" },
    "recommendation": { "type": "string" },
    "alternative": { "type": "array", "items": { "type": "string" } },
    "reason": { "type": "string" },
    "evidence": { "type": "array", "items": { "type": "string" } },
    "expected_impact": { "type": "string" },
    "priority": { "type": "string", "enum": ["HIGH", "MEDIUM", "LOW"] },
    "action": { "type": "string" },
    "timeline": { "type": "string" }
  }
}
```

---

## 5. TypeScript Interface 정의

```typescript
export interface DecisionObject {
  decision_score: number;
  confidence: number;
  risk: string;
  opportunity: string;
  recommendation: string;
  alternative?: string[];
  reason: string;
  evidence: string[];
  expected_impact: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  timeline: string;
}
```

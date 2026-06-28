# Booza Think Data Quality Standard (데이터 품질 평가 표준)

본 문서는 플랫폼 내의 모든 데이터셋에 대한 품질 요건(Data Quality Metrics)과 신뢰 등급(Quality Score)의 정량 산출 알고리즘을 규정합니다.

---

## 1. 8대 데이터 품질 평가지표 (8 Quality Metrics)

1. **Completeness (완전성)**:
   - 필수 필드 누락 비율 검증.
   - 수식: `(1 - (결측 필수 필드 수 / 전체 필수 필드 수)) * 100`
2. **Accuracy (정확성)**:
   - 데이터가 사전 정의된 규격 및 도메인 범위 내에 존재하는지 검증.
   - 예: RSI 범위(0~100), 위도(33~43), 경도(124~132) 일치율.
3. **Consistency (일관성)**:
   - 이종 데이터베이스 또는 파이프라인 간 교차 대조 정합성.
   - 예: 전표 차대변 합계 일치 여부, 주가 종가와 거래대금의 수학적 모순 배제율.
4. **Freshness (신선도)**:
   - 데이터 수집 시점과 최종 업데이트 시점 간의 시간 격차(Latency) 준수율.
   - 수식: `(지정 수집 주기 이내에 도착한 횟수 / 전체 수집 시도 횟수) * 100`
5. **Reliability (신뢰성)**:
   - 제공 기관의 공인성 및 원천 수집 채널의 검증 강도 등급 가중치.
6. **License (준법성)**:
   - 라이선스 제약 조건 준수 여부 (상업용 사용 권장 라이선스 유무 등).
7. **Duplicate (고유성)**:
   - 중복 데이터 발생 건수 제로율.
   - 수식: `(1 - (중복 레코드 수 / 전체 수집 레코드 수)) * 100`
8. **Missing Value (결측 제어)**:
   - 비필수 필드의 결측율이 적정 임계값 이내로 유지되는지 측정.

---

## 2. Quality Score 산출 공식 (Quality Score Formula)

각 데이터 소스 및 개별 레코드셋은 수집 완료 시점에 아래 가중 평균을 적용하여 **Quality Score (QS)**를 계산합니다.

\[
\text{Quality Score (QS)} = (W_c \times \text{Completeness}) + (W_a \times \text{Accuracy}) + (W_s \times \text{Consistency}) + (W_f \times \text{Freshness}) + (W_r \times \text{Reliability})
\]
- 각 가중치 합은 `1.0` 이며, 도메인의 특성에 맞춰 가중 배율을 조절합니다 (예: 회계 재정은 Consistency에 `0.4` 가중치 부여).

---

## 3. Decision Engine 문턱값 게이팅 (Gating Rule)

> [!IMPORTANT]
> **Quality Gate Threshold: 80점**
> 
> 의사결정 엔진(`Decision Engine`)은 최종 분석 실행 전 데이터셋의 **Quality Score가 80점 미만**인 경우, 해당 데이터를 의사결정 자료로 사용하지 않고 즉각 배제하며 시스템 모니터링 로그에 데이터 에러 감사를 기록합니다.

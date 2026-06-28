# Booza Think Data Strategy (데이터 공급망 및 자산화 전략)

---

## 1. 데이터 전략 메타데이터 16대 항목 규격

새로운 Product가 수집 및 참조하는 모든 데이터 소스는 아래의 16대 속성을 포함하여 공식적으로 문서화되고 등록되어야 합니다.

1. **Data Name**: 데이터의 논리적 식별명 (예: 국토부 아파트 매매 실거래가)
2. **Provider**: 데이터를 제공하는 주체 및 출처 (예: 공공데이터포털)
3. **Collection Method**: 수집 기법 (예: Open API, Web Scraping, DB Connection)
4. **Collection Frequency**: 수집 주기 (예: Real-time, Daily, Weekly, Manual)
5. **License**: 저작권 및 사용 라이선스 (예: 공공누리 제1유형, Commercial Free)
6. **Reliability**: 수집원의 신뢰도 점수 (A, B, C, D 등급)
7. **Raw Format**: 수집 직후 원천 포맷 (예: XML, JSON, CSV)
8. **Standard Model**: 플랫폼 표준 정규화 타겟 구조
9. **Ontology Mapping**: 공통 온톨로지(Entity/Relation) 대응 규칙
10. **Storage Strategy**: 저장 대상 테이블 및 스토리지 경로
11. **Update Strategy**: 데이터 덮어쓰기 및 히스토리 보존 방식
12. **Quality Score**: 데이터 결측치/이상치 비율에 기초한 품질 점수 (0.00 ~ 1.00)
13. **Estimated Cost**: 데이터 수집/유지보수에 소요되는 월평균 비용
14. **Owner**: 담당 엔지니어 또는 데이터 관리 부서
15. **Review Date**: 최신 공급망 적격성 검토 일자
16. **Status**: 데이터 상태값 (ACTIVE, ARCHIVED, SUSPENDED)

---

## 2. Data Source Review 승인 프로세스

모든 데이터 소스는 플랫폼 등록 전에 반드시 아래의 **Data Source Review** 승인 단계를 거칩니다.

```
[데이터 소스 제안]
      │
      ▼
[신뢰도/품질 검사] ➔ [법적 사용성/라이선스 검토] ➔ [유지비용/정규화 가용성 평가]
                                                           │
                                                           ▼
                                                [거버넌스 최종 승인 및 활성화]
```

- **법적 사용성 검토**: 데이터 공급처의 이용약관 상 상업적 가공 및 재배포가 적법한지 법률 리뷰를 마쳐야 합니다.
- **품질 지수 평가**: 결측치가 5%를 초과하는 데이터는 자동으로 수집 보류 처리되며, 표준 데이터 형식을 충족하지 않을 경우 승인되지 않습니다.

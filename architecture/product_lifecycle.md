# Booza Think Product Lifecycle & Acceptance Criteria (제품 생명주기 규약)

---

## 1. 16단계 제품 생명주기 표준 (16-Step Standard)

플랫폼에 추가되는 모든 Think 서비스는 다음의 표준 생명주기에 기초하여 빌드되고 운영되어야 합니다.

```
1. Problem Definition (문제 정의) ➔ 2. Data Source Map (소스 수립) ➔ 3. Collection (수집) ➔ 
4. Cleaning (정제) ➔ 5. Standardization (표준화) ➔ 6. Knowledge (지식 변환) ➔ 
7. Intelligence (지식 연산) ➔ 8. Insight (통찰 도출) ➔ 9. Decision (의사결정 추천) ➔ 
10. Simulation (효과 모의) ➔ 11. Prediction (예측 반영) ➔ 12. Workflow (업무 자동화) ➔ 
13. Media (콘텐츠 생성) ➔ 14. Distribution (채널 배포) ➔ 15. Learning (피드백 수집) ➔ 
16. Feedback & Improvement (피드백 순환 개선)
```

---

## 2. Product 수용 기준 (Product Acceptance Criteria)

새로운 Think Product를 플랫폼에 배포 및 정식 릴리즈하기 위해 Governance Engine이 검증하는 필수 체크리스트 항목입니다.

- [ ] **Data Source Map 명세**: 필수 16대 속성을 완비한 데이터 소스맵 및 법적 사용성 검토 완료
- [ ] **Knowledge Model 수립**: 해당 도메인 데이터를 Investment / Real Estate 등 플랫폼 지식으로 변환할 온톨로지 정의 완료
- [ ] **Decision Rule 설계**: 설명 가능한 AI(XAI) 분석을 위한 추천(Recommendation) 및 대안(Alternatives) 생성 로직 구현
- [ ] **Workflow 연동**: 의사결정 승인 시 기동할 업무 자동화 훅 구현
- [ ] **Monitoring 설정**: 사용량 계측(Usage Engine) 및 오동작 검지용 로깅 모듈 매핑
- [ ] **Documentation 완비**: 사용자 설명서 및 거버넌스 아키텍처 스펙 문서 제출
- [ ] **Build Success**: 컴파일 오류가 전혀 없으며 하위 호환성 위배 없음 증명 (기존 앱 영향도 0%)

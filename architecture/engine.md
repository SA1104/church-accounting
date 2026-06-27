# Booza Think Platform OS - 15 Core Engines Specification

본 명세서는 Booza Think Platform OS를 지탱하는 15대 핵심 플랫폼 엔진의 기능 범위와 정적 명세를 기술합니다.

---

## ⚙️ 15대 공식 플랫폼 엔진 기능 요약

### 1. Data Engine
- **역할**: 외부 데이터 수집, Connector 관리.

### 2. Cleaning Engine
- **역할**: 중복 제거, 노이즈 제거, 결측치 처리, OCR 텍스트 후처리.

### 3. Standardization Engine
- **역할**: 키워드 표준화, 단어 통합, 동의어 맵핑, 온톨로지(Ontology) 매트릭스 변환.

### 4. Intelligence Engine
- **역할**: 키워드 추출, 감성 분석, 언급량 분석, 우선순위 배점 점수, 트렌드 분석, 원인 분석.

### 5. Knowledge Engine
- **역할**: 지식 그래프 결합, 색인화, 벡터 임베딩 결합.

### 6. AI Engine
- **역할**: LLM 연동, 상황 문맥 분석, 텍스트 요약 및 분석 추론.

### 7. Decision Engine
- **역할**: 룰 검증, AI 판단, XAI(설명 가능한 AI) 사유 생성, 종합 평점 산정, 결재 보류(HOLD) 판단.

### 8. Simulation Engine
- **역할**: What-if 기반 시나리오 모의 분석.

### 9. Prediction Engine
- **역할**: 시계열 분석 및 미래 수치 예측.

### 10. Learning Engine
- **역할**: 결과 피드백을 기반으로 한 지속적 강화 학습 및 가중치 업데이트.

### 11. Media Engine
- **역할**: 분석 결과를 보고서, 블로그, 숏츠, 유튜브 대본, 카드뉴스 등의 **Media Object** 오브젝트로 변환.

### 12. Distribution Engine
- **역할**: 자동 조립된 콘텐츠를 외부 채널(유튜브, 블로그, SNS, 메일 등)로 동적 업로드/발행.

### 13. Workflow Engine
- **역할**: JSON 파이프라인 흐름 정의를 바탕으로 전체 모듈 실행 순서 제어.

### 14. Automation Engine
- **역할**: 백그라운드 크론 스케줄링 및 큐 프로세싱.

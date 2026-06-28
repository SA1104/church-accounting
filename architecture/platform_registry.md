# Booza Think Platform Registry Specification (플랫폼 레지스트리 규약)

본 문서는 플랫폼 내의 모든 컴포넌트(서비스, 엔진, 플러그인 등)의 동적 가입 및 라이프사이클 관리를 담당하는 **Platform Registry**의 데이터베이스 맵 및 JSON 스펙을 정의합니다.

---

## 1. 9대 관리 대상 레지스트리 (Registry Types)

1. **Product Registry**: 활성화 가능한 서비스 제품군 등록 (`church_think`, `stock_think`, `estate_think`, `mission_think` 등).
2. **Engine Registry**: 핵심 18대 공통 엔진 명세 및 로딩 상태 정보 관리.
3. **Plugin Registry**: 외부 연동용 서드파티 플러그인 규격 관리.
4. **Dataset Registry**: 수집 및 관리되는 모든 데이터 소스의 메타 정보 테이블 연계.
5. **API Registry**: 각 서비스별 외부 및 플랫폼 라우트 주소 목록 관리.
6. **Version Registry**: 플랫폼 코어 및 제품 모듈들의 버전 히스토리 추적.
7. **Migration Registry**: 데이터베이스 DDL 마이그레이션 적용 이력 관리.
8. **Billing Registry**: 정액 요금제 등급 및 할인 요율 설정 정보 레지스트리.
9. **License Registry**: 테넌트별 라이선스 허용 정책 및 기한 통제 관리.

---

## 2. Registry Database Schema 스펙

```sql
CREATE TABLE IF NOT EXISTS public.platform_registries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_type VARCHAR(50) NOT NULL, -- 'PRODUCT', 'ENGINE', 'PLUGIN', 'DATASET', 'API', 'VERSION', 'MIGRATION', 'BILLING', 'LICENSE'
  item_key VARCHAR(100) NOT NULL,     -- 고유 키 (예: 'DataEngine', 'church_think')
  item_name VARCHAR(100) NOT NULL,    -- 명칭 (예: '데이터 수집 엔진', 'Church Think')
  version VARCHAR(50) DEFAULT '1.0.0',
  owner VARCHAR(100) DEFAULT 'PLATFORM_ADMIN',
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}'::jsonb,   -- 동적 추가 속성 설정 (포트, 종속성 목록 등)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (registry_type, item_key)
);
```

---

## 3. Product Registry JSON 설정 예시

```json
{
  "registry_type": "PRODUCT",
  "item_key": "stock_think",
  "item_name": "Stock Think",
  "version": "1.0.0",
  "owner": "FINANCE_TEAM",
  "enabled": true,
  "config": {
    "entry_path": "/app/stock",
    "required_engines": ["DataEngine", "PredictionEngine", "DecisionEngine"],
    "billing_tier_allowed": ["Pro", "Enterprise"],
    "icon": "TrendingUp",
    "theme": {
      "primary": "#10b981",
      "secondary": "#047857"
    }
  }
}
```

# Supabase Migration Runbook: Stock Think (Phase 2C)

## 1. 사전 백업 또는 복구점 확인
* 현재 운영 데이터베이스 스냅샷을 생성합니다. (Supabase Dashboard -> Database -> Backups -> Create a manual backup)
* 최소한 `public` 스키마 덤프를 로컬에 보관하십시오.

## 2. 대상 Supabase Project 확인
* 운영 프로젝트 URL 및 API Key가 일치하는지 확인합니다. `supabase status`나 대상 데이터베이스 주소에서 재확인합니다.

## 3. 개발 DB와 운영 DB 구분
* 개발 DB (`localhost:5432`)에서 먼저 모든 마이그레이션 적용 후 `npm run test:stock`을 통해 API 동작을 확인합니다.
* 개발 DB에서 오류가 없을 때만 운영 DB에 적용합니다.

## 4. Migration 파일 실행 순서
`database/migrations/` 내 다음 순서로 엄격하게 실행해야 합니다. 파일 이름이 아닌 실제 FK 의존성 기준 순서입니다.
1. `2026_08_16_stock_market_reference.sql` (기초 정보 마스터 데이터)
2. `2026_08_16_stock_market_observations.sql` (일별 가격, 스냅샷 정보 및 마스터를 참조)
3. `2026_08_16_stock_macro_and_briefs.sql` (거시경제, 브리핑 데이터)
4. `2026_08_16_stock_ingestion_operations.sql` (수집 배치 로깅 및 독립적이거나 위 테이블을 참조)

*(참고: `database/services/stock/001_schema.sql`이나 `002_seed.sql`은 레거시이므로 이번 Phase 2 적용 순서에서 제외되었습니다 (LEGACY_OPTIONAL_NOT_APPLIED).)*

## 5. 트랜잭션 및 멱등성
* 각 파일은 `BEGIN; ... COMMIT;` 트랜잭션으로 보호됩니다.
* 중간 실패 시 파일 전체가 자동으로 Rollback됩니다.
* 테이블, 인덱스, RLS 정책은 모두 멱등성을 고려하여 작성되었으나, 실제 테이블 구조 일치는 검증 스크립트로 확인해야 합니다.

## 6. 오류 발생 시 복구 절차 (중요)
실패 시 다음 절차를 엄격히 따르십시오. 자동 DROP 구문이나 데이터 삭제 지침을 절대 따르지 마십시오.

1. 오류가 발생한 Migration 파일과 Statement(명령문) 기록
2. Transaction Rollback 여부 확인 (오류 발생 시 자동 Rollback되었는지 확인)
3. `database/verification/verify_stock_phase2.sql`을 실행하여 잔여 객체(부분 생성된 테이블 등)가 남아있는지 확인
4. 이미 존재하는 객체가 있다면 기존 정의와 신규 적용하려던 정의를 비교
5. 원인(예: 구문 오류, 기존 충돌) 수정 후 동일 파일 전체를 다시 실행
6. **테이블 삭제는 별도 사용자 승인 없이는 수행하지 않음**
7. **데이터가 존재하는 운영 환경에서는 절대 자동으로 테이블을 Drop하지 않음**

## 7. 적용 후 검증 SQL
`database/verification/verify_stock_phase2.sql`을 실행하여 모든 18개 테이블과 PK/FK, RLS 활성화 여부를 검증합니다.

## 8. API Health 확인
* 마이그레이션 후 `GET /api/stock/health` 호출 시 `200 OK` 및 `CONNECTED` 응답을 받아야 합니다.

## 9. 운영 적용 전 확인사항
* Backend `server.js`에 주입될 `DATABASE_URL`이 올바른 권한을 가진 계정과 비밀번호로 세팅되어 있는지 확인합니다.
* 호출 시 발급받은 `KRX_OPEN_API_AUTH_KEY`가 서버 환경 변수에만 보관되고 소스 코드에 기록되지 않도록 검수합니다.

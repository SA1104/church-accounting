# Supabase Migration Runbook: Stock Think (Phase 2C)

## 1. 실행 전 백업 또는 복구점 확인
* 현재 운영 데이터베이스 스냅샷을 생성합니다. (Supabase Dashboard -> Database -> Backups -> Create a manual backup)
* 최소한 `public` 스키마 덤프를 로컬에 보관하십시오.

## 2. 실행 대상 Supabase Project 확인
* 운영 프로젝트 URL 및 API Key와 일치하는 연결인지 `supabase status`나 대상 데이터베이스 주소에서 재확인합니다.

## 3. 개발 DB와 운영 DB 구분
* 개발 DB (`localhost:5432`)에서 먼저 모든 마이그레이션 적용 후 `npm run test:stock`을 통해 API 동작을 확인합니다.
* 개발 DB에서 오류가 없을 때만 운영 DB에 적용합니다.

## 4. Migration 파일 실행 순서
`database/migrations/` 내 다음 순서로 엄격하게 실행해야 합니다. 파일 이름이 아닌 실제 FK 의존성 기준 순서입니다:
1. `2026_08_16_stock_market_reference.sql` (기준 정보 마스터 테이블)
2. `2026_08_16_stock_market_observations.sql` (일별 가격, 스냅샷 정보 등 마스터를 참조)
3. `2026_08_16_stock_macro_and_briefs.sql` (거시경제, 브리핑 데이터)
4. `2026_08_16_stock_ingestion_operations.sql` (수집 배치 로깅 등 독립적이거나 위 테이블을 참조)

*(참고: `database/services/stock/001_schema.sql`이나 `002_seed.sql`이 존재한다면, 이들은 초기 설계용 구버전이므로 실행하지 않거나 새로운 `2026_08_16_*` 파일로 대체되었는지 점검해야 합니다.)*

## 5. 선행 Extension과 기존 테이블
* `uuid-ossp`, `pgcrypto` 익스텐션이 필요합니다.
* 기존 `platform_projects`나 `platform_profiles` 등 공통 테이블이 이미 구성되어 있어야 합니다. (기존 사용자 테이블)

## 6. 예상 생성 테이블
* `stock_market_reference`
* `stock_instruments`
* `stock_daily_bars` (KRX/NXT 등 거래소 구분 파티션 또는 단일 구조)
* `stock_snapshot_metrics`
* `stock_macro_observations`
* `stock_daily_briefs`
* `stock_ingestion_runs`

## 7. RLS·Policy 목록
* 각 테이블에는 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`가 적용되어야 합니다.
* Public Read 권한(`SELECT`)이 부여된 Policy 생성 여부를 검증합니다. 

## 8. Seed 목록
* 기준 데이터 (시장 코드 `KRX`, `NXT`, 지수 등)가 `INSERT INTO stock_market_reference` 등을 통해 초기화되어야 합니다.

## 9. 실행 후 검증 SQL
`database/verification/verify_stock_phase2.sql` (이 문서를 참조하여 실행)에 명시된 SQL을 통해 테이블과 PK/FK, 제약 조건을 검증합니다.

## 10. API Health 확인
* 마이그레이션 후 `GET /api/stock/health` 호출 시 `200 OK` 및 `CONNECTED` 응답을 받아야 합니다.

## 11. 오류 발생 시 중단 기준
* 임의의 마이그레이션 파일에서 `ERROR: relation "..." does not exist` 같은 외래 키 의존성 오류가 발생하면 즉시 실행을 중단합니다.

## 12. 재실행 가능 여부
* `IF NOT EXISTS` 구문이나 멱등성 쿼리로 작성되었더라도 기존 데이터를 보존해야 하므로 부분 재실행은 지양합니다.

## 13. Rollback 또는 수동 복구 방법
* 생성된 테이블의 `DROP TABLE ... CASCADE` 스크립트를 미리 준비하거나, 1단계에서 생성한 DB 스냅샷 복구 기능을 이용합니다.

## 14. 운영 적용 전 확인사항
* Backend `server.js`에 주입될 `DATABASE_URL`에 올바른 권한을 가진 계정의 비밀번호가 세팅되어 있는지 확인합니다.
* 노출 시 파급력이 큰 `KRX_OPEN_API_AUTH_KEY`는 서버 환경 변수에만 보관하고 소스 코드에 기록되지 않도록 검사합니다.

# Stock Think Phase 2 Migration Manifest

## 1. 기준 정보
- **기준 커밋 Hash**: `ccc07734 feat: establish Stock Think foundation and stabilize auth` (+ `988fcf09 chore: ignore local task artifacts`)
- **생성 일시**: 2026-08-17 (Phase 2C-1A-R 보강 적용)
- **DB 적용 상태**: 실제 DB 미적용 (TARGET_DB_NOT_SELECTED)

## 2. 기존 레거시 Schema 적용 범위 최종 판정
`database/services/stock/001_schema.sql` 및 `002_seed.sql`은 신규 18개 테이블과의 FK 의존성, Backend API 사용 여부, Phase 2 데이터 수집 관련성이 모두 없음이 확인되었습니다.
- **최종 판정**: `LEGACY_OPTIONAL_NOT_APPLIED`
- 이 두 파일은 Phase 2 마이그레이션 실행 순서에서 완전히 제외됩니다.

## 3. Migration 확정 실행 파일 목록 및 트랜잭션 적용 여부
이 순서는 외래 키(FK) 참조 관계를 반영하여 확정되었습니다.

| 순번 | 파일 | 목적 | 트랜잭션 단위 | 반복 실행 안정성 (멱등성) | 실패 시 복구 방식 |
| --- | --- | --- | --- | --- | --- |
| 1 | `2026_08_16_stock_market_reference.sql` | 기초 참조 마스터 (시장, 데이터 소스, 종목) | `BEGIN; ... COMMIT;` | 확보됨 (안전) | Transaction Rollback 확인 후 원인 수정 재실행 |
| 2 | `2026_08_16_stock_market_observations.sql` | 일별 시세, 장중 스냅샷 | `BEGIN; ... COMMIT;` | 확보됨 (안전) | Transaction Rollback 확인 후 원인 수정 재실행 |
| 3 | `2026_08_16_stock_macro_and_briefs.sql` | 거시경제 지표 및 일일 브리핑, 출처 | `BEGIN; ... COMMIT;` | 확보됨 (안전) | Transaction Rollback 확인 후 원인 수정 재실행 |
| 4 | `2026_08_16_stock_ingestion_operations.sql` | 데이터 수집/이력 및 품질 이슈 추적 | `BEGIN; ... COMMIT;` | 확보됨 (안전) | Transaction Rollback 확인 후 원인 수정 재실행 |
| 5 | `database/verification/verify_stock_phase2.sql` | DB 적용 여부 종합 검증 | - (읽기 전용) | 확보됨 (안전) | - |

> **주의: 트랜잭션 롤백 및 복구 방식**
> 모든 DDL은 트랜잭션 블록(`BEGIN; ... COMMIT;`)으로 감싸져 있습니다. 파일 중간에 실행 오류가 발생할 경우 해당 파일 전체가 롤백됩니다. 부분 실패로 인한 찌꺼기 테이블이 남지 않으므로, **테이블을 직접 삭제(`DROP`)하지 마시고** 구문 수정 후 파일을 재실행하십시오.

## 4. 멱등성 보강 세부 내역
- **Table / Constraint**: `CREATE TABLE IF NOT EXISTS public....`를 통해 스키마를 지정하고 멱등성을 확보했습니다.
- **Index**: `CREATE INDEX IF NOT EXISTS`를 적용하여 반복 실행 시 인덱스 중복 에러가 발생하지 않습니다.
- **RLS Policy**: PostgreSQL의 한계를 극복하기 위해 `DO $$ BEGIN IF NOT EXISTS (...) THEN EXECUTE ... END IF; END $$;` 형태의 동적 검증 블록을 사용하여 안전하게 정책을 생성합니다.
- **Seed Data**: 이번 스키마 구성 단계에서는 데이터 삽입 쿼리가 포함되지 않았습니다.

## 5. 파일별 SHA-256 Checksum (2C-1A-R 업데이트)

```text
database/migrations/2026_08_16_stock_market_reference.sql: 5b2d526e6dc8c7ef25c62b0e2bb3807fa4d7ab496ec4ac09e66d1023c49ad1a5
database/migrations/2026_08_16_stock_market_observations.sql: b89b7c38e10e96a67c71b35310ca9a19b1e8cde78d510989d32d23a969131e53
database/migrations/2026_08_16_stock_macro_and_briefs.sql: d9daf9bdf8141fab93dac0a3c3b989d6285c2a44dbc0c291ff35a16db2a07a18
database/migrations/2026_08_16_stock_ingestion_operations.sql: 19df9014688b0d34068af7a4b130bb820dcde9345fbde342fdf97525099bb7a9
database/verification/verify_stock_phase2.sql: 617f7c3bac7470b1af3d30fc82a470e2a403b5967a22ec2d45d74de179672d08
```

## 6. RLS Policy 및 권한 제한
- 모든 읽기 정책은 `TO anon, authenticated`를 명시하여 무분별한 전체 공개(`PUBLIC`)를 방지했습니다.
- `stock_ingestion_runs`, `stock_ingestion_errors`, `stock_data_quality_issues`와 같은 내부 운영/로깅 테이블은 공개 정책(Policy)이 없어 외부(익명 및 일반 인증 유저) 접근이 원천 차단됩니다. (Service Role 만 접근 가능)
- 마스터, 시세, 뉴스 브리핑 등 공개 가능 테이블은 `is_active = true`, `is_final = true`, `publication_status = 'PUBLISHED'` 조건에 맞는 데이터만 공개되도록 구성되었습니다.
- 익명 사용자 및 일반 사용자의 데이터 변조(쓰기, 수정, 삭제)를 허용하는 정책은 **없습니다**.

# Booza Think Platform OS - SQL Migration Coding Standard

본 가이드라인은 Booza Think Platform OS의 안정성 확보와 무장애 마이그레이션(Zero-Downtime Deployment)을 위해, 모든 데이터베이스 마이그레이션 및 DDL/DML 작성이 준수해야 할 코딩 스탠다드를 정의합니다.

---

## 📌 1. CREATE TABLE 규칙
1. **멱등성 보장**: 모든 테이블 생성은 반드시 `IF NOT EXISTS` 절을 동반해야 합니다.
   ```sql
   CREATE TABLE IF NOT EXISTS platform_example ( ... );
   ```
2. **타입의 명확성**: 식별자(PK, FK) 정의 시 데이터 타입을 누락하지 않아야 합니다. (예: `UUID PRIMARY KEY`)
3. **Audit 필드 탑재**: 시간 흐름 추적을 위해 `created_at` 및 `updated_at` 컬럼을 기본 배치하고, 타임존(`TIMESTAMP WITH TIME ZONE`)을 명시합니다.

---

## 📌 2. ALTER TABLE 규칙
1. **Constraint 추가 멱등성**: 컬럼 추가, 제약조건(Constraint) 부착 시 `pg_constraint` 조회를 활용하는 `DO $$` PL/pgSQL 블록을 필수 적용합니다.
   ```sql
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'unique_example_key'
     ) THEN
       ALTER TABLE platform_example ADD CONSTRAINT unique_example_key UNIQUE (col_a, col_b);
     END IF;
   END $$;
   ```
2. **컬럼 추가 멱등성**: 컬럼 추가 시에도 `information_schema.columns`를 검사하는 `DO $$` 구조를 준수합니다.

---

## 📌 3. INDEX 생성 규칙
1. **인덱스 중복 방지**: 인덱스 생성은 반드시 `CREATE INDEX IF NOT EXISTS`를 사용합니다.
   ```sql
   CREATE INDEX IF NOT EXISTS idx_example_name ON platform_example(col_name);
   ```
2. **명명 규칙**: 인덱스명은 `idx_{테이블명}_{컬럼명}` 형태로 표준화합니다.

---

## 📌 4. 외래키(FK) 생성 규칙
1. **의존성 정리**: 모든 외래키는 `platform_services` 또는 `platform_projects`와 연계되며, 참조 무결성을 위해 `ON DELETE CASCADE` 또는 `ON DELETE SET NULL` 옵션을 명시합니다.
2. **부하 방지**: 외래키 참조 대상 컬럼에는 참조 속도를 단행할 수 있도록 인덱스를 필수 부여합니다.

---

## 📌 5. Seed 데이터 규칙
1. **중복 주입 차단**: 초기 데이터 적재(DML)는 반드시 유니크 제약조건(Constraint)을 식별값으로 활용하여 `ON CONFLICT` 절을 필수 삽입해야 합니다.
2. **멱등성**: 실행 횟수에 무관하게 동일한 데이터 상태가 유지되도록 보장합니다.

---

## 📌 6. UUID 규칙
1. **기본값 지정**: UUID 컬럼 생성 시 시스템이 랜덤 키를 보장하도록 `DEFAULT gen_random_uuid()`를 할당합니다.
2. **확장 플러그인**: 필요한 경우 pgCrypto 또는 uuid-ossp가 사전 기동되어 있는지 선언하고 시작합니다.

---

## 📌 7. JSONB 사용 규칙
1. **유연한 메타 정보**: 정형화하기 어려운 세부 로그 및 분석 설정 데이터는 확장성을 위해 `JSONB` 타입을 사용합니다.
2. **색인 성능**: 특정 JSON 필드로 빈번한 필터링이 필요할 경우 GIN 인덱스(`USING gin`) 지정을 검토합니다.

---

## 📌 8. ON CONFLICT 규칙
1. **행위 지정**: 단순 적재 방지는 `ON CONFLICT DO NOTHING`, 상태 동기화는 `ON CONFLICT (...) DO UPDATE SET ...` 구조를 사용합니다.

---

## 📌 9. RLS (Row Level Security) 적용 규칙
1. **보안 지향**: 사용자 데이터와 직접 결합하는 정보는 RLS를 활성화하고, 서비스별/프로젝트별 격리 정책을 명시합니다.
   ```sql
   ALTER TABLE platform_example ENABLE ROW LEVEL SECURITY;
   ```

---

## 📌 10. Rollback 작성 규칙
1. **별도 관리**: 마이그레이션 실패 시 복구를 위한 Rollback SQL을 구성하되, 운영 중인 라이브 테이블을 DROP 하는 실수를 예방하기 위해 Rollback 스크립트는 반드시 수동 실행용 주석 파일로만 배포합니다.

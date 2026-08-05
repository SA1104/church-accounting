-- =========================================================================
-- Booza Think - Platform Auth & Admin Users Migration
-- Date: 2026-08-04
-- =========================================================================

-- 1. platform_profiles 테이블에 이메일 및 비밀번호 재설정 관련 컬럼 추가
ALTER TABLE public.platform_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMP WITH TIME ZONE;

-- 2. 안전한 이메일 동기화 (auth.users -> platform_profiles)
-- user_id가 일치하는 계정에 한해서만 이메일을 동기화합니다.
-- user_id가 다른 계정은 관리자 화면에서 AUTH_PROFILE_MISMATCH로 조회되어야 하므로 병합하지 않습니다.
UPDATE public.platform_profiles p
SET email = LOWER(TRIM(a.email))
FROM auth.users a
WHERE p.user_id = a.id
  AND a.email IS NOT NULL
  AND (
    p.email IS NULL
    OR TRIM(p.email) = ''
    OR LOWER(TRIM(p.email)) <> LOWER(TRIM(a.email))
  );

-- 3. 이메일 중복 검사 쿼리
-- (배포 전 반드시 실행하여 중복 데이터가 있는지 확인하세요)
-- 
-- SELECT LOWER(TRIM(email)) AS normalized_email, COUNT(*)
-- FROM public.platform_profiles
-- WHERE email IS NOT NULL
--   AND TRIM(email) <> ''
-- GROUP BY LOWER(TRIM(email))
-- HAVING COUNT(*) > 1;
-- 
-- 위 쿼리 결과에서 중복이 없음을 확인한 후, 아래 고유 인덱스를 생성하세요.
-- 만약 중복이 있다면 고유 인덱스(UNIQUE INDEX) 대신 일반 인덱스(INDEX)로 변경하여 배포해야 합니다.

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_profiles_email_lower 
ON public.platform_profiles (LOWER(TRIM(email)))
WHERE email IS NOT NULL AND TRIM(email) <> '';

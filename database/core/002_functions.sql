-- =========================================================================
-- Booza Think Platform OS - Platform Core Functions (002_functions.sql)
-- =========================================================================

-- auth.users 신규 가입 시 platform_profiles 자동 생성 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.platform_profiles (user_id, username, display_name, is_active)
  VALUES (
    new.id,
    split_part(new.email, '@', 1),
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 바인딩
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 공통 SQL 실행기 RPC 함수 (DATABASE_URL 대체 목적, 서비스 역할 전용)
CREATE OR REPLACE FUNCTION public.exec_sql(query_text text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  res_json jsonb := '[]'::jsonb;
  i int;
  param_val text;
  final_query text := query_text;
  row_count int;
BEGIN
  -- 파라미터가 있는 경우 플레이스홀더(?)를 안전하게 이스케이프된 문자열 상수로 치환
  IF jsonb_array_length(params) > 0 THEN
    FOR i IN 0 .. jsonb_array_length(params) - 1 LOOP
      param_val := params->>i;
      IF param_val IS NULL THEN
        final_query := regexp_replace(final_query, '\?', 'NULL');
      ELSE
        -- 홑따옴표가 SQL 인젝션 공격 도구로 오용되지 않도록 이스케이프 처리
        param_val := replace(param_val, '''', '''''');
        final_query := regexp_replace(final_query, '\?', '''' || param_val || '''');
      END IF;
    END LOOP;
  END IF;

  -- 쿼리 타입 분기 처리
  IF upper(final_query) LIKE '%RETURNING%' THEN
    -- 데이터 수정 및 결과 반환 (CTE 적용)
    EXECUTE 'WITH t AS (' || final_query || ') SELECT jsonb_agg(t) FROM t' INTO res_json;
  ELSIF upper(final_query) LIKE 'SELECT%' OR upper(final_query) LIKE 'WITH%' THEN
    -- 일반 조회 (서브쿼리 적용)
    EXECUTE 'SELECT jsonb_agg(t) FROM (' || final_query || ') t' INTO res_json;
  ELSE
    -- 일반 데이터 수정 (결과 카운트 반환)
    EXECUTE final_query;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    res_json := jsonb_build_array(jsonb_build_object('changes', row_count));
  END IF;

  RETURN COALESCE(res_json, '[]'::jsonb);
END;
$$;

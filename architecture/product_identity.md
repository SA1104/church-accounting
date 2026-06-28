# Booza Think Product Identity (제품 정체성 및 UX 설계 규칙)

---

## 1. Product First, Platform Second 원칙

- **사용자의 시각적 초점 격리**:
  사용자가 로그인하고 서비스를 사용하는 전 과정 동안 자신이 "Booza Think"라는 플랫폼 위에 올라와 있다는 느낌을 주지 않는 것을 원칙으로 합니다.
- **개별 브랜딩(Independent Branding)**:
  사용자가 접속한 해당 개별 서비스의 BI(Brand Identity)와 로고, 교회명 등이 최상위에 노출되어 서비스 고유성을 지켜냅니다.

---

## 2. 루트 포털(Service Selector Portal) 규격

사용자가 최상위 도메인`/`으로 접근할 때, 공통 인트로인 **Service Selector**를 제공합니다.

- **메인 카피**: "오늘 무엇을 결정하시겠습니까?"
- **포털 역할**:
  - 현재 활성화된 제품과 비활성화(Coming Soon)된 제품 카드를 세련되게 바인딩하여 플랫폼의 확장성을 은유적으로만 드러냅니다.
  - 사용 가능한 프로덕트 카드(`Church Think`)의 `시작하기` 버튼을 누르는 순간 해당 제품의 구체적인 로그인 및 기능 공간으로 전환됩니다.
- **푸터 표기**:
  - 포털의 최하단에만 연하게 `Powered by Booza Think Platform` 라이선스 카피라이트를 한 줄 노출하여 플랫폼의 존재감을 보조적으로만 보여줍니다.

---

## 3. 개별 앱 내 브랜딩 규칙 (App Isolation)

- **Header 구성**:
  - 기존의 `"Booza Think OS"` 같은 공통 바를 절대 사용하지 않습니다.
  - 테넌트 메타데이터를 기반으로 **`{서비스명} | {조직/교회명}`** (예: `Church Think | 신길교회`) 형식으로 동적 노출합니다.
- **UI 테마색 매핑**:
  - 각 테넌트 프로필(`church_profiles`)에 지정된 `primary_color`와 `secondary_color` 값을 Tailwind/CSS 변수에 바인딩하여 로그인부터 관리 화면까지 개별 맞춤화된 테마 컬러로 동적 적용합니다.

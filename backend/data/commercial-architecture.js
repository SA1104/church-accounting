'use strict';
/**
 * 상권 · 입지 · 경쟁점 컨설팅 Lab 아키텍처 및 데이터 파이프라인 정의서 + 상권 유형별 시뮬레이션 프리셋
 */
const ZONE_ARCHETYPES = [
  {
    id: 'office-station',
    name: '역세권 오피스 밀집 상권',
    desc: '평일 출근·점심 유동인구가 압도적이며 주말·공휴일 매출 공백이 발생하는 상권',
    ageDist: [
      { group: '20대', pct: 24 },
      { group: '30대', pct: 38 },
      { group: '40대', pct: 25 },
      { group: '50대+', pct: 13 }
    ],
    peakHours: '08:00~09:30 (모닝커피) · 11:30~13:00 (점심 피크) · 18:00~21:00 (직장인 회식)',
    weekdayVsWeekend: '평일 78% : 주말 22%',
    rentLevel: '높음 (평당 월세 상위 15%)',
    avgCompetitors300m: { 'takeout-coffee': 14, 'korean-dining': 22, 'chicken-delivery': 6, 'meat-pub': 15, 'beauty-salon': 9, 'study-cafe': 2 },
    advice: '주 5일(월 21~22일) 영업만으로도 월세와 인건비가 빠지는 빠른 회전 구조여야 합니다. 점심 12분 내 식사·픽업이 가능한 동선과 선결제 테이블오더가 필수이며, 주말 공실률을 케이터링·단체 도시락으로 메우면 순이익이 크게 뜁니다.'
  },
  {
    id: 'apt-residential',
    name: '대단지 아파트 · 주거 배후 상권',
    desc: '3,000세대 이상 배후 가구를 기반으로 단골 재방문율과 배달·저녁·주말 수요가 탄탄한 상권',
    ageDist: [
      { group: '10·20대', pct: 18 },
      { group: '30대', pct: 27 },
      { group: '40대', pct: 33 },
      { group: '50대+', pct: 22 }
    ],
    peakHours: '10:30~12:30 (학부모 브런치) · 16:00~18:00 (하교·장보기) · 18:00~22:00 (가족외식·배달)',
    weekdayVsWeekend: '평일 56% : 주말 44%',
    rentLevel: '중간 (권리금 안정, 장기 영업 유리)',
    avgCompetitors300m: { 'takeout-coffee': 6, 'korean-dining': 10, 'chicken-delivery': 9, 'meat-pub': 7, 'beauty-salon': 8, 'study-cafe': 5 },
    advice: '한 번 실망한 손님은 동네 전체에 소문이 나고, 반대로 만족한 단골은 3년 이상 매출을 지탱합니다. 화려한 인테리어보다 위생·아이 동반 편의성·포장 할인 혜택이 훨씬 강력한 모객 무기입니다.'
  },
  {
    id: 'campus-youth',
    name: '대학가 · 청년 트렌드 상권',
    desc: 'SNS 확산 속도와 가성비 민감도가 높으며 방학(1~2월, 7~8월) 매출 급감에 대비해야 하는 상권',
    ageDist: [
      { group: '20대', pct: 58 },
      { group: '30대', pct: 24 },
      { group: '40대', pct: 11 },
      { group: '50대+', pct: 7 }
    ],
    peakHours: '12:00~14:30 (공강 점심) · 17:30~23:30 (모임·야간 주류·디저트)',
    weekdayVsWeekend: '평일 62% : 주말 38%',
    rentLevel: '중상 (방학 비수기 고정비 버퍼 필수)',
    avgCompetitors300m: { 'takeout-coffee': 12, 'korean-dining': 16, 'chicken-delivery': 8, 'meat-pub': 18, 'beauty-salon': 11, 'study-cafe': 7 },
    advice: '방학 4개월 동안 매출이 30~45% 빠져도 버틸 수 있는 월세 수준인지 반드시 계산하세요. 사진 찍기 좋은 시그니처 메뉴 1개와 스레드·릴스 방문 인증 혜택이 유료 광고보다 5배 이상 효율적입니다.'
  },
  {
    id: 'downtown-food-alley',
    name: '핵심 먹자골목 · 광역 상권',
    desc: '저녁·주말 유동인구와 객단가가 높지만 높은 권리금·임대료와 치열한 경쟁을 견뎌야 하는 상권',
    ageDist: [
      { group: '20대', pct: 34 },
      { group: '30대', pct: 35 },
      { group: '40대', pct: 20 },
      { group: '50대+', pct: 11 }
    ],
    peakHours: '12:00~14:00 · 18:00~24:00 (저녁 1·2차 집중)',
    weekdayVsWeekend: '평일 48% : 주말 52%',
    rentLevel: '매우 높음 (환산보증금 상한 초과 여부 필히 점검)',
    avgCompetitors300m: { 'takeout-coffee': 16, 'korean-dining': 24, 'chicken-delivery': 11, 'meat-pub': 26, 'beauty-salon': 15, 'study-cafe': 3 },
    advice: '어중간한 종합 메뉴는 살아남지 못합니다. 대표 메뉴 2가지로 조리 속도와 원가율을 극대화하고, 계약 전 반드시 환산보증금(서울 9억 등) 초과 여부를 점검해 2년 뒤 임대료 급등 리스크를 특약으로 방어하세요.'
  },
  {
    id: 'newtown-complex',
    name: '신도시 중심상업지구 · 주상복합 상권',
    desc: '젊은 맞벌이·육아 가구 비중이 높으나 초기 상가 공실 기간과 높은 분양 임대료를 주의해야 하는 상권',
    ageDist: [
      { group: '10·20대', pct: 16 },
      { group: '30대', pct: 39 },
      { group: '40대', pct: 32 },
      { group: '50대+', pct: 13 }
    ],
    peakHours: '11:00~14:00 · 17:30~21:00 (가족 외식·배달·학원가 연계)',
    weekdayVsWeekend: '평일 52% : 주말 48%',
    rentLevel: '초기 높음 → 렌트프리(무상임대) 협상 여지 큼',
    avgCompetitors300m: { 'takeout-coffee': 8, 'korean-dining': 9, 'chicken-delivery': 7, 'meat-pub': 6, 'beauty-salon': 9, 'study-cafe': 6 },
    advice: '배후 아파트 실제 입주율이 75%를 넘기 전에 들어가면 초기 6개월 적자로 운영자금이 고갈됩니다. 입주 초기 상가는 인테리어 기간 포함 2~4개월 렌트프리(Rent-Free) 협상이 가능하므로 초기 고정비를 최대한 낮추고 진입하세요.'
  }
];

// 향후 정식 핀포인트 위치기반 유료/바이럴 컨설팅 엔진을 위한 데이터 파이프라인 명세
const DATA_PIPELINE_SPEC = [
  {
    layer: '1. 점포 · 경쟁밀도 레이어',
    source: '소상공인시장진흥공단 상가(상권)정보 오픈API (공공데이터포털 data.go.kr)',
    fields: '위경도 좌표(lat, lng), 표준산업분류 대·중·소 업종코드, 상호·지점명(프랜차이즈 판별), 층정보, 분기별 점포 증감률',
    usage: '지정한 핀 위치 반경 300m / 500m / 1km 내 동일·유사 경쟁업체 정확 개수 및 최근 1년 폐업 밀집도 산출'
  },
  {
    layer: '2. 유동인구 · 연령 · 시간대 레이어',
    source: '서울 실시간 도시데이터·생활인구 API / 지자체 통신사 기반 행정동 유동인구 공공데이터',
    fields: '시간대별(00~24시) 유동인구, 요일별 비중, 성별·연령대별(10대~60대+) 상주·직장·방문인구 비율',
    usage: '타깃 업종의 주 소비층(예: 스터디카페 10~20대, 국밥·정육 40~50대)과 실제 상권 체류 인구의 궁합 점수 계산'
  },
  {
    layer: '3. 추정 매출 · 생존율 레이어',
    source: '국세청 100대 생활밀접업종 통계 · 공정거래위원회 가맹사업 정보공개서 · 카드사 상권 빅데이터 공개지표',
    fields: '시군구·상권별 업종 평균 월매출, 중위 매출, 객단가, 1년·3년·5년 생존율',
    usage: '예비창업자의 희망 매출이 해당 동네 상위 몇 %를 찍어야 가능한 수치인지 현실성 검증'
  },
  {
    layer: '4. 임대시세 · 건물 물리 레이어',
    source: '한국부동산원 상업용부동산 임대동향 · 국토교통부 건축물대장 API',
    fields: '상권별 1층/지상층 제곱미터당 평균 임대료, 중대형·소규모 상가 공실률, 전용면적·용도·주차대수',
    usage: '요구받는 보증금·월세가 주변 시세 대비 고평가인지 판독 및 환산보증금 법적 보호 자동 체크'
  },
  {
    layer: '5. 지오코딩 · 집객시설 레이어',
    source: '카카오 로컬(Kakao Local) / 네이버 클라우드 Maps 지오코딩 & 카테고리 검색 API',
    fields: '도로명주소 ↔ 좌표 변환, 최근접 지하철역 출구 거리, 버스정류장 수, 초·중·고·대학교, 아파트 세대수, 대형병원·관공서',
    usage: '실제 도보 동선(횡단보도·언덕 단절 등) 및 핵심 집객 앵커 시설과의 시너지 점수화'
  },
  {
    layer: '6. Pro 결제 & 홍보인증 잠금해제 원장',
    source: 'Supabase PostGIS(공간쿼리 캐시) + 토스페이먼츠/포트원 단건결제 + SNS 공유 URL 검증 워커',
    fields: 'biz_commercial_reports(좌표·분석결과 캐시), biz_pro_unlocks(결제토큰 또는 스레드·블로그 공유 URL 검증 상태)',
    usage: '단건 유료 리포트 판매 수익화 + 결제를 원치 않는 창업자에게는 커뮤니티/SNS 자발적 홍보 인증 시 무료 열람권 부여'
  }
];

module.exports = { ZONE_ARCHETYPES, DATA_PIPELINE_SPEC };

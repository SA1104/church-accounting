# Booza Think Future Products Domain Skeleton (향후 확장 제품 도메인 스켈레톤)

본 문서는 플랫폼의 Future-Proof 확장성을 증명하기 위해, 향후 추가 예정인 8대 Think Product의 도메인(Entity, Attribute, Relationship, Event, Rule, Document)을 표준 스켈레톤 형식으로 사전 설계한 스펙입니다.

---

## 1. Education Think (교육 행정 및 학생 분석)
- **Entity**: `Student` (학생), `Teacher` (교사), `Course` (강의), `School` (학교)
- **Attribute**: `Score` (성적), `AttendanceRate` (출석률), `SocioeconomicStatus` (배경 지수)
- **Relationship**: `EnrolledIn` (강의 등록 관계), `TaughtBy` (담당 교사 지도 관계)
- **Event**: `Exam` (시험 실시), `Graduation` (졸업), `Consulting` (진학 상담)
- **Document**: `Transcript` (성적표), `RecommendationLetter` (추천서), `StudentLedger` (생활기록부)
- **Rule**: 출석률이 80% 미만으로 하락할 경우 학업 경고 발생 및 학부모 알림 발송 규칙.

---

## 2. Finance Think (개인/기업 재무 포트폴리오)
- **Entity**: `Asset` (자산), `Account` (계좌), `Liaison` (거래처), `Liability` (부채)
- **Attribute**: `InterestRate` (이자율), `MaturityDate` (만기일), `TaxRate` (세율)
- **Relationship**: `CollateralizedBy` (담보 제공 관계), `OwesTo` (채권 채무 관계)
- **Event**: `Transaction` (입출금 거래), `LoanApproval` (대출 승인), `Defaults` (채무 불이행)
- **Document**: `LoanContract` (대출 계약서), `TaxReturn` (세금 신고서), `CreditReport` (신용 보고서)
- **Rule**: 연소득 대비 총부채원리금상환비율(DSR)이 40%를 초과할 경우 신규 대출 한도 자동 잠금 규칙.

---

## 3. Construction Think (건설 공정 및 자재 수급)
- **Entity**: `ProjectSite` (현장), `Material` (원자재), `Equipment` (장비), `Labor` (인력)
- **Attribute**: `ProgressRate` (공정률), `UnitCost` (단가), `SafetyScore` (안전 등급)
- **Relationship**: `SuppliedBy` (자재 납품 계약 관계), `OperatedBy` (장비 조종 관계)
- **Event**: `SafetyIncident` (안전 사고), `MilestoneApproval` (단계 승인), `Delay` (공기 지연)
- **Document**: `Blueprints` (설계도면), `ConstructionLog` (작업 일지), `InspectionReport` (검측 보고서)
- **Rule**: 기상청 태풍/폭우 경보 발령 시 고소 작업 자동 전면 보류 및 안전 점검 태스크 강제 생성 규칙.

---

## 4. Manufacturing Think (스마트 공장 및 생산성)
- **Entity**: `FactoryLine` (생산 라인), `ProductModel` (생산 품목), `Machine` (설비), `Defect` (불량)
- **Attribute**: `OEE` (설비종합효율), `Yield` (수율), `Temperature` (동작 온도)
- **Relationship**: `AssembledOn` (조립 라인 매핑), `RequiresComponent` (BOM 종속 관계)
- **Event**: `MachineBreakdown` (설비 고장), `QualityAudit` (품질 검사), `ShiftChange` (근무 교대)
- **Document**: `BOM` (자재명세서), `ProductionPlan` (생산 계획서), `MaintenanceLog` (정비 일지)
- **Rule**: 특정 설비의 진동/온도 센서 임계치 15% 초과 감지 시 예방 정비 오더 생성 및 가동 일시 정지 규칙.

---

## 5. Medical Think (스마트 진료 및 병원 자원)
- **Entity**: `Patient` (환자), `Doctor` (의사), `Bed` (병상), `Prescription` (처방)
- **Attribute**: `Vitals` (바이탈 사인), `BedOccupancy` (병상 가동률), `RiskLevel` (중증도)
- **Relationship**: `AssignedTo` (주치의 매핑), `AllergicTo` (알레르기 반응 물질 연계)
- **Event**: `Admission` (입원), `Surgery` (수술), `EmergencyCall` (응급 호출)
- **Document**: `EMR` (전자의무기록), `ConsentForm` (수술 동의서), `LabResult` (검사 결과지)
- **Rule**: 환자 수축기 혈압 90mmHg 이하 또는 맥박 120회/분 이상 지속 시 의료진 응급 콜 트리거 규칙.

---

## 6. Legal Think (법률 검토 및 송무)
- **Entity**: `Case` (사건), `Contract` (계약서), `Statute` (법령), `Precedent` (판례)
- **Attribute**: `FilingDate` (소제기일), `ClaimAmount` (소송가액), `SuccessProbability` (승소 확률)
- **Relationship**: `GovernedBy` (적용 법령 관계), `CitesPrecedent` (인용 판례 관계)
- **Event**: `Hearing` (변론 기일), `Judgment` (선고일), `Appeal` (항소 제기)
- **Document**: `Complaint` (소장), `Brief` (준비서면), `JudgmentWritten` (판결문)
- **Rule**: 계약서 상 손해배상 예정액이 통상적 범위(계약금 2배)를 극단적으로 이탈할 경우 독소 조항 경고 규칙.

---

## 7. HR Think (인사 고과 및 인재 확보)
- **Entity**: `Employee` (임직원), `JobOpening` (채용 공고), `Evaluation` (인사 평가)
- **Attribute**: `Salary` (급여), `PerformanceScore` (인사 점수), `AttritionRisk` (이탈 위험도)
- **Relationship**: `ReportsTo` (보고 직속 라인), `MentorOf` (멘토-멘티 관계)
- **Event**: `Promotion` (승진), `Hiring` (채용 체결), `Resignation` (퇴사 표명)
- **Document**: `EmploymentAgreement` (근로계약서), `Resume` (이력서), `FeedbackForm` (평가서)
- **Rule**: 핵심 인재(인사 고과 A등급 이상)의 최근 분기 평가 면담 누락 시 이탈 방지를 위한 면담 알림 트리거 규칙.

---

## 8. ESG Think (탄소 배출 및 거버넌스)
- **Entity**: `Facility` (사업장), `EmissionSource` (배출원), `Supplier` (협력 공급망)
- **Attribute**: `CarbonFootprint` (탄소배출량), `WasteQty` (폐기물량), `BoardDiversity` (이사회 다양성 비율)
- **Relationship**: `EmitsFrom` (배출원 연계), `AuditBy` (ESG 평가 기관 매핑)
- **Event**: `EnvironmentalAudit` (환경 실사), `SpillIncident` (오염 물질 누출 사고)
- **Document**: `SustainabilityReport` (지속가능경영 보고서), `CarbonCreditCertificate` (탄소배출권 인증서)
- **Rule**: 연간 누적 탄소배출량이 할당 쿼터의 90% 임계치 도달 시 배출권 추가 매수 추천 결정 생성 규칙.

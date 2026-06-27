# Booza Think Platform OS - Data Contract Specification

Booza Think Platform OS 내에서 각 엔진 간에 송수신되는 모든 핵심 데이터 패킷은 반드시 아래의 데이터 계약 구조(Data Contract Schema)를 100% 준수해야 합니다.

---

## 📝 공통 데이터 스키마 (Common Data Contract JSON)

```json
{
  "serviceId": "church_think",                  // 호출 대상 서비스 식별 키 (예: church_think, stock_think 등)
  "projectId": "8a510c4f-c006-4442-8924-f3c75ab73cf6", // 대상 프로젝트 고유 UUID
  "tenantId": "d7a049e0-06b2-4d26-8809-17be7bf6e491",  // SaaS 테넌트/조직 식별 UUID
  "workflowId": "wf_100249",                    // 워크플로우 실행 파이프라인 UUID
  "entityId": "voucher_10245",                  // 처리 대상 원천 키 (전표 ID, 종목 심볼 등)
  "payload": {                                  // 엔진이 처리해야 할 주 페이로드 본문
    "amount": 50000000,
    "category": "건축비"
  },
  "metadata": {                                 // 기타 톤앤매너, 클라이언트 정보 등 비즈니스 메타데이터
    "requestedBy": "user_id_1024",
    "ipAddress": "127.0.0.1"
  },
  "createdAt": "2026-06-27T16:44:16Z"          // ISO 8601 타임스탬프
}
```

이 스키마를 통해 Data ➔ Cleaning ➔ Intelligence ➔ Decision ➔ Media ➔ Distribution ➔ Workflow ➔ Automation 에 이르는 모든 파이프라인 계층이 일관되고 통일된 입출력 인터페이스를 유지하게 됩니다.

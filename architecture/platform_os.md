# Booza Think Platform OS - Decision Operating System Specification

Booza Think Platform OS는 비즈니스 도메인 지식과 의사결정 워크플로우를 소프트웨어의 실행 흐름으로 자동 제어하는 **의사결정 운영체제(Decision Operating System)**입니다.

---

## 🏛️ 플랫폼 아키텍처 개요

```text
+-----------------------------------------------------------+
|                    Think Apps Layer                       |
|  (Church Think / Stock Think / Estate Think / Mission)    |
+-----------------------------------------------------------+
                             ▼
+-----------------------------------------------------------+
|                   Platform Engine Core                    |
|  (Data -> Cleaning -> Standardization -> Intelligence ->   |
|   Knowledge -> AI -> Decision -> Simulation -> Prediction ->|
|   Learning -> Media -> Distribution -> Workflow -> Auto)  |
+-----------------------------------------------------------+
                             ▼
+-----------------------------------------------------------+
|                    Shared Core OS Services                |
|  (Auth / DB / Tenant Isolation / Audit Log / Plugin Loader)|
+-----------------------------------------------------------+
```

---

## 🔒 멀티 테넌트 및 격리 정책
1. **프로젝트 단위 격리 (`projectId`)**: 프로젝트 멤버와 데이터 자산은 프로젝트 UUID를 기준으로 완전히 분리된 관계형 데이터 공간을 유지합니다.
2. **테넌트 격리 (`tenantId`)**: 상위 부모 조직(교단, 투자 법인 등)의 정책 및 권한 계층이 하위 자식 노드에 투명하게 상속 및 제어되는 SaaS 멀티 테넌시 규칙을 구현합니다.

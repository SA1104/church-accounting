# Booza Think Platform OS - Core Engine Lifecycle Interface

모든 Booza Think Platform OS의 엔진은 반드시 아래 공통 생명주기 및 실행 규격 계약(Interface Contract)을 준수하여 작성되어야 합니다.

---

## ⚙️ 표준 인터페이스 (Standard Interface)

### 1. `initialize()`
- **역할**: 엔진 기동 시 데이터베이스 풀, 외부 자원 풀 또는 종속성 모듈을 초기화합니다.
- **반환값**: `Promise<void>`

### 2. `health()`
- **역할**: 엔진의 현재 기동 및 준비 상태를 자가 진단합니다.
- **반환값**: `Promise<{ status: 'ok' | 'degraded' | 'error', details?: any }>`

### 3. `validate(input)`
- **역할**: 입력 데이터가 해당 엔진의 정형 데이터 계약서(Data Contract) 규격과 스키마 유효성을 충족하는지 검사합니다.
- **반환값**: `Promise<{ isValid: boolean, error?: string }>`

### 4. `execute(input)`
- **역할**: 비즈니스 로직 및 처리를 실제로 집행하는 핵심 진입점입니다.
- **반환값**: `Promise<any>` (결과 데이터 오브젝트 리턴)

### 5. `status()`
- **역할**: 기동 통계 및 내부 누적 트랜잭션, 메모리 지표 정보를 산출합니다.
- **반환값**: `Promise<{ uptime: number, processedCount: number, errorCount: number }>`

### 6. `shutdown()`
- **역할**: 서버 종료 시 사용 중인 네트워크 포트, 파일 소켓, DB 커넥션 풀을 정상 반환(Graceful Shutdown)합니다.
- **반환값**: `Promise<void>`

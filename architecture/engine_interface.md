# Booza Think Engine Interface Specification (엔진 인터페이스 명세)

---

## 1. 공통 엔진 인터페이스 (Base Engine Interface)

모든 표준 엔진은 플랫폼 라이프사이클 관리자의 통제를 따르기 위해 다음 공통 인터페이스 규격을 상속 및 구현해야 합니다.

```typescript
interface BaseEngine {
  engineId: string;
  version: string;
  status: 'IDLE' | 'RUNNING' | 'ERROR';
  
  initialize(config: EngineConfig): Promise<boolean>;
  execute(context: ExecutionContext): Promise<ExecutionResult>;
  terminate(): Promise<void>;
  getStatus(): EngineStatus;
}
```

---

## 2. 라이프사이클 훅 규약 (Lifecycle Hooks)

- **`initialize(config)`**:
  엔진이 처음 메모리에 로드될 때 거버넌스 엔진이 전달하는 메타데이터 환경변수와 라이선스 한도를 바인딩합니다.
- **`execute(context)`**:
  실제 데이터 공급망이나 의사결정 파이프라인에서 트리거되어 연산을 수행하는 핵심 바디입니다. 입력값은 사전에 정의된 데이터 전략 형식을 충족해야 합니다.
- **`terminate()`**:
  엔진 정지 시 사용하던 메모리 자원, 데이터베이스 커넥션 풀, 파일 스트림 등을 완전히 소거하는 자가 청소 작업을 수행합니다.

---

## 3. 엔진 간 통신 규약 (Data Exchange Protocol)

엔진 간의 데이터 입출력은 직렬화 가능한 **JSON Schema** 또는 **Protocol Buffers** 형식을 표준으로 하며, 인메모리 파이프라인을 통과할 때는 `ExecutionContext` 객체에 데이터가 누적(Additive)되는 형태로 공유됩니다. 이전 단계 엔진의 출력이 다음 단계 엔진의 입력 요구사항을 충족하는지 거버넌스 엔진이 스키마 유효성 검증을 거친 후 연결합니다.

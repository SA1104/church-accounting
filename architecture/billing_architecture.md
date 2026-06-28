# Booza Think Billing & Payment Architecture (과금 및 결제 아키텍처)

---

## 1. Billing Engine 핵심 구조

`Billing Engine`은 사용자의 구독 유형, 사용량 계측, 결제 이력을 조합하여 요금을 청구하는 코어 모듈입니다.

- **Subscription**: 테넌트의 구독 등급과 만료일, 차기 청구 예정 시점 관리
- **Invoice**: 월별 과금 계산서 발행 내역 및 납부 상태 추적
- **Quota & Entitlement**: 테넌트가 사용할 수 있는 잔여 크레딧 한도 및 잠금 해제된 Feature Flag 감시
- **Organization Billing**: 부서/그룹 단위의 결제 수단 공유 및 법인 정산 기능

---

## 2. Payment Interface 규약 (PaymentProviderInterface)

플랫폼은 특정 PG(Stripe, Toss Payments 등)에 하드코딩되지 않고 플러그인 형태로 언제든 교체 및 추가될 수 있도록 추상 인터페이스를 전제로 설계됩니다.

```typescript
interface PaymentProvider {
  providerId: string;
  
  initialize(apiKeys: any): Promise<void>;
  createPaymentIntent(amount: number, currency: string, metadata: any): Promise<PaymentIntent>;
  confirmPayment(paymentIntentId: string): Promise<PaymentResult>;
  refundPayment(paymentIntentId: string, amount: number): Promise<RefundResult>;
  registerBillingKey(customerData: any): Promise<BillingKey>;
}
```

---

## 3. Usage Engine 계측 지표 (Metering Targets)

`Usage Engine`은 향후 요금 부과를 위해 다음 9개 리소스를 완전 계측하여 데이터베이스에 가시 기록을 남깁니다.

1. **LLM Token**: AI 보고서 및 프롬프트 생성용 입출력 토큰 수
2. **OCR Record**: 영수증/증빙 스캔 건수
3. **AI Analysis**: 의사결정 시뮬레이션 및 예측 모델 구동 횟수
4. **Image Generation**: 로고 및 프로필 AI 이미지 생성 건수
5. **Video Generation**: 요약 Shorts 동영상 빌드 시간 (초 단위)
6. **Report Generation**: PDF/Word 포맷 보고서 다운로드 횟수
7. **PPT Generation**: 프레젠테이션 템플릿 빌드 횟수
8. **API Call**: 외부 연동용 API 호출 트래픽 양
9. **Storage**: 영수증 첨부파일 및 온톨로지 지식 저장용 디스크 사용량 (GB)

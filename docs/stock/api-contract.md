# Stock Think API Contract

이 문서는 Stock Think의 외부 연동 및 내부 서비스에서 사용될 Public API의 계약(Contract)을 정의합니다. (2A 단계 기준 설계)

## 공통 응답 구조 (Response Envelope)

모든 API 응답은 다음 구조를 따릅니다.

```json
{
  "data": null,
  "meta": {
    "asOfAt": "2026-08-16T09:00:00Z",
    "isFinal": false,
    "freshnessStatus": "UNKNOWN",
    "sources": [
      {
        "providerCode": "KRX_OPEN_API",
        "delayMinutes": 0
      }
    ],
    "evidenceType": "FACT"
  }
}
```

## 엔드포인트 목록

### 1. `GET /api/stock/instruments`
* 용도: 상장된 주식 및 지수 종목 목록 조회
* Query Parameters:
  * `market`: 시장 코드 (예: `KRX_KOSPI`, `US_NASDAQ`)
  * `keyword`: 종목명 검색어
* 응답 데이터:
  ```json
  [
    {
      "stockCode": "005930",
      "name": "삼성전자",
      "marketCode": "KRX_KOSPI",
      "currency": "KRW",
      "isNxtEligible": true
    }
  ]
  ```

### 2. `GET /api/stock/instruments/:stockCode`
* 용도: 단일 종목 상세 조회
* 응답 데이터:
  ```json
  {
    "stockCode": "005930",
    "name": "삼성전자",
    "industry": "반도체와반도체장비",
    "marketCap": 450000000000000,
    "currentPrice": {
      "price": 75000,
      "change": 1000,
      "changeRate": 1.35
    }
  }
  ```

### 3. `GET /api/stock/instruments/:stockCode/daily-bars`
* 용도: 종목의 일별 OHLCV 과거 데이터 조회
* Query Parameters:
  * `startDate`: YYYY-MM-DD
  * `endDate`: YYYY-MM-DD
* 응답 데이터:
  ```json
  [
    {
      "date": "2026-08-14",
      "open": 74000,
      "high": 75500,
      "low": 73800,
      "close": 75000,
      "volume": 12000000,
      "venue": "KRX_KOSPI"
    }
  ]
  ```

### 4. `GET /api/stock/instruments/:stockCode/snapshots`
* 용도: 오늘(또는 특정일)의 주요 거래 세션별 스냅샷 조회
* 응답 데이터:
  ```json
  [
    {
      "type": "NXT_PRE_CLOSE",
      "price": 75200,
      "time": "2026-08-16T08:50:00Z"
    },
    {
      "type": "KRX_OFFICIAL_CLOSE",
      "price": 75000,
      "time": "2026-08-16T15:30:00Z"
    }
  ]
  ```

### 5. `GET /api/stock/markets/korea/latest`
* 용도: 한국 시장(코스피/코스닥) 최신 지수 및 거래 상태
* 응답 데이터:
  ```json
  {
    "session": "OPEN",
    "indices": [
      {
        "code": "KOSPI",
        "value": 2850.12,
        "changeRate": 0.5
      }
    ]
  }
  ```

### 6. `GET /api/stock/markets/global/latest`
* 용도: 미국 시장 최신 지수 및 거래 상태

### 7. `GET /api/stock/macro/latest`
* 용도: 주요 거시경제 지표 최신 값 조회
* 응답 데이터:
  ```json
  [
    {
      "seriesCode": "US_FED_RATE",
      "value": 5.25,
      "date": "2026-07-31",
      "isRevised": false
    }
  ]
  ```

### 8. `GET /api/stock/briefs/:briefDate`
* 용도: 특정 일자의 데일리 브리핑 목록 및 내용 조회
* 응답 데이터:
  ```json
  [
    {
      "type": "KR_MORNING",
      "title": "8월 16일 개장 전 주요 이슈",
      "items": [
        {
          "headline": "미국 CPI 예상치 부합, 안도 랠리 기대",
          "evidenceType": "AI_INTERPRETATION"
        }
      ]
    }
  ]
  ```

## 오류 응답 계약
API 오류 발생 시 일관된 형태를 유지합니다.
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "해당 종목을 찾을 수 없습니다.",
    "details": null
  }
}
```

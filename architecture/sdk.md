# Booza Think Platform OS - Plugin SDK Contract Specification

Booza Think Platform OS는 코어 시스템의 수정을 0%로 유지하며, 새로운 서비스나 퍼블리싱 배포 매체를 모듈 단위로 동적 연동하기 위한 플러그인 SDK(Plugin SDK) 명세를 제공합니다.

---

## 📦 플러그인 3대 필수 구성요소

새로운 플러그인을 플랫폼에 탑재하기 위해서는 반드시 다음 3가지 파일을 폴더 내에 배치해야 합니다.

### 1. `manifest.json` (메타데이터 명세)
```json
{
  "id": "sample_plugin",
  "name": "Sample Publishing Plugin",
  "version": "1.0.0",
  "description": "SNS 자동 퍼블리싱 플러그인",
  "serviceType": "utility",
  "enabled": true,
  "routes": ["/health"]
}
```

### 2. `index.js` (실행 라우터 및 핸들러)
플러그인의 메인 엔트리 역할을 수행하며, Express 라우터 혹은 execute() 인터페이스 함수를 반드시 외부에 반환(`module.exports`)해야 합니다.
```javascript
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ plugin: 'sample_plugin', status: 'ok' });
});

module.exports = router;
```

### 3. `db_schema.js` (스키마 빌더 계약)
데이터베이스 초기화 훅을 제공합니다. 존재할 경우, 로더가 부팅 시 자동으로 읽어 DDL 이행 절차를 대리 실행합니다.
```javascript
async function initModuleDb() {
  console.log('[Plugin SDK] Initializing plugin-specific tables...');
}
module.exports = { initModuleDb };
```
위 규격을 지키는 플러그인들은 `backend/plugins/` 디렉터리에 놓이는 즉시 Core 레지스트리가 안전하게 동적 감지하여 자동 로딩을 수행합니다.

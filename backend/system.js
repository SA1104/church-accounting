const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AdmZip = require('adm-zip');
const { authenticateToken, requireRole } = require('./auth');
const { db, query } = require('./db');

const upload = multer({ dest: 'temp_restores/' });

// 1. 전체 백업 다운로드 (ZIP 파일 생성)
router.get('/backup', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  try {
    const zip = new AdmZip();
    
    // church.db 추가
    const dbFilePath = path.join(__dirname, 'church.db');
    if (fs.existsSync(dbFilePath)) {
      zip.addLocalFile(dbFilePath);
    } else {
      return res.status(404).json({ message: 'Database file not found' });
    }

    // uploads 폴더 추가
    const uploadsDirPath = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDirPath)) {
      zip.addLocalFolder(uploadsDirPath, 'uploads');
    }

    const zipBuffer = zip.toBuffer();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `church_backup_${timestamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(zipBuffer);

    // 백업 완료 감사 로그 기록
    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, result)
      VALUES (?, 'BACKUP_DATABASE', '전체 데이터 백업 완료', ?, ?, 'SUCCESS')
    `, [req.user.userId, req.ip, req.user.position]);

  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Backup execution failed: ' + error.message });
  }
});

// 2. 백업 복원 (ZIP 업로드 및 자동 복원)
router.post('/restore', authenticateToken, requireRole(['SYSTEM_ADMIN']), upload.single('backupFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No backup file uploaded' });
  }

  const zipPath = req.file.path;

  // 복원 시도 감사 로그 (미리 기록 - DB가 닫히기 전)
  await query.run(`
    INSERT INTO system_logs (user_id, action, details, ip_address, user_position, result)
    VALUES (?, 'RESTORE_DATABASE_START', '데이터베이스 복원 프로세스 시작', ?, ?, 'SUCCESS')
  `, [req.user.userId, req.ip, req.user.position]);

  // DB 커넥션을 강제로 닫음 (Windows OS상 SQLite 파일 잠금 해제)
  db.close(async (closeErr) => {
    if (closeErr) {
      console.error('Failed to close database for restore:', closeErr);
      // 임시 업로드 파일 청소
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      return res.status(500).json({ message: 'Failed to close database before restore.' });
    }

    try {
      const zip = new AdmZip(zipPath);
      
      // 백업 파일의 정합성 간단 검증 (church.db가 들어있는지 확인)
      const zipEntries = zip.getEntries();
      const hasDbFile = zipEntries.some(entry => entry.entryName === 'church.db');
      
      if (!hasDbFile) {
        throw new Error('유효하지 않은 백업 파일입니다. church.db가 누락되었습니다.');
      }

      // __dirname(backend)에 압축 파일 덮어쓰기 추출
      zip.extractAllTo(__dirname, true);

      // 임시 파일 삭제
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }

      // 임시 업로드 임시 폴더 내 청소
      const tempDir = path.join(__dirname, 'temp_restores');
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file));
        }
      }

      // 클라이언트에 결과 전송
      res.json({ 
        message: '데이터베이스 복원이 완료되었습니다. 서버가 2초 후에 자동으로 종료/재시작됩니다. 구동 완료 후 브라우저를 새로고침 하십시오.' 
      });

      // 2초 뒤 프로세스 종료시켜 run-app.bat 루프나 사용자 구동 유도
      setTimeout(() => {
        process.exit(0);
      }, 2000);

    } catch (restoreErr) {
      console.error('Restore error during extract:', restoreErr);
      
      // 임시 파일 삭제
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
      
      // 복원 실패 시 어떻게든 프로세스를 재시작시키거나 에러 리턴하기 위해 에러를 띄움
      // 주의: db가 이미 닫혔으므로 에러 응답 후 서버 종료 유도
      res.status(500).json({ message: '복원 처리 중 오류 발생: ' + restoreErr.message + '. 서버를 수동으로 재시작해 주십시오.' });
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    }
  });
});

module.exports = router;
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// 업로드 폴더 위치 정의
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 로컬 저장을 위한 Multer 설정
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'receipt-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storageConfig,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
});

// 파일 스토리지 인터페이스 (추후 S3 등으로 확장 가능)
const StorageService = {
  // 파일 업로드 처리 완료 후 메타데이터 반환
  saveFile: async (file) => {
    // 로컬 스토리지 기준
    return {
      storageProvider: 'LOCAL',
      fileName: file.originalname,
      fileKey: file.filename, // 로컬 파일명 저장
      fileSize: file.size,
      mimeType: file.mimetype
    };
  },

  // 모바일/클라이언트에 서빙할 파일 전체 경로 또는 URL 반환
  getFileUrl: (fileKey) => {
    // 로컬 서빙 주소 제공 (Express static 매핑 대비)
    return `/uploads/${fileKey}`;
  },

  // 파일 삭제 (전표 취소/삭제 시)
  deleteFile: async (fileKey) => {
    const filePath = path.join(uploadDir, fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

module.exports = {
  upload,
  StorageService
};

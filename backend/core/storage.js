const path = require('path');
const multer = require('multer');
global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Use memory storage for serverless-friendly uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const StorageService = {
  saveFile: async (file) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const fileKey = 'receipt-' + uniqueSuffix + ext;

    // Upload buffer directly to Supabase receipts bucket
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileKey, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      throw new Error(`Failed to upload file to storage: ${error.message}`);
    }

    return {
      storageProvider: 'SUPABASE_STORAGE',
      fileName: file.originalname,
      fileKey: fileKey,
      fileSize: file.size,
      mimeType: file.mimetype
    };
  },

  getFileUrl: (fileKey) => {
    const { data } = supabase.storage.from('receipts').getPublicUrl(fileKey);
    return data ? data.publicUrl : '';
  },

  deleteFile: async (fileKey) => {
    const { error } = await supabase.storage.from('receipts').remove([fileKey]);
    if (error) {
      console.error('Supabase Storage delete error:', error);
    }
  }
};

module.exports = {
  upload,
  StorageService
};

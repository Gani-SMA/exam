import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';

// Ensure upload directories exist
const uploadDirs = ['uploads/avatars', 'uploads/questions', 'uploads/attachments'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'questionFile') {
      uploadPath += 'questions/';
    } else {
      uploadPath += 'attachments/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'avatar') {
    // Avatar files - images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed for avatars', 400, 'INVALID_FILE_TYPE'));
    }
  } else if (file.fieldname === 'questionFile') {
    // Question files - CSV/Excel
    if (file.mimetype === 'text/csv' || file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
      cb(null, true);
    } else {
      cb(new AppError('Only CSV and Excel files are allowed', 400, 'INVALID_FILE_TYPE'));
    }
  } else {
    // Question attachments - images, audio, video, documents
    const allowedTypes = [
      'image/', 'audio/', 'video/', 
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument'
    ];
    
    if (allowedTypes.some(type => file.mimetype.includes(type))) {
      cb(null, true);
    } else {
      cb(new AppError('File type not allowed', 400, 'INVALID_FILE_TYPE'));
    }
  }
};

// Upload configurations
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('avatar');

export const uploadQuestionFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('questionFile');

export const uploadAttachments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5 // Max 5 files
  }
}).array('attachments', 5);

// Utility functions
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

export const getFileUrl = (filename: string, type: 'avatar' | 'question' | 'attachment'): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${type}s/${filename}`;
};
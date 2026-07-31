import { BadRequestException } from '@nestjs/common';
import { diskStorage, Options } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export type UploadSubdir = 'offers' | 'shops';

const IMAGE_MIME = /^image\/(jpeg|jpg|png|gif|webp)$/i;

function resolveUploadRoot(): string {
  return process.env.UPLOAD_DEST || './uploads';
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function multerImageOptions(subdir: UploadSubdir): Options {
  const maxSize = Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024);

  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dest = join(resolveUploadRoot(), subdir);
        ensureDir(dest);
        cb(null, dest);
      },
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname || '').toLowerCase() || '.jpg';
        cb(null, `${uuidv4()}${ext}`);
      },
    }),
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      if (!IMAGE_MIME.test(file.mimetype)) {
        cb(new BadRequestException('Only JPEG, PNG, GIF, or WebP images are allowed') as Error);
        return;
      }
      cb(null, true);
    },
  };
}

export function publicUploadPath(subdir: UploadSubdir, filename: string): string {
  return `/uploads/${subdir}/${filename}`;
}

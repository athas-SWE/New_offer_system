import { BadRequestException } from '@nestjs/common';
import { memoryStorage, Options } from 'multer';

export type UploadSubdir = 'offers' | 'shops' | 'hero' | 'services' | 'rentals' | 'pos';

const IMAGE_MIME = /^image\/(jpeg|jpg|png|gif|webp)$/i;

/** Multer options: keep file in memory for Cloudinary upload. */
export function multerImageOptions(_subdir?: UploadSubdir): Options {
  const maxSize = Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024);

  return {
    storage: memoryStorage(),
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

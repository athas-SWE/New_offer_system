import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export type CloudinaryFolder = 'offers' | 'shops' | 'hero' | 'services' | 'rentals';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private ready = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Cloudinary not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.ready = true;
    this.logger.log(`Cloudinary ready (cloud: ${cloudName})`);
  }

  isReady(): boolean {
    return this.ready;
  }

  /**
   * Upload an image buffer to Cloudinary and return the secure HTTPS URL.
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: CloudinaryFolder,
  ): Promise<string> {
    if (!this.ready) {
      throw new ServiceUnavailableException(
        'Image upload is unavailable — Cloudinary is not configured',
      );
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }

    const rootFolder =
      this.configService.get<string>('CLOUDINARY_FOLDER') || 'offer-lanka';

    try {
      const result = await this.uploadBuffer(file.buffer, {
        folder: `${rootFolder}/${folder}`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      });
      return result.secure_url;
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${(error as Error).message}`);
      throw new BadRequestException('Failed to upload image to Cloudinary');
    }
  }

  private uploadBuffer(
    buffer: Buffer,
    options: Record<string, unknown>,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) {
          reject(error || new Error('Empty Cloudinary response'));
          return;
        }
        resolve(result);
      });
      stream.end(buffer);
    });
  }
}

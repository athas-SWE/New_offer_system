import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Optional Firebase Admin SDK wrapper.
 * Enable via FIREBASE_ENABLED=true and provide service account credentials.
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const enabled = this.configService.get<string>('FIREBASE_ENABLED') === 'true';
    if (!enabled) {
      this.logger.log('Firebase Admin disabled (FIREBASE_ENABLED != true)');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        const privateKey = this.configService
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
            clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
            privateKey,
          }),
        });
      }
      this.initialized = true;
      this.logger.log('Firebase Admin initialized');
    } catch (error) {
      this.logger.warn(`Firebase Admin init skipped: ${(error as Error).message}`);
    }
  }

  isReady(): boolean {
    return this.initialized;
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.initialized) {
      this.logger.debug('Push skipped — Firebase not initialized');
      return false;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin');
      await admin.messaging().send({
        token,
        notification: { title, body },
        data,
      });
      return true;
    } catch (error) {
      this.logger.warn(`Push failed: ${(error as Error).message}`);
      return false;
    }
  }
}

import { Global, Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';

@Global()
@Module({
  providers: [FacebookService],
  exports: [FacebookService],
})
export class FacebookModule {}

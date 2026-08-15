import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'API info' })
  info() {
    return {
      ok: true,
      service: 'offer-lanka-api',
      health: '/api/health',
      docs: '/api/docs',
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness + Aiven/MySQL connectivity' })
  async health() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        db: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

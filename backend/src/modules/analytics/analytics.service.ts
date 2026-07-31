import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analytics } from './entities/analytics.entity';
import { AuditLog } from './entities/audit-log.entity';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private readonly analyticsRepo: Repository<Analytics>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async track(input: {
    eventType: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    businessId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    return this.analyticsRepo.save(
      this.analyticsRepo.create({
        ...input,
        entityType: input.entityType || null,
        entityId: input.entityId || null,
        userId: input.userId || null,
        businessId: input.businessId || null,
        metadata: input.metadata || null,
        ipAddress: input.ipAddress || null,
        isDeleted: false,
      }),
    );
  }

  async logAudit(input: {
    action: string;
    entityType: string;
    entityId?: string;
    userId?: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    return this.auditLogRepo.save(
      this.auditLogRepo.create({
        ...input,
        entityId: input.entityId || null,
        userId: input.userId || null,
        changes: input.changes || null,
        ipAddress: input.ipAddress || null,
        isDeleted: false,
      }),
    );
  }

  async findEvents(query: PaginationDto, businessId?: string) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.analyticsRepo
      .createQueryBuilder('a')
      .where('a.is_deleted = :deleted', { deleted: false });

    if (businessId) {
      qb.andWhere('a.business_id = :businessId', { businessId });
    }

    qb.orderBy('a.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async summary(businessId?: string) {
    const qb = this.analyticsRepo
      .createQueryBuilder('a')
      .select('a.event_type', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('a.is_deleted = :deleted', { deleted: false })
      .groupBy('a.event_type');

    if (businessId) {
      qb.andWhere('a.business_id = :businessId', { businessId });
    }

    return qb.getRawMany();
  }
}

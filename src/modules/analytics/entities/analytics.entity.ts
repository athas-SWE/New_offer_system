import { Entity, Column } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';

@Entity('analytics')
export class Analytics extends BaseAuditEntity {
  @Column({ name: 'event_type', type: 'varchar', length: 80 })
  eventType: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 80, nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', type: 'varchar', length: 36, nullable: true })
  entityId: string | null;

  @Column({ name: 'user_id', type: 'varchar', length: 36, nullable: true })
  userId: string | null;

  @Column({ name: 'business_id', type: 'varchar', length: 36, nullable: true })
  businessId: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;
}

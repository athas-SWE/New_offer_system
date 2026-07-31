import { Entity, Column } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';

@Entity('audit_logs')
export class AuditLog extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 80 })
  action: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 80 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 36, nullable: true })
  entityId: string | null;

  @Column({ name: 'user_id', type: 'varchar', length: 36, nullable: true })
  userId: string | null;

  @Column({ type: 'json', nullable: true })
  changes: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;
}
